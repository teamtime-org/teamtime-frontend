import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input } from '@/components/ui';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { ROLES, TASK_STATUS, TASK_PRIORITY } from '@/constants';

const TaskForm = ({ task, onSuccess, onCancel }) => {
  const { user } = useAuth();
  const { createTask, updateTask, loading } = useTasks();
  const { projects = [] } = useProjects();
  const [selectedProject, setSelectedProject] = useState(task?.projectId || '');
  const [selectedAssignee, setSelectedAssignee] = useState(
    task?.assignedTo?.id || task?.assignedToId || ''
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
  } = useForm({
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      projectId: task?.projectId || '',
      assignedToId: task?.assignedTo?.id || task?.assignedToId || '',
      status: task?.status || TASK_STATUS.TODO,
      priority: task?.priority || TASK_PRIORITY.MEDIUM,
      dueDate: task?.dueDate ? task.dueDate.split('T')[0] : '',
      estimatedHours: task?.estimatedHours || '',
      tags: task?.tags ? task.tags.join(', ') : '',
    },
  });

  const startDate = watch('startDate');
  const selectedProjectData = projects?.find(p => p.id === selectedProject);

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description,
        projectId: task.projectId,
        assignedToId: task.assignedTo?.id || task.assignedToId || '',
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        estimatedHours: task.estimatedHours,
        tags: task.tags ? task.tags.join(', ') : '',
      });
      setSelectedProject(task.projectId);
      setSelectedAssignee(task.assignedTo?.id || task.assignedToId || '');
    }
  }, [task, reset]);

  const onSubmit = async (data) => {
    try {
      const taskData = {
        ...data,
        projectId: selectedProject,
        assignedTo: selectedAssignee || null,
        estimatedHours: parseInt(data.estimatedHours) || 0,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      };

      if (task) {
        await updateTask(task.id, taskData);
      } else {
        await createTask(taskData);
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving task:', error);
      
      // Show better error messages
      if (error.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`);
      } else if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map(err => err.message).join('\n');
        alert(`Validation errors:\n${errorMessages}`);
      } else {
        alert('Error saving task. Please check all fields and try again.');
      }
    }
  };

  const handleProjectChange = (projectId) => {
    setSelectedProject(projectId);
    setValue('projectId', projectId);
    // Reset assignee when project changes
    setSelectedAssignee('');
    setValue('assignedToId', '');
  };

  const handleAssigneeChange = (assigneeId) => {
    setSelectedAssignee(assigneeId);
    setValue('assignedToId', assigneeId);
  };

  const isAdmin = user?.role === ROLES.ADMIN;
  const isManager = user?.role === ROLES.MANAGER;

  // Managers can only create tasks in their projects
  const availableProjects = isAdmin 
    ? projects 
    : projects?.filter(project => project.areaId === user?.areaId);

  // Get available assignees based on selected project
  const availableAssignees = selectedProjectData?.assignments || [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Input
            label="Task Title"
            required
            error={errors.title?.message}
            {...register('title', {
              required: 'Task title is required',
              minLength: {
                value: 3,
                message: 'Task title must be at least 3 characters',
              },
              maxLength: {
                value: 200,
                message: 'Task title must not exceed 200 characters',
              },
            })}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Enter task description..."
            {...register('description', {
              maxLength: {
                value: 1000,
                message: 'Description must not exceed 1000 characters',
              },
            })}
          />
          {errors.description && (
            <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
          )}
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
            Assigned To
          </label>
          <div className={`border border-input rounded-md bg-background ${
            !selectedProject ? 'opacity-50 cursor-not-allowed' : ''
          }`}>
            {!selectedProject ? (
              <div className="p-3 text-sm text-gray-500">
                Select a project first to see available assignees
              </div>
            ) : availableAssignees.length === 0 ? (
              <div className="p-3 text-sm text-gray-500">
                No assignees available for this project
              </div>
            ) : (
              <div className="max-h-[200px] overflow-y-auto">
                <div className="p-1">
                  <label className="flex items-center p-2 rounded cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="assignee"
                      value=""
                      checked={selectedAssignee === ''}
                      onChange={() => handleAssigneeChange('')}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="text-sm text-gray-600">Unassigned</span>
                  </label>
                  {availableAssignees.map((assignment) => {
                    // Handle different data structures
                    const user = assignment.user || assignment;
                    const userId = user.id || assignment.userId || assignment.id;
                    const userName = user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user.name || user.fullName || `User ${userId}`;
                    const userEmail = user.email || '';
                    const userInitial = user.firstName?.charAt(0) || user.name?.charAt(0) || userName?.charAt(0) || '?';
                    
                    if (!userId) {
                      console.warn('Assignment without valid user ID:', assignment);
                      return null;
                    }
                    
                    const isSelected = selectedAssignee === userId;
                    return (
                      <label
                        key={userId}
                        className={`flex items-center p-2 rounded cursor-pointer hover:bg-gray-50 ${
                          isSelected ? 'bg-blue-50 border border-blue-200' : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name="assignee"
                          value={userId}
                          checked={isSelected}
                          onChange={() => handleAssigneeChange(userId)}
                          className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <div className="flex items-center flex-1">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                            <span className="text-sm font-medium">
                              {userInitial}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {userName}
                            </div>
                            {userEmail && (
                              <div className="text-xs text-gray-500">
                                {userEmail}
                              </div>
                            )}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          {selectedAssignee && (
            <div className="mt-2">
              {(() => {
                const assignment = availableAssignees.find(a => {
                  const user = a.user || a;
                  const userId = user.id || a.userId || a.id;
                  return userId === selectedAssignee;
                });
                if (!assignment) return null;
                
                const user = assignment.user || assignment;
                const userName = user.firstName && user.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user.name || user.fullName || `User ${selectedAssignee}`;
                
                return (
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium">Selected:</span>
                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                      {userName}
                    </span>
                  </div>
                );
              })()} 
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            {...register('status')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value={TASK_STATUS.TODO}>To Do</option>
            <option value={TASK_STATUS.IN_PROGRESS}>In Progress</option>
            <option value={TASK_STATUS.REVIEW}>Review</option>
            <option value={TASK_STATUS.DONE}>Done</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            {...register('priority')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value={TASK_PRIORITY.LOW}>Low</option>
            <option value={TASK_PRIORITY.MEDIUM}>Medium</option>
            <option value={TASK_PRIORITY.HIGH}>High</option>
            <option value={TASK_PRIORITY.URGENT}>Urgent</option>
          </select>
        </div>

        <div>
          <Input
            label="Estimated Hours"
            type="number"
            min="0"
            step="0.5"
            placeholder="Enter estimated hours"
            error={errors.estimatedHours?.message}
            {...register('estimatedHours', {
              min: {
                value: 0,
                message: 'Estimated hours must be 0 or greater',
              },
              max: {
                value: 1000,
                message: 'Estimated hours must not exceed 1,000',
              },
            })}
          />
        </div>

        <div>
          <Input
            label="Due Date"
            type="date"
            min={selectedProjectData ? new Date(Math.max(Date.now(), new Date(selectedProjectData.startDate))).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
            max={selectedProjectData ? new Date(selectedProjectData.endDate).toISOString().split('T')[0] : undefined}
            error={errors.dueDate?.message}
            {...register('dueDate', {
              validate: (value) => {
                if (value && selectedProjectData) {
                  const dueDate = new Date(value);
                  const projectStartDate = new Date(selectedProjectData.startDate);
                  const projectEndDate = new Date(selectedProjectData.endDate);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  
                  if (dueDate < today) {
                    return 'Due date cannot be in the past';
                  }
                  
                  if (dueDate < projectStartDate) {
                    return `Due date cannot be before project start (${new Date(projectStartDate).toLocaleDateString()})`;
                  }
                  
                  if (dueDate > projectEndDate) {
                    return `Due date cannot be after project end (${new Date(projectEndDate).toLocaleDateString()})`;
                  }
                }
                return true;
              },
            })}
          />
          {selectedProjectData && (
            <p className="text-sm text-gray-500 mt-1">
              Project period: {new Date(selectedProjectData.startDate).toLocaleDateString()} - {new Date(selectedProjectData.endDate).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="md:col-span-2">
          <Input
            label="Tags"
            placeholder="Enter tags separated by commas"
            error={errors.tags?.message}
            {...register('tags')}
          />
          <p className="text-sm text-gray-500 mt-1">
            Separate multiple tags with commas (e.g., bug, frontend, urgent)
          </p>
        </div>
      </div>

      {/* Task Dependencies */}
      {task && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Dependencies</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              Task dependencies will be managed in the detail view after creation.
            </p>
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
          {task ? 'Update Task' : 'Create Task'}
        </Button>
      </div>
    </form>
  );
};

export default TaskForm;