import React, { useState, useEffect } from 'react';
import { 
  FolderOpen, 
  Users, 
  ListChecks, 
  Clock,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Target,
  Search,
  Filter
} from 'lucide-react';
import {
  KPICard,
  StackedBarChart,
  BurndownChart,
  AreaChart,
  DoughnutChart
} from '../charts';
import { Input, Button } from '@/components/ui';
import { projectService } from '@/services/projectService';
import { taskService } from '@/services/taskService';
import userService from '@/services/userService';
import { timesheetService } from '@/services/timesheetService';
import { timePeriodService } from '@/services/timePeriodService';
import { useAuth } from '@/hooks/useAuth';
import { useAreas } from '@/hooks/useAreas';
import { useCatalogs } from '@/hooks/useCatalogs';
import useUsers from '@/hooks/useUsers';
import { useTranslation } from '@/hooks/useTranslation';
import { ROLES, PROJECT_STATUS } from '@/constants';

const CoordinatorDashboard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { areas } = useAreas();
  const { salesManagements, mentors, coordinators } = useCatalogs();
  const { users, fetchAllUsers: loadAllUsers } = useUsers();
  
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    kpis: {},
    projectStatus: {},
    teamWorkload: {},
    burndown: {},
    hoursApproval: {},
    taskDistribution: {}
  });
  const [selectedProject, setSelectedProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [projectView, setProjectView] = useState('combined'); // 'combined', 'general', 'specific'
  const [availablePeriods, setAvailablePeriods] = useState([]);
  const [startPeriodId, setStartPeriodId] = useState('');
  const [endPeriodId, setEndPeriodId] = useState('');
  
  // Filtros de proyectos - igual que en ProjectsView
  const [filters, setFilters] = useState({
    search: '',
    status: 'ACTIVE', // Por defecto mostrar solo proyectos activos
    priority: '',
    areaId: '',
    assignedUserId: '',
    mentorId: '',
    coordinatorId: '', // Se establecerá cuando se carguen los coordinadores
    salesManagementId: '',
    salesExecutiveId: '',
    siebelOrderNumber: '',
    isGeneral: '',
  });
  
  const isAdmin = user?.role === ROLES.ADMIN;
  const isCoordinator = user?.role === ROLES.MANAGER || user?.role === ROLES.COORDINADOR;
  const isCollaborator = user?.role === ROLES.COLABORADOR;

  // Cargar todos los usuarios para el filtro
  useEffect(() => {
    loadAllUsers();
  }, [loadAllUsers]);

  // Establecer el coordinador actual cuando se carguen los coordinadores
  useEffect(() => {
    if (coordinators && coordinators.length > 0 && user && isCoordinator) {
      // Buscar el coordinador actual por múltiples criterios
      const currentCoordinator = coordinators.find(coord => {
        // Intentar por ID primero
        if (coord.id === user.id || coord.id === user.userId) {
          return true;
        }
        // Luego por email
        if (coord.email && user.email && coord.email.toLowerCase() === user.email.toLowerCase()) {
          return true;
        }
        // Finalmente por nombre completo
        if (coord.firstName && coord.lastName && user.firstName && user.lastName) {
          return coord.firstName.toLowerCase() === user.firstName.toLowerCase() && 
                 coord.lastName.toLowerCase() === user.lastName.toLowerCase();
        }
        return false;
      });
      
      if (currentCoordinator && filters.coordinatorId === '') {
        console.log('Coordinador encontrado:', currentCoordinator);
        setFilters(prev => ({ ...prev, coordinatorId: currentCoordinator.id.toString() }));
      } else if (!currentCoordinator && isCoordinator) {
        console.log('No se encontró el coordinador actual en la lista', { user, coordinators });
      }
    }
  }, [coordinators, user, isCoordinator]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cargar datos iniciales con filtros por defecto
  useEffect(() => {
    loadDashboardData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadDashboardData();
  }, [selectedProject, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (startPeriodId && endPeriodId) {
      loadDashboardData();
    }
  }, [startPeriodId, endPeriodId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadAvailablePeriods();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAvailablePeriods = async () => {
    try {
      const periodsRes = await timePeriodService.getAll({ limit: 50 });
      const periods = periodsRes.data?.timePeriods || periodsRes.timePeriods || [];
      setAvailablePeriods(periods);
      
      // Establecer períodos por defecto (los 2 más recientes)
      if (periods.length >= 2 && !startPeriodId && !endPeriodId) {
        setStartPeriodId(periods[1]?.id || ''); // Segundo más reciente
        setEndPeriodId(periods[0]?.id || '');   // Más reciente
      }
    } catch (error) {
      console.error('Error loading periods:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const clearAllFilters = () => {
    // Buscar el coordinador actual
    let defaultCoordinatorId = '';
    if (coordinators && coordinators.length > 0 && user && isCoordinator) {
      const currentCoordinator = coordinators.find(coord => {
        // Intentar por ID primero
        if (coord.id === user.id || coord.id === user.userId) {
          return true;
        }
        // Luego por email
        if (coord.email && user.email && coord.email.toLowerCase() === user.email.toLowerCase()) {
          return true;
        }
        // Finalmente por nombre completo
        if (coord.firstName && coord.lastName && user.firstName && user.lastName) {
          return coord.firstName.toLowerCase() === user.firstName.toLowerCase() && 
                 coord.lastName.toLowerCase() === user.lastName.toLowerCase();
        }
        return false;
      });
      defaultCoordinatorId = currentCoordinator?.id?.toString() || '';
    }
    
    const emptyFilters = {
      search: '',
      status: 'ACTIVE', // Mantener status ACTIVE por defecto
      priority: '',
      areaId: '',
      assignedUserId: '',
      mentorId: '',
      coordinatorId: defaultCoordinatorId, // Mantener el coordinador actual seleccionado
      salesManagementId: '',
      salesExecutiveId: '',
      isGeneral: '',
      siebelOrderNumber: '',
    };
    setFilters(emptyFilters);
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Limpiar valores vacíos antes de enviar la petición
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '' && v != null)
      );
      
      // Cargar proyectos del coordinador con filtros
      const projectsRes = await projectService.getAll({ 
        page: 1, 
        limit: 100, 
        assignedUserId: user.userId,
        ...cleanFilters
      });
      const myProjects = projectsRes.data?.projects || projectsRes.projects || [];
      setProjects(myProjects);
      
      // Clasificar proyectos por tipo
      const generalProjects = myProjects.filter(p => p.isGeneral === true);
      const specificProjects = myProjects.filter(p => p.isGeneral !== true);

      // Si no hay proyecto seleccionado, tomar el primero
      if (!selectedProject && myProjects.length > 0) {
        setSelectedProject(myProjects[0]);
      }

      // Cargar tareas del proyecto seleccionado (simulado por ahora)
      const tasks = []; // Simulado - se puede implementar cuando esté disponible

      // Cargar colaboradores del equipo
      const teamRes = await userService.getUsers(1, 100, '', 'COLABORADOR');
      const teamMembers = teamRes.data?.users || [];

      // Las hojas de tiempo se simulan por ahora
      const timesheets = [];

      // Calcular KPIs
      const totalProjects = myProjects.length;
      const totalGeneralProjects = generalProjects.length;
      const totalSpecificProjects = specificProjects.length;
      const totalCollaborators = teamMembers.length;
      const pendingTasks = tasks.filter(t => t.status === 'pending').length;
      const pendingHours = timesheets.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.hours, 0);
      const averageProgress = myProjects.reduce((sum, p) => sum + (p.progress || 0), 0) / myProjects.length;
      const projectsAtRisk = myProjects.filter(p => p.riskLevel === 'high').length;
      const teamEfficiency = 89; // Placeholder - calcular basado en datos reales
      const upcomingDeadlines = tasks.filter(t => {
        const dueDate = new Date(t.dueDate);
        const today = new Date();
        const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
      }).length;

      // Estado de proyectos (Kanban)
      const projectStatus = {
        labels: ['Planificación', 'En Progreso', 'Revisión', 'Completado'],
        values: [
          myProjects.filter(p => p.status === 'planning').length,
          myProjects.filter(p => p.status === 'in_progress').length,
          myProjects.filter(p => p.status === 'review').length,
          myProjects.filter(p => p.status === 'completed').length
        ],
        colors: ['#64748B', '#2563EB', '#D97706', '#059669']
      };

      // Carga de trabajo del equipo con filtros por tipo de proyecto
      const getFilteredProjects = (view) => {
        switch(view) {
          case 'general':
            return generalProjects.slice(0, 4);
          case 'specific':
            return specificProjects.slice(0, 4);
          default:
            return [...generalProjects.slice(0, 2), ...specificProjects.slice(0, 2)];
        }
      };

      const createTeamWorkload = async (view) => {
        if (!startPeriodId || !endPeriodId || availablePeriods.length === 0) {
          // Sin períodos seleccionados, retornar estructura vacía
          return {
            labels: [],
            datasets: [],
            referenceLine: { value: 0, label: 'Sin períodos seleccionados' },
            collaborators: [],
            periodsSummary: { totalHours: 0, referenceHours: 0, efficiency: 0 }
          };
        }

        const filteredProjects = getFilteredProjects(view);
        const collaborators = teamMembers.slice(0, 6); // Mostrar hasta 6 colaboradores
        
        // Obtener períodos seleccionados para calcular horas de referencia
        const selectedPeriods = availablePeriods.filter(p => {
          const startIndex = availablePeriods.findIndex(period => period.id === startPeriodId);
          const endIndex = availablePeriods.findIndex(period => period.id === endPeriodId);
          const currentIndex = availablePeriods.findIndex(period => period.id === p.id);
          
          // Incluir períodos entre startPeriodId y endPeriodId (inclusive)
          return currentIndex >= endIndex && currentIndex <= startIndex;
        });

        // Calcular horas de referencia total por colaborador
        const totalReferenceHours = selectedPeriods.reduce((sum, period) => {
          const startDate = new Date(period.startDate);
          const endDate = new Date(period.endDate);
          const periodDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
          const workDays = Math.floor((periodDays / 7) * 5) + Math.max(0, Math.min(5, (periodDays % 7) - 2));
          return sum + (workDays * 8); // 8 horas por día laboral
        }, 0);

        // Obtener horas reales trabajadas por cada colaborador en los períodos seleccionados
        const workloadData = await Promise.all(
          collaborators.map(async (collaborator) => {
            let totalWorkedHours = 0;
            
            try {
              // Obtener todas las entradas de tiempo del colaborador para todos los períodos
              for (const period of selectedPeriods) {
                const startDate = new Date(period.startDate);
                const endDate = new Date(period.endDate);
                
                const timeEntriesRes = await timesheetService.getByPeriod(
                  startDate.toISOString().split('T')[0],
                  endDate.toISOString().split('T')[0],
                  collaborator.id
                );
                
                const timeEntries = timeEntriesRes.data?.timeEntries || timeEntriesRes.timeEntries || [];
                
                // Filtrar por proyectos según la vista
                const filteredEntries = timeEntries.filter(entry => {
                  const project = filteredProjects.find(p => p.id === entry.projectId);
                  return project !== undefined;
                });
                
                totalWorkedHours += filteredEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
              }
            } catch (error) {
              console.error(`Error loading hours for ${collaborator.firstName}:`, error);
            }
            
            return {
              collaborator,
              totalWorkedHours,
              efficiency: totalReferenceHours > 0 ? Math.round((totalWorkedHours / totalReferenceHours) * 100) : 0
            };
          })
        );

        // Calcular totales del equipo
        const teamTotalWorked = workloadData.reduce((sum, data) => sum + data.totalWorkedHours, 0);
        const teamTotalReference = totalReferenceHours * collaborators.length;
        const teamEfficiency = teamTotalReference > 0 ? Math.round((teamTotalWorked / teamTotalReference) * 100) : 0;

        return {
          labels: collaborators.map(m => `${m.firstName} ${m.lastName?.charAt(0)}.`),
          datasets: [{
            name: 'Horas Trabajadas',
            data: workloadData.map(data => data.totalWorkedHours),
            color: '#3B82F6'
          }, {
            name: 'Horas de Referencia',
            data: collaborators.map(() => totalReferenceHours),
            color: '#E5E7EB'
          }],
          referenceLine: { value: totalReferenceHours, label: `Referencia (${totalReferenceHours}h)` },
          collaborators: collaborators,
          periodsSummary: {
            totalHours: teamTotalWorked,
            referenceHours: teamTotalReference,
            efficiency: teamEfficiency,
            periodsCount: selectedPeriods.length
          },
          workloadDetails: workloadData
        };
      };

      const teamWorkload = {
        combined: await createTeamWorkload('combined'),
        general: await createTeamWorkload('general'),
        specific: await createTeamWorkload('specific')
      };

      // Burndown chart
      const sprintDays = 10;
      const totalTasks = 50;
      const burndown = {
        labels: Array.from({ length: sprintDays }, (_, i) => `Día ${i + 1}`),
        ideal: Array.from({ length: sprintDays }, (_, i) => 
          totalTasks - (totalTasks / sprintDays) * (i + 1)
        ),
        actual: [50, 47, 42, 38, 35, 30, 28, 24, 18, 12],
        projected: [50, 47, 42, 38, 35, 31, 27, 23, 19, 15]
      };

      // Horas aprobadas vs pendientes
      const hoursApproval = {
        labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
        datasets: [
          {
            name: 'Aprobadas',
            data: [120, 135, 142, 158],
            color: '#059669'
          },
          {
            name: 'Pendientes',
            data: [25, 18, 22, 31],
            color: '#DC2626'
          }
        ]
      };

      // Distribución por tipo de proyecto (con filtros)
      const projectDistribution = {
        combined: {
          labels: [...generalProjects.map(p => `[G] ${p.name}`), ...specificProjects.slice(0, 4).map(p => `[E] ${p.name}`)],
          values: [...generalProjects.map(() => Math.floor(Math.random() * 30) + 20), ...specificProjects.slice(0, 4).map(() => Math.floor(Math.random() * 40) + 30)]
        },
        general: {
          labels: generalProjects.map(p => p.name),
          values: generalProjects.map(() => Math.floor(Math.random() * 30) + 20)
        },
        specific: {
          labels: specificProjects.slice(0, 6).map(p => p.name),
          values: specificProjects.slice(0, 6).map(() => Math.floor(Math.random() * 40) + 30)
        }
      };

      // También mantener la distribución de tareas original como fallback
      const taskDistribution = {
        labels: ['Desarrollo', 'Testing', 'Documentación', 'Reuniones', 'Otros'],
        values: [
          tasks.filter(t => t.type === 'development').length || 25,
          tasks.filter(t => t.type === 'testing').length || 15,
          tasks.filter(t => t.type === 'documentation').length || 10,
          tasks.filter(t => t.type === 'meetings').length || 8,
          tasks.filter(t => !['development', 'testing', 'documentation', 'meetings'].includes(t.type)).length || 12
        ]
      };

      setDashboardData({
        kpis: {
          totalProjects,
          totalGeneralProjects,
          totalSpecificProjects,
          totalCollaborators,
          pendingTasks,
          pendingHours: Math.round(pendingHours),
          averageProgress: Math.round(averageProgress),
          projectsAtRisk,
          teamEfficiency,
          upcomingDeadlines
        },
        projectStatus,
        teamWorkload,
        burndown,
        hoursApproval,
        taskDistribution,
        projectDistribution
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard de Coordinación</h2>
            <p className="text-gray-600 mt-1">Gestión de proyectos y equipo</p>
          </div>
        </div>
      </div>

      {/* Filtros de proyectos - igual que en ProjectsView */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          Filtros de Proyectos
        </h3>
        <div className="space-y-4">
          {/* Primera fila de filtros */}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
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
        </div>
      </div>

      {/* KPI Cards - Primera fila */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Mis Proyectos"
          value={dashboardData.kpis.totalProjects}
          icon={FolderOpen}
          color="indigo"
        />
        <KPICard
          title="Colaboradores"
          value={dashboardData.kpis.totalCollaborators}
          icon={Users}
          color="blue"
        />
        <KPICard
          title="Tareas Pendientes"
          value={dashboardData.kpis.pendingTasks}
          icon={ListChecks}
          color="yellow"
          trend="down"
          trendValue={-15}
        />
        <KPICard
          title="Horas Pendientes"
          value={dashboardData.kpis.pendingHours}
          icon={Clock}
          color="purple"
          suffix="h"
        />
      </div>

      {/* KPI Cards - Segunda fila */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Progreso Promedio"
          value={dashboardData.kpis.averageProgress}
          icon={TrendingUp}
          color="green"
          format="percent"
          trend="up"
          trendValue={8}
        />
        <KPICard
          title="En Riesgo"
          value={dashboardData.kpis.projectsAtRisk}
          icon={AlertCircle}
          color="red"
        />
        <KPICard
          title="Eficiencia del Equipo"
          value={dashboardData.kpis.teamEfficiency}
          icon={CheckCircle2}
          color="green"
          format="percent"
        />
        <KPICard
          title="Próximos Vencimientos"
          value={dashboardData.kpis.upcomingDeadlines}
          icon={Calendar}
          color="yellow"
        />
      </div>

      {/* KPI Cards - Tercera fila (Tipos de proyectos) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Proyectos Generales"
          value={dashboardData.kpis.totalGeneralProjects}
          icon={FolderOpen}
          color="green"
        />
        <KPICard
          title="Proyectos Específicos"
          value={dashboardData.kpis.totalSpecificProjects}
          icon={Target}
          color="blue"
        />
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex items-center justify-center">
          <div className="text-center">
            <h4 className="text-sm font-medium text-gray-600 mb-3">Vista de Proyectos</h4>
            <div className="flex gap-2">
              <button
                onClick={() => setProjectView('combined')}
                className={`px-3 py-1 rounded text-xs ${projectView === 'combined' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                Todos
              </button>
              <button
                onClick={() => setProjectView('general')}
                className={`px-3 py-1 rounded text-xs ${projectView === 'general' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                Generales
              </button>
              <button
                onClick={() => setProjectView('specific')}
                className={`px-3 py-1 rounded text-xs ${projectView === 'specific' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                Específicos
              </button>
            </div>
          </div>
        </div>
        <div></div> {/* Espacio vacío para mantener la grilla */}
      </div>

      {/* Estado de proyectos y distribución de tareas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estado de proyectos (Kanban visual) */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Mis Proyectos</h3>
          <div className="grid grid-cols-4 gap-4">
            {['Planificación', 'En Progreso', 'Revisión', 'Completado'].map((stage, idx) => (
              <div key={stage} className="text-center">
                <div 
                  className={`h-32 rounded-lg flex items-center justify-center text-white font-bold text-2xl ${
                    ['bg-gray-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500'][idx]
                  }`}
                >
                  {dashboardData.projectStatus.values[idx]}
                </div>
                <p className="mt-2 text-sm font-medium text-gray-700">{stage}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Distribución de proyectos */}
        <DoughnutChart
          title={
            projectView === 'combined' ? 'Distribución de Todos los Proyectos' :
            projectView === 'general' ? 'Distribución de Proyectos Generales' :
            'Distribución de Proyectos Específicos'
          }
          data={dashboardData.projectDistribution?.[projectView] || { labels: [], values: [] }}
          centerText={
            projectView === 'combined' ? `${dashboardData.kpis.totalProjects} Proyectos` :
            projectView === 'general' ? `${dashboardData.kpis.totalGeneralProjects} Generales` :
            `${dashboardData.kpis.totalSpecificProjects} Específicos`
          }
          height={250}
        />
      </div>

      {/* Carga de trabajo del equipo con filtros de período */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {projectView === 'combined' ? 'Carga de Trabajo del Equipo - Todos los Proyectos' :
               projectView === 'general' ? 'Carga de Trabajo del Equipo - Proyectos Generales' :
               'Carga de Trabajo del Equipo - Proyectos Específicos'}
            </h3>
            {dashboardData.teamWorkload?.[projectView]?.periodsSummary && (
              <p className="text-sm text-gray-500 mt-1">
                Total: {dashboardData.teamWorkload[projectView].periodsSummary.totalHours}h trabajadas de {dashboardData.teamWorkload[projectView].periodsSummary.referenceHours}h esperadas 
                ({dashboardData.teamWorkload[projectView].periodsSummary.efficiency}% eficiencia)
              </p>
            )}
          </div>
          
          {/* Selectores de período */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Desde:</label>
              <select
                value={startPeriodId}
                onChange={(e) => setStartPeriodId(e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white text-gray-700"
              >
                <option value="">Seleccionar período inicial</option>
                {availablePeriods.map(period => (
                  <option key={period.id} value={period.id}>
                    {period.year}/{String(period.month).padStart(2, '0')} Q{period.periodNumber}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Hasta:</label>
              <select
                value={endPeriodId}
                onChange={(e) => setEndPeriodId(e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white text-gray-700"
              >
                <option value="">Seleccionar período final</option>
                {availablePeriods.map(period => (
                  <option key={period.id} value={period.id}>
                    {period.year}/{String(period.month).padStart(2, '0')} Q{period.periodNumber}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {startPeriodId && endPeriodId ? (
          <div>
            <StackedBarChart
              title=""
              data={dashboardData.teamWorkload?.[projectView] || { labels: [], datasets: [] }}
              xAxisLabel="Colaboradores"
              yAxisLabel="Horas del Período"
              height={350}
              maxValue={dashboardData.teamWorkload?.[projectView]?.referenceLine?.value || 100}
            />
            
            {/* Tabla detallada de carga de trabajo */}
            {dashboardData.teamWorkload?.[projectView]?.workloadDetails && (
              <div className="mt-6">
                <h4 className="text-md font-semibold text-gray-900 mb-3">Detalle por Colaborador</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Colaborador
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Horas Trabajadas
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Horas de Referencia
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Eficiencia
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dashboardData.teamWorkload[projectView].workloadDetails.map((detail, idx) => {
                        const referenceHours = dashboardData.teamWorkload[projectView].referenceLine?.value || 0;
                        const isOverloaded = detail.totalWorkedHours > referenceHours * 1.1;
                        const isUnderworked = detail.totalWorkedHours < referenceHours * 0.7;
                        
                        return (
                          <tr key={detail.collaborator.id || idx}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {detail.collaborator.firstName} {detail.collaborator.lastName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                              {detail.totalWorkedHours}h
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                              {referenceHours}h
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                detail.efficiency >= 90 ? 'bg-green-100 text-green-800' :
                                detail.efficiency >= 70 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {detail.efficiency}%
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                              {isOverloaded ? (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                  Sobrecargado
                                </span>
                              ) : isUnderworked ? (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                  Disponible
                                </span>
                              ) : (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                  Óptimo
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Clock className="h-12 w-12 mb-4 text-gray-300" />
            <p className="text-lg font-medium">Selecciona los períodos para ver la carga de trabajo</p>
            <p className="text-sm text-center">Escoge un período inicial y final para analizar las horas trabajadas vs referencia</p>
          </div>
        )}
      </div>

      {/* Burndown chart */}
      <BurndownChart
        title={selectedProject ? `Burndown - ${selectedProject.name}` : 'Burndown de Tareas'}
        data={dashboardData.burndown}
        height={350}
      />

      {/* Horas aprobadas vs pendientes */}
      <AreaChart
        title="Horas Aprobadas vs Pendientes"
        data={dashboardData.hoursApproval}
        xAxisLabel="Semanas"
        yAxisLabel="Horas"
        height={300}
      />

      {/* Tabla de resumen del equipo */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen del Equipo</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Colaborador
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proyectos Activos
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Horas Esta Semana
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Eficiencia
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(dashboardData.teamWorkload?.[projectView]?.collaborators || []).map((collaborator, idx) => {
                const totalHours = dashboardData.teamWorkload?.[projectView]?.datasets
                  .reduce((sum, dataset) => sum + dataset.data[idx], 0) || 0;
                const activeProjects = dashboardData.teamWorkload?.[projectView]?.datasets?.length || 0;
                const efficiency = Math.floor(Math.random() * 15) + 80; // Simular eficiencia
                const isOverloaded = totalHours > 35;
                const isAvailable = totalHours < 20;
                
                return (
                  <tr key={collaborator.id || idx}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {collaborator.firstName} {collaborator.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                      {activeProjects}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                      <span className={`font-medium ${isOverloaded ? 'text-red-600' : isAvailable ? 'text-green-600' : 'text-gray-900'}`}>
                        {totalHours}h
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className={`font-medium ${efficiency >= 90 ? 'text-green-600' : efficiency >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {efficiency}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        isOverloaded ? 'bg-red-100 text-red-800' : 
                        isAvailable ? 'bg-green-100 text-green-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {isOverloaded ? 'Sobrecargado' : isAvailable ? 'Disponible' : 'Ocupado'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {(dashboardData.teamWorkload?.[projectView]?.collaborators?.length === 0) && (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No hay colaboradores asignados para mostrar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CoordinatorDashboard;