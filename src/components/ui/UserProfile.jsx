import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { User, Mail, Shield, Building2, Calendar, UserCheck } from 'lucide-react';

const UserProfile = ({ className = "" }) => {
  const { user, userId } = useAuth();

  if (!user) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-gray-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Cargando información del usuario...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRoleLabel = (role) => {
    const roles = {
      'ADMINISTRADOR': { label: 'Administrador', color: 'bg-red-100 text-red-800' },
      'COORDINADOR': { label: 'Coordinador', color: 'bg-blue-100 text-blue-800' },
      'COLABORADOR': { label: 'Colaborador', color: 'bg-green-100 text-green-800' }
    };
    return roles[role] || { label: role, color: 'bg-gray-100 text-gray-800' };
  };

  const getUserInitials = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.firstName) {
      return user.firstName.substring(0, 2).toUpperCase();
    }
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getFullName = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) {
      return user.firstName;
    }
    return user.email?.split('@')[0] || 'Usuario';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const roleInfo = getRoleLabel(user.role);

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2">
          <UserCheck className="w-5 h-5" />
          <span>Mi Perfil</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Avatar y nombre */}
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {getUserInitials()}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {getFullName()}
            </h3>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleInfo.color}`}>
                <Shield className="w-3 h-3 mr-1" />
                {roleInfo.label}
              </span>
            </div>
          </div>
        </div>

        {/* Información detallada */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center space-x-3 text-sm">
            <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <div>
              <p className="text-gray-500">Correo electrónico:</p>
              <p className="font-medium text-gray-900">{user.email}</p>
            </div>
          </div>

          {user.area && (
            <div className="flex items-center space-x-3 text-sm">
              <Building2 className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <div>
                <p className="text-gray-500">Área:</p>
                <p className="font-medium text-gray-900">{user.area.name}</p>
              </div>
            </div>
          )}

          {!user.area && user.areaId && (
            <div className="flex items-center space-x-3 text-sm">
              <Building2 className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <div>
                <p className="text-gray-500">Área ID:</p>
                <p className="font-medium text-gray-900 font-mono text-xs">{user.areaId}</p>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-3 text-sm">
            <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <div>
              <p className="text-gray-500">Miembro desde:</p>
              <p className="font-medium text-gray-900">{formatDate(user.createdAt)}</p>
            </div>
          </div>

          {user.isActive !== undefined && (
            <div className="flex items-center space-x-3 text-sm">
              <UserCheck className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <div>
                <p className="text-gray-500">Estado:</p>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  user.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Debug info - solo mostrar si userId está disponible */}
        {userId && (
          <div className="pt-4 border-t">
            <details className="text-xs text-gray-500">
              <summary className="cursor-pointer hover:text-gray-700">
                Información técnica
              </summary>
              <div className="mt-2 space-y-1 font-mono text-xs bg-gray-50 p-2 rounded">
                <p>User ID: {user.id}</p>
                <p>Token User ID: {userId}</p>
                <p>Area ID: {user.areaId || 'No asignada'}</p>
                {user.createdBy && <p>Creado por: {user.createdBy}</p>}
              </div>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserProfile;