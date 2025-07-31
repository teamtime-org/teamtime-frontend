import api from './api';

export const catalogService = {
    // Obtener gerencias de venta
    getSalesManagements: () => api.get('/catalogs/sales-managements'),

    // Obtener mentores disponibles
    getMentors: () => api.get('/catalogs/mentors'),

    // Obtener coordinadores disponibles
    getCoordinators: () => api.get('/catalogs/coordinators'),

    // Obtener ejecutivos de venta
    getSalesExecutives: () => api.get('/catalogs/sales-executives'),

    // Obtener tipos de proyecto
    getProjectTypes: () => api.get('/catalogs/project-types'),
};
