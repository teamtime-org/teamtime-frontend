import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Info } from 'lucide-react';
import { Button, Input, ProjectSearchSelect } from '@/components/ui';
import { useTasks } from '@/hooks/useTasks';
import { useAllProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { ROLES, TASK_STATUS, TASK_PRIORITY } from '@/constants';

const TaskForm = ({ task, onSuccess, onCancel }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { createTask, updateTask, loading } = useTasks();
  const { projects = [] } = useAllProjects();
  const [selectedProject, setSelectedProject] = useState(task?.projectId || '');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm({
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      projectId: task?.projectId || '',
      status: task?.status || TASK_STATUS.TODO,
      priority: task?.priority || TASK_PRIORITY.MEDIUM,
      dueDate: task?.dueDate ? task.dueDate.split('T')[0] : '',
      estimatedHours: task?.estimatedHours || '',
      tags: task?.tags ? task.tags.join(', ') : '',
    },
  });

  const selectedProjectData = projects?.find(p => p.id === selectedProject);

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description,
        projectId: task.projectId,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        estimatedHours: task.estimatedHours,
        tags: task.tags ? task.tags.join(', ') : '',
      });
      setSelectedProject(task.projectId);
      console.log('TaskForm loaded with task:', task);
    }
  }, [task]); // Solo depende de task, no de reset // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (data) => {
    try {
      // Log de depuración para verificar los datos
      console.log('User data:', user);
      console.log('Form data:', data);
      console.log('Selected project:', selectedProject);

      // Verificar que el usuario esté autenticado y tenga un ID
      if (!user || !user.id) {
        alert('Error: Usuario no autenticado. Por favor inicia sesión de nuevo.');
        return;
      }

      // Verificar que se haya seleccionado un proyecto
      if (!selectedProject) {
        alert('Error: Debe seleccionar un proyecto para crear la tarea.');
        return;
      }

      const taskData = {
        ...data,
        projectId: selectedProject,
        createdBy: user.id, // Asegurar que se incluya el ID del usuario que crea la tarea
        estimatedHours: data.estimatedHours ? parseInt(data.estimatedHours) : null,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      };

      console.log('Task data to send:', taskData);

      if (task) {
        await updateTask(task.id, taskData);
      } else {
        await createTask(taskData);
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving task:', error);
      console.error('Error details:', error.response?.data);

      // Show better error messages
      if (error.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`);
      } else if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map(err => err.message).join('\n');
        alert(`Errores de validación:\n${errorMessages}`);
      } else {
        alert('Error al guardar la tarea. Por favor verifica todos los campos e intenta de nuevo.');
      }
    }
  };

  const handleProjectChange = (projectId) => {
    setSelectedProject(projectId);
    setValue('projectId', projectId);
  };

  const isAdmin = user?.role === ROLES.ADMIN;
  const isCoordinator = user?.role === ROLES.MANAGER || user?.role === ROLES.COORDINADOR;
  const canEditAllProjects = isAdmin || isCoordinator;

  // Admins and coordinators can create tasks in any project, others only in their area projects
  const availableProjects = canEditAllProjects
    ? projects
    : projects?.filter(project => project.areaId === user?.areaId);


  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Input
            label={t('taskTitle')}
            required
            error={errors.title?.message}
            {...register('title', {
              required: t('taskTitleRequired'),
              minLength: {
                value: 3,
                message: t('taskTitleMinLength'),
              },
              maxLength: {
                value: 200,
                message: t('taskTitleMaxLength'),
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
            placeholder={t('enterTaskDescription')}
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
            {t('project')} <span className="text-red-500">*</span>
          </label>
          <ProjectSearchSelect
            projects={availableProjects || []}
            value={selectedProject}
            onChange={handleProjectChange}
            placeholder={t('selectProject') || 'Buscar proyecto...'}
            required
          />
          {!selectedProject && (
            <p className="text-sm text-red-600 mt-1">{t('projectRequired')}</p>
          )}
        </div>

        <div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center">
              <Info className="h-4 w-4 text-blue-500 mr-2" />
              <p className="text-sm text-blue-700">
                <strong>Nota:</strong> Los usuarios se asignan al proyecto completo, no a tareas individuales.
                Los colaboradores asignados al proyecto pueden trabajar en cualquier tarea.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('status')}
          </label>
          <select
            {...register('status')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value={TASK_STATUS.TODO}>{t('todo')}</option>
            <option value={TASK_STATUS.IN_PROGRESS}>{t('inProgress')}</option>
            <option value={TASK_STATUS.REVIEW}>{t('inReview')}</option>
            <option value={TASK_STATUS.DONE}>{t('done')}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('priority')}
          </label>
          <select
            {...register('priority')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value={TASK_PRIORITY.LOW}>{t('low')}</option>
            <option value={TASK_PRIORITY.MEDIUM}>{t('medium')}</option>
            <option value={TASK_PRIORITY.HIGH}>{t('high')}</option>
            <option value={TASK_PRIORITY.URGENT}>{t('urgent')}</option>
          </select>
        </div>

        <div>
          <Input
            label={`${t('estimatedHours')} (Opcional)`}
            type="number"
            min="0"
            step="0.5"
            placeholder={t('estimatedHours')}
            error={errors.estimatedHours?.message}
            {...register('estimatedHours', {
              min: {
                value: 0,
                message: 'Las horas estimadas no pueden ser negativas',
              },
              max: {
                value: 1000,
                message: t('estimatedHoursMax'),
              },
            })}
          />
        </div>

        <div>
          <Input
            label={t('dueDate')}
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
                    return t('dueDatePast');
                  }

                  if (dueDate < projectStartDate) {
                    return `${t('dueDateBeforeProject')} (${new Date(projectStartDate).toLocaleDateString()})`;
                  }

                  if (dueDate > projectEndDate) {
                    return `${t('dueDateAfterProject')} (${new Date(projectEndDate).toLocaleDateString()})`;
                  }
                }
                return true;
              },
            })}
          />
          {selectedProjectData && (
            <p className="text-sm text-gray-500 mt-1">
              {t('projectPeriod')}: {new Date(selectedProjectData.startDate).toLocaleDateString()} - {new Date(selectedProjectData.endDate).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="md:col-span-2">
          <Input
            label={t('tags')}
            placeholder={t('enterTags')}
            error={errors.tags?.message}
            {...register('tags')}
          />
          <p className="text-sm text-gray-500 mt-1">
            {t('separateTagsComma')}
          </p>
        </div>
      </div>

      {/* Task Dependencies */}
      {task && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('dependencies')}</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              {t('dependenciesManaged')}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end space-x-3 pt-6 border-t bg-white sticky bottom-0 -mx-6 px-6 -mb-6 pb-6">
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
          disabled={!selectedProject}
        >
          {task ? t('updateTask') : t('createTask')}
        </Button>
      </div>
    </form>
  );
};

export default TaskForm;