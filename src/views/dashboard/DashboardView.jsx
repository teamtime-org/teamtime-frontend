import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { UserProfile, UserStats, QuickActions } from '@/components/ui';
import WorkloadDashboard from '@/components/dashboard/WorkloadDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import CoordinatorDashboard from '@/components/dashboard/CoordinatorDashboard';
import CollaboratorDashboard from '@/components/dashboard/CollaboratorDashboard';

const DashboardView = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  // Obtener el nombre del usuario de manera más robusta
  const getUserName = () => {
    if (!user) return 'Usuario';

    // Intentar diferentes campos que podrían contener el nombre
    return user.name ||
      user.firstName ||
      user.fullName ||
      `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
      user.email?.split('@')[0] ||
      'Usuario';
  };

  // Renderizar dashboard según el rol del usuario
  const renderDashboardByRole = () => {
    switch(user?.role) {
      case 'ADMINISTRADOR':
        return <AdminDashboard />;
      case 'COORDINADOR':
        return <CoordinatorDashboard />;
      case 'COLABORADOR':
        return <CollaboratorDashboard />;
      default:
        return <WorkloadDashboard />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t('welcomeBackUser', { name: getUserName() })}
        </h1>
        <p className="text-gray-600">
          {t('whatsHappening')}
        </p>
      </div>

      {/* Profile and Quick Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <UserProfile className="lg:col-span-1" />
        <QuickActions className="lg:col-span-2" />
      </div>

      {/* User Statistics - Removed per user request */}
      {/* <UserStats className="w-full" /> */}
      
      {/* Role-based Dashboard */}
      {renderDashboardByRole()}
      
      {/* Workload Dashboard - mostrar siempre después del dashboard específico del rol */}
      <WorkloadDashboard />
    </div>
  );
};

export default DashboardView;