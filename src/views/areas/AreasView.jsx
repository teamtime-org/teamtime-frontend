import { useState } from 'react';
import { Plus, Edit, Trash2, Users, FolderOpen, MoreVertical } from 'lucide-react';
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Modal,
  Badge,
  Loading
} from '@/components/ui';
import { useAreas } from '@/hooks/useAreas';
import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/constants';
import { formatDate } from '@/utils';
import AreaForm from './AreaForm';

const AreasView = () => {
  const { user } = useAuth();
  const { areas, loading, error, deleteArea } = useAreas();
  const [showForm, setShowForm] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState(null);

  const isAdmin = user?.role === ROLES.ADMIN;

  const handleEdit = (area) => {
    setEditingArea(area);
    setShowForm(true);
  };

  const handleDelete = (area) => {
    setAreaToDelete(area);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteArea(areaToDelete.id);
      setShowDeleteModal(false);
      setAreaToDelete(null);
    } catch (error) {
      console.error('Error deleting area:', error);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingArea(null);
  };

  if (loading && areas.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Areas</h1>
          <p className="text-gray-600">
            Manage organizational areas and departments
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Area
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {areas.map((area) => (
          <Card key={area.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: area.color }}
                  />
                  <CardTitle className="text-lg">{area.name}</CardTitle>
                </div>
                {isAdmin && (
                  <div className="relative">
                    <details className="relative">
                      <summary className="cursor-pointer p-1 rounded hover:bg-gray-100">
                        <MoreVertical className="h-4 w-4" />
                      </summary>
                      <div className="absolute right-0 z-10 mt-1 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
                        <button
                          onClick={() => handleEdit(area)}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(area)}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </button>
                      </div>
                    </details>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">{area.description}</p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center text-gray-500">
                    <Users className="h-4 w-4 mr-1" />
                    Users
                  </span>
                  <Badge variant="secondary">
                    {area._count?.users || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center text-gray-500">
                    <FolderOpen className="h-4 w-4 mr-1" />
                    Projects
                  </span>
                  <Badge variant="secondary">
                    {area._count?.projects || 0}
                  </Badge>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Created {formatDate(area.createdAt)}
                </p>
                {area.createdByUser && (
                  <p className="text-xs text-gray-500">
                    by {area.createdByUser.firstName} {area.createdByUser.lastName}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {areas.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <FolderOpen className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No areas found</h3>
          <p className="text-gray-600 mb-4">
            Get started by creating your first organizational area.
          </p>
          {isAdmin && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Area
            </Button>
          )}
        </div>
      )}

      {/* Area Form Modal */}
      {showForm && (
        <Modal
          isOpen={showForm}
          onClose={handleFormClose}
          title={editingArea ? 'Edit Area' : 'Create New Area'}
          size="lg"
        >
          <AreaForm
            area={editingArea}
            onSuccess={handleFormClose}
            onCancel={handleFormClose}
          />
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Area"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={confirmDelete}
                loading={loading}
              >
                Delete
              </Button>
            </>
          }
        >
          <p className="text-gray-600">
            Are you sure you want to delete the area "{areaToDelete?.name}"? 
            This action cannot be undone and will affect all users and projects 
            associated with this area.
          </p>
        </Modal>
      )}
    </div>
  );
};

export default AreasView;