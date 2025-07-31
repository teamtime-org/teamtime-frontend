import { useState, useEffect, useCallback } from 'react';
import { catalogService } from '@/services/catalogService';

export const useCatalogs = () => {
    const [salesManagements, setSalesManagements] = useState([]);
    const [mentors, setMentors] = useState([]);
    const [coordinators, setCoordinators] = useState([]);
    const [salesExecutives, setSalesExecutives] = useState([]);
    const [projectTypes, setProjectTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchSalesManagements = async () => {
        try {
            const response = await catalogService.getSalesManagements();
            setSalesManagements(response.data?.data || []);
        } catch (err) {
            console.error('Error fetching sales managements:', err);
        }
    };

    const fetchMentors = async () => {
        try {
            const response = await catalogService.getMentors();
            setMentors(response.data?.data || []);
        } catch (err) {
            console.error('Error fetching mentors:', err);
        }
    };

    const fetchCoordinators = async () => {
        try {
            const response = await catalogService.getCoordinators();
            setCoordinators(response.data?.data || []);
        } catch (err) {
            console.error('Error fetching coordinators:', err);
        }
    };

    const fetchSalesExecutives = async () => {
        try {
            const response = await catalogService.getSalesExecutives();
            setSalesExecutives(response.data?.data || []);
        } catch (err) {
            console.error('Error fetching sales executives:', err);
        }
    };

    const fetchProjectTypes = async () => {
        try {
            const response = await catalogService.getProjectTypes();
            setProjectTypes(response.data?.data || []);
        } catch (err) {
            console.error('Error fetching project types:', err);
        }
    };

    const fetchAllCatalogs = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            await Promise.all([
                fetchSalesManagements(),
                fetchMentors(),
                fetchCoordinators(),
                fetchSalesExecutives(),
                fetchProjectTypes(),
            ]);
        } catch (err) {
            setError(err.message || 'Error loading catalogs');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllCatalogs();
    }, [fetchAllCatalogs]);

    return {
        salesManagements,
        mentors,
        coordinators,
        salesExecutives,
        projectTypes,
        loading,
        error,
        refetch: fetchAllCatalogs,
    };
};
