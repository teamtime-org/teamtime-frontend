import { useState } from 'react';
import { 
  Plus, 
  Filter,
  Download,
  Upload,
  FileText,
  Edit
} from 'lucide-react';
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Badge,
  Modal
} from '@/components/ui';
import { useTimesheetApprovals } from '@/hooks/useTimesheets';
import { useAuth } from '@/hooks/useAuth';
import { ROLES, TIMESHEET_STATUS } from '@/constants';
import TimesheetForm from './TimesheetForm';
import TimesheetMatrix from './TimesheetMatrix';

const statusConfig = {
  [TIMESHEET_STATUS.DRAFT]: { 
    variant: 'secondary', 
    label: 'Draft', 
    icon: Edit,
    color: 'text-gray-500' 
  },
  [TIMESHEET_STATUS.SUBMITTED]: { 
    variant: 'warning', 
    label: 'Submitted', 
    icon: FileText,
    color: 'text-yellow-500' 
  },
  [TIMESHEET_STATUS.APPROVED]: { 
    variant: 'success', 
    label: 'Approved', 
    icon: FileText,
    color: 'text-green-500' 
  },
  [TIMESHEET_STATUS.REJECTED]: { 
    variant: 'danger', 
    label: 'Rejected', 
    icon: FileText,
    color: 'text-red-500' 
  },
};

const TimesheetView = () => {
  const { user } = useAuth();
  const { pendingApprovals } = useTimesheetApprovals();
  
  const [showForm, setShowForm] = useState(false);
  const [editingTimesheet, setEditingTimesheet] = useState(null);

  const isAdmin = user?.role === ROLES.ADMIN;
  const isManager = user?.role === ROLES.MANAGER;

  const handleFormClose = () => {
    setShowForm(false);
    setEditingTimesheet(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timesheet</h1>
          <p className="text-gray-600">
            Track and manage your working hours
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Entry
            </Button>
            
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          </div>
        </div>
      </div>

      {/* Pending Approvals (for managers) */}
      {(isAdmin || isManager) && pendingApprovals.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Pending Approvals</h3>
                <p className="text-sm text-gray-600">
                  {pendingApprovals.length} timesheet{pendingApprovals.length !== 1 ? 's' : ''} waiting for approval
                </p>
              </div>
              <Badge variant="warning">
                {pendingApprovals.length}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Matrix View - Only view available */}
      <TimesheetMatrix />

      {/* Modals */}
      {showForm && (
        <Modal
          isOpen={showForm}
          onClose={handleFormClose}
          title={editingTimesheet ? 'Edit Timesheet' : 'New Timesheet Entry'}
          size="lg"
        >
          <TimesheetForm
            timesheet={editingTimesheet}
            onSuccess={handleFormClose}
            onCancel={handleFormClose}
          />
        </Modal>
      )}
    </div>
  );
};

export default TimesheetView;