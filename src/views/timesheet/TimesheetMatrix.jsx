import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Loading } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useAssignedTasks } from '@/hooks/useTasks';
import { useAssignedProjects } from '@/hooks/useProjects';
import { useTranslation } from '@/hooks/useTranslation';
import { timesheetService } from '@/services/timesheetService';
import { formatDate } from '@/utils';

const TimesheetMatrix = () => {
  const { user, userId } = useAuth();
  const { t } = useTranslation();
  const { projects, loading: projectsLoading } = useAssignedProjects();
  const { tasks, loading: tasksLoading } = useAssignedTasks();

  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const [timeEntries, setTimeEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveIndicator, setSaveIndicator] = useState({});
  const [projectStatusFilter, setProjectStatusFilter] = useState('ACTIVE');

  // Filtrar proyectos por estado
  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    
    if (projectStatusFilter === 'ALL') {
      return projects;
    }
    
    return projects.filter(project => project.status === projectStatusFilter);
  }, [projects, projectStatusFilter]);

  // Generar array de días L-D (memoizado para evitar recálculos)
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      return day;
    });
  }, [weekStart]);

  // Agrupar tareas por proyecto (memoizado) - proyectos asignados con opción de crear tareas generales
  const projectTaskGroups = useMemo(() => {
    return filteredProjects?.map(project => {
      // Buscar tareas específicas del proyecto asignadas al usuario
      const projectTasks = tasks?.filter(task => task.projectId === project.id) || [];

      // Si no hay tareas específicas, crear una tarea general del proyecto
      const finalTasks = projectTasks.length > 0 ? projectTasks : [{
        id: `general-${project.id}`,
        name: 'Trabajo general del proyecto',
        description: 'Tiempo de trabajo general en el proyecto',
        projectId: project.id,
        isGeneral: true
      }];

      return {
        project,
        tasks: finalTasks
      };
    }) || [];
  }, [filteredProjects, tasks]);

  // Cargar entradas de tiempo existentes
  const loadTimeEntries = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const startDate = formatDate(weekStart);
      const endDate = formatDate(weekDays[6]);

      console.log('[TimesheetMatrix] Loading time entries for:', { userId, startDate, endDate });

      const response = await timesheetService.getTimeEntries({
        userId: userId,
        startDate,
        endDate
      });

      const entries = response.timeEntries || response.data?.timeEntries || [];
      console.log('[TimesheetMatrix] Loaded entries:', entries.length, 'entries');
      console.log('[TimesheetMatrix] Entries details:', entries.map(e => ({ id: e.id, taskId: e.taskId, hours: e.hours, date: e.date })));
      setTimeEntries(entries);
    } catch (error) {
      console.error('Error al cargar entradas:', error);
      // Implementar retry con backoff si es error 429
      if (error.response?.status === 429) {
        setTimeout(() => {
          setLoading(false);
        }, 5000); // Esperar 5 segundos antes de permitir otra llamada
        return;
      }
    } finally {
      setLoading(false);
    }
  }, [userId, weekStart, weekDays]);

  useEffect(() => {
    // Debug: verificar datos del usuario al cargar
    console.log('TimesheetMatrix useEffect - datos del usuario:', {
      user,
      userId,
      userKeys: user ? Object.keys(user) : null,
      token: localStorage.getItem('auth_token')
    });

    // Solo cargar si realmente cambió la semana o el usuario
    const timeoutId = setTimeout(() => {
      loadTimeEntries();
    }, 100); // Debounce de 100ms para evitar llamadas múltiples

    return () => clearTimeout(timeoutId);
  }, [weekStart, userId]); // Solo depender de weekStart y userId

  // Limpiar timeouts al desmontar componente
  useEffect(() => {
    return () => {
      // Limpiar todos los timeouts pendientes
      Object.keys(window).forEach(key => {
        if (key.startsWith('timeout-')) {
          clearTimeout(window[key]);
          delete window[key];
        }
      });
    };
  }, []);

  // Obtener horas para una tarea y día específico
  const getHoursForTaskAndDay = (taskId, date) => {
    const targetDateStr = date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    
    const entry = timeEntries.find(entry => {
      let entryDateStr;
      if (typeof entry.date === 'string') {
        entryDateStr = entry.date.split('T')[0];
      } else {
        entryDateStr = new Date(entry.date).toISOString().split('T')[0];
      }
      return entry.taskId === taskId && entryDateStr === targetDateStr;
    });
    return entry?.hours || '';
  };

  // Obtener ID de entrada para una tarea y día específico
  const getEntryId = (taskId, date) => {
    const targetDateStr = date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    
    const entry = timeEntries.find(entry => {
      let entryDateStr;
      if (typeof entry.date === 'string') {
        entryDateStr = entry.date.split('T')[0];
      } else {
        entryDateStr = new Date(entry.date).toISOString().split('T')[0];
      }
      return entry.taskId === taskId && entryDateStr === targetDateStr;
    });
    return entry?.id;
  };

  // State para manejar las peticiones en cola
  const [pendingRequests, setPendingRequests] = useState(new Set());

  // Autosave con debounce y rate limiting
  const autosave = useCallback(async (taskId, projectId, date, hours) => {
    const key = `${taskId}-${formatDate(date)}`;

    // Verificar que tengamos userId antes de proceder
    if (!userId) {
      console.error('No se puede guardar: userId no disponible', { user, userId });
      setSaveIndicator(prev => ({ ...prev, [key]: 'error' }));
      return;
    }

    // Evitar peticiones duplicadas
    if (pendingRequests.has(key)) {
      return;
    }

    setPendingRequests(prev => new Set(prev).add(key));
    setSaveIndicator(prev => ({ ...prev, [key]: 'saving' }));

    try {
      const existingEntryId = getEntryId(taskId, date);

      if (hours === '' || hours === '0' || parseFloat(hours) === 0) {
        // Eliminar entrada si existe y horas es 0 o vacío
        if (existingEntryId) {
          await timesheetService.deleteTimeEntry(existingEntryId);
          setTimeEntries(prev => prev.filter(entry => entry.id !== existingEntryId));
        }
      } else {
        const hoursFloat = parseFloat(hours);
        if (isNaN(hoursFloat) || hoursFloat < 0) {
          setSaveIndicator(prev => ({ ...prev, [key]: 'error' }));
          return;
        }

        const entryData = {
          userId: userId,
          projectId,
          taskId,
          date: date.toISOString().split('T')[0], // Solo la fecha YYYY-MM-DD
          hours: hoursFloat,
          description: `Trabajo en tarea`
        };
        
        console.log('[TimesheetMatrix] About to save entry:', entryData);
        console.log('[TimesheetMatrix] User ID:', userId, 'Project ID:', projectId, 'Task ID:', taskId);

        if (existingEntryId) {
          // Actualizar entrada existente
          const response = await timesheetService.updateTimeEntry(existingEntryId, entryData);
          const updatedEntry = response.data || response;
          setTimeEntries(prev => prev.map(entry =>
            entry.id === existingEntryId ? updatedEntry : entry
          ));
        } else {
          // Crear nueva entrada
          const response = await timesheetService.createTimeEntry(entryData);
          const newEntry = response.data || response;
          console.log('[TimesheetMatrix] Adding new entry to state:', newEntry);
          console.log('[TimesheetMatrix] Current timeEntries before adding:', timeEntries.length);
          setTimeEntries(prev => {
            console.log('[TimesheetMatrix] Current state entries:', prev.length);
            
            // Primero, remover cualquier entrada temporal para esta tarea y fecha
            const targetDateStr = date.toISOString().split('T')[0];
            const withoutTemp = prev.filter(entry => {
              if (entry.id && entry.id.toString().startsWith('temp-')) {
                let entryDateStr;
                if (typeof entry.date === 'string') {
                  entryDateStr = entry.date.split('T')[0];
                } else {
                  entryDateStr = new Date(entry.date).toISOString().split('T')[0];
                }
                return !(entry.taskId === taskId && entryDateStr === targetDateStr);
              }
              return true;
            });
            
            // Verificar que no exista ya una entrada real con el mismo ID
            const exists = withoutTemp.some(entry => entry.id === newEntry.id);
            if (exists) {
              console.log('[TimesheetMatrix] Entry already exists, updating instead of adding');
              return withoutTemp.map(entry => entry.id === newEntry.id ? newEntry : entry);
            }
            console.log('[TimesheetMatrix] Adding new entry, will have:', withoutTemp.length + 1, 'entries');
            return [...withoutTemp, newEntry];
          });
        }
      }

      setSaveIndicator(prev => ({ ...prev, [key]: 'saved' }));
      setTimeout(() => {
        setSaveIndicator(prev => ({ ...prev, [key]: null }));
      }, 2000);

    } catch (error) {
      console.error('Error al guardar entrada de tiempo:', error.response?.data?.message || error.message);
      setSaveIndicator(prev => ({ ...prev, [key]: 'error' }));

      // Si es error 429, esperar más tiempo antes de permitir otra petición
      const waitTime = error.response?.status === 429 ? 5000 : 3000;
      setTimeout(() => {
        setSaveIndicator(prev => ({ ...prev, [key]: null }));
      }, waitTime);
    } finally {
      // Limpiar la petición pendiente después de un delay
      setTimeout(() => {
        setPendingRequests(prev => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
      }, 1000);
    }
  }, [timeEntries, getEntryId, pendingRequests, user?.id]);

  // Manejar cambio en input con debounce
  const handleHoursChange = useCallback((taskId, projectId, date, value) => {
    const key = `${taskId}-${formatDate(date)}`;

    // Actualizar display inmediatamente
    setTimeEntries(prev => {
      const targetDateStr = date.toISOString().split('T')[0]; // Formato YYYY-MM-DD consistente
      
      // Buscar entrada existente (real, no temporal)
      const existingIndex = prev.findIndex(entry => {
        // No considerar entradas temporales como existentes
        if (entry.id && entry.id.toString().startsWith('temp-')) {
          return false;
        }
        
        let entryDateStr;
        if (typeof entry.date === 'string') {
          entryDateStr = entry.date.split('T')[0];
        } else {
          entryDateStr = new Date(entry.date).toISOString().split('T')[0];
        }
        return entry.taskId === taskId && entryDateStr === targetDateStr;
      });

      // Remover cualquier entrada temporal existente para esta tarea y fecha
      const withoutTemp = prev.filter(entry => {
        if (entry.id && entry.id.toString().startsWith('temp-')) {
          let entryDateStr;
          if (typeof entry.date === 'string') {
            entryDateStr = entry.date.split('T')[0];
          } else {
            entryDateStr = new Date(entry.date).toISOString().split('T')[0];
          }
          return !(entry.taskId === taskId && entryDateStr === targetDateStr);
        }
        return true;
      });

      if (existingIndex >= 0) {
        // Actualizar entrada real existente
        const updated = [...withoutTemp];
        const realExistingIndex = updated.findIndex(entry => {
          let entryDateStr;
          if (typeof entry.date === 'string') {
            entryDateStr = entry.date.split('T')[0];
          } else {
            entryDateStr = new Date(entry.date).toISOString().split('T')[0];
          }
          return entry.taskId === taskId && entryDateStr === targetDateStr && 
                 !(entry.id && entry.id.toString().startsWith('temp-'));
        });
        
        if (realExistingIndex >= 0) {
          updated[realExistingIndex] = { ...updated[realExistingIndex], hours: parseFloat(value) || 0 };
        }
        return updated;
      } else if (value && parseFloat(value) > 0) {
        // Crear nueva entrada temporal para display inmediato
        return [...withoutTemp, {
          id: `temp-${taskId}-${targetDateStr}-${Date.now()}`,
          taskId,
          projectId,
          date: targetDateStr, // Usar formato YYYY-MM-DD consistente
          hours: parseFloat(value) || 0,
          userId: userId
        }];
      }
      
      return withoutTemp; // Retornar sin las temporales si el valor es 0 o vacío
    });

    // Debounce autosave - aumentado a 2 segundos para reducir llamadas
    clearTimeout(window[`timeout-${key}`]);
    window[`timeout-${key}`] = setTimeout(() => {
      autosave(taskId, projectId, date, value);
    }, 2000);
  }, [autosave, userId]);

  // Navegación de semana
  const goToPreviousWeek = () => {
    const newWeekStart = new Date(weekStart);
    newWeekStart.setDate(weekStart.getDate() - 7);
    setWeekStart(newWeekStart);
  };

  const goToNextWeek = () => {
    const newWeekStart = new Date(weekStart);
    newWeekStart.setDate(weekStart.getDate() + 7);
    setWeekStart(newWeekStart);
  };

  // Calcular totales por día
  const getDayTotal = (date) => {
    const targetDateStr = date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    
    // Filtrar entradas que coincidan con la fecha y excluir entradas temporales
    const matchingEntries = timeEntries.filter(entry => {
      // Excluir entradas temporales (creadas para display inmediato)
      if (entry.id && entry.id.toString().startsWith('temp-')) {
        return false;
      }
      
      let entryDateStr;
      if (typeof entry.date === 'string') {
        // Si es string, puede ser "YYYY-MM-DD" o "YYYY-MM-DDTHH:mm:ss.sssZ"
        entryDateStr = entry.date.split('T')[0];
      } else {
        // Si es Date, convertir a string
        entryDateStr = new Date(entry.date).toISOString().split('T')[0];
      }
      return entryDateStr === targetDateStr;
    });

    const total = matchingEntries.reduce((sum, entry) => sum + (parseFloat(entry.hours) || 0), 0);
    
    return total;
  };

  // Calcular total por tarea
  const getTaskTotal = (taskId) => {
    return timeEntries
      .filter(entry => {
        // Excluir entradas temporales y filtrar solo por taskId
        if (entry.id && entry.id.toString().startsWith('temp-')) {
          return false;
        }
        return entry.taskId === taskId;
      })
      .reduce((sum, entry) => sum + (parseFloat(entry.hours) || 0), 0);
  };

  if (projectsLoading || tasksLoading || loading) {
    return <Loading />;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Matriz de Tiempo - Proyectos Asignados
          </CardTitle>
          <div className="flex items-center gap-4">
            {/* Filtro de estado de proyectos */}
            <select
              value={projectStatusFilter}
              onChange={(e) => setProjectStatusFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ACTIVE">Solo Activos</option>
              <option value="COMPLETED">Solo Completados</option>
              <option value="PAUSED">Solo Pausados</option>
              <option value="CANCELLED">Solo Cancelados</option>
              <option value="ALL">Todos los Estados</option>
            </select>
            
            {/* Navegación de semana */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[200px] text-center">
                {formatDate(weekStart)} - {formatDate(weekDays[6])}
              </span>
              <Button variant="outline" size="sm" onClick={goToNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Información sobre proyectos cargados */}
        <div className="text-sm text-gray-600">
          Mostrando {filteredProjects.length} proyecto(s) {projectStatusFilter === 'ALL' ? '' : projectStatusFilter.toLowerCase()} asignado(s)
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 p-3 text-left font-medium min-w-[200px]">
                  {t('projectTask')}
                </th>
                {weekDays.map((day, index) => (
                  <th key={index} className="border border-gray-300 p-3 text-center font-medium w-24">
                    <div>
                      {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][index]}
                    </div>
                    <div className="text-xs text-gray-500">
                      {day.getDate()}/{day.getMonth() + 1}
                    </div>
                  </th>
                ))}
                <th className="border border-gray-300 p-3 text-center font-medium w-20">
                  {t('total')}
                </th>
              </tr>
            </thead>
            <tbody>
              {projectTaskGroups.length === 0 ? (
                <tr>
                  <td colSpan={9} className="border border-gray-300 p-8 text-center">
                    <div className="text-gray-500">
                      <div className="text-lg font-medium mb-2">
                        {projectStatusFilter === 'ACTIVE' ? 'Sin Proyectos Activos Asignados' : `Sin Proyectos ${projectStatusFilter} Asignados`}
                      </div>
                      <div className="text-sm">
                        {projectStatusFilter === 'ACTIVE' 
                          ? 'No tienes proyectos activos asignados. Contacta a tu coordinador o prueba con otro filtro de estado.' 
                          : projects?.length > 0 
                            ? 'No tienes proyectos en este estado. Cambia el filtro arriba para ver otros proyectos.'
                            : 'No tienes proyectos asignados. Contacta a tu coordinador para que te asigne proyectos.'
                        }
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                projectTaskGroups.map(({ project, tasks }) => (
                  <React.Fragment key={project.id}>
                    {/* Fila de proyecto */}
                    <tr className="bg-blue-50">
                      <td className="border border-gray-300 p-3 font-semibold text-blue-900">
                        📁 {project.name}
                      </td>
                      {weekDays.map((_, index) => (
                        <td key={index} className="border border-gray-300 p-3"></td>
                      ))}
                      <td className="border border-gray-300 p-3"></td>
                    </tr>

                    {/* Filas de tareas */}
                    {tasks.map(task => (
                      <tr key={task.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-3 pl-8">
                          <div className="text-sm">
                            📋 {task.title || task.name}
                            {task.isGeneral && <span className="ml-1 text-xs text-blue-600">(General)</span>}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {task.description}
                          </div>
                        </td>
                        {weekDays.map((day, dayIndex) => {
                          const key = `${task.id}-${formatDate(day)}`;
                          const saveStatus = saveIndicator[key];
                          return (
                            <td key={dayIndex} className="border border-gray-300 p-1">
                              <div className="relative">
                                <input
                                  type="number"
                                  min="0"
                                  max="24"
                                  step="0.25"
                                  value={getHoursForTaskAndDay(task.id, day)}
                                  onChange={(e) => handleHoursChange(task.id, project.id, day, e.target.value)}
                                  className={`w-full p-2 text-center border-0 bg-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded ${saveStatus === 'saving' ? 'bg-yellow-50' :
                                    saveStatus === 'saved' ? 'bg-green-50' :
                                      saveStatus === 'error' ? 'bg-red-50' : ''
                                    }`}
                                  placeholder="0"
                                />
                                {saveStatus === 'saving' && (
                                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                                )}
                                {saveStatus === 'saved' && (
                                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full"></div>
                                )}
                                {saveStatus === 'error' && (
                                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full"></div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                        <td className="border border-gray-300 p-3 text-center font-medium bg-gray-50">
                          {getTaskTotal(task.id).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              )}

              {/* Fila de totales - solo mostrar si hay tareas */}
              {projectTaskGroups.length > 0 && (
                <tr className="bg-gray-100 font-bold">
                  <td className="border border-gray-300 p-3">
                    Total por día
                  </td>
                  {weekDays.map((day, index) => (
                    <td key={index} className="border border-gray-300 p-3 text-center">
                      {getDayTotal(day).toFixed(2)}
                    </td>
                  ))}
                  <td className="border border-gray-300 p-3 text-center">
                    {(() => {
                      // Excluir entradas temporales del total general
                      const realEntries = timeEntries.filter(entry => 
                        !(entry.id && entry.id.toString().startsWith('temp-'))
                      );
                      const total = realEntries.reduce((sum, entry) => sum + (parseFloat(entry.hours) || 0), 0);
                      console.log('[TimesheetMatrix] Calculating total:', realEntries.length, 'real entries (excluding temps), total:', total);
                      return total.toFixed(2);
                    })()}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          <p>💡 Los cambios se guardan automáticamente después de 1 segundo</p>
          <p>🟡 Guardando | 🟢 Guardado | 🔴 Error</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimesheetMatrix;