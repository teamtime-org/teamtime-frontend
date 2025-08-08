import { useState, useEffect, useCallback } from 'react';
import userService from '../services/userService';

const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  const fetchUsers = useCallback(async (page = 1, limit = 10, search = '', role = '') => {
    setLoading(true);
    setError(null);

    try {
      const response = await userService.getUsers(page, limit, search, role);
      setUsers(response.data?.users || []);
      setPagination(response.data?.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar usuarios');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []); // Sin dependencias para mantenerla estable

  const fetchAllUsers = useCallback(async (search = '', role = '') => {
    setLoading(true);
    setError(null);

    try {
      // Primero obtenemos el total para saber cuántos usuarios hay
      const initialResponse = await userService.getUsers(1, 1, search, role);
      const total = initialResponse.data?.total || 0;
      
      // Luego cargamos todos los usuarios usando el total como límite
      const response = await userService.getUsers(1, Math.max(total, 500), search, role);
      setUsers(response.data?.users || []);
      setPagination({
        page: 1,
        limit: total,
        total: total,
        pages: 1
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar usuarios');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = async (userData) => {
    try {
      const response = await userService.createUser(userData);
      await fetchUsers(pagination.page, pagination.limit);
      return response;
    } catch (err) {
      const message = err.response?.data?.message || 'Error al crear usuario';
      setError(message);
      throw new Error(message);
    }
  };

  const updateUser = async (id, userData) => {
    try {
      const response = await userService.updateUser(id, userData);
      await fetchUsers(pagination.page, pagination.limit);
      return response;
    } catch (err) {
      const message = err.response?.data?.message || 'Error al actualizar usuario';
      setError(message);
      throw new Error(message);
    }
  };

  const deleteUser = async (id) => {
    try {
      const response = await userService.deleteUser(id);
      await fetchUsers(pagination.page, pagination.limit);
      return response;
    } catch (err) {
      const message = err.response?.data?.message || 'Error al eliminar usuario';
      setError(message);
      throw new Error(message);
    }
  };

  const toggleUserStatus = async (id) => {
    try {
      const response = await userService.toggleUserStatus(id);
      await fetchUsers(pagination.page, pagination.limit);
      return response;
    } catch (err) {
      const message = err.response?.data?.message || 'Error al cambiar estado del usuario';
      setError(message);
      throw new Error(message);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]); // fetchUsers es estable gracias a useCallback

  return {
    users,
    loading,
    error,
    pagination,
    fetchUsers,
    fetchAllUsers,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus
  };
};

// Hook para cargar todos los usuarios (usado en formularios)
export const useAllUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAllUsers = useCallback(async (search = '', role = '') => {
    try {
      setLoading(true);
      setError(null);
      
      // Primero obtenemos el total para saber cuántos usuarios hay
      const initialResponse = await userService.getUsers(1, 1, search, role);
      const total = initialResponse.data?.total || 0;
      
      // Luego cargamos todos los usuarios usando el total como límite
      const response = await userService.getUsers(1, Math.max(total, 500), search, role);
      setUsers(response.data?.users || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar usuarios');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  return {
    users,
    loading,
    error,
    fetchAllUsers,
  };
};

export default useUsers;