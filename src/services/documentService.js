import api from './api';

class DocumentService {
  // Generar documento para proyecto
  async generateDocument(projectId, templateName, templateType = 'transfer') {
    const response = await api.post('/documents/generate', {
      projectId,
      templateName,
      templateType
    });
    return response.data.data;
  }

  // Generación masiva de documentos
  async batchGenerateDocuments(projectIds, templateName, templateType = 'transfer') {
    const response = await api.post('/documents/batch/generate', {
      projectIds,
      templateName,
      templateType
    });
    return response.data.data;
  }

  // Previsualizar documento sin generarlo
  async previewDocument(projectId, templateName, templateType = 'transfer') {
    const response = await api.post('/documents/preview', {
      projectId,
      templateName,
      templateType
    });
    return response.data.data;
  }

  // Obtener plantillas disponibles
  async getAvailableTemplates(templateType = null) {
    const params = templateType ? `?templateType=${templateType}` : '';
    const response = await api.get(`/documents/templates${params}`);
    return response.data.data;
  }

  // Crear o actualizar plantilla
  async saveTemplate(templateData) {
    const response = await api.post('/documents/templates', templateData);
    return response.data.data;
  }

  // Obtener documentos generados para un proyecto
  async getProjectDocuments(projectId, page = 1, limit = 20) {
    const response = await api.get(`/documents/project/${projectId}?page=${page}&limit=${limit}`);
    return response.data.data;
  }

  // Obtener estadísticas de generación de documentos
  async getDocumentStatistics(templateType = null, dateFrom = null, dateTo = null) {
    const params = new URLSearchParams();
    if (templateType) params.append('templateType', templateType);
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);

    const queryString = params.toString() ? `?${params}` : '';
    const response = await api.get(`/documents/statistics${queryString}`);
    return response.data.data;
  }

  // Descargar documento generado
  async downloadDocument(documentId) {
    const response = await api.get(`/documents/download/${documentId}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Eliminar documento
  async deleteDocument(documentId) {
    const response = await api.delete(`/documents/${documentId}`);
    return response.data;
  }

  // Obtener variables disponibles para plantillas
  async getTemplateVariables() {
    return [
      { name: 'projectName', description: 'Nombre del proyecto', example: 'Internet Dedicado Universidad' },
      { name: 'clientName', description: 'Nombre del cliente', example: 'Universidad Autónoma de Aguascalientes' },
      { name: 'clientAcronym', description: 'Siglas del cliente', example: 'UAA' },
      { name: 'internalId', description: 'ID interno del proyecto', example: '25-E-UAA-001' },
      { name: 'tcvMXN', description: 'Valor total del contrato', example: '$193,392.00' },
      { name: 'monthlyIncomeMXN', description: 'Ingreso mensual', example: '$16,116.00' },
      { name: 'projectStage', description: 'Etapa del proyecto', example: 'Adjudicado' },
      { name: 'requestDate', description: 'Fecha de solicitud', example: '08/02/2023' },
      { name: 'deliveryDate', description: 'Fecha de entrega', example: '21/02/2023' },
      { name: 'serviceDescription', description: 'Descripción del servicio', example: 'Enlace por Fibra Óptica...' },
      { name: 'fromAreaName', description: 'Área de origen', example: 'Diseño de Soluciones' },
      { name: 'toAreaName', description: 'Área de destino', example: 'PMO' },
      { name: 'transferDate', description: 'Fecha de transferencia', example: '16/09/2025' },
      { name: 'transferNotes', description: 'Notas de transferencia', example: 'Proyecto aprobado para implementación' }
    ];
  }
}

export default new DocumentService();