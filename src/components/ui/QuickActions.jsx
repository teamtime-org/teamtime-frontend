import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import { 
  Plus, 
  Clock, 
  FileText, 
  Users, 
  Settings, 
  Upload, 
  BarChart3, 
  UserPlus,
  FolderPlus,
  CheckSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickActions = ({ className = "" }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return null;
  }

  const getQuickActions = () => {
    const baseActions = [
      {
        title: 'Registrar Tiempo',
        description: 'Agregar horas trabajadas',
        icon: Clock,
        color: 'bg-blue-100 hover:bg-blue-200 text-blue-700',
        onClick: () => navigate('/timesheet')
      }
    ];

    // Acciones específicas por rol
    if (user.role === 'ADMINISTRADOR') {
      return [
        ...baseActions,
        {
          title: 'Crear Usuario',
          description: 'Agregar nuevo miembro al equipo',
          icon: UserPlus,
          color: 'bg-green-100 hover:bg-green-200 text-green-700',
          onClick: () => navigate('/users/new')
        },
        {
          title: 'Nuevo Proyecto',
          description: 'Iniciar un nuevo proyecto',
          icon: FolderPlus,
          color: 'bg-purple-100 hover:bg-purple-200 text-purple-700',
          onClick: () => navigate('/projects/new')
        },
        {
          title: 'Importar Excel',
          description: 'Cargar datos desde archivo',
          icon: Upload,
          color: 'bg-orange-100 hover:bg-orange-200 text-orange-700',
          onClick: () => navigate('/projects/import')
        },
        {
          title: 'Ver Reportes',
          description: 'Analizar métricas y rendimiento',
          icon: BarChart3,
          color: 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700',
          onClick: () => navigate('/reports')
        },
        {
          title: 'Gestionar Áreas',
          description: 'Configurar áreas organizacionales',
          icon: Settings,
          color: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
          onClick: () => navigate('/areas')
        }
      ];
    } else if (user.role === 'COORDINADOR') {
      return [
        ...baseActions,
        {
          title: 'Mis Proyectos',
          description: 'Ver proyectos bajo supervisión',
          icon: FolderPlus,
          color: 'bg-purple-100 hover:bg-purple-200 text-purple-700',
          onClick: () => navigate('/projects')
        },
        {
          title: 'Asignar Tareas',
          description: 'Distribuir trabajo al equipo',
          icon: CheckSquare,
          color: 'bg-green-100 hover:bg-green-200 text-green-700',
          onClick: () => navigate('/tasks')
        },
        {
          title: 'Equipo',
          description: 'Gestionar miembros del área',
          icon: Users,
          color: 'bg-blue-100 hover:bg-blue-200 text-blue-700',
          onClick: () => navigate('/users')
        },
        {
          title: 'Reportes del Área',
          description: 'Ver métricas del equipo',
          icon: BarChart3,
          color: 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700',
          onClick: () => navigate('/reports')
        }
      ];
    } else { // COLABORADOR
      return [
        ...baseActions,
        {
          title: 'Mis Tareas',
          description: 'Ver tareas asignadas',
          icon: CheckSquare,
          color: 'bg-green-100 hover:bg-green-200 text-green-700',
          onClick: () => navigate('/tasks')
        },
        {
          title: 'Mis Proyectos',
          description: 'Ver proyectos asignados',
          icon: FolderPlus,
          color: 'bg-purple-100 hover:bg-purple-200 text-purple-700',
          onClick: () => navigate('/projects')
        },
        {
          title: 'Mi Reporte',
          description: 'Ver mi progreso y horas',
          icon: FileText,
          color: 'bg-orange-100 hover:bg-orange-200 text-orange-700',
          onClick: () => navigate('/reports')
        }
      ];
    }
  };

  const actions = getQuickActions();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Acciones Rápidas</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              className={`h-auto p-4 flex flex-col items-start text-left space-y-2 ${action.color} border border-transparent hover:border-current transition-all duration-200`}
              onClick={action.onClick}
            >
              <div className="flex items-center space-x-2 w-full">
                <action.icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium text-sm">{action.title}</span>
              </div>
              <p className="text-xs opacity-75 text-left w-full">
                {action.description}
              </p>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;