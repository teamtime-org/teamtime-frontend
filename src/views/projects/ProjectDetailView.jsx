import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Calendar,
  Users,
  Clock,
  BarChart3,
  Settings,
  Plus,
  CheckCircle,
  Circle,
  User,
  MapPin,
  Edit
} from 'lucide-react';
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Badge,
  Loading,
  Modal
} from '@/components/ui';
import { useProject } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/constants';
import { formatDate, formatDuration, getInitials } from '@/utils';
import ProjectAssignments from './ProjectAssignments';
import ProjectStatistics from './ProjectStatistics';

const statusConfig = {
  ACTIVE: { variant: 'success', label: 'Active' },
  COMPLETED: { variant: 'default', label: 'Completed' },
  ON_HOLD: { variant: 'warning', label: 'On Hold' },
  CANCELLED: { variant: 'danger', label: 'Cancelled' },
};

const priorityConfig = {
  LOW: { variant: 'secondary', label: 'Low' },
  MEDIUM: { variant: 'default', label: 'Medium' },
  HIGH: { variant: 'warning', label: 'High' },
  URGENT: { variant: 'danger', label: 'Urgent' },
};

const ProjectDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { project, loading, error } = useProject(id);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [showAssignments, setShowAssignments] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);

  const isAdmin = user?.role === ROLES.ADMIN;
  const isManager = user?.role === ROLES.MANAGER;
  const canManageProject = isAdmin || (isManager && user?.areaId === project?.areaId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading size="lg" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Project not found</h3>
        <p className="text-gray-600 mb-4">
          The project you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Button onClick={() => navigate('/projects')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
      </div>
    );
  }

  const calculateProgress = () => {
    if (!project._count?.tasks || project._count.tasks === 0) return 0;
    const completedTasks = project._count.completedTasks || 0;
    return Math.round((completedTasks / project._count.tasks) * 100);
  };

  const progress = calculateProgress();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/projects')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant={priorityConfig[project.priority]?.variant}>
                {priorityConfig[project.priority]?.label}
              </Badge>
              <Badge variant={statusConfig[project.status]?.variant}>
                {statusConfig[project.status]?.label}
              </Badge>
            </div>
          </div>
        </div>
        
        {canManageProject && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowAssignments(true)}
            >
              <Users className="h-4 w-4 mr-2" />
              Manage Team
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowStatistics(true)}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Statistics
            </Button>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit Project
            </Button>
          </div>
        )}
      </div>

      {/* Project Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Progress</p>
                <p className="text-2xl font-bold text-gray-900">{progress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Team Members</p>
                <p className="text-2xl font-bold text-gray-900">{project.assignments?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-100">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tasks</p>
                <p className="text-2xl font-bold text-gray-900">
                  {project._count?.completedTasks || 0}/{project._count?.tasks || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-orange-100">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Est. Hours</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatDuration(project.estimatedHours)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Project Progress</h3>
            <span className="text-sm text-gray-600">{progress}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>{project._count?.completedTasks || 0} completed</span>
            <span>{(project._count?.tasks || 0) - (project._count?.completedTasks || 0)} remaining</span>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Circle },
            { id: 'tasks', label: 'Tasks', icon: CheckCircle },
            { id: 'team', label: 'Team', icon: Users },
            { id: 'timeline', label: 'Timeline', icon: Calendar },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-600">{project.description || 'No description provided.'}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Start Date</h4>
                    <p className="text-gray-600">{formatDate(project.startDate)}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">End Date</h4>
                    <p className="text-gray-600">{formatDate(project.endDate)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: project.area?.color }}
                  />
                  <span className="text-gray-600">{project.area?.name}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">
                    Created by {project.creator?.firstName} {project.creator?.lastName}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {project.assignments?.length > 0 ? (
                    project.assignments.map((assignment) => (
                      <div key={assignment.user.id} className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {getInitials(`${assignment.user.firstName} ${assignment.user.lastName}`)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {assignment.user.firstName} {assignment.user.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{assignment.user.role}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No team members assigned yet.</p>
                  )}
                </div>
                
                {canManageProject && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => setShowAssignments(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Manage Team
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'tasks' && (
          <Card>
            <CardHeader>
              <CardTitle>Project Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-500">Task management will be implemented in the next phase.</p>
                <p className="text-sm text-gray-400 mt-2">
                  Currently showing {project._count?.tasks || 0} tasks for this project.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'team' && (
          <Card>
            <CardHeader>
              <CardTitle>Team Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {project.assignments?.map((assignment) => (
                  <div key={assignment.user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {getInitials(`${assignment.user.firstName} ${assignment.user.lastName}`)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {assignment.user.firstName} {assignment.user.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{assignment.user.role}</p>
                      </div>
                    </div>
                    
                    {canManageProject && (
                      <Button variant="outline" size="sm">
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
                
                {project.assignments?.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No team members assigned to this project.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'timeline' && (
          <Card>
            <CardHeader>
              <CardTitle>Project Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Project Started</p>
                    <p className="text-sm text-gray-500">{formatDate(project.startDate)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Current Progress</p>
                    <p className="text-sm text-gray-500">{progress}% completed</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  <div>
                    <p className="font-medium">Expected Completion</p>
                    <p className="text-sm text-gray-500">{formatDate(project.endDate)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Assignment Management Modal */}
      {showAssignments && (
        <Modal
          isOpen={showAssignments}
          onClose={() => setShowAssignments(false)}
          title="Manage Project Team"
          size="lg"
        >
          <ProjectAssignments
            project={project}
            onClose={() => setShowAssignments(false)}
          />
        </Modal>
      )}

      {/* Statistics Modal */}
      {showStatistics && (
        <Modal
          isOpen={showStatistics}
          onClose={() => setShowStatistics(false)}
          title="Project Statistics"
          size="xl"
        >
          <ProjectStatistics
            project={project}
            onClose={() => setShowStatistics(false)}
          />
        </Modal>
      )}
    </div>
  );
};

export default ProjectDetailView;