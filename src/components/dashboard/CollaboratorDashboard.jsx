import React, { useState, useEffect } from 'react';
import { 
  FolderOpen, 
  ListChecks, 
  Clock,
  CheckCircle,
  TrendingUp,
  Calendar,
  Target,
  Award,
  AlertCircle
} from 'lucide-react';
import {
  KPICard,
  DoughnutChart,
  AreaChart,
  StackedBarChart
} from '../charts';
import { projectService } from '@/services/projectService';
import { taskService } from '@/services/taskService';
import { timesheetService } from '@/services/timesheetService';
import { timePeriodService } from '@/services/timePeriodService';
import { useAuth } from '@/hooks/useAuth';

const CollaboratorDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // Función para calcular las horas totales dinámicamente según la vista
  const getTotalHours = (data, view) => {
    if (!data || !data[view] || !data[view].values) return 0;
    return data[view].values.reduce((sum, val) => sum + val, 0);
  };
  const [dashboardData, setDashboardData] = useState({
    kpis: {},
    timeDistribution: {},
    taskProgress: [],
    weeklyHours: {},
    activityCalendar: [],
    projectContribution: {}
  });
  const [selectedPeriod, setSelectedPeriod] = useState('current'); // 'current', 'previous', specific period ID
  const [availablePeriods, setAvailablePeriods] = useState([]);
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [projectView, setProjectView] = useState('combined'); // 'combined', 'general', 'specific'

  useEffect(() => {
    loadPeriodsAndDashboard();
  }, [selectedPeriod, projectView]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cargar períodos disponibles y datos del dashboard
  const loadPeriodsAndDashboard = async () => {
    try {
      // Primero cargar períodos disponibles
      if (availablePeriods.length === 0) {
        const periodsRes = await timePeriodService.getAll({ limit: 50 });
        const periods = periodsRes.data?.timePeriods || periodsRes.timePeriods || [];
        setAvailablePeriods(periods);

        // Obtener período actual
        try {
          const currentRes = await timePeriodService.getCurrent();
          const current = currentRes.data || currentRes;
          setCurrentPeriod(current);
        } catch (error) {
          console.log('No hay período actual activo');
        }
      }

      // Luego cargar datos del dashboard
      await loadDashboardData();
    } catch (error) {
      console.error('Error loading periods:', error);
      await loadDashboardData();
    }
  };

  // Obtener período seleccionado
  const getSelectedPeriod = () => {
    if (selectedPeriod === 'current' && currentPeriod) {
      return currentPeriod;
    }
    
    if (selectedPeriod === 'previous' && availablePeriods.length > 1) {
      // Encontrar el período anterior al actual
      const currentIndex = availablePeriods.findIndex(p => p.id === currentPeriod?.id);
      return currentIndex > 0 ? availablePeriods[currentIndex + 1] : availablePeriods[1];
    }
    
    // Si es un ID específico
    const specificPeriod = availablePeriods.find(p => p.id === selectedPeriod);
    if (specificPeriod) {
      return specificPeriod;
    }
    
    // Fallback al período más reciente
    return availablePeriods[0] || currentPeriod;
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Obtener el período seleccionado de la base de datos
      const period = getSelectedPeriod();
      
      if (!period) {
        console.log('No hay período seleccionado disponible');
        setLoading(false);
        return;
      }

      const startDate = new Date(period.startDate);
      const endDate = new Date(period.endDate);

      // Cargar proyectos asignados
      const projectsRes = await projectService.getAll({ 
        page: 1, 
        limit: 100, 
        assignedUserId: user.userId 
      });
      const myProjects = projectsRes.data?.projects || projectsRes.projects || [];

      // Cargar horas capturadas del período actual  
      const timeEntriesRes = await timesheetService.getByPeriod(
        startDate.toISOString().split('T')[0], 
        endDate.toISOString().split('T')[0], 
        user.userId
      );
      const timeEntries = timeEntriesRes.data?.timeEntries || timeEntriesRes.timeEntries || [];

      // Clasificar proyectos por tipo
      const generalProjects = myProjects.filter(p => p.isGeneral === true);
      const specificProjects = myProjects.filter(p => p.isGeneral !== true);
      
      // Calcular duraciones de proyectos y fechas
      const projectsWithDuration = myProjects.map(project => {
        const now = new Date();
        const startDate = new Date(project.startDate);
        const endDate = project.endDate ? new Date(project.endDate) : null;
        const assignedDate = project.assignedAt ? new Date(project.assignedAt) : startDate;
        
        const daysActive = Math.floor((now - assignedDate) / (1000 * 60 * 60 * 24));
        const daysRemaining = endDate ? Math.floor((endDate - now) / (1000 * 60 * 60 * 24)) : null;
        const isOverdue = endDate && now > endDate;
        
        return {
          ...project,
          daysActive,
          daysRemaining,
          isOverdue,
          assignedDate
        };
      });

      // Calcular horas totales capturadas en el período
      const totalCapturedHours = timeEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
      
      // Calcular horas de referencia basándose en los días del período real
      const periodDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      const workDays = Math.floor((periodDays / 7) * 5) + Math.max(0, Math.min(5, (periodDays % 7) - 2)); // Aproximar días laborales
      const referencePeriodHours = workDays * 8; // 8 horas por día laboral
      
      // Validar y calcular métricas con seguridad
      const efficiency = referencePeriodHours > 0 
        ? Math.min(200, Math.round((totalCapturedHours / referencePeriodHours) * 100)) 
        : 0;
      const pendingHours = Math.max(0, referencePeriodHours - totalCapturedHours);
      const availableHours = referencePeriodHours - totalCapturedHours;
      
      // Verificar si hay datos
      const hasTimeData = timeEntries.length > 0 && totalCapturedHours > 0;

      // Calcular distribución de tiempo real por proyecto
      const calculateRealProjectHours = (projects, projectType = null) => {
        return projects.map(project => {
          const projectHours = timeEntries
            .filter(entry => entry.projectId === project.id)
            .reduce((sum, entry) => sum + entry.hours, 0);
          return projectHours;
        });
      };

      const generalValues = calculateRealProjectHours(generalProjects);
      const specificValues = calculateRealProjectHours(specificProjects);
      
      // Para vista combinada, tomar los primeros proyectos con horas registradas
      const combinedProjectsData = [
        ...generalProjects.map(p => ({ ...p, type: 'general' })),
        ...specificProjects.map(p => ({ ...p, type: 'specific' }))
      ];
      
      const combinedValues = calculateRealProjectHours(combinedProjectsData);
      
      const timeDistribution = {
        general: {
          labels: generalProjects.map(p => p.name),
          values: generalValues,
          totalHours: generalValues.reduce((sum, val) => sum + val, 0)
        },
        specific: {
          labels: specificProjects.map(p => p.name),
          values: specificValues,
          totalHours: specificValues.reduce((sum, val) => sum + val, 0)
        },
        combined: {
          labels: combinedProjectsData.map(p => `[${p.type === 'general' ? 'G' : 'E'}] ${p.name}`),
          values: combinedValues,
          totalHours: combinedValues.reduce((sum, val) => sum + val, 0)
        }
      };

      // Comparativa de horas trabajadas vs referencia por tipo de proyecto
      const calculateProjectComparison = (projects, referenceHoursPerProject) => {
        const totalWorked = projects.reduce((sum, project) => {
          const projectHours = timeEntries
            .filter(entry => entry.projectId === project.id)
            .reduce((sum, entry) => sum + entry.hours, 0);
          return sum + projectHours;
        }, 0);
        
        const totalReference = projects.length * referenceHoursPerProject;
        
        const projectDetails = projects.map(project => {
          const worked = timeEntries
            .filter(entry => entry.projectId === project.id)
            .reduce((sum, entry) => sum + entry.hours, 0);
          
          return {
            name: project.name,
            worked: worked,
            reference: referenceHoursPerProject,
            efficiency: referenceHoursPerProject > 0 ? Math.min(100, Math.round((worked / referenceHoursPerProject) * 100)) : 0
          };
        });
        
        return {
          worked: totalWorked,
          reference: totalReference,
          projects: projectDetails
        };
      };

      // Horas de referencia por período para cada tipo de proyecto basadas en días reales
      const getProjectReferenceHours = (projectType) => {
        // Calcular horas base por día para cada tipo de proyecto
        const hoursPerWorkDay = {
          general: 2,    // 2 horas por día laboral para proyectos generales
          specific: 4    // 4 horas por día laboral para proyectos específicos
        };
        
        return workDays * (hoursPerWorkDay[projectType] || hoursPerWorkDay.general);
      };

      const hoursComparison = {
        general: calculateProjectComparison(generalProjects, getProjectReferenceHours('general')),
        specific: calculateProjectComparison(specificProjects, getProjectReferenceHours('specific'))
      };

      // Calcular horas por día de la semana (solo si hay datos)
      const weeklyHours = hasTimeData ? (() => {
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const dayHours = new Array(7).fill(0);
        
        timeEntries.forEach(entry => {
          const entryDate = new Date(entry.date);
          const dayOfWeek = entryDate.getDay();
          dayHours[dayOfWeek] += entry.hours || 0;
        });
        
        return {
          labels: dayNames.slice(1).concat([dayNames[0]]), // Lun-Vie, Dom
          datasets: [{
            name: 'Horas trabajadas',
            data: dayHours.slice(1).concat([dayHours[0]]),
            color: '#2563EB'
          }]
        };
      })() : null;

      // Calendario de actividad - últimos 30 días con datos reales
      const activityCalendar = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Buscar horas reales para esta fecha
        const dayHours = timeEntries
          .filter(entry => entry.date === dateStr)
          .reduce((sum, entry) => sum + (entry.hours || 0), 0);
        
        activityCalendar.push({
          date: dateStr,
          hours: dayHours,
          intensity: dayHours === 0 ? 'none' : dayHours < 4 ? 'low' : dayHours < 8 ? 'medium' : 'high'
        });
      }

      // Contribución por tipo de actividad basada en las tareas de los proyectos
      const generalTasks = ['Organización', 'Mejora continua', 'SmartCampus', 'Certificación', 'Mentoría', 'Preventa'];
      const specificTasks = ['Inicio', 'Planeación', 'Ejecución', 'Monitoreo', 'Cierre'];
      
      // Calcular distribución basada en los proyectos del colaborador
      const getTaskDistribution = () => {
        const totalGeneralProjects = generalProjects.length;
        const totalSpecificProjects = specificProjects.length;
        const totalProjects = totalGeneralProjects + totalSpecificProjects;
        
        if (totalProjects === 0) {
          return { labels: [], values: [] };
        }
        
        // Calcular porcentajes aproximados basados en las tareas de cada tipo de proyecto
        const generalWeight = totalGeneralProjects / totalProjects;
        const specificWeight = totalSpecificProjects / totalProjects;
        
        const taskDistribution = {
          // Tareas más comunes en proyectos generales (rutinarias)
          'Organización': Math.round(generalWeight * 25),
          'Mejora continua': Math.round(generalWeight * 20),
          'SmartCampus': Math.round(generalWeight * 15),
          'Certificación': Math.round(generalWeight * 12),
          'Mentoría': Math.round(generalWeight * 8),
          // Tareas más comunes en proyectos específicos (metodológicas) 
          'Planeación': Math.round(specificWeight * 30),
          'Ejecución': Math.round(specificWeight * 35),
          'Monitoreo': Math.round(specificWeight * 20),
          'Cierre': Math.round(specificWeight * 10),
          'Inicio': Math.round(specificWeight * 5)
        };
        
        // Filtrar valores > 0 y ordenar
        const filteredTasks = Object.entries(taskDistribution)
          .filter(([_, value]) => value > 0)
          .sort(([_, a], [__, b]) => b - a)
          .slice(0, 6); // Máximo 6 categorías para legibilidad
        
        return {
          labels: filteredTasks.map(([task, _]) => task),
          values: filteredTasks.map(([_, value]) => value)
        };
      };
      
      const projectContribution = getTaskDistribution();

      setDashboardData({
        kpis: {
          assignedProjects: myProjects.length,
          generalProjects: generalProjects.length,
          specificProjects: specificProjects.length,
          periodHours: Math.round(totalCapturedHours),
          pendingHours: Math.round(pendingHours),
          personalEfficiency: efficiency,
          availableHours: Math.round(availableHours),
          projectsOverdue: projectsWithDuration.filter(p => p.isOverdue).length,
          averageDaysActive: Math.round(projectsWithDuration.reduce((sum, p) => sum + p.daysActive, 0) / projectsWithDuration.length) || 0
        },
        timeDistribution,
        hoursComparison,
        projectsWithDuration,
        weeklyHours,
        activityCalendar,
        projectContribution
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };


  // Componente para el calendario de actividad
  const ActivityCalendar = ({ data }) => {
    const weeks = [];
    for (let i = 0; i < data.length; i += 7) {
      weeks.push(data.slice(i, i + 7));
    }

    const getColor = (intensity) => {
      switch(intensity) {
        case 'none': return 'bg-gray-100';
        case 'low': return 'bg-green-200';
        case 'medium': return 'bg-green-400';
        case 'high': return 'bg-green-600';
        default: return 'bg-gray-100';
      }
    };

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad de los Últimos 30 Días</h3>
        <div className="flex gap-1">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-1">
              {week.map((day, dayIdx) => (
                <div
                  key={dayIdx}
                  className={`w-4 h-4 rounded-sm ${getColor(day.intensity)} hover:ring-2 hover:ring-offset-1 hover:ring-indigo-500 cursor-pointer`}
                  title={`${day.date}: ${day.hours}h`}
                ></div>
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs text-gray-600">
          <span>Menos</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-200 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-600 rounded-sm"></div>
          </div>
          <span>Más</span>
        </div>
      </div>
    );
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
            <h2 className="text-2xl font-bold text-gray-900">Mi Dashboard Personal</h2>
            <p className="text-gray-600 mt-1">Seguimiento de tareas y productividad</p>
          </div>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2"
          >
            <option value="week">Esta semana</option>
            <option value="month">Este mes</option>
            <option value="quarter">Este trimestre</option>
          </select>
        </div>
      </div>

      {/* KPI Cards - Primera fila */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Proyectos Asignados"
          value={dashboardData.kpis.assignedProjects}
          icon={FolderOpen}
          color="indigo"
        />
        <KPICard
          title="Proyectos Generales"
          value={dashboardData.kpis.generalProjects}
          icon={FolderOpen}
          color="blue"
        />
        <KPICard
          title={`Horas del Período`}
          value={dashboardData.kpis.periodHours}
          icon={Clock}
          color="purple"
          suffix="h"
        />
        <KPICard
          title="Horas Pendientes"
          value={dashboardData.kpis.pendingHours}
          icon={Clock}
          color="yellow"
          suffix="h"
        />
      </div>

      {/* KPI Cards - Segunda fila */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Proyectos Específicos"
          value={dashboardData.kpis.specificProjects}
          icon={Target}
          color="green"
        />
        <KPICard
          title="Eficiencia Personal"
          value={dashboardData.kpis.personalEfficiency}
          icon={TrendingUp}
          color="green"
          format="percent"
        />
        <KPICard
          title="Proyectos Vencidos"
          value={dashboardData.kpis.projectsOverdue}
          icon={AlertCircle}
          color="red"
        />
        <KPICard
          title="Tiempo Disponible"
          value={dashboardData.kpis.availableHours}
          icon={Target}
          color="blue"
          suffix="h"
        />
      </div>

      {/* Selector de Período */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Período de Análisis</h3>
            <p className="text-xs text-gray-500">
              {(() => {
                const period = getSelectedPeriod();
                if (!period) return 'Selecciona un período';
                
                const startDate = new Date(period.startDate).toLocaleDateString('es-MX');
                const endDate = new Date(period.endDate).toLocaleDateString('es-MX');
                return `${period.year}/${String(period.month).padStart(2, '0')} - Quincena ${period.periodNumber} (${startDate} al ${endDate})`;
              })()}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedPeriod('current')}
              className={`px-3 py-1 rounded text-sm ${selectedPeriod === 'current' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              Actual
            </button>
            <button
              onClick={() => setSelectedPeriod('previous')}
              className={`px-3 py-1 rounded text-sm ${selectedPeriod === 'previous' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              Anterior
            </button>
            {/* Selector desplegable para períodos específicos */}
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-1 rounded text-sm border border-gray-300 bg-white text-gray-600"
            >
              <option value="current">Período Actual</option>
              <option value="previous">Período Anterior</option>
              {availablePeriods.slice(0, 10).map(period => (
                <option key={period.id} value={period.id}>
                  {period.year}/{String(period.month).padStart(2, '0')} Q{period.periodNumber}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Distribución de tiempo por proyecto */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Mi Distribución de Tiempo por Proyecto</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setProjectView('combined')}
              className={`px-3 py-1 rounded text-sm ${projectView === 'combined' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              Todos
            </button>
            <button
              onClick={() => setProjectView('general')}
              className={`px-3 py-1 rounded text-sm ${projectView === 'general' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              Generales
            </button>
            <button
              onClick={() => setProjectView('specific')}
              className={`px-3 py-1 rounded text-sm ${projectView === 'specific' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              Específicos
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribución por proyecto */}
          <div className="bg-gray-50 p-4 rounded-lg">
            {getTotalHours(dashboardData.timeDistribution, projectView) > 0 ? (
              <DoughnutChart
                title={projectView === 'combined' ? 'Todos los Proyectos' : projectView === 'general' ? 'Proyectos Generales' : 'Proyectos Específicos'}
                data={dashboardData.timeDistribution?.[projectView] || { labels: [], values: [] }}
                centerText={`${getTotalHours(dashboardData.timeDistribution, projectView)}h Total`}
                height={300}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-72 text-gray-500">
                <FolderOpen className="h-12 w-12 mb-4 text-gray-300" />
                <p className="text-lg font-medium">Sin horas registradas</p>
                <p className="text-sm text-center">
                  {projectView === 'combined' && 'No hay horas registradas en ningún proyecto'}
                  {projectView === 'general' && 'No hay horas registradas en proyectos generales'}
                  {projectView === 'specific' && 'No hay horas registradas en proyectos específicos'}
                </p>
              </div>
            )}
          </div>
          
          {/* Contribución por tipo de actividad */}
          <div className="bg-gray-50 p-4 rounded-lg">
            {dashboardData.projectContribution?.values?.length > 0 ? (
              <DoughnutChart
                title="Contribución por Tipo de Actividad"
                data={dashboardData.projectContribution}
                centerText="100%"
                height={300}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-72 text-gray-500">
                <ListChecks className="h-12 w-12 mb-4 text-gray-300" />
                <p className="text-lg font-medium">Sin actividades registradas</p>
                <p className="text-sm text-center">Las actividades se mostrarán cuando registres horas en proyectos</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comparativa de horas trabajadas vs referencia */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Horas Trabajadas vs Horas de Referencia 
          <span className="text-sm font-normal text-gray-500 ml-2">
            (Período Seleccionado)
          </span>
        </h3>
        
        {/* Resumen general */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">Proyectos Generales</h4>
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-600">Trabajadas: {dashboardData.hoursComparison?.general?.worked || 0}h</span>
              <span className="text-sm text-green-600">Referencia: {dashboardData.hoursComparison?.general?.reference || 0}h</span>
            </div>
            <div className="mt-2 bg-green-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ 
                  width: `${Math.min(100, ((dashboardData.hoursComparison?.general?.worked || 0) / (dashboardData.hoursComparison?.general?.reference || 1)) * 100)}%` 
                }}
              ></div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">Proyectos Específicos</h4>
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-600">Trabajadas: {dashboardData.hoursComparison?.specific?.worked || 0}h</span>
              <span className="text-sm text-blue-600">Referencia: {dashboardData.hoursComparison?.specific?.reference || 0}h</span>
            </div>
            <div className="mt-2 bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ 
                  width: `${Math.min(100, ((dashboardData.hoursComparison?.specific?.worked || 0) / (dashboardData.hoursComparison?.specific?.reference || 1)) * 100)}%` 
                }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* Detalle por proyecto */}
        <div className="space-y-4">
          {(dashboardData.hoursComparison?.general?.projects || []).map((project, idx) => (
            <div key={`general-${idx}`} className="border border-green-200 rounded p-3 bg-green-50">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-green-800">[G] {project.name}</span>
                <span className="text-sm text-green-600">{project.efficiency}% eficiencia</span>
              </div>
              <div className="flex justify-between text-sm text-green-600 mb-1">
                <span>Trabajadas: {project.worked}h</span>
                <span>Referencia: {project.reference}h</span>
              </div>
              <div className="bg-green-200 rounded-full h-1.5">
                <div 
                  className="bg-green-600 h-1.5 rounded-full" 
                  style={{ width: `${Math.min(100, (project.worked / project.reference) * 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
          
          {(dashboardData.hoursComparison?.specific?.projects || []).map((project, idx) => (
            <div key={`specific-${idx}`} className="border border-blue-200 rounded p-3 bg-blue-50">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-blue-800">[E] {project.name}</span>
                <span className="text-sm text-blue-600">{project.efficiency}% eficiencia</span>
              </div>
              <div className="flex justify-between text-sm text-blue-600 mb-1">
                <span>Trabajadas: {project.worked}h</span>
                <span>Referencia: {project.reference}h</span>
              </div>
              <div className="bg-blue-200 rounded-full h-1.5">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full" 
                  style={{ width: `${Math.min(100, (project.worked / project.reference) * 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Horas por período */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Mis Horas Trabajadas del Período
        </h3>
        {dashboardData.weeklyHours ? (
          <StackedBarChart
            title=""
            data={dashboardData.weeklyHours}
            xAxisLabel="Días"
            yAxisLabel="Horas"
            height={300}
            stacked={false}
            maxValue={10}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Clock className="h-12 w-12 mb-4 text-gray-300" />
            <p className="text-lg font-medium">Sin datos de tiempo registrados</p>
            <p className="text-sm">Comienza a registrar tus horas para ver el análisis aquí</p>
          </div>
        )}
      </div>

      {/* Calendario de actividad */}
      <ActivityCalendar data={dashboardData.activityCalendar} />

      {/* Logros y reconocimientos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <Award className="h-5 w-5 mr-2 text-yellow-500" />
          <h3 className="text-lg font-semibold text-gray-900">Logros Recientes</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center justify-between mb-2">
              <Award className="h-8 w-8 text-yellow-600" />
              <span className="text-xs text-yellow-600 font-medium">Esta semana</span>
            </div>
            <h4 className="font-semibold text-gray-900">Súper Productivo</h4>
            <p className="text-sm text-gray-600 mt-1">Completaste más de 10 tareas</p>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <span className="text-xs text-green-600 font-medium">Este mes</span>
            </div>
            <h4 className="font-semibold text-gray-900">Cero Retrasos</h4>
            <p className="text-sm text-gray-600 mt-1">Todas las entregas a tiempo</p>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <span className="text-xs text-blue-600 font-medium">Este trimestre</span>
            </div>
            <h4 className="font-semibold text-gray-900">Alta Eficiencia</h4>
            <p className="text-sm text-gray-600 mt-1">Eficiencia superior al 90%</p>
          </div>
        </div>
      </div>

      {/* Resumen de estadísticas de proyectos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Mi Resumen de Proyectos</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-indigo-600">
              {dashboardData.kpis.assignedProjects}
            </p>
            <p className="text-sm text-gray-600 mt-1">Proyectos asignados</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">
              {dashboardData.kpis.personalEfficiency}%
            </p>
            <p className="text-sm text-gray-600 mt-1">Eficiencia promedio</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">
              {dashboardData.kpis.periodHours}h
            </p>
            <p className="text-sm text-gray-600 mt-1">Horas trabajadas {selectedPeriod === 'week' ? 'esta semana' : selectedPeriod === 'month' ? 'este mes' : 'este trimestre'}</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-orange-600">
              {dashboardData.kpis.averageDaysActive}
            </p>
            <p className="text-sm text-gray-600 mt-1">Días promedio trabajando proyectos</p>
          </div>
        </div>
        
        {/* Información adicional sobre proyectos vencidos */}
        {dashboardData.kpis.projectsOverdue > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-700 font-medium">
                {dashboardData.kpis.projectsOverdue} proyecto{dashboardData.kpis.projectsOverdue > 1 ? 's' : ''} con fecha de finalización vencida
              </span>
            </div>
          </div>
        )}
        
        {/* Lista de proyectos con información de duración */}
        {dashboardData.projectsWithDuration && dashboardData.projectsWithDuration.length > 0 && (
          <div className="mt-6">
            <h4 className="font-semibold text-gray-900 mb-3">Estado de Mis Proyectos</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {dashboardData.projectsWithDuration.map((project, idx) => (
                <div key={idx} className={`p-3 rounded-lg border ${project.isOverdue ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`font-medium ${project.isOverdue ? 'text-red-800' : 'text-gray-800'}`}>
                        {project.isGeneral ? '[G]' : '[E]'} {project.name}
                      </span>
                      <div className="text-sm text-gray-600 mt-1">
                        <span>Activo desde: {project.daysActive} días</span>
                        {project.daysRemaining !== null && (
                          <span className={`ml-4 ${project.isOverdue ? 'text-red-600' : project.daysRemaining < 7 ? 'text-yellow-600' : 'text-gray-600'}`}>
                            {project.isOverdue ? `Vencido hace ${Math.abs(project.daysRemaining)} días` : `${project.daysRemaining} días restantes`}
                          </span>
                        )}
                      </div>
                    </div>
                    {project.isOverdue && (
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollaboratorDashboard;