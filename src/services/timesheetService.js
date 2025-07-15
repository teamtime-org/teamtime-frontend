import api from '@/services/api';

export const timesheetService = {
  // Get all timesheets with filtering and pagination
  getAll: async (params = {}) => {
    const response = await api.get('/time-entries', { params });
    return response.data;
  },

  // Get timesheet by ID
  getById: async (id) => {
    const response = await api.get(`/timesheets/${id}`);
    return response.data;
  },

  // Create new timesheet
  create: async (timesheetData) => {
    const response = await api.post('/timesheets', timesheetData);
    return response.data;
  },

  // Update timesheet
  update: async (id, timesheetData) => {
    const response = await api.put(`/timesheets/${id}`, timesheetData);
    return response.data;
  },

  // Delete timesheet
  delete: async (id) => {
    const response = await api.delete(`/timesheets/${id}`);
    return response.data;
  },

  // Get timesheet entries for a specific period
  getByPeriod: async (startDate, endDate, userId = null) => {
    const params = { startDate, endDate };
    if (userId) params.userId = userId;
    const response = await api.get('/timesheets/period', { params });
    return response.data;
  },

  // Get current user's timesheets
  getMyTimesheets: async (params = {}) => {
    const response = await api.get('/timesheets/my-timesheets', { params });
    return response.data;
  },

  // Get timesheet entries for a specific week
  getWeeklyTimesheet: async (weekStart, userId = null) => {
    const params = { weekStart };
    if (userId) params.userId = userId;
    const response = await api.get('/timesheets/weekly', { params });
    return response.data;
  },

  // Submit timesheet for approval
  submit: async (id) => {
    const response = await api.post(`/timesheets/${id}/submit`);
    return response.data;
  },

  // Approve timesheet
  approve: async (id, approvalData = {}) => {
    const response = await api.post(`/timesheets/${id}/approve`, approvalData);
    return response.data;
  },

  // Reject timesheet
  reject: async (id, rejectionData) => {
    const response = await api.post(`/timesheets/${id}/reject`, rejectionData);
    return response.data;
  },

  // Reopen timesheet (return to draft)
  reopen: async (id) => {
    const response = await api.post(`/timesheets/${id}/reopen`);
    return response.data;
  },

  // Get time entries for a timesheet
  getTimeEntries: async (id) => {
    const response = await api.get(`/timesheets/${id}/entries`);
    return response.data;
  },

  // Add time entry to timesheet
  addTimeEntry: async (id, entryData) => {
    const response = await api.post(`/timesheets/${id}/entries`, entryData);
    return response.data;
  },

  // Update time entry
  updateTimeEntry: async (timesheetId, entryId, entryData) => {
    const response = await api.put(`/timesheets/${timesheetId}/entries/${entryId}`, entryData);
    return response.data;
  },

  // Delete time entry
  deleteTimeEntry: async (timesheetId, entryId) => {
    const response = await api.delete(`/timesheets/${timesheetId}/entries/${entryId}`);
    return response.data;
  },

  // Start timer for a task
  startTimer: async (taskId, description = '') => {
    const response = await api.post('/timesheets/timer/start', { taskId, description });
    return response.data;
  },

  // Stop current timer
  stopTimer: async () => {
    const response = await api.post('/timesheets/timer/stop');
    return response.data;
  },

  // Get current running timer
  getCurrentTimer: async () => {
    const response = await api.get('/timesheets/timer/current');
    return response.data;
  },

  // Get timer history
  getTimerHistory: async (params = {}) => {
    const response = await api.get('/timesheets/timer/history', { params });
    return response.data;
  },

  // Update running timer
  updateTimer: async (timerId, timerData) => {
    const response = await api.put(`/timesheets/timer/${timerId}`, timerData);
    return response.data;
  },

  // Delete timer entry
  deleteTimer: async (timerId) => {
    const response = await api.delete(`/timesheets/timer/${timerId}`);
    return response.data;
  },

  // Get timesheet statistics
  getStatistics: async (filters = {}) => {
    const response = await api.get('/timesheets/statistics', { params: filters });
    return response.data;
  },

  // Get user timesheet statistics
  getUserStatistics: async (userId, filters = {}) => {
    const response = await api.get(`/timesheets/users/${userId}/statistics`, { params: filters });
    return response.data;
  },

  // Export timesheet data
  exportTimesheet: async (filters = {}, format = 'csv') => {
    const response = await api.get('/timesheets/export', { 
      params: { ...filters, format },
      responseType: 'blob'
    });
    return response.data;
  },

  // Import timesheet data
  importTimesheet: async (formData) => {
    const response = await api.post('/timesheets/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get timesheet templates
  getTemplates: async () => {
    const response = await api.get('/timesheets/templates');
    return response.data;
  },

  // Create timesheet template
  createTemplate: async (templateData) => {
    const response = await api.post('/timesheets/templates', templateData);
    return response.data;
  },

  // Bulk update time entries
  bulkUpdateEntries: async (timesheetId, entries) => {
    const response = await api.post(`/timesheets/${timesheetId}/entries/bulk-update`, { entries });
    return response.data;
  },

  // Get pending approvals (for managers)
  getPendingApprovals: async (params = {}) => {
    const response = await api.get('/timesheets/pending-approvals', { params });
    return response.data;
  },

  // Get team timesheets (for managers)
  getTeamTimesheets: async (params = {}) => {
    const response = await api.get('/timesheets/team', { params });
    return response.data;
  },

  // Copy timesheet from previous period
  copyFromPrevious: async (timesheetId, targetWeek) => {
    const response = await api.post(`/timesheets/${timesheetId}/copy`, { targetWeek });
    return response.data;
  },

  // Get timesheet summary by project
  getProjectSummary: async (projectId, filters = {}) => {
    const response = await api.get(`/timesheets/projects/${projectId}/summary`, { params: filters });
    return response.data;
  },

  // Get timesheet summary by user
  getUserSummary: async (userId, filters = {}) => {
    const response = await api.get(`/timesheets/users/${userId}/summary`, { params: filters });
    return response.data;
  },

  // Validate timesheet before submission
  validateTimesheet: async (id) => {
    const response = await api.post(`/timesheets/${id}/validate`);
    return response.data;
  },

  // Get timesheet comments
  getComments: async (id) => {
    const response = await api.get(`/timesheets/${id}/comments`);
    return response.data;
  },

  // Add comment to timesheet
  addComment: async (id, comment) => {
    const response = await api.post(`/timesheets/${id}/comments`, { comment });
    return response.data;
  },

  // Update timesheet comment
  updateComment: async (timesheetId, commentId, comment) => {
    const response = await api.put(`/timesheets/${timesheetId}/comments/${commentId}`, { comment });
    return response.data;
  },

  // Delete timesheet comment
  deleteComment: async (timesheetId, commentId) => {
    const response = await api.delete(`/timesheets/${timesheetId}/comments/${commentId}`);
    return response.data;
  },
};