import { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Circle, 
  AlertCircle, 
  User, 
  Calendar,
  Plus,
  Filter,
  Search
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Button,
  Badge,
  Input,
  Loading
} from '@/components/ui';
import { useProjectTasks } from '@/hooks/useTasks';
import { formatDate, getInitials } from '@/utils';

const taskStatusConfig = {
  TODO: { 
    icon: Circle, 
    variant: 'secondary', 
    label: 'To Do',
    color: 'text-gray-500' 
  },
  IN_PROGRESS: { 
    icon: Clock, 
    variant: 'warning', 
    label: 'In Progress',
    color: 'text-orange-500' 
  },
  REVIEW: { 
    icon: AlertCircle, 
    variant: 'info', 
    label: 'In Review',
    color: 'text-blue-500' 
  },
  DONE: { 
    icon: CheckCircle2, 
    variant: 'success', 
    label: 'Done',
    color: 'text-green-500' 
  },
};

const priorityConfig = {
  LOW: { variant: 'secondary', label: 'Low', color: 'bg-gray-100 text-gray-700' },
  MEDIUM: { variant: 'default', label: 'Medium', color: 'bg-blue-100 text-blue-700' },
  HIGH: { variant: 'warning', label: 'High', color: 'bg-orange-100 text-orange-700' },
  URGENT: { variant: 'danger', label: 'Urgent', color: 'bg-red-100 text-red-700' },
};

const ProjectTasksList = ({ projectId, canManage = false }) => {
  const { tasks, loading, error, refetch } = useProjectTasks(projectId);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <Loading size="lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading tasks: {error}</p>
            <Button variant="outline" onClick={refetch} className="mt-2">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle2 className="h-5 w-5" />
            <span>Tasks ({tasks.length})</span>
          </CardTitle>
          {canManage && (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          )}
        </div>
        
        {/* Filters */}
        <div className="flex space-x-4 mt-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            {Object.entries(taskStatusConfig).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8">
            <Circle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">
              {tasks.length === 0 ? 'No tasks found' : 'No tasks match your filters'}
            </p>
            {tasks.length === 0 && canManage && (
              <Button variant="outline" className="mt-2">
                <Plus className="h-4 w-4 mr-2" />
                Create First Task
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task) => {
              const StatusIcon = taskStatusConfig[task.status]?.icon || Circle;
              const statusConfig = taskStatusConfig[task.status];
              const priority = priorityConfig[task.priority];
              
              return (
                <div
                  key={task.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <StatusIcon className={`h-5 w-5 mt-1 ${statusConfig?.color}`} />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900">{task.title}</h4>
                          <Badge className={priority?.color}>
                            {priority?.label}
                          </Badge>
                        </div>
                        {task.description && (
                          <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          {task.assignee && (
                            <div className="flex items-center space-x-1">
                              <User className="h-4 w-4" />
                              <span>{task.assignee.firstName} {task.assignee.lastName}</span>
                            </div>
                          )}
                          {task.dueDate && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(task.dueDate)}</span>
                            </div>
                          )}
                          {task.estimatedHours && (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{task.estimatedHours}h</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge variant={statusConfig?.variant}>
                      {statusConfig?.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectTasksList;