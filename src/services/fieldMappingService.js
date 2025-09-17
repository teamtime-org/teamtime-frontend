import api from './api';

class FieldMappingService {
  // Obtener mapeos de campos para un área
  async getFieldMappings(sourceAreaId) {
    const response = await api.get(`/field-mappings/area/${sourceAreaId}`);
    return response.data.data;
  }

  // Obtener transformaciones disponibles
  async getAvailableTransformations() {
    const response = await api.get('/field-mappings/transformations');
    return response.data.data;
  }

  // Obtener reglas de validación disponibles
  async getAvailableValidationRules() {
    const response = await api.get('/field-mappings/validation-rules');
    return response.data.data;
  }

  // Crear nuevo mapeo de campo
  async createFieldMapping(mappingData) {
    const response = await api.post('/field-mappings', mappingData);
    return response.data.data;
  }

  // Actualizar mapeo de campo
  async updateFieldMapping(id, updateData) {
    const response = await api.put(`/field-mappings/${id}`, updateData);
    return response.data.data;
  }

  // Eliminar mapeo de campo
  async deleteFieldMapping(id) {
    const response = await api.delete(`/field-mappings/${id}`);
    return response.data;
  }

  // Actualizar orden de mapeos
  async updateMappingOrder(mappings) {
    const response = await api.put('/field-mappings/order', { mappings });
    return response.data;
  }

  // Clonar mapeos de un área a otra
  async cloneMappings(sourceAreaId, targetAreaId) {
    const response = await api.post('/field-mappings/clone', {
      sourceAreaId,
      targetAreaId
    });
    return response.data.data;
  }

  // Probar mapeo con datos de ejemplo
  async testMapping(sourceAreaId, testData) {
    const response = await api.post('/field-mappings/test', {
      sourceAreaId,
      testData
    });
    return response.data.data;
  }

  // Exportar configuración de mapeos de un área
  async exportMappings(sourceAreaId) {
    const response = await api.get(`/field-mappings/area/${sourceAreaId}/export`);
    return response.data.data;
  }

  // Importar configuración de mapeos
  async importMappings(sourceAreaId, mappings) {
    const response = await api.post('/field-mappings/import', {
      sourceAreaId,
      mappings
    });
    return response.data.data;
  }
}

export default new FieldMappingService();