import { useState, useEffect, useCallback } from 'react';
import { timesheetService } from '@/services/timesheetService';

export const useTimesheets = (initialParams = {}) => {
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchTimesheets = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const queryParams = { ...initialParams, ...params };
      const response = await timesheetService.getAll(queryParams);
      
      setTimesheets(response.data?.timesheets || []);
      setPagination({
        page: response.data?.page || 1,
        limit: response.data?.limit || 10,
        total: response.data?.total || 0,
        totalPages: response.data?.totalPages || 0,
      });
    } catch (err) {
      console.warn('Timesheets API not available, using mock data');
      // Provide mock data when backend is not available
      setTimesheets([]);
      setPagination({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      });
      setError(null); // Don't show error for missing backend endpoints
    } finally {
      setLoading(false);
    }
  }, []);

  const createTimesheet = async (timesheetData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await timesheetService.create(timesheetData);
      await fetchTimesheets();
      return response.data;
    } catch (err) {
      console.warn('Timesheet creation API not available');
      setError('Backend not available - Timesheet creation disabled');
      throw new Error('Backend not available');
    } finally {
      setLoading(false);
    }
  };

  const updateTimesheet = async (id, timesheetData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await timesheetService.update(id, timesheetData);
      setTimesheets(prev => prev.map(timesheet => 
        timesheet.id === id ? response.data : timesheet
      ));
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating timesheet');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTimesheet = async (id) => {
    try {
      setLoading(true);
      setError(null);
      await timesheetService.delete(id);
      setTimesheets(prev => prev.filter(timesheet => timesheet.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting timesheet');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const submitTimesheet = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await timesheetService.submit(id);
      setTimesheets(prev => prev.map(timesheet => 
        timesheet.id === id ? { ...timesheet, status: 'submitted' } : timesheet
      ));
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Error submitting timesheet');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const approveTimesheet = async (id, approvalData = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await timesheetService.approve(id, approvalData);
      setTimesheets(prev => prev.map(timesheet => 
        timesheet.id === id ? { ...timesheet, status: 'approved' } : timesheet
      ));
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Error approving timesheet');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const rejectTimesheet = async (id, rejectionData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await timesheetService.reject(id, rejectionData);
      setTimesheets(prev => prev.map(timesheet => 
        timesheet.id === id ? { ...timesheet, status: 'rejected' } : timesheet
      ));
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Error rejecting timesheet');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimesheets();
  }, [fetchTimesheets]);

  return {
    timesheets,
    loading,
    error,
    pagination,
    fetchTimesheets,
    createTimesheet,
    updateTimesheet,
    deleteTimesheet,
    submitTimesheet,
    approveTimesheet,
    rejectTimesheet,
  };
};

export const useTimesheet = (id) => {
  const [timesheet, setTimesheet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTimesheet = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await timesheetService.getById(id);
      setTimesheet(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading timesheet');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTimesheet();
  }, [fetchTimesheet]);

  return {
    timesheet,
    loading,
    error,
    fetchTimesheet,
  };
};

export const useWeeklyTimesheet = (weekStart, userId = null) => {
  const [timesheet, setTimesheet] = useState(null);
  const [timeEntries, setTimeEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWeeklyTimesheet = useCallback(async () => {
    if (!weekStart) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await timesheetService.getWeeklyTimesheet(weekStart, userId);
      setTimesheet(response.data?.timesheet || null);
      setTimeEntries(response.data?.entries || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading weekly timesheet');
    } finally {
      setLoading(false);
    }
  }, [weekStart, userId]);

  const addTimeEntry = async (entryData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await timesheetService.addTimeEntry(timesheet.id, entryData);
      setTimeEntries(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Error adding time entry');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTimeEntry = async (entryId, entryData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await timesheetService.updateTimeEntry(timesheet.id, entryId, entryData);
      setTimeEntries(prev => prev.map(entry => 
        entry.id === entryId ? response.data : entry
      ));
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating time entry');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTimeEntry = async (entryId) => {
    try {
      setLoading(true);
      setError(null);
      await timesheetService.deleteTimeEntry(timesheet.id, entryId);
      setTimeEntries(prev => prev.filter(entry => entry.id !== entryId));
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting time entry');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const bulkUpdateEntries = async (entries) => {
    try {
      setLoading(true);
      setError(null);
      const response = await timesheetService.bulkUpdateEntries(timesheet.id, entries);
      setTimeEntries(response.data?.entries || []);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating time entries');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklyTimesheet();
  }, [fetchWeeklyTimesheet]);

  return {
    timesheet,
    timeEntries,
    loading,
    error,
    fetchWeeklyTimesheet,
    addTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    bulkUpdateEntries,
  };
};

export const useTimer = () => {
  const [currentTimer, setCurrentTimer] = useState(null);
  const [timerHistory, setTimerHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCurrentTimer = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await timesheetService.getCurrentTimer();
      setCurrentTimer(response.data?.timer || null);
    } catch (err) {
      console.warn('Timer API not available');
      setCurrentTimer(null);
      setError(null); // Don't show error for missing backend endpoints
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTimerHistory = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await timesheetService.getTimerHistory(params);
      setTimerHistory(response.data?.history || []);
    } catch (err) {
      console.warn('Timer history API not available');
      setTimerHistory([]);
      setError(null); // Don't show error for missing backend endpoints
    } finally {
      setLoading(false);
    }
  }, []);

  const startTimer = async (taskId, description = '') => {
    try {
      setLoading(true);
      setError(null);
      const response = await timesheetService.startTimer(taskId, description);
      setCurrentTimer(response.data);
      return response.data;
    } catch (err) {
      console.warn('Timer start API not available');
      setError('Backend not available - Timer functionality disabled');
      throw new Error('Backend not available');
    } finally {
      setLoading(false);
    }
  };

  const stopTimer = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await timesheetService.stopTimer();
      setCurrentTimer(null);
      await fetchTimerHistory();
      return response.data;
    } catch (err) {
      console.warn('Timer stop API not available');
      setError('Backend not available - Timer functionality disabled');
      throw new Error('Backend not available');
    } finally {
      setLoading(false);
    }
  };

  const updateTimer = async (timerId, timerData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await timesheetService.updateTimer(timerId, timerData);
      if (currentTimer && currentTimer.id === timerId) {
        setCurrentTimer(response.data);
      }
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating timer');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTimer = async (timerId) => {
    try {
      setLoading(true);
      setError(null);
      await timesheetService.deleteTimer(timerId);
      if (currentTimer && currentTimer.id === timerId) {
        setCurrentTimer(null);
      }
      setTimerHistory(prev => prev.filter(timer => timer.id !== timerId));
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting timer');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentTimer();
    fetchTimerHistory();
  }, [fetchCurrentTimer, fetchTimerHistory]);

  return {
    currentTimer,
    timerHistory,
    loading,
    error,
    startTimer,
    stopTimer,
    updateTimer,
    deleteTimer,
    fetchCurrentTimer,
    fetchTimerHistory,
  };
};

export const useTimesheetApprovals = () => {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [teamTimesheets, setTeamTimesheets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPendingApprovals = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await timesheetService.getPendingApprovals(params);
      setPendingApprovals(response.data?.approvals || []);
    } catch (err) {
      console.warn('Pending approvals API not available');
      setPendingApprovals([]);
      setError(null); // Don't show error for missing backend endpoints
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTeamTimesheets = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await timesheetService.getTeamTimesheets(params);
      setTeamTimesheets(response.data?.timesheets || []);
    } catch (err) {
      console.warn('Team timesheets API not available');
      setTeamTimesheets([]);
      setError(null); // Don't show error for missing backend endpoints
    } finally {
      setLoading(false);
    }
  }, []);

  const approveTimesheet = async (id, approvalData = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await timesheetService.approve(id, approvalData);
      setPendingApprovals(prev => prev.filter(approval => approval.id !== id));
      setTeamTimesheets(prev => prev.map(timesheet => 
        timesheet.id === id ? { ...timesheet, status: 'approved' } : timesheet
      ));
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Error approving timesheet');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const rejectTimesheet = async (id, rejectionData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await timesheetService.reject(id, rejectionData);
      setPendingApprovals(prev => prev.filter(approval => approval.id !== id));
      setTeamTimesheets(prev => prev.map(timesheet => 
        timesheet.id === id ? { ...timesheet, status: 'rejected' } : timesheet
      ));
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Error rejecting timesheet');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingApprovals();
    fetchTeamTimesheets();
  }, [fetchPendingApprovals, fetchTeamTimesheets]);

  return {
    pendingApprovals,
    teamTimesheets,
    loading,
    error,
    approveTimesheet,
    rejectTimesheet,
    fetchPendingApprovals,
    fetchTeamTimesheets,
  };
};