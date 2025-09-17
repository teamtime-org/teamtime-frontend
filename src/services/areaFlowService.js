import api from './api';

class AreaFlowService {
  // Obtener configuración completa de flujos
  async getFlowConfiguration() {
    const response = await api.get('/area-flows/configuration');
    return response.data.data;
  }

  // Obtener flujo específico entre dos áreas
  async getFlowBetweenAreas(fromAreaId, toAreaId) {
    const response = await api.get(`/area-flows/between?fromAreaId=${fromAreaId}&toAreaId=${toAreaId}`);
    return response.data.data;
  }

  // Obtener flujos disponibles desde un área
  async getAvailableFlowsFromArea(fromAreaId) {
    const response = await api.get(`/area-flows/from/${fromAreaId}`);
    return response.data.data;
  }

  // Obtener siguiente paso obligatorio
  async getNextFlowStep(fromAreaId) {
    const response = await api.get(`/area-flows/from/${fromAreaId}/next`);
    return response.data.data;
  }

  // Obtener flujos alternativos
  async getAlternativeFlows(fromAreaId) {
    const response = await api.get(`/area-flows/from/${fromAreaId}/alternatives`);
    return response.data.data;
  }

  // Obtener estadísticas de flujos
  async getFlowStatistics() {
    const response = await api.get('/area-flows/statistics');
    return response.data.data;
  }

  // Obtener datos para diagrama de flujos
  async getFlowDiagram() {
    const response = await api.get('/area-flows/diagram');
    return response.data.data;
  }

  // Crear nuevo flujo entre áreas
  async createAreaFlow(flowData) {
    const response = await api.post('/area-flows', flowData);
    return response.data.data;
  }

  // Actualizar flujo existente
  async updateAreaFlow(id, updateData) {
    const response = await api.put(`/area-flows/${id}`, updateData);
    return response.data.data;
  }

  // Eliminar flujo (desactivar)
  async deleteAreaFlow(id) {
    const response = await api.delete(`/area-flows/${id}`);
    return response.data;
  }

  // Validar transferencia según flujo configurado
  async validateTransfer(projectId, fromAreaId, toAreaId) {
    const response = await api.post('/area-flows/validate', {
      projectId,
      fromAreaId,
      toAreaId
    });
    return response.data.data;
  }

  // Exportar configuración de flujos
  async exportFlowConfiguration() {
    const response = await api.get('/area-flows/export');
    return response.data.data;
  }

  // Importar configuración de flujos
  async importFlowConfiguration(areas) {
    const response = await api.post('/area-flows/import', { areas });
    return response.data.data;
  }
}

export default new AreaFlowService();