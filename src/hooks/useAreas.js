import { useState, useEffect } from 'react';
import { areaService } from '@/services/areaService';

export const useAreas = () => {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAreas = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await areaService.getAll();
      setAreas(response.data?.areas || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading areas');
    } finally {
      setLoading(false);
    }
  };

  const createArea = async (areaData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await areaService.create(areaData);
      setAreas(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating area');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateArea = async (id, areaData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await areaService.update(id, areaData);
      setAreas(prev => prev.map(area => 
        area.id === id ? response.data : area
      ));
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating area');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteArea = async (id) => {
    try {
      setLoading(true);
      setError(null);
      await areaService.delete(id);
      setAreas(prev => prev.filter(area => area.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting area');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  return {
    areas,
    loading,
    error,
    fetchAreas,
    createArea,
    updateArea,
    deleteArea,
  };
};