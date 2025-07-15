import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Badge, Loading } from '@/components/ui';
import { ROLES } from '@/constants';
import userService from '@/services/userService';

const UserDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await userService.getUserById(id);
        setUser(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Error al cargar usuario');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUser();
    }
  }, [id]);

  const getRoleText = (role) => {
    const roleMap = {
      [ROLES.ADMIN]: 'Administrador',
      [ROLES.MANAGER]: 'Coordinador',
      [ROLES.EMPLOYEE]: 'Colaborador'
    };
    return roleMap[role] || role;
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

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={() => navigate('/users')}>
          Volver a usuarios
        </Button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96">
        <div className="text-gray-600 mb-4">Usuario no encontrado</div>
        <Button onClick={() => navigate('/users')}>
          Volver a usuarios
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Detalles del Usuario</h1>
        <Button
          variant="outline"
          onClick={() => navigate('/users')}
        >
          Volver a usuarios
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-600">
                  {user.firstName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-semibold">{user.firstName} {user.lastName}</h2>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Información Personal</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-600">Nombre:</span>
                    <p className="font-medium">{user.firstName} {user.lastName}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Email:</span>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Área:</span>
                    <p className="font-medium">{user.area?.name || 'No especificado'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Información Laboral</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-600">Rol:</span>
                    <div className="mt-1">{getRoleBadge(user.role)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">ID del Área:</span>
                    <p className="font-medium">{user.areaId || 'No especificado'}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Estado de la cuenta</h3>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-600">Estado:</span>
                <div className="mt-1">{getStatusBadge(user.isActive)}</div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Fecha de creación:</span>
                <p className="font-medium">
                  {new Date(user.createdAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Última actualización:</span>
                <p className="font-medium">
                  {new Date(user.updatedAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">Acciones</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/users/${user.id}/edit`)}
              >
                Editar usuario
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  // Implementar toggle de estado
                  console.log('Toggle status for user:', user.id);
                }}
              >
                {user.isActive ? 'Desactivar' : 'Activar'} usuario
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserDetailView;