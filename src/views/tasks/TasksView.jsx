import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Users,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Play,
  Pause,
  CheckCircle,
  Circle,
  AlertCircle,
  Timer,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import {
  Button,
  Input,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Modal,
  Badge,
  Loading,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@/components/ui';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { ROLES, TASK_STATUS, TASK_PRIORITY } from '@/constants';
import { formatDate, formatDuration } from '@/utils';
import TaskForm from './TaskForm';

const TasksView = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { projects } = useProjects();

  const statusConfig = {
    [TASK_STATUS.TODO]: {
      variant: 'secondary',
      label: 'Pendiente',
      icon: Circle,
      color: 'text-gray-500'
    },
    [TASK_STATUS.IN_PROGRESS]: {
      variant: 'primary',
      label: t('inProgress'),
      icon: Play,
      color: 'text-blue-500'
    },
    [TASK_STATUS.REVIEW]: {
      variant: 'warning',
      label: t('review'),
      icon: AlertCircle,
      color: 'text-yellow-500'
    },
    [TASK_STATUS.DONE]: {
      variant: 'success',
      label: t('done'),
      icon: CheckCircle,
      color: 'text-green-500'
    },
  };

  const priorityConfig = {
    [TASK_PRIORITY.LOW]: { variant: 'secondary', label: t('low'), color: 'bg-gray-100' },
    [TASK_PRIORITY.MEDIUM]: { variant: 'primary', label: t('medium'), color: 'bg-blue-100' },
    [TASK_PRIORITY.HIGH]: { variant: 'warning', label: t('high'), color: 'bg-yellow-100' },
    [TASK_PRIORITY.URGENT]: { variant: 'danger', label: t('urgent'), color: 'bg-red-100' },
  };
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    projectId: '',
    assignedTo: '',
    dueDate: '',
  });

  const { tasks, loading, error, pagination, fetchTasks, deleteTask, updateTaskStatus } = useTasks(filters);

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // grid | list | kanban
  const [expandedProjects, setExpandedProjects] = useState(new Set());

  const isAdmin = user?.role === ROLES.ADMIN;
  const isManager = user?.role === ROLES.MANAGER;
  const canCreateTasks = isAdmin || isManager;

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchTasks(newFilters);
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleDelete = (task) => {
    setTaskToDelete(task);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteTask(taskToDelete.id);
      setShowDeleteModal(false);
      setTaskToDelete(null);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  const handleFormSuccess = async () => {
    setShowForm(false);
    setEditingTask(null);
    // Refrescar los datos después de una actualización exitosa
    await fetchTasks(filters);
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const calculateProgress = (task) => {
    if (!task.estimatedHours || task.estimatedHours === 0) return 0;
    const loggedHours = task.loggedHours || 0;
    return Math.min(Math.round((loggedHours / task.estimatedHours) * 100), 100);
  };

  const getStatusIcon = (status) => {
    const config = statusConfig[status];
    const Icon = config?.icon || Circle;
    return <Icon className={`h-4 w-4 ${config?.color}`} />;
  };

  const isOverdue = (task) => {
    if (!task.dueDate) return false;
    return new Date(task.dueDate) < new Date() && task.status !== TASK_STATUS.DONE;
  };

  const groupTasksByProject = (tasks) => {
    const grouped = tasks.reduce((acc, task) => {
      const projectKey = task.project?.id || 'no-project';

      if (!acc[projectKey]) {
        acc[projectKey] = {
          project: task.project || { name: 'No Project', id: 'no-project' },
          tasks: []
        };
      }

      acc[projectKey].tasks.push(task);
      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => {
      if (a.project.id === 'no-project') return 1;
      if (b.project.id === 'no-project') return -1;
      return a.project.name.localeCompare(b.project.name);
    });
  };

  const toggleProjectExpansion = (projectId) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600">
            Manage and track task progress across your projects
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${viewMode === 'grid'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${viewMode === 'kanban'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Kanban
            </button>
          </div>

          {canCreateTasks && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search tasks..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">All Status</option>
              <option value={TASK_STATUS.TODO}>To Do</option>
              <option value={TASK_STATUS.IN_PROGRESS}>In Progress</option>
              <option value={TASK_STATUS.REVIEW}>Review</option>
              <option value={TASK_STATUS.DONE}>Done</option>
            </select>

            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">All Priorities</option>
              <option value={TASK_PRIORITY.LOW}>Low</option>
              <option value={TASK_PRIORITY.MEDIUM}>Medium</option>
              <option value={TASK_PRIORITY.HIGH}>High</option>
              <option value={TASK_PRIORITY.URGENT}>Urgent</option>
            </select>

            <select
              value={filters.projectId}
              onChange={(e) => handleFilterChange('projectId', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">All Projects</option>
              {projects && projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>

            <select
              value={filters.assignedTo}
              onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">All Assignees</option>
              <option value="me">My Tasks</option>
              <option value="unassigned">Unassigned</option>
            </select>

            <Input
              type="date"
              placeholder="Due date"
              value={filters.dueDate}
              onChange={(e) => handleFilterChange('dueDate', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {error && !error.includes('Backend not available') && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {error && error.includes('Backend not available') && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-800">
            <strong>Backend not available:</strong> Some task features are disabled.
            The backend server needs to implement the tasks API endpoints.
          </p>
        </div>
      )}

      {/* Tasks Grid */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tasks.map((task) => {
            const progress = calculateProgress(task);
            const overdue = isOverdue(task);

            return (
              <Card
                key={task.id}
                className={`hover:shadow-lg transition-shadow ${overdue ? 'ring-2 ring-red-200' : ''
                  }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        {getStatusIcon(task.status)}
                        <CardTitle className="text-sm truncate">{task.title}</CardTitle>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={priorityConfig[task.priority]?.variant}
                          className={`${priorityConfig[task.priority]?.color} text-xs`}
                        >
                          {priorityConfig[task.priority]?.label}
                        </Badge>
                        <Badge variant={statusConfig[task.status]?.variant} className="text-xs">
                          {statusConfig[task.status]?.label}
                        </Badge>
                        {overdue && (
                          <Badge variant="danger" className="text-xs">
                            Overdue
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="relative ml-2">
                      <details className="relative">
                        <summary className="cursor-pointer p-1 rounded hover:bg-gray-100">
                          <MoreVertical className="h-4 w-4" />
                        </summary>
                        <div className="absolute right-0 z-10 mt-1 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
                          <button
                            onClick={() => navigate(`/tasks/${task.id}`)}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </button>
                          {canCreateTasks && (
                            <>
                              <button
                                onClick={() => handleEdit(task)}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(task)}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </details>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <p className="text-gray-600 text-xs mb-3 line-clamp-2">
                    {task.description}
                  </p>

                  {/* Progress Bar */}
                  {task.estimatedHours > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Task Info */}
                  <div className="space-y-2 text-xs">
                    {task.project && (
                      <div className="flex items-center">
                        <div
                          className="w-2 h-2 rounded-full mr-2"
                          style={{ backgroundColor: task.project.area?.color || '#3b82f6' }}
                        />
                        <span className="text-gray-600 truncate">{task.project.name}</span>
                      </div>
                    )}

                    {task.assignedTo && (
                      <div className="flex items-center">
                        <Users className="h-3 w-3 mr-2 text-gray-400" />
                        <span className="text-gray-600">{task.assignedTo.name}</span>
                      </div>
                    )}

                    {task.dueDate && (
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-2 text-gray-400" />
                        <span className={`${overdue ? 'text-red-600' : 'text-gray-600'}`}>
                          {formatDate(task.dueDate)}
                        </span>
                      </div>
                    )}

                    {task.estimatedHours && (
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-2 text-gray-400" />
                        <span className="text-gray-600">
                          {formatDuration(task.estimatedHours)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Status Actions */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <div className="flex items-center space-x-1">
                      {task.status !== TASK_STATUS.DONE && (
                        <button
                          onClick={() => handleStatusChange(task.id, TASK_STATUS.DONE)}
                          className="p-1 rounded hover:bg-green-100 text-green-600"
                          title="Mark as Done"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      {task.status !== TASK_STATUS.IN_PROGRESS && (
                        <button
                          onClick={() => handleStatusChange(task.id, TASK_STATUS.IN_PROGRESS)}
                          className="p-1 rounded hover:bg-blue-100 text-blue-600"
                          title="Start Progress"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => navigate(`/tasks/${task.id}/timer`)}
                      className="p-1 rounded hover:bg-gray-100 text-gray-600"
                      title="Time Tracker"
                    >
                      <Timer className="h-4 w-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tasks Summary */}
      {viewMode === 'list' && tasks.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{tasks.length}</div>
                <div className="text-sm text-gray-600">Total Tasks</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {tasks.filter(t => t.status === TASK_STATUS.DONE).length}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {tasks.filter(t => t.status === TASK_STATUS.IN_PROGRESS).length}
                </div>
                <div className="text-sm text-gray-600">In Progress</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {tasks.filter(t => isOverdue(t)).length}
                </div>
                <div className="text-sm text-gray-600">Overdue</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tasks List View */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          {/* List Controls */}
          {tasks.length > 0 && (
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {groupTasksByProject(tasks).length} project{groupTasksByProject(tasks).length !== 1 ? 's' : ''} found
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const allProjects = groupTasksByProject(tasks).map(g => g.project.id);
                    setExpandedProjects(new Set(allProjects));
                  }}
                >
                  Expand All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExpandedProjects(new Set())}
                >
                  Collapse All
                </Button>
              </div>
            </div>
          )}
          {groupTasksByProject(tasks).map((group) => {
            const isExpanded = expandedProjects.has(group.project.id);
            const completedTasks = group.tasks.filter(t => t.status === TASK_STATUS.DONE).length;
            const overdueTasks = group.tasks.filter(t => isOverdue(t)).length;

            return (
              <Card key={group.project.id}>
                <CardHeader className="pb-3">
                  <CardTitle
                    className="flex items-center text-lg cursor-pointer hover:bg-gray-50 -m-4 p-4 rounded-lg"
                    onClick={() => toggleProjectExpansion(group.project.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 mr-2 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 mr-2 text-gray-500" />
                    )}
                    {group.project.area && (
                      <div
                        className="w-3 h-3 rounded-full mr-3"
                        style={{ backgroundColor: group.project.area.color || '#3b82f6' }}
                      />
                    )}
                    <span className="flex-1">{group.project.name}</span>
                    <div className="flex items-center space-x-2 ml-auto">
                      {overdueTasks > 0 && (
                        <Badge variant="danger" className="text-xs">
                          {overdueTasks} overdue
                        </Badge>
                      )}
                      <Badge variant="success" className="text-xs">
                        {completedTasks}/{group.tasks.length} done
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {group.tasks.length} task{group.tasks.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                {isExpanded && (
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8"></TableHead>
                          <TableHead>Task</TableHead>
                          <TableHead className="w-24">Priority</TableHead>
                          <TableHead className="w-24">Status</TableHead>
                          <TableHead className="w-32">Assignee</TableHead>
                          <TableHead className="w-24">Due Date</TableHead>
                          <TableHead className="w-20">Progress</TableHead>
                          <TableHead className="w-20">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.tasks.map((task) => {
                          const progress = calculateProgress(task);
                          const overdue = isOverdue(task);

                          return (
                            <TableRow key={task.id} className={overdue ? 'bg-red-50' : ''}>
                              <TableCell>
                                {getStatusIcon(task.status)}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium text-sm">{task.title}</div>
                                  {task.description && (
                                    <div className="text-xs text-gray-500 truncate max-w-xs">
                                      {task.description}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={priorityConfig[task.priority]?.variant}
                                  className="text-xs"
                                >
                                  {priorityConfig[task.priority]?.label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={statusConfig[task.status]?.variant} className="text-xs">
                                  {statusConfig[task.status]?.label}
                                </Badge>
                                {overdue && (
                                  <Badge variant="danger" className="text-xs ml-1">
                                    Overdue
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  {task.assignedTo ? (
                                    <>
                                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                                        <span className="text-xs font-medium">
                                          {task.assignedTo.firstName?.charAt(0) || task.assignedTo.name?.charAt(0) || '?'}
                                        </span>
                                      </div>
                                      <span className="text-xs text-gray-600 truncate">
                                        {task.assignedTo.firstName && task.assignedTo.lastName
                                          ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
                                          : task.assignedTo.name || 'Unknown'
                                        }
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-xs text-gray-400">Unassigned</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {task.dueDate ? (
                                  <span className={`text-xs ${overdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                                    {formatDate(task.dueDate)}
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-400">No due date</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {task.estimatedHours > 0 ? (
                                  <div className="flex items-center space-x-2">
                                    <div className="w-12 bg-gray-200 rounded-full h-1.5">
                                      <div
                                        className={`h-1.5 rounded-full transition-all ${progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                                          }`}
                                        style={{ width: `${progress}%` }}
                                      />
                                    </div>
                                    <span className="text-xs text-gray-600 w-8">{progress}%</span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => navigate(`/tasks/${task.id}`)}
                                    className="p-1 rounded hover:bg-gray-100 text-gray-600"
                                    title="View Details"
                                  >
                                    <Eye className="h-3 w-3" />
                                  </button>
                                  {canCreateTasks && (
                                    <>
                                      <button
                                        onClick={() => handleEdit(task)}
                                        className="p-1 rounded hover:bg-gray-100 text-gray-600"
                                        title="Edit"
                                      >
                                        <Edit className="h-3 w-3" />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(task)}
                                        className="p-1 rounded hover:bg-red-100 text-red-600"
                                        title="Delete"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </>
                                  )}
                                  <button
                                    onClick={() => navigate(`/tasks/${task.id}/timer`)}
                                    className="p-1 rounded hover:bg-gray-100 text-gray-600"
                                    title="Time Tracker"
                                  >
                                    <Timer className="h-3 w-3" />
                                  </button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {tasks.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-600 mb-4">
            {Object.values(filters).some(f => f)
              ? 'No tasks match your current filters.'
              : 'Get started by creating your first task.'
            }
          </p>
          {canCreateTasks && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} tasks
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => fetchTasks({ ...filters, page: pagination.page - 1 })}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => fetchTasks({ ...filters, page: pagination.page + 1 })}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Task Form Modal */}
      {showForm && (
        <Modal
          isOpen={showForm}
          onClose={handleFormClose}
          title={editingTask ? 'Edit Task' : 'Create New Task'}
          size="xl"
        >
          <TaskForm
            task={editingTask}
            onSuccess={handleFormSuccess}
            onCancel={handleFormClose}
          />
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Task"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={confirmDelete}
                loading={loading}
              >
                Delete
              </Button>
            </>
          }
        >
          <p className="text-gray-600">
            Are you sure you want to delete the task "{taskToDelete?.title}"?
            This action cannot be undone and will remove all associated time entries
            and comments.
          </p>
        </Modal>
      )}
    </div>
  );
};

export default TasksView;