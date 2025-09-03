import api from '@/services/api';

export const timePeriodService = {
  // Obtener todos los períodos
  getAll: async (params = {}) => {
    const response = await api.get('/time-periods', { params });
    return response.data;
  },

  // Obtener un período por ID
  getById: async (id) => {
    const response = await api.get(`/time-periods/${id}`);
    return response.data;
  },

  // Crear un nuevo período
  create: async (periodData) => {
    const response = await api.post('/time-periods', periodData);
    return response.data;
  },

  // Crear múltiples períodos
  createBulk: async (periodsData) => {
    const response = await api.post('/time-periods/bulk', { periods: periodsData });
    return response.data;
  },

  // Actualizar un período
  update: async (id, periodData) => {
    const response = await api.put(`/time-periods/${id}`, periodData);
    return response.data;
  },

  // Eliminar un período
  delete: async (id) => {
    const response = await api.delete(`/time-periods/${id}`);
    return response.data;
  },

  // Obtener período actual
  getCurrent: async () => {
    const response = await api.get('/time-periods/current');
    return response.data;
  },

  // Obtener períodos por rango de fecha
  getByDateRange: async (startDate, endDate) => {
    const response = await api.get('/time-periods/range', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // Obtener estadísticas de un período
  getStatistics: async (periodId) => {
    const response = await api.get(`/time-periods/${periodId}/statistics`);
    return response.data;
  },

  // Comparar horas trabajadas vs referencia
  getComparison: async (periodId, userId = null) => {
    const params = userId ? { userId } : {};
    const response = await api.get(`/time-periods/${periodId}/comparison`, { params });
    return response.data;
  }
};