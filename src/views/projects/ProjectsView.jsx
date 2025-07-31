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
  FileSpreadsheet,
  Grid3X3,
  List
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
import ResponsiveProjectsTable from '@/components/projects/ResponsiveProjectsTable';
import { useProjects } from '@/hooks/useProjects';
import { useAreas } from '@/hooks/useAreas';
import { useCatalogs } from '@/hooks/useCatalogs';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { ROLES, PROJECT_STATUS } from '@/constants';
import { formatDate, formatDuration } from '@/utils';
import ProjectForm from './ProjectForm';

const ProjectsView = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { areas } = useAreas();
  const { salesManagements, mentors, coordinators } = useCatalogs();

  const statusConfig = {
    [PROJECT_STATUS.ACTIVE]: { variant: 'success', label: t('active') },
    [PROJECT_STATUS.COMPLETED]: { variant: 'default', label: t('completed') },
    [PROJECT_STATUS.ON_HOLD]: { variant: 'warning', label: t('onHold') },
    [PROJECT_STATUS.CANCELLED]: { variant: 'danger', label: t('cancelled') },
    [PROJECT_STATUS.AWARDED]: { variant: 'info', label: 'Ganado' },
  };

  const priorityConfig = {
    LOW: { variant: 'secondary', label: t('low') },
    MEDIUM: { variant: 'default', label: t('medium') },
    HIGH: { variant: 'warning', label: t('high') },
    URGENT: { variant: 'danger', label: t('urgent') },
  };
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    areaId: '',
    // Nuevos filtros de Excel
    mentorId: '',
    coordinatorId: '',
    salesManagementId: '',
    salesExecutiveId: '',
    siebelOrderNumber: '',
  });

  const [viewMode, setViewMode] = useState('table'); // 'table' o 'cards'
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const { projects, loading, error, pagination, fetchProjects, deleteProject } = useProjects();

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

    // Limpiar valores vacíos antes de enviar la petición
    const cleanFilters = Object.fromEntries(
      Object.entries(newFilters).filter(([, v]) => v !== '' && v != null)
    );

    fetchProjects(cleanFilters);
  };

  const clearAllFilters = () => {
    const emptyFilters = {
      search: '',
      status: '',
      priority: '',
      areaId: '',
      mentorId: '',
      coordinatorId: '',
      salesManagementId: '',
      salesExecutiveId: '',
      siebelOrderNumber: '',
    };
    setFilters(emptyFilters);
    fetchProjects({});
  };

  const handleSort = (column, order) => {
    setSortBy(column);
    setSortOrder(order);
    // Aquí podrías llamar fetchProjects con los nuevos parámetros de ordenamiento
    // fetchProjects({ ...filters, sortBy: column, sortOrder: order });
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
    // El hook useProjects ya se encarga de actualizar la lista automáticamente
    // No necesitamos llamar fetchProjects() aquí
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
          <h1 className="text-2xl font-bold text-gray-900">{t('projects')}</h1>
          <p className="text-gray-600">
            Gestiona y rastrea el progreso de proyectos en tu organización
          </p>
        </div>
        {canCreateProjects && (
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => navigate('/projects/import')}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Importar Excel
            </Button>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 text-sm font-medium flex items-center space-x-2 ${viewMode === 'table'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <List className="h-4 w-4" />
                <span>Tabla</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-2 text-sm font-medium flex items-center space-x-2 ${viewMode === 'cards'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <Grid3X3 className="h-4 w-4" />
                <span>Tarjetas</span>
              </button>
            </div>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('newProject')}
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar proyectos..."
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
              <option value="">Todos los Estados</option>
              <option value="ACTIVE">{t('active')}</option>
              <option value="COMPLETED">{t('completed')}</option>
              <option value="ON_HOLD">{t('onHold')}</option>
              <option value="CANCELLED">{t('cancelled')}</option>
              <option value="AWARDED">Ganado</option>
            </select>

            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Todas las Prioridades</option>
              <option value="LOW">{t('low')}</option>
              <option value="MEDIUM">{t('medium')}</option>
              <option value="HIGH">{t('high')}</option>
              <option value="URGENT">{t('urgent')}</option>
            </select>

            <select
              value={filters.areaId}
              onChange={(e) => handleFilterChange('areaId', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Todas las Áreas</option>
              {areas && areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
          </div>

          {/* Segunda fila de filtros - Excel Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
            <select
              value={filters.mentorId}
              onChange={(e) => handleFilterChange('mentorId', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Todos los Mentores</option>
              {mentors && mentors.map((mentor) => (
                <option key={mentor.id} value={mentor.id}>
                  {mentor.firstName} {mentor.lastName}
                </option>
              ))}
            </select>

            <select
              value={filters.coordinatorId}
              onChange={(e) => handleFilterChange('coordinatorId', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Todos los Coordinadores</option>
              {coordinators && coordinators.map((coordinator) => (
                <option key={coordinator.id} value={coordinator.id}>
                  {coordinator.firstName} {coordinator.lastName}
                </option>
              ))}
            </select>

            <select
              value={filters.salesManagementId}
              onChange={(e) => handleFilterChange('salesManagementId', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Todas las Gerencias</option>
              {salesManagements && salesManagements.map((management) => (
                <option key={management.id} value={management.id}>
                  {management.name}
                </option>
              ))}
            </select>

            <Input
              placeholder="Orden Siebel..."
              value={filters.siebelOrderNumber}
              onChange={(e) => handleFilterChange('siebelOrderNumber', e.target.value)}
            />

            <Button
              variant="outline"
              onClick={clearAllFilters}
              className="whitespace-nowrap"
            >
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Projects Content */}
      {viewMode === 'table' ? (
        <ResponsiveProjectsTable
          projects={projects}
          onEdit={handleEdit}
          onDelete={handleDelete}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      ) : (
        /* Projects Grid */
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
      )}

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
        <div className="flex items-center justify-between bg-white border-t border-gray-200 px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => fetchProjects({ ...filters, page: pagination.page - 1 })}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => fetchProjects({ ...filters, page: pagination.page + 1 })}
            >
              Siguiente
            </Button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando{' '}
                <span className="font-medium">
                  {((pagination.page - 1) * pagination.limit) + 1}
                </span>{' '}
                a{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                de{' '}
                <span className="font-medium">{pagination.total}</span>{' '}
                proyectos
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <label htmlFor="pageSize" className="text-sm text-gray-600">
                  Por página:
                </label>
                <select
                  id="pageSize"
                  value={pagination.limit}
                  onChange={(e) => fetchProjects({ ...filters, page: 1, limit: parseInt(e.target.value) })}
                  className="border border-gray-300 rounded-md text-sm px-2 py-1"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => fetchProjects({ ...filters, page: pagination.page - 1 })}
                  className="rounded-r-none"
                >
                  Anterior
                </Button>

                {/* Page numbers */}
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => fetchProjects({ ...filters, page: pageNum })}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${pagination.page === pageNum
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => fetchProjects({ ...filters, page: pagination.page + 1 })}
                  className="rounded-l-none"
                >
                  Siguiente
                </Button>
              </nav>
            </div>
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