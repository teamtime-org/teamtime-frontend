import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Save,
  Send,
  Download
} from 'lucide-react';
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Loading,
  Modal,
  Input
} from '@/components/ui';
import { useWeeklyTimesheet } from '@/hooks/useTimesheets';
import { useAssignedTasks } from '@/hooks/useTasks';
import { useAssignedProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, formatDuration, getWeekRange, getWeekDays } from '@/utils';
import TimesheetForm from './TimesheetForm';

const WeeklyTimesheetView = ({ weekStart: initialWeekStart, onWeekChange, onClose }) => {
  const { user } = useAuth();
  const [weekStart, setWeekStart] = useState(initialWeekStart || new Date());
  const { projects } = useAssignedProjects();
  const { tasks } = useAssignedTasks();
  
  const { 
    timesheet, 
    timeEntries, 
    loading, 
    error, 
    addTimeEntry, 
    updateTimeEntry, 
    deleteTimeEntry,
    bulkUpdateEntries
  } = useWeeklyTimesheet(weekStart);

  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [localEntries, setLocalEntries] = useState([]);

  useEffect(() => {
    setLocalEntries(timeEntries);
  }, [timeEntries]);

  // Función para obtener los días de la semana usando las utilidades

  const navigateWeek = (direction) => {
    const newWeekStart = new Date(weekStart);
    newWeekStart.setDate(newWeekStart.getDate() + (direction * 7));
    setWeekStart(newWeekStart);
    if (onWeekChange) {
      onWeekChange(newWeekStart);
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setShowForm(true);
  };

  const handleDelete = async (entryId) => {
    try {
      await deleteTimeEntry(entryId);
    } catch (error) {
      console.error('Error deleting time entry:', error);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingEntry(null);
  };

  const getEntriesForDay = (day) => {
    const dayString = day.toISOString().split('T')[0];
    return localEntries.filter(entry => {
      const entryDate = new Date(entry.date).toISOString().split('T')[0];
      return entryDate === dayString;
    });
  };

  const getDayTotal = (day) => {
    const dayEntries = getEntriesForDay(day);
    return dayEntries.reduce((total, entry) => total + (entry.hours || 0), 0);
  };

  const getWeekTotal = () => {
    return localEntries.reduce((total, entry) => total + (entry.hours || 0), 0);
  };

  const handleQuickAdd = (day) => {
    setEditingEntry({
      date: day.toISOString().split('T')[0],
      hours: 8, // Default 8 hours
      description: '',
      projectId: '',
      taskId: '',
    });
    setShowForm(true);
  };

  const handleInlineEdit = (entryId, field, value) => {
    setLocalEntries(prev => prev.map(entry => 
      entry.id === entryId ? { ...entry, [field]: value } : entry
    ));
  };

  const handleSaveBulk = async () => {
    try {
      const changedEntries = localEntries.filter(entry => {
        const original = timeEntries.find(te => te.id === entry.id);
        return JSON.stringify(entry) !== JSON.stringify(original);
      });
      
      if (changedEntries.length > 0) {
        await bulkUpdateEntries(changedEntries);
      }
      
      setEditMode(false);
    } catch (error) {
      console.error('Error saving bulk updates:', error);
    }
  };

  const weekDays = getWeekDays(weekStart);
  const weekTotal = getWeekTotal();

  if (loading && timeEntries.length === 0) {
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
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateWeek(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Week of {formatDate(weekStart)}
            </h2>
            <p className="text-sm text-gray-600">
              {formatDate(weekStart)} - {formatDate(weekDays[6])}
            </p>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateWeek(1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="text-right mr-4">
            <div className="text-sm text-gray-600">Total Hours</div>
            <div className="text-lg font-bold text-gray-900">
              {formatDuration(weekTotal)}
            </div>
          </div>

          {editMode ? (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setLocalEntries(timeEntries);
                  setEditMode(false);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveBulk}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setEditMode(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Mode
              </Button>
              
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Weekly Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Time Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4 font-medium text-gray-900">Day</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-900">Date</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-900">Project</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-900">Task</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-900">Hours</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-900">Description</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {weekDays.map((day, dayIndex) => {
                  const dayEntries = getEntriesForDay(day);
                  const dayTotal = getDayTotal(day);
                  const isToday = day.toDateString() === new Date().toDateString();
                  
                  if (dayEntries.length === 0) {
                    return (
                      <tr key={dayIndex} className={`border-b ${isToday ? 'bg-blue-50' : ''}`}>
                        <td className="py-3 px-4 font-medium">
                          {day.toLocaleDateString('en-US', { weekday: 'short' })}
                        </td>
                        <td className="py-3 px-4">
                          {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </td>
                        <td className="py-3 px-4 text-gray-500" colSpan="4">
                          No entries
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickAdd(day)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        </td>
                      </tr>
                    );
                  }

                  return dayEntries.map((entry, entryIndex) => {
                    const project = projects?.find(p => p.id === entry.projectId);
                    const task = tasks?.find(t => t.id === entry.taskId);
                    
                    return (
                      <tr key={`${dayIndex}-${entryIndex}`} className={`border-b ${isToday ? 'bg-blue-50' : ''}`}>
                        {entryIndex === 0 && (
                          <>
                            <td className="py-3 px-4 font-medium" rowSpan={dayEntries.length}>
                              {day.toLocaleDateString('en-US', { weekday: 'short' })}
                              {dayTotal > 0 && (
                                <div className="text-xs text-gray-600">
                                  {formatDuration(dayTotal)}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4" rowSpan={dayEntries.length}>
                              {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </td>
                          </>
                        )}
                        
                        <td className="py-3 px-4">
                          {editMode ? (
                            <select
                              value={entry.projectId}
                              onChange={(e) => handleInlineEdit(entry.id, 'projectId', e.target.value)}
                              className="w-full text-sm border rounded px-2 py-1"
                            >
                              <option value="">Select Project</option>
                              {projects?.map(project => (
                                <option key={project.id} value={project.id}>
                                  {project.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-sm">{project?.name || 'No project'}</span>
                          )}
                        </td>
                        
                        <td className="py-3 px-4">
                          {editMode ? (
                            <select
                              value={entry.taskId || ''}
                              onChange={(e) => handleInlineEdit(entry.id, 'taskId', e.target.value)}
                              className="w-full text-sm border rounded px-2 py-1"
                            >
                              <option value="">General</option>
                              {tasks?.filter(t => t.projectId === entry.projectId).map(task => (
                                <option key={task.id} value={task.id}>
                                  {task.title}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-sm">{task?.title || 'General'}</span>
                          )}
                        </td>
                        
                        <td className="py-3 px-4">
                          {editMode ? (
                            <input
                              type="number"
                              step="0.25"
                              min="0"
                              max="24"
                              value={entry.hours}
                              onChange={(e) => handleInlineEdit(entry.id, 'hours', parseFloat(e.target.value))}
                              className="w-20 text-sm border rounded px-2 py-1"
                            />
                          ) : (
                            <span className="text-sm font-medium">{formatDuration(entry.hours)}</span>
                          )}
                        </td>
                        
                        <td className="py-3 px-4 max-w-xs">
                          {editMode ? (
                            <textarea
                              value={entry.description}
                              onChange={(e) => handleInlineEdit(entry.id, 'description', e.target.value)}
                              className="w-full text-sm border rounded px-2 py-1 resize-none"
                              rows="2"
                            />
                          ) : (
                            <span className="text-sm text-gray-700 line-clamp-2">
                              {entry.description}
                            </span>
                          )}
                        </td>
                        
                        <td className="py-3 px-4">
                          {!editMode && (
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(entry)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(entry.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  });
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 bg-gray-50">
                  <td className="py-3 px-4 font-bold" colSpan="4">
                    Weekly Total
                  </td>
                  <td className="py-3 px-4 font-bold">
                    {formatDuration(weekTotal)}
                  </td>
                  <td className="py-3 px-4" colSpan="2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            {timesheet?.status && (
              <span className="font-medium">
                Status: {timesheet.status.replace('_', ' ').toLowerCase()}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          {timesheet?.status === 'draft' && (
            <Button>
              <Send className="h-4 w-4 mr-2" />
              Submit for Approval
            </Button>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <Modal
          isOpen={showForm}
          onClose={handleFormClose}
          title={editingEntry?.id ? 'Edit Time Entry' : 'New Time Entry'}
          size="lg"
        >
          <TimesheetForm
            timesheet={editingEntry}
            onSuccess={handleFormClose}
            onCancel={handleFormClose}
          />
        </Modal>
      )}
    </div>
  );
};

export default WeeklyTimesheetView;