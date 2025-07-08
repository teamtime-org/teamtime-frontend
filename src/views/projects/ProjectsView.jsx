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
  Eye
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
  Loading
} from '@/components/ui';
import { useProjects } from '@/hooks/useProjects';
import { useAreas } from '@/hooks/useAreas';
import { useAuth } from '@/hooks/useAuth';
import { ROLES, PROJECT_STATUS } from '@/constants';
import { formatDate, formatDuration } from '@/utils';
import ProjectForm from './ProjectForm';

const statusConfig = {
  [PROJECT_STATUS.ACTIVE]: { variant: 'success', label: 'Active' },
  [PROJECT_STATUS.COMPLETED]: { variant: 'default', label: 'Completed' },
  [PROJECT_STATUS.ON_HOLD]: { variant: 'warning', label: 'On Hold' },
  [PROJECT_STATUS.CANCELLED]: { variant: 'danger', label: 'Cancelled' },
};

const priorityConfig = {
  LOW: { variant: 'secondary', label: 'Low' },
  MEDIUM: { variant: 'default', label: 'Medium' },
  HIGH: { variant: 'warning', label: 'High' },
  URGENT: { variant: 'danger', label: 'Urgent' },
};

const ProjectsView = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { areas } = useAreas();
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    areaId: '',
  });
  
  const { projects, loading, error, pagination, fetchProjects, deleteProject } = useProjects(filters);
  
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  const isAdmin = user?.role === ROLES.ADMIN;
  const isManager = user?.role === ROLES.MANAGER;
  const canCreateProjects = isAdmin || isManager;

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchProjects(newFilters);
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setShowForm(true);
  };

  const handleDelete = (project) => {
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteProject(projectToDelete.id);
      setShowDeleteModal(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingProject(null);
  };

  const calculateProgress = (project) => {
    if (!project._count?.tasks || project._count.tasks === 0) return 0;
    const completedTasks = project._count.completedTasks || 0;
    return Math.round((completedTasks / project._count.tasks) * 100);
  };

  if (loading && projects.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600">
            Manage and track project progress across your organization
          </p>
        </div>
        {canCreateProjects && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        )}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search projects..."
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
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>

            <select
              value={filters.areaId}
              onChange={(e) => handleFilterChange('areaId', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">All Areas</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {projects.map((project) => {
          const progress = calculateProgress(project);
          
          return (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{project.name}</CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant={priorityConfig[project.priority]?.variant}>
                        {priorityConfig[project.priority]?.label}
                      </Badge>
                      <Badge variant={statusConfig[project.status]?.variant}>
                        {statusConfig[project.status]?.label}
                      </Badge>
                    </div>
                  </div>
                  <div className="relative ml-2">
                    <details className="relative">
                      <summary className="cursor-pointer p-1 rounded hover:bg-gray-100">
                        <MoreVertical className="h-4 w-4" />
                      </summary>
                      <div className="absolute right-0 z-10 mt-1 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
                        <button
                          onClick={() => navigate(`/projects/${project.id}`)}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </button>
                        {canCreateProjects && (
                          <>
                            <button
                              onClick={() => handleEdit(project)}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(project)}
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
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {project.description}
                </p>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Project Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center text-gray-400 mb-1">
                      <Users className="h-4 w-4" />
                    </div>
                    <div className="text-sm font-medium">{project._count?.assignments || 0}</div>
                    <div className="text-xs text-gray-500">Members</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center text-gray-400 mb-1">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="text-sm font-medium">{project._count?.tasks || 0}</div>
                    <div className="text-xs text-gray-500">Tasks</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center text-gray-400 mb-1">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="text-sm font-medium">
                      {formatDuration(project.estimatedHours)}
                    </div>
                    <div className="text-xs text-gray-500">Est. Hours</div>
                  </div>
                </div>

                {/* Project Info */}
                <div className="space-y-2 text-sm">
                  {project.area && (
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: project.area.color }}
                      />
                      <span className="text-gray-600">{project.area.name}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Start Date:</span>
                    <span>{formatDate(project.startDate)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">End Date:</span>
                    <span>{formatDate(project.endDate)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {projects.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-600 mb-4">
            {filters.search || filters.status || filters.priority || filters.areaId
              ? 'No projects match your current filters.'
              : 'Get started by creating your first project.'
            }
          </p>
          {canCreateProjects && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Project
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
            {pagination.total} projects
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => fetchProjects({ ...filters, page: pagination.page - 1 })}
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
              onClick={() => fetchProjects({ ...filters, page: pagination.page + 1 })}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Project Form Modal */}
      {showForm && (
        <Modal
          isOpen={showForm}
          onClose={handleFormClose}
          title={editingProject ? 'Edit Project' : 'Create New Project'}
          size="xl"
        >
          <ProjectForm
            project={editingProject}
            onSuccess={handleFormClose}
            onCancel={handleFormClose}
          />
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Project"
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
            Are you sure you want to delete the project "{projectToDelete?.name}"? 
            This action cannot be undone and will remove all associated tasks, 
            time entries, and assignments.
          </p>
        </Modal>
      )}
    </div>
  );
};

export default ProjectsView;