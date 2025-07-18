import api from '@/services/api';

export const timesheetService = {
  // Get all time entries with filtering and pagination
  getAll: async (params = {}) => {
    const response = await api.get('/time-entries', { params });
    return response.data;
  },

  // Get all time entries with filtering and pagination
  getTimeEntries: async (params = {}) => {
    const response = await api.get('/time-entries', { params });
    return response.data;
  },

  // Get time entry by ID
  getTimeEntryById: async (id) => {
    const response = await api.get(`/time-entries/${id}`);
    return response.data;
  },

  // Create new time entry
  createTimeEntry: async (entryData) => {
    const response = await api.post('/time-entries', entryData);
    return response.data;
  },

  // Update time entry
  updateTimeEntry: async (id, entryData) => {
    const response = await api.put(`/time-entries/${id}`, entryData);
    return response.data;
  },

  // Delete time entry
  deleteTimeEntry: async (id) => {
    const response = await api.delete(`/time-entries/${id}`);
    return response.data;
  },

  // Get time entries for a specific period  
  getByPeriod: async (startDate, endDate, userId = null) => {
    const params = { startDate, endDate };
    if (userId) params.userId = userId;
    const response = await api.get('/time-entries', { params });
    return response.data;
  },

  // Get current user's time entries
  getMyTimeEntries: async (params = {}) => {
    const response = await api.get('/time-entries', { params });
    return response.data;
  },

  // Get time entries for a specific week
  getWeeklyTimeEntries: async (startDate, endDate, userId = null) => {
    const params = { startDate, endDate };
    if (userId) params.userId = userId;
    const response = await api.get('/time-entries', { params });
    return response.data;
  },

  // Note: Approval functionality not yet implemented in backend
  // submit: async (id) => {
  //   const response = await api.post(`/timesheets/${id}/submit`);
  //   return response.data;
  // },

  // approve: async (id, approvalData = {}) => {
  //   const response = await api.post(`/timesheets/${id}/approve`, approvalData);
  //   return response.data;
  // },

  // reject: async (id, rejectionData) => {
  //   const response = await api.post(`/timesheets/${id}/reject`, rejectionData);
  //   return response.data;
  // },

  // reopen: async (id) => {
  //   const response = await api.post(`/timesheets/${id}/reopen`);
  //   return response.data;
  // },

  // Note: These functions use non-existent endpoints, commented out
  // getTimeEntries: async (id) => {
  //   const response = await api.get(`/timesheets/${id}/entries`);
  //   return response.data;
  // },

  // addTimeEntry: async (id, entryData) => {
  //   const response = await api.post(`/timesheets/${id}/entries`, entryData);
  //   return response.data;
  // },

  // Timer functionality not yet implemented in backend
  // startTimer: async (taskId, description = '') => {
  //   const response = await api.post('/timesheets/timer/start', { taskId, description });
  //   return response.data;
  // },

  // stopTimer: async () => {
  //   const response = await api.post('/timesheets/timer/stop');
  //   return response.data;
  // },

  // getCurrentTimer: async () => {
  //   const response = await api.get('/timesheets/timer/current');
  //   return response.data;
  // },

  // getTimerHistory: async (params = {}) => {
  //   const response = await api.get('/timesheets/timer/history', { params });
  //   return response.data;
  // },

  // Note: Advanced features not yet implemented in backend
  // updateTimer: async (timerId, timerData) => {
  //   const response = await api.put(`/timesheets/timer/${timerId}`, timerData);
  //   return response.data;
  // },

  // deleteTimer: async (timerId) => {
  //   const response = await api.delete(`/timesheets/timer/${timerId}`);
  //   return response.data;
  // },

  // Statistics available at /time-entries/stats
  getStatistics: async (filters = {}) => {
    const response = await api.get('/time-entries/stats', { params: filters });
    return response.data;
  },

  // Note: These advanced features not yet implemented
  // getUserStatistics: async (userId, filters = {}) => {
  //   const response = await api.get(`/timesheets/users/${userId}/statistics`, { params: filters });
  //   return response.data;
  // },

  // exportTimesheet: async (filters = {}, format = 'csv') => {
  //   const response = await api.get('/timesheets/export', { 
  //     params: { ...filters, format },
  //     responseType: 'blob'
  //   });
  //   return response.data;
  // },

  // importTimesheet: async (formData) => {
  //   const response = await api.post('/timesheets/import', formData, {
  //     headers: {
  //       'Content-Type': 'multipart/form-data',
  //     },
  //   });
  //   return response.data;
  // },

  // Note: Template and advanced management features not yet implemented
  // getTemplates: async () => {
  //   const response = await api.get('/timesheets/templates');
  //   return response.data;
  // },

  // createTemplate: async (templateData) => {
  //   const response = await api.post('/timesheets/templates', templateData);
  //   return response.data;
  // },

  // bulkUpdateEntries: async (timesheetId, entries) => {
  //   const response = await api.post(`/timesheets/${timesheetId}/entries/bulk-update`, { entries });
  //   return response.data;
  // },

  // getPendingApprovals: async (params = {}) => {
  //   const response = await api.get('/timesheets/pending-approvals', { params });
  //   return response.data;
  // },

  // getTeamTimesheets: async (params = {}) => {
  //   const response = await api.get('/timesheets/team', { params });
  //   return response.data;
  // },

  // Available: Get project summary from time-entries 
  getProjectSummary: async (projectId, filters = {}) => {
    const response = await api.get(`/time-entries/project/${projectId}/report`, { params: filters });
    return response.data;
  },

  // Available: Get user summary from time-entries
  getUserSummary: async (userId, filters = {}) => {
    const response = await api.get(`/time-entries/user/${userId}/summary`, { params: filters });
    return response.data;
  },

  // Create time entry (alias for createTimeEntry)
  create: async (entryData) => {
    const response = await api.post('/time-entries', entryData);
    return response.data;
  },

  // Update time entry (alias for updateTimeEntry)
  update: async (id, entryData) => {
    const response = await api.put(`/time-entries/${id}`, entryData);
    return response.data;
  },

  // Delete time entry (alias for deleteTimeEntry)
  delete: async (id) => {
    const response = await api.delete(`/time-entries/${id}`);
    return response.data;
  },

  // Get time entry by ID (alias for getTimeEntryById)
  getById: async (id) => {
    const response = await api.get(`/time-entries/${id}`);
    return response.data;
  },

  // Placeholder methods for missing functionality
  submit: async (id) => {
    console.warn('Submit functionality not yet implemented');
    throw new Error('Submit functionality not yet implemented');
  },

  approve: async (id, approvalData = {}) => {
    console.warn('Approve functionality not yet implemented');
    throw new Error('Approve functionality not yet implemented');
  },

  reject: async (id, rejectionData) => {
    console.warn('Reject functionality not yet implemented');
    throw new Error('Reject functionality not yet implemented');
  },

  getWeeklyTimesheet: async (weekStart, userId = null) => {
    console.warn('Weekly timesheet functionality not yet implemented');
    throw new Error('Weekly timesheet functionality not yet implemented');
  },

  bulkUpdateEntries: async (timesheetId, entries) => {
    console.warn('Bulk update entries functionality not yet implemented');
    throw new Error('Bulk update entries functionality not yet implemented');
  },

  // Timer functionality placeholders
  startTimer: async (taskId, description = '') => {
    console.warn('Timer functionality not yet implemented');
    throw new Error('Timer functionality not yet implemented');
  },

  stopTimer: async () => {
    console.warn('Timer functionality not yet implemented');
    throw new Error('Timer functionality not yet implemented');
  },

  getCurrentTimer: async () => {
    console.warn('Timer functionality not yet implemented');
    throw new Error('Timer functionality not yet implemented');
  },

  getTimerHistory: async (params = {}) => {
    console.warn('Timer functionality not yet implemented');
    throw new Error('Timer functionality not yet implemented');
  },

  updateTimer: async (timerId, timerData) => {
    console.warn('Timer functionality not yet implemented');
    throw new Error('Timer functionality not yet implemented');
  },

  deleteTimer: async (timerId) => {
    console.warn('Timer functionality not yet implemented');
    throw new Error('Timer functionality not yet implemented');
  },

  // Approval functionality placeholders
  getPendingApprovals: async (params = {}) => {
    console.warn('Pending approvals functionality not yet implemented');
    throw new Error('Pending approvals functionality not yet implemented');
  },

  getTeamTimesheets: async (params = {}) => {
    console.warn('Team timesheets functionality not yet implemented');
    throw new Error('Team timesheets functionality not yet implemented');
  },

  // Note: Validation and comments not yet implemented
  // validateTimesheet: async (id) => {
  //   const response = await api.post(`/timesheets/${id}/validate`);
  //   return response.data;
  // },

  // getComments: async (id) => {
  //   const response = await api.get(`/timesheets/${id}/comments`);
  //   return response.data;
  // },

  // addComment: async (id, comment) => {
  //   const response = await api.post(`/timesheets/${id}/comments`, { comment });
  //   return response.data;
  // },

  // updateComment: async (timesheetId, commentId, comment) => {
  //   const response = await api.put(`/timesheets/${timesheetId}/comments/${commentId}`, { comment });
  //   return response.data;
  // },

  // deleteComment: async (timesheetId, commentId) => {
  //   const response = await api.delete(`/timesheets/${timesheetId}/comments/${commentId}`);
  //   return response.data;
  // },
};