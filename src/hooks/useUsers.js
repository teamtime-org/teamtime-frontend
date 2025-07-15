import { useState, useEffect } from 'react';
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

  const fetchUsers = async (page = 1, limit = 10, search = '', role = '') => {
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
  };

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
  }, []);

  return {
    users,
    loading,
    error,
    pagination,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus
  };
};

export default useUsers;