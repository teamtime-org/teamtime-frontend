import api from './api';

export const projectService = {
  getAll: async (params = {}) => {
    const searchParams = new URLSearchParams();
    
    // Add query parameters
    if (params.page) searchParams.append('page', params.page);
    if (params.limit) searchParams.append('limit', params.limit);
    if (params.search) searchParams.append('search', params.search);
    if (params.status) searchParams.append('status', params.status);
    if (params.priority) searchParams.append('priority', params.priority);
    if (params.areaId) searchParams.append('areaId', params.areaId);
    if (params.userId) searchParams.append('userId', params.userId);
    if (params.assignedUserId) searchParams.append('assignedUserId', params.assignedUserId);
    // Excel filters
    if (params.mentorId) searchParams.append('mentorId', params.mentorId);
    if (params.coordinatorId) searchParams.append('coordinatorId', params.coordinatorId);
    if (params.salesManagementId) searchParams.append('salesManagementId', params.salesManagementId);
    if (params.salesExecutiveId) searchParams.append('salesExecutiveId', params.salesExecutiveId);
    if (params.siebelOrderNumber) searchParams.append('siebelOrderNumber', params.siebelOrderNumber);
    
    const queryString = searchParams.toString();
    const response = await api.get(`/projects${queryString ? `?${queryString}` : ''}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  create: async (projectData) => {
    const response = await api.post('/projects', projectData);
    return response.data;
  },

  update: async (id, projectData) => {
    const response = await api.put(`/projects/${id}`, projectData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },

  // Project assignments
  getAssignments: async (id) => {
    const response = await api.get(`/projects/${id}/assignments`);
    return response.data;
  },

  assignUser: async (projectId, userId) => {
    const response = await api.post(`/projects/${projectId}/assignments`, { userId });
    return response.data;
  },

  unassignUser: async (projectId, userId) => {
    const response = await api.delete(`/projects/${projectId}/assignments/${userId}`);
    return response.data;
  },

  // Project tasks
  getTasks: async (id) => {
    const response = await api.get(`/projects/${id}/tasks`);
    return response.data;
  },

  // Project statistics
  getStatistics: async (id) => {
    const response = await api.get(`/projects/${id}/statistics`);
    return response.data;
  },

  // Time entries for project
  getTimeEntries: async (id, params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.startDate) searchParams.append('startDate', params.startDate);
    if (params.endDate) searchParams.append('endDate', params.endDate);
    if (params.userId) searchParams.append('userId', params.userId);
    
    const queryString = searchParams.toString();
    const response = await api.get(`/projects/${id}/time-entries${queryString ? `?${queryString}` : ''}`);
    return response.data;
  },

  // Project progress
  getProgress: async (id) => {
    const response = await api.get(`/projects/${id}/progress`);
    return response.data;
  },
};