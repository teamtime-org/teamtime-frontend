import { useState, useEffect, useCallback } from 'react';
import { taskService } from '@/services/taskService';

// Hook para tareas de un proyecto específico
export const useProjectTasks = (projectId) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProjectTasks = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await taskService.getAll({ projectId });
      setTasks(response.data?.tasks || []);
    } catch (err) {
      console.error('Error fetching project tasks:', err);
      setError(err.response?.data?.message || 'Error loading tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      fetchProjectTasks();
    }
  }, [projectId]); // Solo depende de projectId, no de la función

  return {
    tasks,
    loading,
    error,
    refetch: fetchProjectTasks,
  };
};

export const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchTasks = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await taskService.getAll(params);

      setTasks(response.data?.tasks || []);
      setPagination({
        page: response.data?.page || params.page || 1,
        limit: response.data?.limit || params.limit || 10,
        total: response.data?.total || 0,
        totalPages: response.data?.totalPages || Math.ceil((response.data?.total || 0) / (params.limit || 10)),
      });
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err.response?.data?.message || 'Error loading tasks');
      setTasks([]);
      setPagination({
        page: params.page || 1,
        limit: params.limit || 10,
        total: 0,
        totalPages: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []); // Sin dependencias para mantenerlo estable

  const createTask = async (taskData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await taskService.create(taskData);
      await fetchTasks();
      return response.data;
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err.response?.data?.message || 'Error creating task');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (id, taskData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await taskService.update(id, taskData);

      // Actualizar la tarea específica en el estado local con todos los datos
      setTasks(prev => prev.map(task =>
        task.id === id ? {
          ...task,
          ...response.data,
          // Asegurarse de que las relaciones se mantengan si existen
          project: response.data.project || task.project,
          assignee: response.data.assignee || task.assignee,
          creator: response.data.creator || task.creator
        } : task
      ));

      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating task');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (id) => {
    try {
      setLoading(true);
      setError(null);
      await taskService.delete(id);
      setTasks(prev => prev.filter(task => task.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting task');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (id, status) => {
    try {
      setLoading(true);
      setError(null);
      const response = await taskService.updateStatus(id, status);
      setTasks(prev => prev.map(task =>
        task.id === id ? { ...task, status } : task
      ));
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating task status');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTaskPriority = async (id, priority) => {
    try {
      setLoading(true);
      setError(null);
      const response = await taskService.updatePriority(id, priority);
      setTasks(prev => prev.map(task =>
        task.id === id ? { ...task, priority } : task
      ));
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating task priority');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const assignUser = async (id, userId) => {
    try {
      await taskService.assignUser(id, userId);
      await fetchTasks();
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Error assigning user');
    }
  };

  const unassignUser = async (id, userId) => {
    try {
      await taskService.unassignUser(id, userId);
      await fetchTasks();
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Error unassigning user');
    }
  };

  // No fetch automático, se hará desde el componente
  // useEffect(() => {
  //   fetchTasks();
  // }, [fetchTasks]);

  return {
    tasks,
    loading,
    error,
    pagination,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    updateTaskPriority,
    assignUser,
    unassignUser,
  };
};

export const useTask = (id) => {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTask = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const response = await taskService.getById(id);
      setTask(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading task');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  return {
    task,
    loading,
    error,
    fetchTask,
  };
};

export const useTaskComments = (taskId) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchComments = useCallback(async () => {
    if (!taskId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await taskService.getComments(taskId);
      setComments(response.data?.comments || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading comments');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  const addComment = async (comment) => {
    try {
      setLoading(true);
      setError(null);
      const response = await taskService.addComment(taskId, comment);
      setComments(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Error adding comment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateComment = async (commentId, comment) => {
    try {
      setLoading(true);
      setError(null);
      const response = await taskService.updateComment(taskId, commentId, comment);
      setComments(prev => prev.map(c =>
        c.id === commentId ? response.data : c
      ));
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating comment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteComment = async (commentId) => {
    try {
      setLoading(true);
      setError(null);
      await taskService.deleteComment(taskId, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting comment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return {
    comments,
    loading,
    error,
    fetchComments,
    addComment,
    updateComment,
    deleteComment,
  };
};

export const useTaskTimeTracking = (taskId) => {
  const [timeEntries, setTimeEntries] = useState([]);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTimeEntries = useCallback(async () => {
    if (!taskId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await taskService.getTimeEntries(taskId);
      setTimeEntries(response.data?.timeEntries || []);
      setCurrentEntry(response.data?.currentEntry || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading time entries');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  const startTimer = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await taskService.startTimer(taskId);
      setCurrentEntry(response.data);
      await fetchTimeEntries();
    } catch (err) {
      setError(err.response?.data?.message || 'Error starting timer');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const stopTimer = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await taskService.stopTimer(taskId);
      setCurrentEntry(null);
      await fetchTimeEntries();
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Error stopping timer');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addTimeEntry = async (timeData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await taskService.addTimeEntry(taskId, timeData);
      setTimeEntries(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Error adding time entry');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeEntries();
  }, [fetchTimeEntries]);

  return {
    timeEntries,
    currentEntry,
    loading,
    error,
    fetchTimeEntries,
    startTimer,
    stopTimer,
    addTimeEntry,
  };
};