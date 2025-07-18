import api from '@/services/api';

export const taskService = {
  // Get all tasks with filtering and pagination
  getAll: async (params = {}) => {
    const response = await api.get('/tasks', { params });
    return response.data;
  },

  // Get task by ID
  getById: async (id) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  // Create new task
  create: async (taskData) => {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },

  // Update task
  update: async (id, taskData) => {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data;
  },

  // Delete task
  delete: async (id) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  // Update task status
  updateStatus: async (id, status) => {
    const response = await api.patch(`/tasks/${id}/status`, { status });
    return response.data;
  },

  // Update task priority
  updatePriority: async (id, priority) => {
    const response = await api.patch(`/tasks/${id}/priority`, { priority });
    return response.data;
  },

  // Assign task to user
  assignUser: async (id, userId) => {
    const response = await api.patch(`/tasks/${id}/assign`, { assignedTo: userId });
    return response.data;
  },

  // Bulk assign tasks to user
  bulkAssignTasks: async (taskIds, userId) => {
    const response = await api.post(`/tasks/bulk-assign`, { taskIds, userId });
    return response.data;
  },

  // Unassign task from user
  unassignUser: async (id) => {
    const response = await api.patch(`/tasks/${id}/assign`, { assignedTo: null });
    return response.data;
  },

  // Get task comments
  getComments: async (id) => {
    const response = await api.get(`/tasks/${id}/comments`);
    return response.data;
  },

  // Add comment to task
  addComment: async (id, comment) => {
    const response = await api.post(`/tasks/${id}/comments`, { comment });
    return response.data;
  },

  // Update comment
  updateComment: async (taskId, commentId, comment) => {
    const response = await api.put(`/tasks/${taskId}/comments/${commentId}`, { comment });
    return response.data;
  },

  // Delete comment
  deleteComment: async (taskId, commentId) => {
    const response = await api.delete(`/tasks/${taskId}/comments/${commentId}`);
    return response.data;
  },

  // Get task attachments
  getAttachments: async (id) => {
    const response = await api.get(`/tasks/${id}/attachments`);
    return response.data;
  },

  // Upload attachment
  uploadAttachment: async (id, formData) => {
    const response = await api.post(`/tasks/${id}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete attachment
  deleteAttachment: async (taskId, attachmentId) => {
    const response = await api.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
    return response.data;
  },

  // Get task time entries
  getTimeEntries: async (id) => {
    const response = await api.get(`/tasks/${id}/time-entries`);
    return response.data;
  },

  // Start time tracking
  startTimer: async (id) => {
    const response = await api.post(`/tasks/${id}/time-entries/start`);
    return response.data;
  },

  // Stop time tracking
  stopTimer: async (id) => {
    const response = await api.post(`/tasks/${id}/time-entries/stop`);
    return response.data;
  },

  // Add manual time entry
  addTimeEntry: async (id, timeData) => {
    const response = await api.post(`/tasks/${id}/time-entries`, timeData);
    return response.data;
  },

  // Update time entry
  updateTimeEntry: async (taskId, entryId, timeData) => {
    const response = await api.put(`/tasks/${taskId}/time-entries/${entryId}`, timeData);
    return response.data;
  },

  // Delete time entry
  deleteTimeEntry: async (taskId, entryId) => {
    const response = await api.delete(`/tasks/${taskId}/time-entries/${entryId}`);
    return response.data;
  },

  // Get task statistics
  getStatistics: async (filters = {}) => {
    const response = await api.get('/tasks/statistics', { params: filters });
    return response.data;
  },

  // Get tasks by project
  getByProject: async (projectId, params = {}) => {
    const response = await api.get(`/projects/${projectId}/tasks`, { params });
    return response.data;
  },

  // Get tasks assigned to user
  getAssignedToUser: async (userId, params = {}) => {
    const response = await api.get(`/users/${userId}/tasks`, { params });
    return response.data;
  },

  // Get my tasks (current user)
  getMyTasks: async (params = {}) => {
    const response = await api.get('/tasks/my-tasks', { params });
    return response.data;
  },

  // Duplicate task
  duplicate: async (id) => {
    const response = await api.post(`/tasks/${id}/duplicate`);
    return response.data;
  },

  // Move task to different project
  moveToProject: async (id, projectId) => {
    const response = await api.patch(`/tasks/${id}/move`, { projectId });
    return response.data;
  },

  // Get task dependencies
  getDependencies: async (id) => {
    const response = await api.get(`/tasks/${id}/dependencies`);
    return response.data;
  },

  // Add task dependency
  addDependency: async (id, dependencyId) => {
    const response = await api.post(`/tasks/${id}/dependencies`, { dependencyId });
    return response.data;
  },

  // Remove task dependency
  removeDependency: async (id, dependencyId) => {
    const response = await api.delete(`/tasks/${id}/dependencies/${dependencyId}`);
    return response.data;
  },
};