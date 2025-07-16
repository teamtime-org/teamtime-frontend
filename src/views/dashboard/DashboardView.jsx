import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Clock, FolderOpen, CheckSquare, Users } from 'lucide-react';

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

  const stats = [
    {
      title: t('totalProjects'),
      value: '12',
      icon: FolderOpen,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      title: t('activeTasks'),
      value: '24',
      icon: CheckSquare,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      title: t('hoursThisWeek'),
      value: '32.5',
      icon: Clock,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
    {
      title: t('teamMembers'),
      value: '8',
      icon: Users,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
    },
  ];

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

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('recentProjects')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Rediseño de Sitio Web</p>
                  <p className="text-sm text-gray-500">Última actualización hace 2 horas</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  {t('active')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Aplicación Móvil</p>
                  <p className="text-sm text-gray-500">Última actualización hace 1 día</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                  {t('inProgress')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Migración de Base de Datos</p>
                  <p className="text-sm text-gray-500">Última actualización hace 3 días</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                  {t('planning')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('recentActivity')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-2 w-2 bg-green-500 rounded-full mt-2"></div>
                </div>
                <div>
                  <p className="text-sm">
                    <span className="font-medium">Juan Pérez</span> {t('activityCompleted')} tarea "Actualizar página principal"
                  </p>
                  <p className="text-xs text-gray-500">hace 2 horas</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-2 w-2 bg-blue-500 rounded-full mt-2"></div>
                </div>
                <div>
                  <p className="text-sm">
                    <span className="font-medium">María García</span> {t('activityAdded')} {t('activityNewTask')} "Revisar maquetas de diseño"
                  </p>
                  <p className="text-xs text-gray-500">hace 4 horas</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-2 w-2 bg-purple-500 rounded-full mt-2"></div>
                </div>
                <div>
                  <p className="text-sm">
                    <span className="font-medium">{t('team')}</span> {t('activityMeeting')} {t('activityScheduled')} {t('activityFor')} {t('tomorrow')}
                  </p>
                  <p className="text-xs text-gray-500">hace 1 día</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardView;