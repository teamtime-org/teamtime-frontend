import { useState, useEffect } from 'react';
import { Search, Plus, X, Check } from 'lucide-react';
import { Button, Input, Loading } from '@/components/ui';
import { useProject } from '@/hooks/useProjects';
import { getInitials } from '@/utils';

const ProjectAssignments = ({ project, onClose }) => {
  const { assignUser, unassignUser } = useProject(project.id);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [assignedUserIds, setAssignedUserIds] = useState(
    project.assignments?.map(a => a.user.id) || []
  );

  // Mock function - replace with actual API call
  const fetchAvailableUsers = async () => {
    setLoading(true);
    try {
      // This would be a real API call to get users from the same area
      // For now, we'll use mock data
      const mockUsers = [
        { id: '1', firstName: 'Ana', lastName: 'García', role: 'COLABORADOR', email: 'ana@company.com' },
        { id: '2', firstName: 'Luis', lastName: 'Martínez', role: 'COLABORADOR', email: 'luis@company.com' },
        { id: '3', firstName: 'María', lastName: 'López', role: 'COORDINADOR', email: 'maria@company.com' },
        { id: '4', firstName: 'Carlos', lastName: 'Ruiz', role: 'COLABORADOR', email: 'carlos@company.com' },
      ];
      setAvailableUsers(mockUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableUsers();
  }, []);

  const handleAssignUser = async (userId) => {
    try {
      await assignUser(userId);
      setAssignedUserIds(prev => [...prev, userId]);
    } catch (error) {
      console.error('Error assigning user:', error);
    }
  };

  const handleUnassignUser = async (userId) => {
    try {
      await unassignUser(userId);
      setAssignedUserIds(prev => prev.filter(id => id !== userId));
    } catch (error) {
      console.error('Error unassigning user:', error);
    }
  };

  const filteredUsers = availableUsers.filter(user =>
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentAssignments = project.assignments || [];
  const availableToAssign = filteredUsers.filter(user => 
    !assignedUserIds.includes(user.id)
  );

  return (
    <div className="space-y-6">
      {/* Current Team Members */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Current Team Members</h3>
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {currentAssignments.map((assignment) => (
            <div key={assignment.user.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {getInitials(`${assignment.user.firstName} ${assignment.user.lastName}`)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {assignment.user.firstName} {assignment.user.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{assignment.user.role}</p>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUnassignUser(assignment.user.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          {currentAssignments.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No team members assigned yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add New Members */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Add Team Members</h3>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Available Users */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loading />
            </div>
          ) : availableToAssign.length > 0 ? (
            availableToAssign.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {getInitials(`${user.firstName} ${user.lastName}`)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAssignUser(user.id)}
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchTerm ? 'No users found matching your search.' : 'All available users are already assigned.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button onClick={onClose}>
          <Check className="h-4 w-4 mr-2" />
          Done
        </Button>
      </div>
    </div>
  );
};

export default ProjectAssignments;