import api from './api';

class TransferService {
  // Transferir proyecto entre áreas
  async transferProject(transferData) {
    const response = await api.post('/transfers', transferData);
    return response.data.data;
  }

  // Obtener transferencias de un proyecto
  async getProjectTransfers(projectId, page = 1, limit = 20) {
    const response = await api.get(`/transfers/project/${projectId}?page=${page}&limit=${limit}`);
    return response.data.data;
  }

  // Obtener transferencias por área
  async getTransfersByArea(areaId, type = 'outgoing', page = 1, limit = 20) {
    const response = await api.get(`/transfers/area/${areaId}?type=${type}&page=${page}&limit=${limit}`);
    return response.data.data;
  }

  // Obtener transferencias pendientes de aprobación
  async getPendingApprovals(page = 1, limit = 20) {
    const response = await api.get(`/transfers/pending?page=${page}&limit=${limit}`);
    return response.data.data;
  }

  // Procesar aprobación de transferencia
  async processTransferApproval(transferId, approved, notes = null) {
    const response = await api.post(`/transfers/${transferId}/approve`, {
      approved,
      notes
    });
    return response.data.data;
  }

  // Validar transferencia
  async validateTransfer(projectId, fromAreaId, toAreaId) {
    const response = await api.post('/transfers/validate', {
      projectId,
      fromAreaId,
      toAreaId
    });
    return response.data.data;
  }

  // Obtener pasos disponibles para un área
  async getAvailableNextSteps(fromAreaId) {
    const response = await api.get(`/transfers/next-steps/${fromAreaId}`);
    return response.data.data;
  }

  // Obtener estadísticas de transferencias
  async getTransferStatistics(areaId = null, dateFrom = null, dateTo = null) {
    const params = new URLSearchParams();
    if (areaId) params.append('areaId', areaId);
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);

    const queryString = params.toString() ? `?${params}` : '';
    const response = await api.get(`/transfers/statistics${queryString}`);
    return response.data.data;
  }

  // Cancelar transferencia pendiente
  async cancelTransfer(transferId, reason) {
    const response = await api.post(`/transfers/${transferId}/cancel`, {
      reason
    });
    return response.data;
  }

  // Obtener historial de transferencias
  async getTransferHistory(projectId) {
    const response = await api.get(`/transfers/history/${projectId}`);
    return response.data.data;
  }

  // Transferencia masiva
  async batchTransfer(transferData) {
    const response = await api.post('/transfers/batch', transferData);
    return response.data.data;
  }
}

export default new TransferService();