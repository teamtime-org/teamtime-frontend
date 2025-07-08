import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input } from '@/components/ui';
import { useProjects } from '@/hooks/useProjects';
import { useAreas } from '@/hooks/useAreas';
import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/constants';

const ProjectForm = ({ project, onSuccess, onCancel }) => {
  const { user } = useAuth();
  const { createProject, updateProject, loading } = useProjects();
  const { areas } = useAreas();
  const [selectedArea, setSelectedArea] = useState(project?.areaId || user?.areaId || '');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
  } = useForm({
    defaultValues: {
      name: project?.name || '',
      description: project?.description || '',
      areaId: project?.areaId || user?.areaId || '',
      priority: project?.priority || 'MEDIUM',
      status: project?.status || 'ACTIVE',
      startDate: project?.startDate ? project.startDate.split('T')[0] : '',
      endDate: project?.endDate ? project.endDate.split('T')[0] : '',
      estimatedHours: project?.estimatedHours || '',
    },
  });

  const startDate = watch('startDate');

  useEffect(() => {
    if (project) {
      reset({
        name: project.name,
        description: project.description,
        areaId: project.areaId,
        priority: project.priority,
        status: project.status,
        startDate: project.startDate ? project.startDate.split('T')[0] : '',
        endDate: project.endDate ? project.endDate.split('T')[0] : '',
        estimatedHours: project.estimatedHours,
      });
      setSelectedArea(project.areaId);
    }
  }, [project, reset]);

  const onSubmit = async (data) => {
    try {
      const projectData = {
        ...data,
        estimatedHours: parseInt(data.estimatedHours) || 0,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
        areaId: selectedArea,
      };

      if (project) {
        await updateProject(project.id, projectData);
      } else {
        await createProject(projectData);
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const handleAreaChange = (areaId) => {
    setSelectedArea(areaId);
    setValue('areaId', areaId);
  };

  const isAdmin = user?.role === ROLES.ADMIN;
  const isManager = user?.role === ROLES.MANAGER;

  // Managers can only create projects in their own area
  const availableAreas = isAdmin ? areas : areas.filter(area => area.id === user?.areaId);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Input
            label="Project Name"
            required
            error={errors.name?.message}
            {...register('name', {
              required: 'Project name is required',
              minLength: {
                value: 3,
                message: 'Project name must be at least 3 characters',
              },
              maxLength: {
                value: 200,
                message: 'Project name must not exceed 200 characters',
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
            placeholder="Enter project description..."
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
            Area <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedArea}
            onChange={(e) => handleAreaChange(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            required
          >
            <option value="">Select an area</option>
            {availableAreas && availableAreas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
          {!selectedArea && (
            <p className="text-sm text-red-600 mt-1">Area is required</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            {...register('priority')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            {...register('status')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div>
          <Input
            label="Estimated Hours"
            type="number"
            min="1"
            placeholder="Enter estimated hours"
            error={errors.estimatedHours?.message}
            {...register('estimatedHours', {
              min: {
                value: 1,
                message: 'Estimated hours must be at least 1',
              },
              max: {
                value: 10000,
                message: 'Estimated hours must not exceed 10,000',
              },
            })}
          />
        </div>

        <div>
          <Input
            label="Start Date"
            type="date"
            error={errors.startDate?.message}
            {...register('startDate', {
              required: 'Start date is required',
            })}
          />
        </div>

        <div>
          <Input
            label="End Date"
            type="date"
            error={errors.endDate?.message}
            {...register('endDate', {
              required: 'End date is required',
              validate: (value) => {
                if (startDate && value && new Date(value) <= new Date(startDate)) {
                  return 'End date must be after start date';
                }
                return true;
              },
            })}
          />
        </div>
      </div>

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
          disabled={!selectedArea}
        >
          {project ? 'Update Project' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
};

export default ProjectForm;