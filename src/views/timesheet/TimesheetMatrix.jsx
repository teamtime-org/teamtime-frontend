import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Save, Filter, Search } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Loading, Input } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { taskService } from '@/services/taskService';
import { useAssignedProjects, useAllProjects } from '@/hooks/useProjects';
import { useTranslation } from '@/hooks/useTranslation';
import { useAreas } from '@/hooks/useAreas';
import { useCatalogs } from '@/hooks/useCatalogs';
import useUsers from '@/hooks/useUsers';
import { useDateRestrictions } from '@/hooks/useSystemConfig';
import { timesheetService } from '@/services/timesheetService';
import { formatDate } from '@/utils';
import { ROLES } from '@/constants';

const TimesheetMatrix = () => {
  const { user, userId } = useAuth();
  const { t } = useTranslation();

  // Determinar roles del usuario
  const isAdmin = user?.role === ROLES.ADMIN;
  const isCoordinator = user?.role === ROLES.MANAGER || user?.role === ROLES.COORDINADOR;
  const isCollaborator = user?.role === ROLES.COLABORADOR;

  // Usar todos los proyectos para admins, solo asignados para usuarios normales
  const { projects: assignedProjects, loading: assignedLoading } = useAssignedProjects();
  const { projects: allProjects, loading: allLoading } = useAllProjects();

  const projects = isAdmin ? allProjects : assignedProjects;
  const projectsLoading = isAdmin ? allLoading : assignedLoading;


  // Estado para tareas agrupadas por proyecto
  const [projectTasks, setProjectTasks] = useState({});
  const [loadingTasks, setLoadingTasks] = useState(false);
  const { areas } = useAreas();
  const { salesManagements, mentors, coordinators } = useCatalogs();
  const { users, fetchAllUsers: loadAllUsers } = useUsers();
  const { restrictions: dateRestrictions, isDateAllowed } = useDateRestrictions();

  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(12, 0, 0, 0); // Establecer a mediodía para evitar problemas de timezone
    return monday;
  });

  const [timeEntries, setTimeEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveIndicator, setSaveIndicator] = useState({});
  const [filters, setFilters] = useState({
    search: '',
    status: 'ACTIVE', // Por defecto mostrar solo proyectos activos
    priority: '',
    areaId: '',
    // Filtros de asignaciones reales
    assignedUserId: '', // Para usuarios asignados al proyecto
    // Filtros de Excel (mantener para compatibilidad)
    mentorId: '',
    coordinatorId: '',
    salesManagementId: '',
    salesExecutiveId: '',
    siebelOrderNumber: '',
    isGeneral: '',
  });

  // Cargar todos los usuarios para el filtro
  useEffect(() => {
    loadAllUsers();
  }, [loadAllUsers]);

  // Función para aplicar filtros
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Limpiar todos los filtros
  const clearAllFilters = () => {
    const emptyFilters = {
      search: '',
      status: '',
      priority: '',
      areaId: '',
      assignedUserId: '',
      mentorId: '',
      coordinatorId: '',
      salesManagementId: '',
      salesExecutiveId: '',
      isGeneral: '',
      siebelOrderNumber: '',
    };
    setFilters(emptyFilters);
  };


  // Filtrar proyectos con todos los filtros aplicados - igual que ProjectsView
  const filteredProjects = useMemo(() => {
    if (!projects) return [];

    return projects.filter(project => {
      // Filtro por búsqueda
      if (filters.search &&
        !project.name?.toLowerCase().includes(filters.search.toLowerCase()) &&
        !project.description?.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Filtro por estado
      if (filters.status && project.status !== filters.status) {
        return false;
      }

      // Filtro por prioridad
      if (filters.priority && project.priority !== filters.priority) {
        return false;
      }

      // Filtro por área
      if (filters.areaId && project.areaId !== filters.areaId) {
        return false;
      }

      // Filtro por coordinador
      if (filters.coordinatorId && project.excelDetails?.coordinator?.id !== filters.coordinatorId) {
        return false;
      }

      // Filtro por mentor
      if (filters.mentorId && project.excelDetails?.mentor?.id !== filters.mentorId) {
        return false;
      }

      // Filtro por gerencia de ventas
      if (filters.salesManagementId && project.excelDetails?.salesManagement?.id !== filters.salesManagementId) {
        return false;
      }

      // Filtro por orden Siebel
      if (filters.siebelOrderNumber &&
        !project.excelDetails?.siebelOrderNumber?.toLowerCase().includes(filters.siebelOrderNumber.toLowerCase())) {
        return false;
      }

      // Filtro por isGeneral
      if (filters.isGeneral !== '' && filters.isGeneral !== null && filters.isGeneral !== undefined) {
        const isGeneralValue = filters.isGeneral === 'true';
        if (project.isGeneral !== isGeneralValue) {
          return false;
        }
      }

      return true;
    });
  }, [projects, filters]);

  // Función para cargar tareas de los proyectos filtrados
  const loadProjectTasks = useCallback(async () => {
    if (!filteredProjects || filteredProjects.length === 0) {
      setProjectTasks({});
      return;
    }

    setLoadingTasks(true);
    try {
      const tasksPromises = filteredProjects.map(async (project) => {
        const response = await taskService.getAll({ projectId: project.id });
        return {
          projectId: project.id,
          tasks: response.data?.tasks || []
        };
      });

      const results = await Promise.all(tasksPromises);
      const tasksMap = {};
      results.forEach(({ projectId, tasks }) => {
        tasksMap[projectId] = tasks;
      });

      setProjectTasks(tasksMap);
    } catch (err) {
      console.error('Error loading project tasks:', err);
      setProjectTasks({});
    } finally {
      setLoadingTasks(false);
    }
  }, [filteredProjects]);

  // Cargar tareas cuando cambien los proyectos filtrados
  useEffect(() => {
    loadProjectTasks();
  }, [loadProjectTasks]);

  // Generar array de días L-D (memoizado para evitar recálculos)
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i, 12, 0, 0);
      return day;
    });
  }, [weekStart]);

  // Agrupar tareas por proyecto - mostrar solo tareas reales del proyecto
  const projectTaskGroups = useMemo(() => {
    if (!filteredProjects || filteredProjects.length === 0) {
      return [];
    }

    const groups = filteredProjects.map(project => {
      const tasks = projectTasks[project.id] || [];
      return {
        project,
        tasks: tasks
      };
    }).filter(group => group.tasks.length > 0);

    // If no groups have tasks, show projects anyway to allow task creation
    if (groups.length === 0) {
      return filteredProjects.map(project => ({
        project,
        tasks: []
      }));
    }

    return groups;
  }, [filteredProjects, projectTasks]);

  // Normalizar fecha a formato YYYY-MM-DD sin conversiones de timezone
  const normalizeDateString = useCallback((date) => {
    if (!date) return '';
    
    // Si ya está en formato YYYY-MM-DD, devolverlo
    if (typeof date === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
      }
      // Si tiene T (ISO), simplemente tomar la parte de la fecha sin conversiones
      if (date.includes('T')) {
        return date.split('T')[0];
      }
    }
    
    // Para objetos Date, extraer fecha local
    let dateObj;
    if (date instanceof Date) {
      dateObj = date;
    } else {
      dateObj = new Date(date);
    }
    
    if (isNaN(dateObj.getTime())) return '';
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }, []);

  // Cargar entradas de tiempo existentes
  const loadTimeEntries = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const startDate = formatDate(weekStart, 'yyyy-MM-dd');
      const endWeek = new Date(weekStart);
      endWeek.setDate(weekStart.getDate() + 6);
      const endDate = formatDate(endWeek, 'yyyy-MM-dd');

      const response = await timesheetService.getTimeEntries({
        userId: userId,
        startDate,
        endDate,
        limit: 1000, // High limit to get all entries for the week
        _t: Date.now()
      });

      const entries = response.data?.timeEntries || response.timeEntries || [];
      console.log('🔍 DEBUG: Time entries loaded:', entries);
      console.log('🔍 DEBUG: Week start:', weekStart);
      console.log('🔍 DEBUG: Week range:', formatDate(weekStart, 'yyyy-MM-dd'), 'to', endDate);
      setTimeEntries(entries);
    } catch (error) {
      console.error('Error al cargar entradas:', error);
      if (error.response?.status === 429) {
        setTimeout(() => {
          setLoading(false);
        }, 5000);
        return;
      }
    } finally {
      setLoading(false);
    }
  }, [userId, weekStart]);

  // Función para limpiar entradas temporales y timeouts
  const cleanupTemporaryData = useCallback(() => {
    // Limpiar entradas temporales
    setTimeEntries(prev => prev.filter(entry =>
      !(entry.id && entry.id.toString().startsWith('temp-'))
    ));

    // Limpiar indicadores de guardado
    setSaveIndicator({});

    // Limpiar todos los timeouts pendientes
    Object.keys(window).forEach(key => {
      if (key.startsWith('timeout-')) {
        clearTimeout(window[key]);
        delete window[key];
      }
    });
  }, []);

  useEffect(() => {
    cleanupTemporaryData();
    
    const timeoutId = setTimeout(() => {
      loadTimeEntries();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [weekStart, userId, cleanupTemporaryData, loadTimeEntries]);


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
  const getHoursForTaskAndDay = useCallback((taskId, date) => {
    const targetDateStr = normalizeDateString(date);
    
    const entry = timeEntries.find(entry => {
      const entryDateStr = normalizeDateString(entry.date);
      const match = entry.taskId === taskId && entryDateStr === targetDateStr;
      if (taskId === "58e97240-2c8d-4f4d-92aa-d9417a9a6b32") {
        console.log('🔍 DEBUG: Searching for task', taskId, 'on', targetDateStr, 'Date obj:', date);
        console.log('🔍 DEBUG: Checking entry:', {
          id: entry.id,
          taskId: entry.taskId,
          date: entry.date,
          normalizedDate: entryDateStr,
          hours: entry.hours,
          match
        });
      }
      return match;
    });

    const result = entry ? (typeof entry.hours === 'string' ? entry.hours : String(entry.hours)) : '';
    if (taskId === "58e97240-2c8d-4f4d-92aa-d9417a9a6b32") {
      console.log('🔍 DEBUG: Final result for task', taskId, 'on', targetDateStr, ':', result);
    }
    return result;
  }, [timeEntries, normalizeDateString]);

  // Obtener ID de entrada para una tarea y día específico
  const getEntryId = useCallback((taskId, date) => {
    const targetDateStr = normalizeDateString(date);

    const entry = timeEntries.find(entry => {
      const entryDateStr = normalizeDateString(entry.date);
      return entry.taskId === taskId && entryDateStr === targetDateStr;
    });

    return entry?.id;
  }, [timeEntries, normalizeDateString]);

  // State para manejar las peticiones en cola
  const [pendingRequests, setPendingRequests] = useState(new Set());

  // Autosave con debounce y rate limiting
  const autosave = useCallback(async (taskId, projectId, date, hours) => {
    // date ya viene en formato YYYY-MM-DD
    const key = `${taskId}-${date}`;

    if (!userId) {
      setSaveIndicator(prev => ({ ...prev, [key]: 'error' }));
      return;
    }

    if (pendingRequests.has(key)) {
      return;
    }

    setPendingRequests(prev => new Set(prev).add(key));
    setSaveIndicator(prev => ({ ...prev, [key]: 'saving' }));

    try {
      const existingEntryId = getEntryId(taskId, date);

      if (hours === '' || hours === '0' || parseFloat(hours) === 0) {
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

        // Enviar fecha como año, mes, día separados para evitar problemas de timezone
        // date viene en formato YYYY-MM-DD string
        const [year, month, day] = date.split('-').map(n => parseInt(n));
        
        const entryData = {
          userId: userId,
          projectId,
          taskId,
          year: year,
          month: month,
          day: day,
          hours: hoursFloat,
          description: 'Trabajo en tarea'
        };
        
        console.log('[Autosave] Entry data to send:', entryData);
        console.log('[Autosave] Date as integers - Year:', year, 'Month:', month, 'Day:', day);

        if (existingEntryId) {
          const response = await timesheetService.updateTimeEntry(existingEntryId, entryData);
          const updatedEntry = response.data || response;
          setTimeEntries(prev => prev.map(entry =>
            entry.id === existingEntryId ? updatedEntry : entry
          ));
        } else {
          const response = await timesheetService.createTimeEntry(entryData);
          const newEntry = response.data || response;
          setTimeEntries(prev => {
            const targetDateStr = normalizeDateString(date);
            const withoutTemp = prev.filter(entry => {
              if (entry.id && entry.id.toString().startsWith('temp-')) {
                const entryDateStr = normalizeDateString(entry.date);
                return !(entry.taskId === taskId && entryDateStr === targetDateStr);
              }
              return true;
            });

            const exists = withoutTemp.some(entry => entry.id === newEntry.id);
            if (exists) {
              return withoutTemp.map(entry => entry.id === newEntry.id ? newEntry : entry);
            }
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

      const waitTime = error.response?.status === 429 ? 5000 : 3000;
      setTimeout(() => {
        setSaveIndicator(prev => ({ ...prev, [key]: null }));
      }, waitTime);
    } finally {
      setTimeout(() => {
        setPendingRequests(prev => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
      }, 1000);
    }
  }, [getEntryId, pendingRequests, userId, normalizeDateString]);

  // Manejar cambio en input con debounce
  const handleHoursChange = useCallback((taskId, projectId, date, value) => {
    const normalizedDate = normalizeDateString(date);
    const key = `${taskId}-${normalizedDate}`;

    // Validar fecha antes de procesar
    const dateValidation = isDateAllowed(date);
    if (!dateValidation.isValid && parseFloat(value) > 0) {
      // Mostrar mensaje de error pero no guardar
      setSaveIndicator(prev => ({ ...prev, [key]: 'error' }));
      setTimeout(() => {
        setSaveIndicator(prev => ({ ...prev, [key]: null }));
      }, 3000);
      return; // No procesar el cambio
    }

    // Actualizar display inmediatamente
    setTimeEntries(prev => {
      const targetDateStr = normalizeDateString(date); // Usar normalización consistente

      // Buscar entrada existente (real, no temporal)
      const existingIndex = prev.findIndex(entry => {
        // No considerar entradas temporales como existentes
        if (entry.id && entry.id.toString().startsWith('temp-')) {
          return false;
        }

        const entryDateStr = normalizeDateString(entry.date);
        return entry.taskId === taskId && entryDateStr === targetDateStr;
      });

      // Remover cualquier entrada temporal existente para esta tarea y fecha
      const withoutTemp = prev.filter(entry => {
        if (entry.id && entry.id.toString().startsWith('temp-')) {
          const entryDateStr = normalizeDateString(entry.date);
          return !(entry.taskId === taskId && entryDateStr === targetDateStr);
        }
        return true;
      });

      if (existingIndex >= 0) {
        // Actualizar entrada real existente
        const updated = [...withoutTemp];
        const realExistingIndex = updated.findIndex(entry => {
          const entryDateStr = normalizeDateString(entry.date);
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
          date: targetDateStr, // Usar formato normalizado consistente
          hours: parseFloat(value) || 0,
          userId: userId
        }];
      }

      return withoutTemp; // Retornar sin las temporales si el valor es 0 o vacío
    });

    // Debounce autosave - aumentado a 2 segundos para reducir llamadas
    clearTimeout(window[`timeout-${key}`]);
    window[`timeout-${key}`] = setTimeout(() => {
      // Pasar la fecha normalizada en formato YYYY-MM-DD
      const normalizedDate = normalizeDateString(date);
      autosave(taskId, projectId, normalizedDate, value);
    }, 2000);
  }, [autosave, userId, isDateAllowed, normalizeDateString]);


  // Navegación de semana
  const goToPreviousWeek = () => {
    cleanupTemporaryData();
    const newWeekStart = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() - 7, 12, 0, 0);
    setWeekStart(newWeekStart);
  };

  const goToNextWeek = () => {
    cleanupTemporaryData();
    const newWeekStart = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 7, 12, 0, 0);
    setWeekStart(newWeekStart);
  };

  // Calcular totales por día
  const getDayTotal = (date) => {
    const targetDateStr = normalizeDateString(date);

    // Filtrar entradas que coincidan con la fecha y excluir entradas temporales
    const matchingEntries = timeEntries.filter(entry => {
      // Excluir entradas temporales (creadas para display inmediato)
      if (entry.id && entry.id.toString().startsWith('temp-')) {
        return false;
      }

      const entryDateStr = normalizeDateString(entry.date);
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

  if (projectsLoading || loadingTasks || loading) {
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
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los Status</option>
              <option value="ACTIVE">{t('active')}</option>
              <option value="COMPLETED">{t('completed')}</option>
              <option value="ON_HOLD">{t('onHold')}</option>
              <option value="CANCELLED">{t('cancelled')}</option>
              <option value="AWARDED">Ganado</option>
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
          Mostrando {filteredProjects.length} proyecto(s) {filters.status ? filters.status.toLowerCase() : ''}
          {isAdmin ? ' (todos los proyectos del sistema)' : ' (asignados a ti)'}
        </div>
      </CardHeader>

      {/* Filters - igual que ProjectsView */}
      <Card className="mx-6 mb-4">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar proyectos..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Todos los Status</option>
              <option value="ACTIVE">{t('active')}</option>
              <option value="COMPLETED">{t('completed')}</option>
              <option value="ON_HOLD">{t('onHold')}</option>
              <option value="CANCELLED">{t('cancelled')}</option>
              <option value="AWARDED">Ganado</option>
            </select>

            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Todas las Prioridades</option>
              <option value="LOW">{t('low')}</option>
              <option value="MEDIUM">{t('medium')}</option>
              <option value="HIGH">{t('high')}</option>
              <option value="URGENT">{t('urgent')}</option>
            </select>

            {(isAdmin || isCoordinator) ? (
              <select
                value={filters.areaId}
                onChange={(e) => handleFilterChange('areaId', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Todas las Áreas</option>
                {areas && areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={filters.areaId}
                onChange={(e) => handleFilterChange('areaId', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Mi Área</option>
                {areas && areas.filter(area => area.id === user?.areaId).map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Segunda fila de filtros - Solo para administradores y coordinadores */}
          {!isCollaborator && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 mt-4">
              <select
                value={filters.assignedUserId}
                onChange={(e) => handleFilterChange('assignedUserId', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Usuarios Asignados</option>
                <option value="me">Mis Proyectos</option>
                {users && users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </option>
                ))}
              </select>

              <select
                value={filters.mentorId}
                onChange={(e) => handleFilterChange('mentorId', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Todos los Mentores</option>
                {mentors && mentors.map((mentor) => (
                  <option key={mentor.id} value={mentor.id}>
                    {mentor.firstName} {mentor.lastName}
                  </option>
                ))}
              </select>

              <select
                value={filters.coordinatorId}
                onChange={(e) => handleFilterChange('coordinatorId', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Todos los Coordinadores</option>
                {coordinators && coordinators.map((coordinator) => (
                  <option key={coordinator.id} value={coordinator.id}>
                    {coordinator.firstName} {coordinator.lastName}
                  </option>
                ))}
              </select>

              <select
                value={filters.salesManagementId}
                onChange={(e) => handleFilterChange('salesManagementId', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Todas las Gerencias</option>
                {salesManagements && salesManagements.map((management) => (
                  <option key={management.id} value={management.id}>
                    {management.name}
                  </option>
                ))}
              </select>

              <Input
                placeholder="Orden Siebel..."
                value={filters.siebelOrderNumber}
                onChange={(e) => handleFilterChange('siebelOrderNumber', e.target.value)}
              />

              <select
                value={filters.isGeneral}
                onChange={(e) => handleFilterChange('isGeneral', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Todos los Tipos</option>
                <option value="true">Solo Generales</option>
                <option value="false">Solo Específicos</option>
              </select>

              <Button
                variant="outline"
                onClick={clearAllFilters}
                className="whitespace-nowrap"
              >
                Limpiar Filtros
              </Button>
            </div>
          )}

          {/* Fila de filtros para colaboradores - Filtros de sus proyectos */}
          {isCollaborator && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
              <select
                value={filters.coordinatorId}
                onChange={(e) => handleFilterChange('coordinatorId', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Todos los Coordinadores</option>
                {coordinators && coordinators.map((coordinator) => (
                  <option key={coordinator.id} value={coordinator.id}>
                    {coordinator.firstName} {coordinator.lastName}
                  </option>
                ))}
              </select>

              <select
                value={filters.salesManagementId}
                onChange={(e) => handleFilterChange('salesManagementId', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Todas las Gerencias</option>
                {salesManagements && salesManagements.map((management) => (
                  <option key={management.id} value={management.id}>
                    {management.name}
                  </option>
                ))}
              </select>

              <select
                value={filters.isGeneral}
                onChange={(e) => handleFilterChange('isGeneral', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Todos los Tipos</option>
                <option value="true">Solo Generales</option>
                <option value="false">Solo Específicos</option>
              </select>

              <Button
                variant="outline"
                onClick={clearAllFilters}
                className="whitespace-nowrap"
              >
                Limpiar Filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>


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
                        {filters.status === 'ACTIVE'
                          ? (isAdmin ? 'Sin Proyectos Activos en el Sistema' : 'Sin Proyectos Activos Asignados')
                          : filters.status
                            ? `Sin Proyectos ${filters.status} ${isAdmin ? 'en el Sistema' : 'Asignados'}`
                            : (isAdmin ? 'Sin Proyectos en el Sistema' : 'Sin Proyectos Asignados')}
                      </div>
                      <div className="text-sm">
                        {projects?.length > 0
                          ? 'No hay proyectos que coincidan con los filtros seleccionados. Cambia los filtros arriba para ver otros proyectos.'
                          : isAdmin
                            ? 'No hay proyectos en el sistema. Crea algunos proyectos para empezar a usarlos en el timesheet.'
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
                          const normalizedDay = normalizeDateString(day);
                          const key = `${task.id}-${normalizedDay}`;
                          const saveStatus = saveIndicator[key];
                          const dateValidation = isDateAllowed(day);
                          const isDateRestricted = !dateValidation.isValid;

                          return (
                            <td key={dayIndex} className="border border-gray-300 p-1 relative">
                              {/* Indicador visual para fechas restringidas */}
                              {isDateRestricted && (
                                <div
                                  className="absolute inset-0 bg-red-100 opacity-30 pointer-events-none z-0"
                                  title={dateValidation.reason}
                                ></div>
                              )}
                              <div className="relative z-10">
                                <input
                                  type="number"
                                  min="0"
                                  max="24"
                                  step="0.25"
                                  value={getHoursForTaskAndDay(task.id, day)}
                                  onChange={(e) => handleHoursChange(task.id, project.id, day, e.target.value)}
                                  disabled={isDateRestricted}
                                  className={`w-full p-2 text-center border-0 bg-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded 
                                    ${saveStatus === 'saving' ? 'bg-yellow-50' :
                                      saveStatus === 'saved' ? 'bg-green-50' :
                                        saveStatus === 'error' ? 'bg-red-50' : ''}
                                    ${isDateRestricted ? 'cursor-not-allowed text-gray-400' : ''}
                                  `}
                                  placeholder="0"
                                  title={isDateRestricted ? dateValidation.reason : ''}
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
                      const realEntries = timeEntries.filter(entry =>
                        !(entry.id && entry.id.toString().startsWith('temp-'))
                      );
                      return realEntries.reduce((sum, entry) => sum + (parseFloat(entry.hours) || 0), 0).toFixed(2);
                    })()}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-sm text-gray-500 space-y-2">
          <p>💡 Los cambios se guardan automáticamente después de 2 segundos</p>
          <p>🟡 Guardando | 🟢 Guardado | 🔴 Error</p>

          {/* Información sobre restricciones de fecha */}
          {dateRestrictions.enabled && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">📅 Restricciones de Fecha Activas</h4>
              <div className="text-xs text-blue-700 space-y-1">
                <p>• Días pasados permitidos: <strong>{dateRestrictions.pastDaysAllowed}</strong></p>
                <p>• Días futuros permitidos: <strong>{dateRestrictions.futureDaysAllowed}</strong></p>
                <p>• Las fechas restringidas aparecen con fondo rojizo y están deshabilitadas</p>
              </div>
            </div>
          )}

          {!dateRestrictions.enabled && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-green-700">🔓 Sin restricciones de fecha - Puede capturar tiempo en cualquier fecha</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TimesheetMatrix;