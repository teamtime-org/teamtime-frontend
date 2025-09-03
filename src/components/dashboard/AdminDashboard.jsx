import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  FolderOpen, 
  AlertTriangle,
  Clock,
  CheckCircle,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import {
  KPICard,
  DoughnutChart,
  AreaChart,
  ScatterChart,
  HeatmapChart,
  StackedBarChart
} from '../charts';
import DashboardFilters from './DashboardFilters';
import { projectService } from '@/services/projectService';
import { areaService } from '@/services/areaService';
import userService from '@/services/userService';
import { timesheetService } from '@/services/timesheetService';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    kpis: {},
    projectsByArea: {},
    timeline: {},
    riskMatrix: [],
    workloadHeatmap: {},
    budgetAnalysis: {}
  });
  const [filters, setFilters] = useState({
    period: '30days',
    area: 'all',
    status: 'all',
    risk: 'all'
  });

  useEffect(() => {
    loadDashboardData();
  }, [filters]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Cargar datos en paralelo
      const [projectsRes, areasRes, usersRes] = await Promise.all([
        projectService.getAll({ page: 1, limit: 1000 }),
        areaService.getAll({ page: 1, limit: 100 }),
        userService.getUsers(1, 1000)
      ]);

      const projects = projectsRes.data?.projects || projectsRes.projects || [];
      const areas = areasRes.data?.areas || areasRes.areas || [];
      const users = usersRes.data?.users || usersRes.users || [];

      // Calcular KPIs
      const totalProjects = projects.length;
      const activeAreas = areas.filter(a => a.isActive !== false).length;
      const activeUsers = users.filter(u => u.isActive !== false).length;
      const projectsAtRisk = projects.filter(p => p.riskLevel === 'high').length;
      
      // Simular datos por ahora
      const totalHours = projects.length * 100; // Simulado
      const completedProjects = projects.filter(p => p.status === 'COMPLETED').length;
      const averageEfficiency = completedProjects > 0 ? (completedProjects / projects.length) * 100 : 85;
      const budgetUsed = 67; // Simulado

      // Distribución de proyectos por área
      const projectsByArea = areas.reduce((acc, area) => {
        const count = projects.filter(p => p.areaId === area.id).length;
        if (count > 0) {
          acc.labels.push(area.name);
          acc.values.push(count);
        }
        return acc;
      }, { labels: [], values: [] });

      // Timeline de proyectos
      const timelineData = {
        periods: ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'],
        areas: areas.slice(0, 5).map(area => ({
          name: area.name,
          data: [
            projects.filter(p => p.areaId === area.id && p.quarter === 'Q1').length,
            projects.filter(p => p.areaId === area.id && p.quarter === 'Q2').length,
            projects.filter(p => p.areaId === area.id && p.quarter === 'Q3').length,
            projects.filter(p => p.areaId === area.id && p.quarter === 'Q4').length
          ]
        }))
      };

      // Matriz de riesgo vs progreso
      const riskMatrix = projects.slice(0, 20).map(project => ({
        project: project.name,
        progress: project.progress || Math.random() * 100,
        risk: project.riskLevel === 'high' ? 8 : project.riskLevel === 'medium' ? 5 : 2,
        area: areas.find(a => a.id === project.areaId)?.name || 'Sin área'
      }));

      // Heatmap de carga de trabajo
      const coordinators = users.filter(u => u.role === 'COORDINADOR').slice(0, 5);
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
      const workloadData = coordinators.map(() => 
        months.map(() => Math.floor(Math.random() * 40) + 60)
      );

      setDashboardData({
        kpis: {
          totalProjects,
          activeAreas,
          activeUsers,
          projectsAtRisk,
          totalHours: Math.round(totalHours),
          completedProjects,
          averageEfficiency: Math.round(averageEfficiency),
          budgetUsed: Math.round(budgetUsed)
        },
        projectsByArea,
        timeline: timelineData,
        riskMatrix,
        workloadHeatmap: {
          xAxis: months,
          yAxis: coordinators.map(c => `${c.firstName} ${c.lastName}`),
          data: workloadData
        }
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

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleExport = (type, exportFilters) => {
    console.log(`Exporting dashboard as ${type} with filters:`, exportFilters);
  };

  return (
    <div className="space-y-6">
      {/* Filtros y Exportación */}
      <DashboardFilters 
        onFilterChange={handleFilterChange}
        onExport={handleExport}
        dashboardType="admin"
        showExportOptions={true}
      />

      {/* Contenedor principal del dashboard para exportación */}
      <div id="dashboard-content" className="space-y-6">

      {/* KPI Cards - Primera fila */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Proyectos"
          value={dashboardData.kpis.totalProjects}
          icon={FolderOpen}
          color="indigo"
          trend="up"
          trendValue={12}
        />
        <KPICard
          title="Áreas Activas"
          value={dashboardData.kpis.activeAreas}
          icon={Building2}
          color="green"
        />
        <KPICard
          title="Usuarios Activos"
          value={dashboardData.kpis.activeUsers}
          icon={Users}
          color="blue"
          trend="up"
          trendValue={5}
        />
        <KPICard
          title="Proyectos en Riesgo"
          value={dashboardData.kpis.projectsAtRisk}
          icon={AlertTriangle}
          color="red"
          trend="down"
          trendValue={-8}
        />
      </div>

      {/* KPI Cards - Segunda fila */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Horas Capturadas"
          value={dashboardData.kpis.totalHours}
          icon={Clock}
          color="purple"
          format="number"
          suffix="h"
        />
        <KPICard
          title="Proyectos Completados"
          value={dashboardData.kpis.completedProjects}
          icon={CheckCircle}
          color="green"
        />
        <KPICard
          title="Eficiencia Promedio"
          value={dashboardData.kpis.averageEfficiency}
          icon={TrendingUp}
          color="yellow"
          format="percent"
        />
        <KPICard
          title="Presupuesto Utilizado"
          value={dashboardData.kpis.budgetUsed}
          icon={DollarSign}
          color="indigo"
          format="percent"
        />
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución de proyectos por área */}
        <DoughnutChart
          title="Distribución de Proyectos por Área"
          data={dashboardData.projectsByArea}
          centerText={`${dashboardData.kpis.totalProjects} Total`}
          height={350}
        />

        {/* Timeline de proyectos */}
        <AreaChart
          title="Proyectos por Trimestre"
          data={{
            labels: dashboardData.timeline.periods || [],
            datasets: (dashboardData.timeline.areas || []).map((area, index) => ({
              name: area.name,
              data: area.data,
              color: index === 0 ? '#2563EB' : '#059669'
            }))
          }}
          xAxisLabel="Trimestres"
          yAxisLabel="Cantidad de Proyectos"
          height={350}
        />
      </div>

      {/* Matriz de riesgo */}
      <ScatterChart
        title="Matriz de Riesgo vs Progreso"
        data={dashboardData.riskMatrix}
        height={400}
      />

      {/* Heatmap de carga de trabajo */}
      {dashboardData.workloadHeatmap.data && dashboardData.workloadHeatmap.data.length > 0 && (
        <HeatmapChart
          title="Carga de Trabajo por Coordinador"
          xAxis={dashboardData.workloadHeatmap.xAxis}
          yAxis={dashboardData.workloadHeatmap.yAxis}
          data={dashboardData.workloadHeatmap.data}
          height={300}
        />
      )}

      {/* Análisis de presupuesto por área */}
      <StackedBarChart
        title="Análisis de Presupuesto por Área"
        data={{
          labels: ['TI', 'Marketing', 'Finanzas', 'RRHH', 'Operaciones'],
          datasets: [
            {
              name: 'Presupuesto Asignado',
              data: [450000, 320000, 280000, 150000, 380000],
              color: '#2563EB'
            },
            {
              name: 'Presupuesto Utilizado',
              data: [380000, 290000, 250000, 120000, 340000],
              color: '#059669'
            },
            {
              name: 'Presupuesto Restante',
              data: [70000, 30000, 30000, 30000, 40000],
              color: '#E5E7EB'
            }
          ]
        }}
        xAxisLabel="Áreas"
        yAxisLabel="Presupuesto (MXN)"
        height={350}
        stacked={false}
      />
      </div>
    </div>
  );
};

export default AdminDashboard;