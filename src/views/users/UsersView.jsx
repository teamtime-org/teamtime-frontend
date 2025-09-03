import { useState, useEffect } from 'react';
import { 
  Button, 
  Input, 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell, 
  Badge,
  Loading 
} from '@/components/ui';
import { ROLES } from '@/constants';
import useUsers from '@/hooks/useUsers';
import UserForm from './UserForm';

const UsersView = () => {
  const {
    users,
    loading,
    error,
    pagination,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus
  } = useUsers();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(1, pagination.limit, searchTerm, roleFilter);
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (userData) => {
    setFormLoading(true);
    try {
      if (selectedUser) {
        await updateUser(selectedUser.id, userData);
      } else {
        await createUser(userData);
      }
      setIsModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      // El error ya se maneja en el hook useUsers
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      try {
        await deleteUser(userId);
      } catch (error) {
        // El error ya se maneja en el hook useUsers
      }
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      await toggleUserStatus(userId);
    } catch (error) {
      // El error ya se maneja en el hook useUsers
    }
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      [ROLES.ADMIN]: { variant: 'danger', text: 'Administrador' },
      [ROLES.MANAGER]: { variant: 'warning', text: 'Coordinador' },
      [ROLES.EMPLOYEE]: { variant: 'default', text: 'Colaborador' }
    };

    const config = roleConfig[role] || { variant: 'default', text: role };
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const getStatusBadge = (isActive) => {
    return (
      <Badge variant={isActive ? 'success' : 'secondary'}>
        {isActive ? 'Activo' : 'Inactivo'}
      </Badge>
    );
  };

  const handlePageChange = (newPage) => {
    fetchUsers(newPage, pagination.limit, searchTerm, roleFilter);
  };

  const handleLimitChange = (newLimit) => {
    fetchUsers(1, parseInt(newLimit), searchTerm, roleFilter);
  };

  // Debug info
  useEffect(() => {
    console.log('Pagination info:', pagination);
    console.log('Total users:', pagination.total);
    console.log('Total pages:', pagination.pages);
  }, [pagination]);

  if (loading && users.length === 0) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Administración de Usuarios</h1>
        <Button onClick={handleCreateUser}>
          Crear Usuario
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSearch} className="flex gap-4 items-end">
        <div className="flex-1">
          <Input
            label="Buscar"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filtrar por rol
          </label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Todos los roles</option>
            <option value={ROLES.ADMIN}>Administrador</option>
            <option value={ROLES.MANAGER}>Coordinador</option>
            <option value={ROLES.EMPLOYEE}>Colaborador</option>
          </select>
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? 'Buscando...' : 'Buscar'}
        </Button>
      </form>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Área</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.isArray(users) && users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{user.firstName} {user.lastName}</div>
                    {user.area && (
                      <div className="text-sm text-gray-500">{user.area.name}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{getRoleBadge(user.role)}</TableCell>
                <TableCell>{user.area?.name || '-'}</TableCell>
                <TableCell>{getStatusBadge(user.isActive)}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(user.id)}
                    >
                      {user.isActive ? 'Desactivar' : 'Activar'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Eliminar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {Array.isArray(users) && users.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-500">No se encontraron usuarios</p>
          </div>
        )}

        {/* Paginación mejorada - siempre visible */}
        <div className="flex justify-between items-center px-4 py-3 border-t bg-gray-50">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-700">
              Mostrando {users.length > 0 ? ((pagination.page - 1) * pagination.limit) + 1 : 0} a{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
              {pagination.total} usuarios
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-700">Mostrar:</label>
              <select
                value={pagination.limit}
                onChange={(e) => handleLimitChange(e.target.value)}
                className="h-8 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <span className="text-sm text-gray-700">por página</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={pagination.page === 1 || loading}
            >
              Primera
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1 || loading}
            >
              Anterior
            </Button>
            
            {/* Números de página */}
            {pagination.pages > 1 && (
              <div className="flex space-x-1">
                {(() => {
                  const pages = [];
                  const maxVisible = 5;
                  let start = Math.max(1, pagination.page - Math.floor(maxVisible / 2));
                  let end = Math.min(pagination.pages, start + maxVisible - 1);
                  
                  if (end - start < maxVisible - 1) {
                    start = Math.max(1, end - maxVisible + 1);
                  }
                  
                  if (start > 1) {
                    pages.push(
                      <Button
                        key={1}
                        variant={pagination.page === 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(1)}
                        disabled={loading}
                      >
                        1
                      </Button>
                    );
                    if (start > 2) {
                      pages.push(<span key="dots1" className="px-2">...</span>);
                    }
                  }
                  
                  for (let i = start; i <= end; i++) {
                    pages.push(
                      <Button
                        key={i}
                        variant={pagination.page === i ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(i)}
                        disabled={loading}
                      >
                        {i}
                      </Button>
                    );
                  }
                  
                  if (end < pagination.pages) {
                    if (end < pagination.pages - 1) {
                      pages.push(<span key="dots2" className="px-2">...</span>);
                    }
                    pages.push(
                      <Button
                        key={pagination.pages}
                        variant={pagination.page === pagination.pages ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pagination.pages)}
                        disabled={loading}
                      >
                        {pagination.pages}
                      </Button>
                    );
                  }
                  
                  return pages;
                })()}
              </div>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages || loading}
            >
              Siguiente
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.pages)}
              disabled={pagination.page === pagination.pages || loading}
            >
              Última
            </Button>
          </div>
        </div>
      </div>

      <UserForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        user={selectedUser}
        loading={formLoading}
      />
    </div>
  );
};

export default UsersView;