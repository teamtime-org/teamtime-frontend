import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Loading } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { timesheetService } from '@/services/timesheetService';
import { formatDate } from '@/utils';

const TimesheetMatrix = () => {
  const { user } = useAuth();
  const { projects } = useProjects();
  const { tasks } = useTasks();
  
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

  // Generar array de días L-V (memoizado para evitar recálculos)
  const weekDays = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      return day;
    });
  }, [weekStart]);

  // Agrupar tareas por proyecto (memoizado)
  const projectTaskGroups = useMemo(() => {
    return projects?.reduce((acc, project) => {
      const projectTasks = tasks?.filter(task => task.projectId === project.id) || [];
      if (projectTasks.length > 0) {
        acc.push({
          project,
          tasks: projectTasks
        });
      }
      return acc;
    }, []) || [];
  }, [projects, tasks]);

  // Cargar entradas de tiempo existentes
  const loadTimeEntries = useCallback(async () => {
    if (!user?.id || loading) return;
    
    setLoading(true);
    try {
      const startDate = formatDate(weekStart);
      const endDate = formatDate(weekDays[4]);
      
      const response = await timesheetService.getTimeEntries({
        userId: user.id,
        startDate,
        endDate
      });
      
      setTimeEntries(response.timeEntries || response.data?.timeEntries || []);
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
  }, [user?.id, weekStart, weekDays, loading]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadTimeEntries();
    }, 100); // Debounce de 100ms para evitar llamadas múltiples
    
    return () => clearTimeout(timeoutId);
  }, [weekStart, user?.id]); // Solo depender de weekStart y user.id

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
    const entry = timeEntries.find(entry => 
      entry.taskId === taskId && 
      formatDate(new Date(entry.date)) === formatDate(date)
    );
    return entry?.hours || '';
  };

  // Obtener ID de entrada para una tarea y día específico
  const getEntryId = (taskId, date) => {
    const entry = timeEntries.find(entry => 
      entry.taskId === taskId && 
      formatDate(new Date(entry.date)) === formatDate(date)
    );
    return entry?.id;
  };

  // State para manejar las peticiones en cola
  const [pendingRequests, setPendingRequests] = useState(new Set());

  // Autosave con debounce y rate limiting
  const autosave = useCallback(async (taskId, projectId, date, hours) => {
    const key = `${taskId}-${formatDate(date)}`;
    
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
          projectId,
          taskId,
          date: formatDate(date),
          hours: hoursFloat,
          description: `Trabajo en tarea`
        };

        if (existingEntryId) {
          // Actualizar entrada existente
          const response = await timesheetService.updateTimeEntry(existingEntryId, entryData);
          setTimeEntries(prev => prev.map(entry => 
            entry.id === existingEntryId ? (response.data || response) : entry
          ));
        } else {
          // Crear nueva entrada
          const response = await timesheetService.createTimeEntry(entryData);
          setTimeEntries(prev => [...prev, (response.data || response)]);
        }
      }
      
      setSaveIndicator(prev => ({ ...prev, [key]: 'saved' }));
      setTimeout(() => {
        setSaveIndicator(prev => ({ ...prev, [key]: null }));
      }, 2000);

    } catch (error) {
      console.error('Error al guardar:', error);
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
  }, [timeEntries, getEntryId, pendingRequests]);

  // Manejar cambio en input con debounce
  const handleHoursChange = useCallback((taskId, projectId, date, value) => {
    const key = `${taskId}-${formatDate(date)}`;
    
    // Actualizar display inmediatamente
    setTimeEntries(prev => {
      const existingIndex = prev.findIndex(entry => 
        entry.taskId === taskId && 
        formatDate(new Date(entry.date)) === formatDate(date)
      );
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], hours: parseFloat(value) || 0 };
        return updated;
      } else if (value && parseFloat(value) > 0) {
        return [...prev, {
          id: `temp-${Date.now()}`,
          taskId,
          projectId,
          date: formatDate(date),
          hours: parseFloat(value) || 0,
          userId: user.id
        }];
      }
      return prev;
    });

    // Debounce autosave - aumentado a 2 segundos para reducir llamadas
    clearTimeout(window[`timeout-${key}`]);
    window[`timeout-${key}`] = setTimeout(() => {
      autosave(taskId, projectId, date, value);
    }, 2000);
  }, [autosave, user?.id]);

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
    return timeEntries
      .filter(entry => formatDate(new Date(entry.date)) === formatDate(date))
      .reduce((sum, entry) => sum + (parseFloat(entry.hours) || 0), 0);
  };

  // Calcular total por tarea
  const getTaskTotal = (taskId) => {
    return timeEntries
      .filter(entry => entry.taskId === taskId)
      .reduce((sum, entry) => sum + (parseFloat(entry.hours) || 0), 0);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Captura de Horas - Matriz Semanal
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[200px] text-center">
              {formatDate(weekStart)} - {formatDate(weekDays[4])}
            </span>
            <Button variant="outline" size="sm" onClick={goToNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 p-3 text-left font-medium min-w-[200px]">
                  Proyecto / Tarea
                </th>
                {weekDays.map((day, index) => (
                  <th key={index} className="border border-gray-300 p-3 text-center font-medium w-24">
                    <div>
                      {['Lun', 'Mar', 'Mié', 'Jue', 'Vie'][index]}
                    </div>
                    <div className="text-xs text-gray-500">
                      {day.getDate()}/{day.getMonth() + 1}
                    </div>
                  </th>
                ))}
                <th className="border border-gray-300 p-3 text-center font-medium w-20">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {projectTaskGroups.map(({ project, tasks }) => (
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
                          📋 {task.name}
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
                                className={`w-full p-2 text-center border-0 bg-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded ${
                                  saveStatus === 'saving' ? 'bg-yellow-50' :
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
              ))}
              
              {/* Fila de totales */}
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
                  {timeEntries.reduce((sum, entry) => sum + (parseFloat(entry.hours) || 0), 0).toFixed(2)}
                </td>
              </tr>
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