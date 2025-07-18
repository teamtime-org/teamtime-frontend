import { useState, useEffect, useCallback } from 'react';
import { projectService } from '@/services/projectService';

export const useProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchProjects = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const queryParams = { ...params };
      const response = await projectService.getAll(queryParams);

      setProjects(response.data?.projects || []);
      setPagination({
        page: response.data?.page || 1,
        limit: response.data?.limit || 10,
        total: response.data?.total || 0,
        totalPages: response.data?.totalPages || 0,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading projects');
    } finally {
      setLoading(false);
    }
  }, []); // Sin dependencias para evitar bucles infinitos

  const createProject = async (projectData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await projectService.create(projectData);

      // Refrescar la lista para asegurar que se muestre el nuevo proyecto
      await fetchProjects();

      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating project');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async (id, projectData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await projectService.update(id, projectData);
      setProjects(prev => prev.map(project =>
        project.id === id ? response.data : project
      ));
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating project');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (id) => {
    try {
      setLoading(true);
      setError(null);
      await projectService.delete(id);
      setProjects(prev => prev.filter(project => project.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting project');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar una vez al montar

  return {
    projects,
    loading,
    error,
    pagination,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  };
};

export const useProject = (id) => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProject = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const response = await projectService.getById(id);
      setProject(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading project');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const assignUser = async (userId) => {
    try {
      await projectService.assignUser(id, userId);
      await fetchProject(); // Refresh project data
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Error assigning user');
    }
  };

  const unassignUser = async (userId) => {
    try {
      await projectService.unassignUser(id, userId);
      await fetchProject(); // Refresh project data
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Error unassigning user');
    }
  };

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  return {
    project,
    loading,
    error,
    fetchProject,
    assignUser,
    unassignUser,
  };
};