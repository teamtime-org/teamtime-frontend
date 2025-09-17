import api from './api';

class ExcelImportV2Service {
  // Importar Excel a staging con schema v2
  async importExcelToStaging(file, sourceAreaId, options = {}) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sourceAreaId', sourceAreaId);

    // Opciones adicionales
    if (options.skipValidation) {
      formData.append('skipValidation', 'true');
    }
    if (options.batchSize) {
      formData.append('batchSize', options.batchSize.toString());
    }
    if (options.startRow) {
      formData.append('startRow', options.startRow.toString());
    }

    const response = await api.post('/excel-import/staging', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000, // 5 minutes timeout for large files
    });

    return response.data.data;
  }

  // Validar estructura del Excel antes de importar
  async validateExcelStructure(file, sourceAreaId) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sourceAreaId', sourceAreaId);

    const response = await api.post('/excel-import/validate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });

    return response.data.data;
  }

  // Obtener plantilla de Excel para un área
  async downloadExcelTemplate(sourceAreaId) {
    const response = await api.get(`/excel-import/template/${sourceAreaId}`, {
      responseType: 'blob'
    });

    return response.data;
  }

  // Obtener historial de importaciones
  async getImportHistory(page = 1, limit = 20, sourceAreaId = null) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (sourceAreaId) {
      params.append('sourceAreaId', sourceAreaId);
    }

    const response = await api.get(`/excel-import/logs?${params}`);
    return response.data.data;
  }

  // Obtener detalles de una importación específica
  async getImportDetails(importId) {
    const response = await api.get(`/excel-import/history/${importId}`);
    return response.data.data;
  }

  // Obtener estadísticas de importaciones
  async getImportStatistics(sourceAreaId = null, dateFrom = null, dateTo = null) {
    const params = new URLSearchParams();

    if (sourceAreaId) params.append('sourceAreaId', sourceAreaId);
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);

    const queryString = params.toString() ? `?${params}` : '';
    const response = await api.get(`/excel-import/statistics${queryString}`);
    return response.data.data;
  }

  // Reintegar importación fallida
  async retryImport(importId) {
    const response = await api.post(`/excel-import/retry/${importId}`);
    return response.data.data;
  }

  // Cancelar importación en progreso
  async cancelImport(importId) {
    const response = await api.post(`/excel-import/cancel/${importId}`);
    return response.data;
  }

  // Obtener progreso de importación
  async getImportProgress(importId) {
    const response = await api.get(`/excel-import/progress/${importId}`);
    return response.data.data;
  }

  // Obtener configuración de importación para un área
  async getImportConfiguration(sourceAreaId) {
    const response = await api.get(`/excel-import/config/${sourceAreaId}`);
    return response.data.data;
  }

  // Previsualizar datos del Excel antes de importar
  async previewExcelData(file, sourceAreaId, maxRows = 10) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sourceAreaId', sourceAreaId);
    formData.append('maxRows', maxRows.toString());

    const response = await api.post('/excel-import/preview', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });

    return response.data.data;
  }
}

export default new ExcelImportV2Service();