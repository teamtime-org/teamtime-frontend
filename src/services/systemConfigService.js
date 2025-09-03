import api from '@/services/api';

export const systemConfigService = {
  // Obtener todas las configuraciones del sistema
  getAll: async () => {
    const response = await api.get('/system-config');
    return response.data;
  },

  // Obtener una configuración específica por clave
  getConfig: async (key) => {
    const response = await api.get(`/system-config/${key}`);
    return response.data;
  },

  // Crear o actualizar una configuración
  setConfig: async (configData) => {
    const response = await api.post('/system-config', configData);
    return response.data;
  },

  // Eliminar una configuración
  deleteConfig: async (key) => {
    const response = await api.delete(`/system-config/${key}`);
    return response.data;
  },

  // Obtener configuración de días futuros permitidos
  getFutureDaysConfig: async () => {
    const response = await api.get('/system-config/future-days');
    return response.data;
  },

  // Configurar días futuros permitidos
  setFutureDaysConfig: async (days) => {
    const response = await api.put('/system-config/future-days', { days });
    return response.data;
  },

  // Obtener configuraciones de restricciones de fecha
  getDateRestrictionConfigs: async () => {
    const response = await api.get('/system-config/date-restrictions');
    return response.data;
  },

  // Configurar restricciones de fecha para timesheet
  setDateRestrictionConfigs: async (configs) => {
    const response = await api.put('/system-config/date-restrictions', configs);
    return response.data;
  },

  // Validar fecha para registro de tiempo
  validateDateForTimeEntry: async (date) => {
    const response = await api.get('/system-config/validate-date', { 
      params: { date: date.toISOString().split('T')[0] }
    });
    return response.data;
  },

  // Inicializar configuraciones por defecto
  initializeDefaults: async () => {
    const response = await api.post('/system-config/initialize');
    return response.data;
  }
};