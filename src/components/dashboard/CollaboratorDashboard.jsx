import React, { useState, useEffect } from 'react';
import { 
  FolderOpen, 
  Clock,
  TrendingUp,
  Calendar,
  Target,
  Activity
} from 'lucide-react';
import {
  KPICard,
  DoughnutChart,
  StackedBarChart
} from '../charts';
import dashboardService from '@/services/dashboardService';
import { useAuth } from '@/hooks/useAuth';

const CollaboratorDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  
  // Período por defecto - semana actual
  const [startDate, setStartDate] = useState('2025-09-15');
  const [endDate, setEndDate] = useState('2025-09-21');

  useEffect(() => {
    loadDashboardData();
  }, [startDate, endDate]);

  // Función simplificada para cargar datos del dashboard
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const result = await dashboardService.getCollaboratorDashboard({
        startDate,
        endDate
      });
      setDashboardData(result.data);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Datos por defecto en caso de error
      setDashboardData({
        period: { startDate, endDate, workDays: 5, description: `${startDate} - ${endDate}` },
        kpis: { assignedProjects: 0, generalProjects: 0, specificProjects: 0, capturedHours: 0, referenceHours: 45, workload: 0 },
        projects: { distribution: [] },
        timeAnalysis: { totalEntries: 0, weeklyDistribution: { labels: [], data: [] }, hoursComparison: { general: { worked: 0, reference: 0 }, specific: { worked: 0, reference: 0 } } }
      });
    } finally {
      setLoading(false);
    }
  };

  // Función simplificada para descripción del período
  const getPeriodDescription = () => {
    return dashboardData?.period?.description || `${startDate} - ${endDate}`;
  };

  // Función para obtener el color de la carga de trabajo
  const getWorkloadColor = (workload) => {
    if (workload < 80) return 'yellow';
    if (workload <= 100) return 'green';
    return 'red';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Cargando dashboard...</span>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-gray-400 text-lg mb-2">No hay datos disponibles</div>
          <button 
            onClick={loadDashboardData}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Colaborador</h1>
            <p className="text-gray-600 mt-1">
              Período: {getPeriodDescription()} ({dashboardData.period?.workDays || 0} días laborales)
            </p>
          </div>
          
          {/* Controles de período */}
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2">
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <KPICard
          title="Proyectos Asignados"
          value={dashboardData.kpis?.assignedProjects || 0}
          icon={FolderOpen}
          color="indigo"
        />
        
        <KPICard
          title="Horas Capturadas"
          value={parseFloat(dashboardData.kpis?.capturedHours) || 0}
          suffix="h"
          icon={Clock}
          color="blue"
        />
        
        <KPICard
          title="Carga de Trabajo"
          value={parseInt(dashboardData.kpis?.workload) || 0}
          suffix="%"
          icon={TrendingUp}
          color={getWorkloadColor(parseInt(dashboardData.kpis?.workload) || 0)}
          subtitle={`Objetivo: ${parseInt(dashboardData.kpis?.referenceHours) || 0}h`}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución de tiempo por proyecto */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución de Tiempo</h3>
          {dashboardData.projects?.distribution?.length > 0 ? (
            <DoughnutChart
              data={{
                labels: dashboardData.projects.distribution.map(p => p.name),
                datasets: [{
                  data: dashboardData.projects.distribution.map(p => p.hours),
                  backgroundColor: [
                    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
                    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
                  ]
                }]
              }}
              options={{
                plugins: {
                  legend: { position: 'bottom' }
                }
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500">
              No hay datos de distribución
            </div>
          )}
        </div>

        {/* Distribución semanal */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución Semanal</h3>
          {dashboardData.timeAnalysis?.weeklyDistribution?.data?.length > 0 ? (
            <StackedBarChart
              data={{
                labels: dashboardData.timeAnalysis.weeklyDistribution.labels,
                datasets: [{
                  label: 'Horas trabajadas',
                  data: dashboardData.timeAnalysis.weeklyDistribution.data,
                  backgroundColor: '#3B82F6'
                }]
              }}
              options={{
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  y: { beginAtZero: true }
                }
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500">
              No hay datos de distribución semanal
            </div>
          )}
        </div>
      </div>

      {/* Resumen de proyectos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Proyectos Generales */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-green-600" />
            Actividades Generales ({dashboardData.kpis?.generalProjects || 0})
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Horas trabajadas:</span>
              <span className="font-semibold">{dashboardData.timeAnalysis?.hoursComparison?.general?.worked || 0}h</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Horas de referencia:</span>
              <span className="text-gray-500">{dashboardData.timeAnalysis?.hoursComparison?.general?.reference || 0}h</span>
            </div>
          </div>
        </div>

        {/* Proyectos Específicos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2 text-blue-600" />
            Proyectos Específicos ({dashboardData.kpis?.specificProjects || 0})
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Horas trabajadas:</span>
              <span className="font-semibold">{dashboardData.timeAnalysis?.hoursComparison?.specific?.worked || 0}h</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Horas de referencia:</span>
              <span className="text-gray-500">{dashboardData.timeAnalysis?.hoursComparison?.specific?.reference || 0}h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas adicionales */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas del Período</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{dashboardData.timeAnalysis?.totalEntries || 0}</div>
            <div className="text-sm text-gray-600">Registros de tiempo</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{dashboardData.kpis?.capturedHours || 0}h</div>
            <div className="text-sm text-gray-600">Total capturado</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{dashboardData.period?.workDays || 0}</div>
            <div className="text-sm text-gray-600">Días laborales</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaboratorDashboard;