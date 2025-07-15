import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Calendar, 
  Clock, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  Play,
  Pause,
  Square,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  FileText,
  Timer,
  Edit,
  Trash2,
  Send
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
import { useTimesheets, useTimer, useTimesheetApprovals } from '@/hooks/useTimesheets';
import { useAuth } from '@/hooks/useAuth';
import { ROLES, TIMESHEET_STATUS } from '@/constants';
import { formatDate, formatDateTime, formatDuration } from '@/utils';
import TimesheetForm from './TimesheetForm';
import WeeklyTimesheetView from './WeeklyTimesheetView';
import TimerWidget from './TimerWidget';

const statusConfig = {
  [TIMESHEET_STATUS.DRAFT]: { 
    variant: 'secondary', 
    label: 'Draft', 
    icon: Edit,
    color: 'text-gray-500' 
  },
  [TIMESHEET_STATUS.SUBMITTED]: { 
    variant: 'warning', 
    label: 'Submitted', 
    icon: Send,
    color: 'text-yellow-500' 
  },
  [TIMESHEET_STATUS.APPROVED]: { 
    variant: 'success', 
    label: 'Approved', 
    icon: CheckCircle,
    color: 'text-green-500' 
  },
  [TIMESHEET_STATUS.REJECTED]: { 
    variant: 'danger', 
    label: 'Rejected', 
    icon: XCircle,
    color: 'text-red-500' 
  },
};

const TimesheetView = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentTimer } = useTimer();
  const { pendingApprovals } = useTimesheetApprovals();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('calendar'); // calendar | list | weekly
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    userId: '',
  });
  
  const { timesheets, loading, error, fetchTimesheets, submitTimesheet, deleteTimesheet } = useTimesheets(filters);
  
  const [showForm, setShowForm] = useState(false);
  const [editingTimesheet, setEditingTimesheet] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [timesheetToDelete, setTimesheetToDelete] = useState(null);
  const [showWeeklyView, setShowWeeklyView] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(null);

  const isAdmin = user?.role === ROLES.ADMIN;
  const isManager = user?.role === ROLES.MANAGER;
  const canApprove = isAdmin || isManager;

  useEffect(() => {
    fetchTimesheets();
  }, [fetchTimesheets, currentDate]);

  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const getWeekEnd = (date) => {
    const weekStart = getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return weekEnd;
  };

  const getWeekDays = (weekStart) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const handleEdit = (timesheet) => {
    setEditingTimesheet(timesheet);
    setShowForm(true);
  };

  const handleDelete = (timesheet) => {
    setTimesheetToDelete(timesheet);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteTimesheet(timesheetToDelete.id);
      setShowDeleteModal(false);
      setTimesheetToDelete(null);
    } catch (error) {
      console.error('Error deleting timesheet:', error);
    }
  };

  const handleSubmit = async (timesheetId) => {
    try {
      await submitTimesheet(timesheetId);
    } catch (error) {
      console.error('Error submitting timesheet:', error);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingTimesheet(null);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const openWeeklyView = (weekStart) => {
    setSelectedWeek(weekStart);
    setShowWeeklyView(true);
  };

  const getStatusIcon = (status) => {
    const config = statusConfig[status];
    const Icon = config?.icon || Edit;
    return <Icon className={`h-4 w-4 ${config?.color}`} />;
  };

  const calculateWeeklyHours = (weekStart) => {
    const weekEnd = getWeekEnd(weekStart);
    const weekTimesheets = timesheets.filter(timesheet => {
      const timesheetDate = new Date(timesheet.weekStart);
      return timesheetDate >= weekStart && timesheetDate <= weekEnd;
    });
    
    return weekTimesheets.reduce((total, timesheet) => total + (timesheet.totalHours || 0), 0);
  };

  const currentWeekStart = getWeekStart(currentDate);
  const currentWeekEnd = getWeekEnd(currentDate);
  const weekDays = getWeekDays(currentWeekStart);

  if (loading && timesheets.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timesheet</h1>
          <p className="text-gray-600">
            Track and manage your working hours
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Timer Widget */}
          <TimerWidget />
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => openWeeklyView(currentWeekStart)}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Weekly View
            </Button>
            
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Entry
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-600">This Week</div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatDuration(calculateWeeklyHours(currentWeekStart))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-600">This Month</div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatDuration(timesheets.reduce((total, ts) => total + (ts.totalHours || 0), 0))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {canApprove && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-yellow-500" />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-600">Pending Approvals</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {pendingApprovals.length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Timer className="h-8 w-8 text-purple-500" />
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-600">Active Timer</div>
                <div className="text-2xl font-bold text-gray-900">
                  {currentTimer ? 'Running' : 'Stopped'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'calendar' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Calendar
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'list' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode('weekly')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'weekly' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Weekly
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-3">
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">All Status</option>
            <option value={TIMESHEET_STATUS.DRAFT}>Draft</option>
            <option value={TIMESHEET_STATUS.SUBMITTED}>Submitted</option>
            <option value={TIMESHEET_STATUS.APPROVED}>Approved</option>
            <option value={TIMESHEET_STATUS.REJECTED}>Rejected</option>
          </select>

          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {error && !error.includes('Backend not available') && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {error && error.includes('Backend not available') && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-800">
            <strong>Backend not available:</strong> Some timesheet features are disabled. 
            The backend server needs to implement the timesheet API endpoints.
          </p>
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Week of {formatDate(currentWeekStart)}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateWeek(-1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateWeek(1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day, index) => {
                const dayTimesheets = timesheets.filter(timesheet => {
                  const timesheetDate = new Date(timesheet.date);
                  return timesheetDate.toDateString() === day.toDateString();
                });
                
                const dayHours = dayTimesheets.reduce((total, ts) => total + (ts.totalHours || 0), 0);
                const isToday = day.toDateString() === new Date().toDateString();
                
                return (
                  <div
                    key={index}
                    className={`p-3 border rounded-lg min-h-[120px] ${
                      isToday ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900 mb-2">
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className="text-lg font-bold text-gray-700 mb-2">
                      {day.getDate()}
                    </div>
                    
                    {dayHours > 0 && (
                      <div className="text-xs text-blue-600 font-medium">
                        {formatDuration(dayHours)}
                      </div>
                    )}
                    
                    {dayTimesheets.map(timesheet => (
                      <div
                        key={timesheet.id}
                        className="mt-1 p-1 bg-gray-100 rounded text-xs cursor-pointer hover:bg-gray-200"
                        onClick={() => navigate(`/timesheet/${timesheet.id}`)}
                      >
                        {timesheet.task?.title || 'General'}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 flex justify-center">
              <Button
                onClick={() => openWeeklyView(currentWeekStart)}
                className="w-full"
              >
                View Weekly Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {timesheets.map((timesheet) => (
            <Card key={timesheet.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(timesheet.status)}
                      <div>
                        <div className="font-medium text-gray-900">
                          Week of {formatDate(timesheet.weekStart)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatDuration(timesheet.totalHours || 0)} total
                        </div>
                      </div>
                    </div>
                    
                    <Badge variant={statusConfig[timesheet.status]?.variant}>
                      {statusConfig[timesheet.status]?.label}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {timesheet.status === TIMESHEET_STATUS.DRAFT && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(timesheet)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSubmit(timesheet.id)}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Submit
                        </Button>
                      </>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/timesheet/${timesheet.id}`)}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    
                    {timesheet.status === TIMESHEET_STATUS.DRAFT && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(timesheet)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {timesheets.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No timesheets found</h3>
              <p className="text-gray-600 mb-4">
                Start tracking your time by creating your first timesheet entry.
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Timesheet
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Weekly View */}
      {viewMode === 'weekly' && (
        <WeeklyTimesheetView
          weekStart={currentWeekStart}
          onWeekChange={setCurrentDate}
        />
      )}

      {/* Modals */}
      {showForm && (
        <Modal
          isOpen={showForm}
          onClose={handleFormClose}
          title={editingTimesheet ? 'Edit Timesheet' : 'New Timesheet Entry'}
          size="lg"
        >
          <TimesheetForm
            timesheet={editingTimesheet}
            onSuccess={handleFormClose}
            onCancel={handleFormClose}
          />
        </Modal>
      )}

      {showWeeklyView && (
        <Modal
          isOpen={showWeeklyView}
          onClose={() => setShowWeeklyView(false)}
          title={`Weekly Timesheet - ${formatDate(selectedWeek)}`}
          size="xl"
        >
          <WeeklyTimesheetView
            weekStart={selectedWeek}
            onClose={() => setShowWeeklyView(false)}
          />
        </Modal>
      )}

      {showDeleteModal && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Timesheet"
          footer={
            <>
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={confirmDelete}>
                Delete
              </Button>
            </>
          }
        >
          <p className="text-gray-600">
            Are you sure you want to delete this timesheet? This action cannot be undone
            and will remove all associated time entries.
          </p>
        </Modal>
      )}
    </div>
  );
};

export default TimesheetView;