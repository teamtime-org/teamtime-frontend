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
  const [selectedAssignee, setSelectedAssignee] = useState(task?.assignedToId || '');

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
      assignedToId: task?.assignedToId || '',
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
        assignedToId: task.assignedToId,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        estimatedHours: task.estimatedHours,
        tags: task.tags ? task.tags.join(', ') : '',
      });
      setSelectedProject(task.projectId);
      setSelectedAssignee(task.assignedToId);
    }
  }, [task, reset]);

  const onSubmit = async (data) => {
    try {
      const taskData = {
        ...data,
        projectId: selectedProject,
        assignedToId: selectedAssignee || null,
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
          <select
            value={selectedAssignee}
            onChange={(e) => handleAssigneeChange(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!selectedProject}
          >
            <option value="">Unassigned</option>
            {availableAssignees.map((assignment) => (
              <option key={assignment.user.id} value={assignment.user.id}>
                {assignment.user.name}
              </option>
            ))}
          </select>
          {!selectedProject && (
            <p className="text-sm text-gray-500 mt-1">Select a project first</p>
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
            error={errors.dueDate?.message}
            {...register('dueDate', {
              validate: (value) => {
                if (value && selectedProjectData) {
                  const dueDate = new Date(value);
                  const projectEndDate = new Date(selectedProjectData.endDate);
                  
                  if (dueDate > projectEndDate) {
                    return 'Due date cannot be after project end date';
                  }
                }
                return true;
              },
            })}
          />
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