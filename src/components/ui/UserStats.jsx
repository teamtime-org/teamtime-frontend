import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui';
import { Clock, FolderOpen, CheckSquare, Users, TrendingUp, Target } from 'lucide-react';
import { projectService } from '@/services/projectService';
import { taskService } from '@/services/taskService';
import { timesheetService } from '@/services/timesheetService';

const UserStats = ({ className = "" }) => {
  const { user, userId } = useAuth();
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeTasks: 0,
    hoursThisWeek: 0,
    teamMembers: 0,
    loading: true
  });

  useEffect(() => {
    if (userId) {
      loadUserStats();
    }
  }, [userId]);

  const loadUserStats = async () => {
    if (!userId) return;
    
    try {
      setStats(prev => ({ ...prev, loading: true }));
      
      // Cargar datos en paralelo
      const [projectsData, tasksData, hoursData] = await Promise.all([
        // Proyectos asignados al usuario
        projectService.getAll({ assigned: true, limit: 1000 }).catch(() => ({ data: { projects: [] } })),
        
        // Tareas asignadas al usuario
        taskService.getAll({ assigned: true, limit: 1000 }).catch(() => ({ data: { tasks: [] } })),
        
        // Horas de esta semana
        getThisWeekHours().catch(() => 0)
      ]);

      const totalProjects = projectsData.data?.projects?.length || 0;
      const activeTasks = tasksData.data?.tasks?.filter(task => 
        task.status === 'TODO' || task.status === 'IN_PROGRESS'
      ).length || 0;

      setStats({
        totalProjects,
        activeTasks,
        hoursThisWeek: hoursData,
        teamMembers: user.role === 'ADMINISTRADOR' ? '∞' : 
                    user.role === 'COORDINADOR' ? '5-10' : '1',
        loading: false
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const getThisWeekHours = async () => {
    try {
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1)); // Lunes
      const endOfWeek = new Date(now.setDate(startOfWeek.getDate() + 6)); // Domingo
      
      const startDate = startOfWeek.toISOString().split('T')[0];
      const endDate = endOfWeek.toISOString().split('T')[0];
      
      const response = await timesheetService.getTimeEntries({
        userId: userId,
        startDate,
        endDate
      });
      
      if (response.data?.timeEntries) {
        return response.data.timeEntries.reduce((total, entry) => 
          total + (parseFloat(entry.hours) || 0), 0
        );
      }
      return 0;
    } catch (error) {
      console.error('Error getting weekly hours:', error);
      return 0;
    }
  };

  const getStatConfig = () => {
    const baseStats = [
      {
        title: 'Proyectos Asignados',
        value: stats.loading ? '...' : stats.totalProjects.toString(),
        icon: FolderOpen,
        color: 'text-blue-600',
        bg: 'bg-blue-100',
        description: user.role === 'COLABORADOR' ? 'Proyectos donde participas' : 'Proyectos bajo tu supervisión'
      },
      {
        title: 'Tareas Activas',
        value: stats.loading ? '...' : stats.activeTasks.toString(),
        icon: CheckSquare,
        color: 'text-green-600',
        bg: 'bg-green-100',
        description: 'Tareas pendientes y en progreso'
      },
      {
        title: 'Horas Esta Semana',
        value: stats.loading ? '...' : stats.hoursThisWeek.toFixed(1),
        icon: Clock,
        color: 'text-purple-600',
        bg: 'bg-purple-100',
        description: 'Total de horas registradas'
      }
    ];

    // Solo mostrar estadísticas de equipo para coordinadores y administradores
    if (user.role === 'COORDINADOR' || user.role === 'ADMINISTRADOR') {
      baseStats.push({
        title: 'Miembros del Equipo',
        value: stats.teamMembers.toString(),
        icon: Users,
        color: 'text-orange-600',
        bg: 'bg-orange-100',
        description: user.role === 'ADMINISTRADOR' ? 'Todos los usuarios' : 'Usuarios en tu área'
      });
    } else {
      // Para colaboradores, mostrar una métrica diferente
      baseStats.push({
        title: 'Mi Productividad',
        value: stats.loading ? '...' : (stats.hoursThisWeek >= 40 ? 'Alta' : stats.hoursThisWeek >= 20 ? 'Media' : 'Baja'),
        icon: TrendingUp,
        color: 'text-indigo-600',
        bg: 'bg-indigo-100',
        description: 'Basada en horas registradas'
      });
    }

    return baseStats;
  };

  if (!user) {
    return null;
  }

  const statsConfig = getStatConfig();

  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {statsConfig.map((stat) => (
        <Card key={stat.title} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                {stat.description && (
                  <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default UserStats;