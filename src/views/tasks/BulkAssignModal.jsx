import { useState } from 'react';
import { UserPlus, X, Check, AlertCircle } from 'lucide-react';
import { Button, Modal, Loading } from '@/components/ui';
import { taskService } from '@/services/taskService';
import { useProjects } from '@/hooks/useProjects';

const BulkAssignModal = ({ isOpen, onClose, selectedTaskIds, onSuccess }) => {
  const { projects } = useProjects();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  // Obtener usuarios únicos de todos los proyectos
  const allUsers = projects?.reduce((acc, project) => {
    project.assignments?.forEach(assignment => {
      if (!acc.find(user => user.id === assignment.user.id)) {
        acc.push(assignment.user);
      }
    });
    return acc;
  }, []) || [];

  const handleAssign = async () => {
    if (!selectedUserId || selectedTaskIds.length === 0) {
      return;
    }

    setLoading(true);
    try {
      const response = await taskService.bulkAssignTasks(
        Array.from(selectedTaskIds),
        selectedUserId
      );
      
      setResults(response);
      
      // Si todas fueron exitosas, cerrar después de 2 segundos
      if (response.failed.length === 0) {
        setTimeout(() => {
          handleClose();
          onSuccess();
        }, 2000);
      }
    } catch (error) {
      console.error('Error en asignación múltiple:', error);
      setResults({
        successful: [],
        failed: Array.from(selectedTaskIds).map(id => ({
          taskId: id,
          error: error.message || 'Error desconocido'
        })),
        total: selectedTaskIds.length
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedUserId('');
    setResults(null);
    onClose();
  };

  const selectedUser = allUsers.find(user => user.id === selectedUserId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Asignación Múltiple de Tareas"
      size="md"
    >
      <div className="space-y-6">
        {/* Información de tareas seleccionadas */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-900">
              {selectedTaskIds.length} tarea{selectedTaskIds.length !== 1 ? 's' : ''} seleccionada{selectedTaskIds.length !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-sm text-blue-700">
            Estas tareas serán asignadas al usuario seleccionado
          </p>
        </div>

        {/* Selector de usuario */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Asignar a usuario
          </label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          >
            <option value="">Seleccionar usuario...</option>
            {allUsers.map(user => (
              <option key={user.id} value={user.id}>
                {user.firstName} {user.lastName} ({user.email})
              </option>
            ))}
          </select>
        </div>

        {/* Vista previa de la asignación */}
        {selectedUser && (
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-900">
                Vista previa de asignación
              </span>
            </div>
            <p className="text-sm text-green-700">
              {selectedTaskIds.length} tarea{selectedTaskIds.length !== 1 ? 's' : ''} será{selectedTaskIds.length !== 1 ? 'n' : ''} asignada{selectedTaskIds.length !== 1 ? 's' : ''} a{' '}
              <span className="font-medium">
                {selectedUser.firstName} {selectedUser.lastName}
              </span>
            </p>
          </div>
        )}

        {/* Resultados de la asignación */}
        {results && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Resultados de la asignación:</h4>
            
            {results.successful.length > 0 && (
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">
                    {results.successful.length} tarea{results.successful.length !== 1 ? 's' : ''} asignada{results.successful.length !== 1 ? 's' : ''} exitosamente
                  </span>
                </div>
              </div>
            )}
            
            {results.failed.length > 0 && (
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-900">
                    {results.failed.length} tarea{results.failed.length !== 1 ? 's' : ''} con errores:
                  </span>
                </div>
                <div className="space-y-1">
                  {results.failed.slice(0, 3).map((failure, index) => (
                    <p key={index} className="text-xs text-red-700">
                      • {failure.error}
                    </p>
                  ))}
                  {results.failed.length > 3 && (
                    <p className="text-xs text-red-700">
                      ... y {results.failed.length - 3} más
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            {results ? 'Cerrar' : 'Cancelar'}
          </Button>
          
          {!results && (
            <Button
              onClick={handleAssign}
              disabled={!selectedUserId || loading || selectedTaskIds.length === 0}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loading size="sm" />
                  Asignando...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Asignar Tareas
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default BulkAssignModal;