import api from './api';

const areaService = {
  getAll: async () => {
    const response = await api.get('/areas');
    return response.data;
  },

  // Alias para compatibilidad con vistas que usan getAreas
  getAreas: async () => {
    const response = await api.get('/areas');
    const result = response.data.data?.areas || response.data.data || response.data;
    // Asegurar que siempre se devuelva un array
    return Array.isArray(result) ? result : [];
  },

  getById: async (id) => {
    const response = await api.get(`/areas/${id}`);
    return response.data;
  },

  create: async (areaData) => {
    const response = await api.post('/areas', areaData);
    return response.data;
  },

  update: async (id, areaData) => {
    const response = await api.put(`/areas/${id}`, areaData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/areas/${id}`);
    return response.data;
  },

  getStatistics: async (id) => {
    const response = await api.get(`/areas/${id}/statistics`);
    return response.data;
  },

  getUsers: async (id) => {
    const response = await api.get(`/areas/${id}/users`);
    return response.data;
  },

  getProjects: async (id) => {
    const response = await api.get(`/areas/${id}/projects`);
    return response.data;
  },
};

export { areaService };
export default areaService;