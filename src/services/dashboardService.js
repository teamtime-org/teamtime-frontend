import api from './api';

const dashboardService = {
  // Dashboard Admin
  getAdminDashboard: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/dashboard/admin?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching admin dashboard:', error);
      throw error;
    }
  },

  // Dashboard Coordinador
  getCoordinatorDashboard: async (coordinatorId, filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/dashboard/coordinator/${coordinatorId}?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching coordinator dashboard:', error);
      throw error;
    }
  },

  // Dashboard Colaborador
  getCollaboratorDashboard: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/dashboard/collaborator?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching collaborator dashboard:', error);
      throw error;
    }
  },

  // Métricas KPI generales
  getKPIMetrics: async (role, userId = null) => {
    try {
      const endpoint = userId ? `/dashboard/kpi/${role}/${userId}` : `/dashboard/kpi/${role}`;
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      console.error('Error fetching KPI metrics:', error);
      throw error;
    }
  },

  // Datos para gráficas específicas
  getChartData: async (chartType, params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await api.get(`/dashboard/charts/${chartType}?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching chart data:', error);
      throw error;
    }
  },

  // Matriz de riesgo
  getRiskMatrix: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/dashboard/risk-matrix?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching risk matrix:', error);
      throw error;
    }
  },

  // Heatmap de carga de trabajo
  getWorkloadHeatmap: async (period = 'month', areaId = null) => {
    try {
      const params = new URLSearchParams({ period, ...(areaId && { areaId }) }).toString();
      const response = await api.get(`/dashboard/workload-heatmap?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching workload heatmap:', error);
      throw error;
    }
  },

  // Timeline de proyectos
  getProjectTimeline: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/dashboard/project-timeline?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching project timeline:', error);
      throw error;
    }
  },

  // Burndown chart
  getBurndownData: async (projectId, sprintId = null) => {
    try {
      const endpoint = sprintId ? 
        `/dashboard/burndown/${projectId}/${sprintId}` : 
        `/dashboard/burndown/${projectId}`;
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      console.error('Error fetching burndown data:', error);
      throw error;
    }
  },

  // Distribución de tareas
  getTaskDistribution: async (userId = null, projectId = null) => {
    try {
      const params = new URLSearchParams({
        ...(userId && { userId }),
        ...(projectId && { projectId })
      }).toString();
      const response = await api.get(`/dashboard/task-distribution?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching task distribution:', error);
      throw error;
    }
  },

  // Análisis de presupuesto
  getBudgetAnalysis: async (areaId = null, projectId = null) => {
    try {
      const params = new URLSearchParams({
        ...(areaId && { areaId }),
        ...(projectId && { projectId })
      }).toString();
      const response = await api.get(`/dashboard/budget-analysis?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching budget analysis:', error);
      throw error;
    }
  },

  // Actividad del calendario
  getActivityCalendar: async (userId, startDate, endDate) => {
    try {
      const params = new URLSearchParams({ userId, startDate, endDate }).toString();
      const response = await api.get(`/dashboard/activity-calendar?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching activity calendar:', error);
      throw error;
    }
  },

  // Exportar dashboard a PDF
  exportDashboardPDF: async (dashboardType, filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/dashboard/export/pdf/${dashboardType}?${params}`, {
        responseType: 'blob'
      });
      
      // Crear URL para descargar
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `dashboard-${dashboardType}-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return true;
    } catch (error) {
      console.error('Error exporting dashboard to PDF:', error);
      throw error;
    }
  },

  // Exportar datos a Excel
  exportDashboardExcel: async (dashboardType, filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/dashboard/export/excel/${dashboardType}?${params}`, {
        responseType: 'blob'
      });
      
      // Crear URL para descargar
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `dashboard-${dashboardType}-${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return true;
    } catch (error) {
      console.error('Error exporting dashboard to Excel:', error);
      throw error;
    }
  }
};

export default dashboardService;