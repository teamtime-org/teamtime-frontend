import api from './api';
import { STANDARD_PROJECT_TASKS, GENERAL_PROJECT_TASKS, GENERAL_PROJECT_PREFIX } from '@/constants';

export const standardProjectService = {
  /**
   * Crea las 5 tareas estándar para un proyecto
   * @param {string} projectId - ID del proyecto
   * @returns {Promise} Response with created tasks
   */
  async createStandardTasks(projectId) {
    try {
      const tasksToCreate = STANDARD_PROJECT_TASKS.map(taskTitle => ({
        title: taskTitle,
        description: `Actividad estándar: ${taskTitle}`,
        projectId,
        status: 'TODO',
        priority: 'MEDIUM'
      }));

      const response = await api.post('/projects/create-standard-tasks', {
        projectId,
        tasks: tasksToCreate
      });

      return response.data;
    } catch (error) {
      console.error('Error creating standard tasks:', error);
      throw error;
    }
  },

  /**
   * Crea o obtiene el proyecto general de un área
   * @param {string} areaId - ID del área
   * @param {string} areaName - Nombre del área
   * @returns {Promise} Response with general project
   */
  async createOrGetGeneralProject(areaId, areaName) {
    try {
      const response = await api.post('/projects/create-general-project', {
        areaId,
        areaName,
        projectName: `${GENERAL_PROJECT_PREFIX}: ${areaName}`,
        tasks: GENERAL_PROJECT_TASKS
      });

      return response.data;
    } catch (error) {
      console.error('Error creating/getting general project:', error);
      throw error;
    }
  },

  /**
   * Asigna un usuario al proyecto general de su área
   * @param {string} userId - ID del usuario
   * @param {string} areaId - ID del área
   * @returns {Promise} Response with assignment result
   */
  async assignUserToGeneralProject(userId, areaId) {
    try {
      const response = await api.post('/projects/assign-to-general-project', {
        userId,
        areaId
      });

      return response.data;
    } catch (error) {
      console.error('Error assigning user to general project:', error);
      throw error;
    }
  },

  /**
   * Asigna múltiples usuarios al proyecto general de su área
   * @param {string[]} userIds - IDs de los usuarios
   * @param {string} areaId - ID del área
   * @returns {Promise} Response with assignment results
   */
  async assignUsersToGeneralProject(userIds, areaId) {
    try {
      const response = await api.post('/projects/assign-users-to-general-project', {
        userIds,
        areaId
      });

      return response.data;
    } catch (error) {
      console.error('Error assigning users to general project:', error);
      throw error;
    }
  },

  /**
   * Verifica si un proyecto tiene las tareas estándar creadas
   * @param {string} projectId - ID del proyecto
   * @returns {Promise} Response with verification result
   */
  async hasStandardTasks(projectId) {
    try {
      const response = await api.get(`/projects/${projectId}/has-standard-tasks`);
      return response.data;
    } catch (error) {
      console.error('Error checking standard tasks:', error);
      throw error;
    }
  },

  /**
   * Obtiene el proyecto general de un área
   * @param {string} areaId - ID del área
   * @returns {Promise} Response with general project
   */
  async getGeneralProjectByArea(areaId) {
    try {
      const response = await api.get(`/projects/general-project/${areaId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting general project:', error);
      throw error;
    }
  }
};