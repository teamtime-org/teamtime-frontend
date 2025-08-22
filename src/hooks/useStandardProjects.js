import { useState } from 'react';
import { standardProjectService } from '@/services/standardProjectService';

export const useStandardProjects = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createStandardTasks = async (projectId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await standardProjectService.createStandardTasks(projectId);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating standard tasks');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createOrGetGeneralProject = async (areaId, areaName) => {
    try {
      setLoading(true);
      setError(null);
      const response = await standardProjectService.createOrGetGeneralProject(areaId, areaName);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating/getting general project');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const assignUserToGeneralProject = async (userId, areaId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await standardProjectService.assignUserToGeneralProject(userId, areaId);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Error assigning user to general project');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const assignUsersToGeneralProject = async (userIds, areaId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await standardProjectService.assignUsersToGeneralProject(userIds, areaId);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Error assigning users to general project');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const hasStandardTasks = async (projectId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await standardProjectService.hasStandardTasks(projectId);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Error checking standard tasks');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getGeneralProjectByArea = async (areaId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await standardProjectService.getGeneralProjectByArea(areaId);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Error getting general project');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createStandardTasks,
    createOrGetGeneralProject,
    assignUserToGeneralProject,
    assignUsersToGeneralProject,
    hasStandardTasks,
    getGeneralProjectByArea
  };
};