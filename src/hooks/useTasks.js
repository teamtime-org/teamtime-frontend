import { useState, useEffect, useCallback } from 'react';
import { taskService } from '@/services/taskService';

export const useTasks = (initialParams = {}) => {
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
      const queryParams = { ...initialParams, ...params };
      const response = await taskService.getAll(queryParams);
      
      setTasks(response.data?.tasks || []);
      setPagination({
        page: 1, // Backend no está enviando pagination, usar defaults
        limit: 10,
        total: response.data?.total || 0,
        totalPages: Math.ceil((response.data?.total || 0) / 10),
      });
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err.response?.data?.message || 'Error loading tasks');
      setTasks([]);
      setPagination({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

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
      setTasks(prev => prev.map(task => 
        task.id === id ? response.data : task
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

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

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