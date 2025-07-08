import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Clock, 
  Calendar, 
  User, 
  Users, 
  Flag,
  MessageSquare,
  Paperclip,
  Play,
  Pause,
  Square,
  CheckCircle,
  AlertCircle,
  Plus,
  Download,
  Upload,
  Timer,
  BarChart3
} from 'lucide-react';
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Badge,
  Loading,
  Modal,
  Input
} from '@/components/ui';
import { useTask, useTaskComments, useTaskTimeTracking } from '@/hooks/useTasks';
import { useAuth } from '@/hooks/useAuth';
import { ROLES, TASK_STATUS, TASK_PRIORITY } from '@/constants';
import { formatDate, formatDuration, formatDateTime } from '@/utils';
import TaskForm from './TaskForm';

const statusConfig = {
  [TASK_STATUS.TODO]: { 
    variant: 'secondary', 
    label: 'To Do', 
    icon: Square,
    color: 'text-gray-500' 
  },
  [TASK_STATUS.IN_PROGRESS]: { 
    variant: 'primary', 
    label: 'In Progress', 
    icon: Play,
    color: 'text-blue-500' 
  },
  [TASK_STATUS.REVIEW]: { 
    variant: 'warning', 
    label: 'Review', 
    icon: AlertCircle,
    color: 'text-yellow-500' 
  },
  [TASK_STATUS.DONE]: { 
    variant: 'success', 
    label: 'Done', 
    icon: CheckCircle,
    color: 'text-green-500' 
  },
};

const priorityConfig = {
  [TASK_PRIORITY.LOW]: { variant: 'secondary', label: 'Low', color: 'text-gray-600' },
  [TASK_PRIORITY.MEDIUM]: { variant: 'primary', label: 'Medium', color: 'text-blue-600' },
  [TASK_PRIORITY.HIGH]: { variant: 'warning', label: 'High', color: 'text-yellow-600' },
  [TASK_PRIORITY.URGENT]: { variant: 'danger', label: 'Urgent', color: 'text-red-600' },
};

const TaskDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { task, loading, error, fetchTask } = useTask(id);
  const { comments, addComment, deleteComment } = useTaskComments(id);
  const { timeEntries, currentEntry, startTimer, stopTimer, addTimeEntry } = useTaskTimeTracking(id);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [timeData, setTimeData] = useState({ hours: '', description: '' });

  const isAdmin = user?.role === ROLES.ADMIN;
  const isManager = user?.role === ROLES.MANAGER;
  const canEdit = isAdmin || isManager || task?.assignedToId === user?.id;

  useEffect(() => {
    if (id) {
      fetchTask();
    }
  }, [id, fetchTask]);

  const handleDelete = async () => {
    try {
      // Implementation for task deletion
      navigate('/tasks');
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    try {
      await addComment(newComment);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleStartTimer = async () => {
    try {
      await startTimer();
    } catch (error) {
      console.error('Error starting timer:', error);
    }
  };

  const handleStopTimer = async () => {
    try {
      await stopTimer();
    } catch (error) {
      console.error('Error stopping timer:', error);
    }
  };

  const handleAddManualTime = async (e) => {
    e.preventDefault();
    if (!timeData.hours) return;
    
    try {
      await addTimeEntry({
        hours: parseFloat(timeData.hours),
        description: timeData.description,
        date: new Date().toISOString(),
      });
      setTimeData({ hours: '', description: '' });
      setShowTimeModal(false);
    } catch (error) {
      console.error('Error adding time entry:', error);
    }
  };

  const calculateProgress = () => {
    if (!task?.estimatedHours || task.estimatedHours === 0) return 0;
    const totalLogged = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
    return Math.min(Math.round((totalLogged / task.estimatedHours) * 100), 100);
  };

  const isOverdue = () => {
    if (!task?.dueDate) return false;
    return new Date(task.dueDate) < new Date() && task.status !== TASK_STATUS.DONE;
  };

  const getStatusIcon = (status) => {
    const config = statusConfig[status];
    const Icon = config?.icon || Square;
    return <Icon className={`h-5 w-5 ${config?.color}`} />;
  };

  const getPriorityIcon = (priority) => {
    const config = priorityConfig[priority];
    return <Flag className={`h-4 w-4 ${config?.color}`} />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading size="lg" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Task not found</h3>
        <p className="text-gray-600 mb-4">
          The task you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Button onClick={() => navigate('/tasks')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tasks
        </Button>
      </div>
    );
  }

  const overdue = isOverdue();
  const progress = calculateProgress();
  const totalLoggedHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/tasks')}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center space-x-3">
              {getStatusIcon(task.status)}
              <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
            </div>
            <div className="flex items-center space-x-4 mt-2">
              <Badge variant={priorityConfig[task.priority]?.variant}>
                {priorityConfig[task.priority]?.label}
              </Badge>
              <Badge variant={statusConfig[task.status]?.variant}>
                {statusConfig[task.status]?.label}
              </Badge>
              {overdue && (
                <Badge variant="danger">Overdue</Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Timer Controls */}
          {canEdit && (
            <div className="flex items-center space-x-2">
              {currentEntry ? (
                <Button
                  variant="outline"
                  onClick={handleStopTimer}
                  className="flex items-center space-x-2"
                >
                  <Pause className="h-4 w-4" />
                  <span>Stop Timer</span>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleStartTimer}
                  className="flex items-center space-x-2"
                >
                  <Play className="h-4 w-4" />
                  <span>Start Timer</span>
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setShowTimeModal(true)}
                className="flex items-center space-x-2"
              >
                <Clock className="h-4 w-4" />
                <span>Add Time</span>
              </Button>
            </div>
          )}
          
          {canEdit && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(true)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Task Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="border-b">
            <nav className="flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'comments', label: 'Comments', icon: MessageSquare },
                { id: 'time', label: 'Time Tracking', icon: Timer },
                { id: 'attachments', label: 'Attachments', icon: Paperclip },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 pb-4 border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {task.description || 'No description provided.'}
                    </p>
                  </CardContent>
                </Card>

                {task.tags && task.tags.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Tags</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {task.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Add Comment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddComment} className="space-y-4">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      <Button type="submit" disabled={!newComment.trim()}>
                        Add Comment
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  {comments.map((comment) => (
                    <Card key={comment.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                {comment.user.name.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">
                                {comment.user.name}
                              </span>
                              <span className="text-gray-500 text-sm">
                                {formatDateTime(comment.createdAt)}
                              </span>
                            </div>
                            <p className="mt-1 text-gray-700 whitespace-pre-wrap">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {comments.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No comments yet. Be the first to comment!
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'time' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Time Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {formatDuration(totalLoggedHours)}
                        </div>
                        <div className="text-sm text-gray-600">Total Logged</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-600">
                          {formatDuration(task.estimatedHours)}
                        </div>
                        <div className="text-sm text-gray-600">Estimated</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {progress}%
                        </div>
                        <div className="text-sm text-gray-600">Progress</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Time Entries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {timeEntries.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium">{entry.user.name}</div>
                            <div className="text-sm text-gray-600">
                              {formatDateTime(entry.startTime)} - {formatDateTime(entry.endTime)}
                            </div>
                            {entry.description && (
                              <div className="text-sm text-gray-700 mt-1">
                                {entry.description}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatDuration(entry.hours)}</div>
                          </div>
                        </div>
                      ))}
                      
                      {timeEntries.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          No time entries yet. Start tracking your time!
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'attachments' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Upload Attachment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        Drag and drop files here, or click to select files
                      </p>
                      <Button variant="outline" className="mt-4">
                        Select Files
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Attachments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      No attachments yet. Upload files to get started!
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Task Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Task Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Project</label>
                <div className="mt-1 flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: task.project?.area?.color || '#3b82f6' }}
                  />
                  <span className="text-gray-900">{task.project?.name}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Assigned To</label>
                <div className="mt-1 flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">
                    {task.assignedTo?.name || 'Unassigned'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Priority</label>
                <div className="mt-1 flex items-center space-x-2">
                  {getPriorityIcon(task.priority)}
                  <span className="text-gray-900">
                    {priorityConfig[task.priority]?.label}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <div className="mt-1 flex items-center space-x-2">
                  {getStatusIcon(task.status)}
                  <span className="text-gray-900">
                    {statusConfig[task.status]?.label}
                  </span>
                </div>
              </div>

              {task.dueDate && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Due Date</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className={`text-gray-900 ${overdue ? 'text-red-600' : ''}`}>
                      {formatDate(task.dueDate)}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-600">Created</label>
                <div className="mt-1 text-gray-900">
                  {formatDateTime(task.createdAt)}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Updated</label>
                <div className="mt-1 text-gray-900">
                  {formatDateTime(task.updatedAt)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Card */}
          <Card>
            <CardHeader>
              <CardTitle>Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Time Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-xs text-gray-600">
                  {formatDuration(totalLoggedHours)} of {formatDuration(task.estimatedHours)} estimated
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      {showEditModal && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Task"
          size="xl"
        >
          <TaskForm
            task={task}
            onSuccess={() => {
              setShowEditModal(false);
              fetchTask();
            }}
            onCancel={() => setShowEditModal(false)}
          />
        </Modal>
      )}

      {showDeleteModal && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Task"
          footer={
            <>
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                Delete
              </Button>
            </>
          }
        >
          <p className="text-gray-600">
            Are you sure you want to delete this task? This action cannot be undone
            and will remove all associated time entries and comments.
          </p>
        </Modal>
      )}

      {showTimeModal && (
        <Modal
          isOpen={showTimeModal}
          onClose={() => setShowTimeModal(false)}
          title="Add Time Entry"
        >
          <form onSubmit={handleAddManualTime} className="space-y-4">
            <Input
              label="Hours"
              type="number"
              step="0.25"
              min="0"
              value={timeData.hours}
              onChange={(e) => setTimeData({...timeData, hours: e.target.value})}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={timeData.description}
                onChange={(e) => setTimeData({...timeData, description: e.target.value})}
                className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="What did you work on?"
              />
            </div>
            <div className="flex space-x-3">
              <Button type="button" variant="outline" onClick={() => setShowTimeModal(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Time</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default TaskDetailView;