import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input } from '@/components/ui';
import { useProjects } from '@/hooks/useProjects';
import { useAreas } from '@/hooks/useAreas';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { ROLES } from '@/constants';

const ProjectForm = ({ project, onSuccess, onCancel }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
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
            label={t('projectName')}
            required
            error={errors.name?.message}
            {...register('name', {
              required: t('projectNameRequired'),
              minLength: {
                value: 3,
                message: t('projectNameMinLength'),
              },
              maxLength: {
                value: 200,
                message: t('projectNameMaxLength'),
              },
            })}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('description')}
          </label>
          <textarea
            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder={t('enterProjectDescription')}
            {...register('description', {
              maxLength: {
                value: 1000,
                message: t('descriptionMaxLength'),
              },
            })}
          />
          {errors.description && (
            <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('area')} <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedArea}
            onChange={(e) => handleAreaChange(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            required
          >
            <option value="">{t('selectArea')}</option>
            {availableAreas && availableAreas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
          {!selectedArea && (
            <p className="text-sm text-red-600 mt-1">{t('areaRequired')}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('priority')}
          </label>
          <select
            {...register('priority')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="LOW">{t('low')}</option>
            <option value="MEDIUM">{t('medium')}</option>
            <option value="HIGH">{t('high')}</option>
            <option value="URGENT">{t('urgent')}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('status')}
          </label>
          <select
            {...register('status')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="ACTIVE">{t('active')}</option>
            <option value="COMPLETED">{t('completed')}</option>
            <option value="ON_HOLD">{t('onHold')}</option>
            <option value="CANCELLED">{t('cancelled')}</option>
          </select>
        </div>

        <div>
          <Input
            label={t('estimatedHours')}
            type="number"
            min="1"
            placeholder={t('enterEstimatedHours')}
            error={errors.estimatedHours?.message}
            {...register('estimatedHours', {
              min: {
                value: 1,
                message: t('estimatedHoursMin'),
              },
              max: {
                value: 10000,
                message: t('estimatedHoursMax'),
              },
            })}
          />
        </div>

        <div>
          <Input
            label={t('startDate')}
            type="date"
            error={errors.startDate?.message}
            {...register('startDate', {
              required: t('startDateRequired'),
            })}
          />
        </div>

        <div>
          <Input
            label={t('endDate')}
            type="date"
            error={errors.endDate?.message}
            {...register('endDate', {
              required: t('endDateRequired'),
              validate: (value) => {
                if (startDate && value && new Date(value) <= new Date(startDate)) {
                  return t('endDateAfterStart');
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
          {t('cancel')}
        </Button>
        <Button
          type="submit"
          loading={loading}
          disabled={!selectedArea}
        >
          {project ? t('updateProject') : t('createProject')}
        </Button>
      </div>
    </form>
  );
};

export default ProjectForm;