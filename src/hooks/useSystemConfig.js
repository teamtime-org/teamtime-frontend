import { useState, useEffect, useCallback } from 'react';
import { systemConfigService } from '@/services/systemConfigService';

export const useSystemConfig = () => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchConfigs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await systemConfigService.getAll();
      setConfigs(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading system configs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  return {
    configs,
    loading,
    error,
    refetch: fetchConfigs
  };
};

export const useDateRestrictions = () => {
  const [restrictions, setRestrictions] = useState({
    enabled: true,
    futureDaysAllowed: 7,
    pastDaysAllowed: 30
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRestrictions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await systemConfigService.getDateRestrictionConfigs();
      setRestrictions(response.data || {
        enabled: true,
        futureDaysAllowed: 7,
        pastDaysAllowed: 30
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading date restrictions');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRestrictions = useCallback(async (newRestrictions) => {
    try {
      setLoading(true);
      setError(null);
      const response = await systemConfigService.setDateRestrictionConfigs(newRestrictions);
      setRestrictions(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating date restrictions');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const validateDate = useCallback(async (date) => {
    try {
      const response = await systemConfigService.validateDateForTimeEntry(date);
      return response.data;
    } catch (err) {
      console.error('Error validating date:', err);
      return { isValid: false, reason: 'Error validating date' };
    }
  }, []);

  const isDateAllowed = useCallback((date) => {
    // Si las restricciones están deshabilitadas, permitir cualquier fecha
    if (!restrictions.enabled) {
      return { isValid: true };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Verificar fecha futura
    if (diffDays > restrictions.futureDaysAllowed) {
      return {
        isValid: false,
        reason: `No se puede registrar tiempo más de ${restrictions.futureDaysAllowed} días en el futuro`
      };
    }

    // Verificar fecha pasada
    if (diffDays < -restrictions.pastDaysAllowed) {
      return {
        isValid: false,
        reason: `No se puede registrar tiempo más de ${restrictions.pastDaysAllowed} días en el pasado`
      };
    }

    return { isValid: true };
  }, [restrictions]);

  useEffect(() => {
    fetchRestrictions();
  }, [fetchRestrictions]);

  return {
    restrictions,
    loading,
    error,
    updateRestrictions,
    validateDate,
    isDateAllowed,
    refetch: fetchRestrictions
  };
};

export default useSystemConfig;