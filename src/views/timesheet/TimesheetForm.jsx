import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input } from '@/components/ui';
import { useTimesheets } from '@/hooks/useTimesheets';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/constants';

const TimesheetForm = ({ timesheet, onSuccess, onCancel }) => {
  const { user } = useAuth();
  const { createTimesheet, updateTimesheet, loading } = useTimesheets();
  const { projects = [] } = useProjects();
  const { tasks = [] } = useTasks();
  const [selectedProject, setSelectedProject] = useState(timesheet?.projectId || '');
  const [selectedTask, setSelectedTask] = useState(timesheet?.taskId || '');
  const [availableTasks, setAvailableTasks] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
  } = useForm({
    defaultValues: {
      date: timesheet?.date ? timesheet.date.split('T')[0] : new Date().toISOString().split('T')[0],
      startTime: timesheet?.startTime || '',
      endTime: timesheet?.endTime || '',
      hours: timesheet?.hours || '',
      description: timesheet?.description || '',
      projectId: timesheet?.projectId || '',
      taskId: timesheet?.taskId || '',
      isBreakDeducted: timesheet?.isBreakDeducted || false,
      breakDuration: timesheet?.breakDuration || 0,
    },
  });

  const watchedStartTime = watch('startTime');
  const watchedEndTime = watch('endTime');
  const watchedHours = watch('hours');

  useEffect(() => {
    if (timesheet) {
      reset({
        date: timesheet.date ? timesheet.date.split('T')[0] : new Date().toISOString().split('T')[0],
        startTime: timesheet.startTime || '',
        endTime: timesheet.endTime || '',
        hours: timesheet.hours || '',
        description: timesheet.description || '',
        projectId: timesheet.projectId || '',
        taskId: timesheet.taskId || '',
        isBreakDeducted: timesheet.isBreakDeducted || false,
        breakDuration: timesheet.breakDuration || 0,
      });
      setSelectedProject(timesheet.projectId);
      setSelectedTask(timesheet.taskId);
    }
  }, [timesheet, reset]);

  useEffect(() => {
    if (selectedProject) {
      const projectTasks = tasks.filter(task => task.projectId === selectedProject);
      setAvailableTasks(projectTasks);
    } else {
      setAvailableTasks([]);
    }
  }, [selectedProject, tasks]);

  useEffect(() => {
    if (watchedStartTime && watchedEndTime) {
      const start = new Date(`2000-01-01T${watchedStartTime}`);
      const end = new Date(`2000-01-01T${watchedEndTime}`);
      
      if (end > start) {
        const diffMs = end.getTime() - start.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        setValue('hours', diffHours.toFixed(2));
      }
    }
  }, [watchedStartTime, watchedEndTime, setValue]);

  const onSubmit = async (data) => {
    try {
      const timesheetData = {
        ...data,
        projectId: selectedProject,
        taskId: selectedTask || null,
        hours: parseFloat(data.hours),
        breakDuration: parseFloat(data.breakDuration) || 0,
        date: new Date(data.date).toISOString(),
      };

      if (timesheet) {
        await updateTimesheet(timesheet.id, timesheetData);
      } else {
        await createTimesheet(timesheetData);
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving timesheet:', error);
      // Don't close the modal on error, let user try again
      if (error.message.includes('Backend not available')) {
        alert('Backend not available. Timesheet functionality is currently disabled.');
      } else {
        alert('Error saving timesheet. Please try again.');
      }
    }
  };

  const handleProjectChange = (projectId) => {
    setSelectedProject(projectId);
    setValue('projectId', projectId);
    setSelectedTask('');
    setValue('taskId', '');
  };

  const handleTaskChange = (taskId) => {
    setSelectedTask(taskId);
    setValue('taskId', taskId);
  };

  const calculateHoursFromTime = () => {
    if (watchedStartTime && watchedEndTime) {
      const start = new Date(`2000-01-01T${watchedStartTime}`);
      const end = new Date(`2000-01-01T${watchedEndTime}`);
      
      if (end > start) {
        const diffMs = end.getTime() - start.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        setValue('hours', diffHours.toFixed(2));
      }
    }
  };

  const isAdmin = user?.role === ROLES.ADMIN;
  const isManager = user?.role === ROLES.MANAGER;

  // Managers can only log time for their projects
  const availableProjects = isAdmin 
    ? projects 
    : projects?.filter(project => project.areaId === user?.areaId);

  // Show message if no projects are available
  if (!availableProjects || availableProjects.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">No Projects Available</h3>
          <p className="text-yellow-700">
            You need to have projects available to create timesheet entries. 
            Please create some projects first or contact your administrator.
          </p>
        </div>
        <div className="flex items-center justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Input
            label="Date"
            type="date"
            required
            error={errors.date?.message}
            {...register('date', {
              required: 'Date is required',
              validate: (value) => {
                const selectedDate = new Date(value);
                const today = new Date();
                const maxDate = new Date();
                maxDate.setDate(maxDate.getDate() + 7); // Allow up to 7 days in the future
                
                if (selectedDate > maxDate) {
                  return 'Date cannot be more than 7 days in the future';
                }
                
                const minDate = new Date();
                minDate.setDate(minDate.getDate() - 30); // Allow up to 30 days in the past
                
                if (selectedDate < minDate) {
                  return 'Date cannot be more than 30 days in the past';
                }
                
                return true;
              },
            })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedProject}
            onChange={(e) => handleProjectChange(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            required
          >
            <option value="">Select a project</option>
            {availableProjects && availableProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          {!selectedProject && (
            <p className="text-sm text-red-600 mt-1">Project is required</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Task (Optional)
          </label>
          <select
            value={selectedTask}
            onChange={(e) => handleTaskChange(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!selectedProject}
          >
            <option value="">General project work</option>
            {availableTasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
          {!selectedProject && (
            <p className="text-sm text-gray-500 mt-1">Select a project first</p>
          )}
        </div>

        <div>
          <Input
            label="Hours"
            type="number"
            step="0.25"
            min="0"
            max="24"
            required
            error={errors.hours?.message}
            {...register('hours', {
              required: 'Hours are required',
              min: {
                value: 0.25,
                message: 'Minimum hours is 0.25 (15 minutes)',
              },
              max: {
                value: 24,
                message: 'Maximum hours is 24',
              },
            })}
          />
        </div>

        <div>
          <Input
            label="Start Time (Optional)"
            type="time"
            error={errors.startTime?.message}
            {...register('startTime')}
          />
        </div>

        <div>
          <Input
            label="End Time (Optional)"
            type="time"
            error={errors.endTime?.message}
            {...register('endTime', {
              validate: (value) => {
                if (value && watchedStartTime) {
                  const start = new Date(`2000-01-01T${watchedStartTime}`);
                  const end = new Date(`2000-01-01T${value}`);
                  
                  if (end <= start) {
                    return 'End time must be after start time';
                  }
                }
                return true;
              },
            })}
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isBreakDeducted"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            {...register('isBreakDeducted')}
          />
          <label htmlFor="isBreakDeducted" className="text-sm font-medium text-gray-700">
            Deduct break time
          </label>
        </div>

        <div>
          <Input
            label="Break Duration (minutes)"
            type="number"
            min="0"
            max="240"
            placeholder="e.g., 30"
            error={errors.breakDuration?.message}
            {...register('breakDuration', {
              min: {
                value: 0,
                message: 'Break duration cannot be negative',
              },
              max: {
                value: 240,
                message: 'Break duration cannot exceed 4 hours',
              },
            })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Describe the work performed..."
          {...register('description', {
            required: 'Description is required',
            minLength: {
              value: 10,
              message: 'Description must be at least 10 characters',
            },
            maxLength: {
              value: 500,
              message: 'Description must not exceed 500 characters',
            },
          })}
        />
        {errors.description && (
          <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
        )}
      </div>

      {/* Time Calculation Helper */}
      {watchedStartTime && watchedEndTime && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800">
              Calculated hours: {watchedHours || '0'} hours
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={calculateHoursFromTime}
            >
              Update Hours
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end space-x-3 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={loading}
          disabled={!selectedProject}
        >
          {timesheet ? 'Update Entry' : 'Create Entry'}
        </Button>
      </div>
    </form>
  );
};

export default TimesheetForm;