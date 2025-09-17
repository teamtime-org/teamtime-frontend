import api from './api';

class StagingService {
  // Obtener proyectos en staging por área
  async getStagingProjectsByArea(sourceAreaId, status = null, page = 1, limit = 20) {
    const params = new URLSearchParams({
      sourceAreaId,
      page: page.toString(),
      limit: limit.toString()
    });

    if (status) {
      params.append('status', status);
    }

    const response = await api.get(`/staging?${params}`);
    return response.data.data;
  }

  // Obtener proyecto en staging por ID
  async getStagingProject(id) {
    const response = await api.get(`/staging/${id}`);
    return response.data.data;
  }

  // Actualizar proyecto en staging
  async updateStagingProject(id, updateData) {
    const response = await api.put(`/staging/${id}`, updateData);
    return response.data.data;
  }

  // Actualizar estado de proyecto en staging
  async updateStagingProjectStatus(id, status, notes = null) {
    const response = await api.patch(`/staging/${id}/status`, {
      status,
      notes
    });
    return response.data.data;
  }

  // Transferir proyecto de staging a activo
  async transferToActive(id) {
    const response = await api.post(`/staging/${id}/transfer`);
    return response.data.data;
  }

  // Transferencia masiva a activo
  async batchTransferToActive(projectIds) {
    const response = await api.post('/staging/batch/transfer', {
      projectIds
    });
    return response.data.data;
  }

  // Eliminar proyecto de staging
  async deleteStagingProject(id) {
    const response = await api.delete(`/staging/${id}`);
    return response.data;
  }

  // Obtener estadísticas de staging
  async getStagingStatistics(sourceAreaId = null) {
    const params = sourceAreaId ? `?sourceAreaId=${sourceAreaId}` : '';
    const response = await api.get(`/staging/statistics${params}`);
    return response.data.data;
  }

  // Validar proyecto en staging
  async validateStagingProject(id) {
    const response = await api.post(`/staging/${id}/validate`);
    return response.data.data;
  }

  // Obtener errores de validación detallados
  async getValidationErrors(id) {
    const response = await api.get(`/staging/${id}/validation-errors`);
    return response.data.data;
  }
}

export default new StagingService();