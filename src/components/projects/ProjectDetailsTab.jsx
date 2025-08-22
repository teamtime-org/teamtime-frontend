import { 
  Calendar,
  User,
  MapPin,
  DollarSign,
  Clock,
  FileText,
  Building,
  Phone,
  Mail,
  Globe,
  Tag,
  AlertTriangle,
  Target,
  Briefcase
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Badge
} from '@/components/ui';
import { formatDate, formatCurrency, formatDuration } from '@/utils';

const DetailItem = ({ icon: Icon, label, value, className = "" }) => {
  if (!value && value !== 0) return null;
  
  return (
    <div className={`flex items-start space-x-3 ${className}`}>
      <Icon className="h-5 w-5 text-gray-400 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-sm text-gray-900">{value}</p>
      </div>
    </div>
  );
};

const ProjectDetailsTab = ({ project }) => {
  const excelDetails = project.excelDetails;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DetailItem 
            icon={FileText} 
            label="Description" 
            value={project.description || 'No description provided'} 
          />
          
          <div className="grid grid-cols-2 gap-4">
            <DetailItem 
              icon={Calendar} 
              label="Start Date" 
              value={formatDate(project.startDate)} 
            />
            <DetailItem 
              icon={Calendar} 
              label="End Date" 
              value={formatDate(project.endDate)} 
            />
          </div>

          <DetailItem 
            icon={Clock} 
            label="Estimated Hours" 
            value={project.estimatedHours ? formatDuration(project.estimatedHours) : 'No estimado'} 
          />

          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-500">Area</p>
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: project.area?.color }}
                />
                <span className="text-sm text-gray-900">{project.area?.name}</span>
              </div>
            </div>
          </div>

          <DetailItem 
            icon={User} 
            label="Created by" 
            value={`${project.creator?.firstName} ${project.creator?.lastName}`} 
          />
        </CardContent>
      </Card>

      {/* Excel Project Details */}
      {excelDetails && (
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {excelDetails.serviceDescription && (
              <DetailItem 
                icon={Briefcase} 
                label="Service Description" 
                value={excelDetails.serviceDescription} 
              />
            )}

            {excelDetails.generalStatus && (
              <DetailItem 
                icon={Target} 
                label="General Status" 
                value={excelDetails.generalStatus} 
              />
            )}

            {excelDetails.nextSteps && (
              <DetailItem 
                icon={AlertTriangle} 
                label="Next Steps" 
                value={excelDetails.nextSteps} 
              />
            )}

            {excelDetails.isStrategicProject && (
              <div className="flex items-center space-x-2">
                <Tag className="h-5 w-5 text-blue-500" />
                <Badge variant="info">Strategic Project</Badge>
              </div>
            )}

            {excelDetails.siebelOrderNumber && (
              <DetailItem 
                icon={FileText} 
                label="Siebel Order Number" 
                value={excelDetails.siebelOrderNumber} 
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Financial Information */}
      {excelDetails && (excelDetails.totalContractAmountMXN || excelDetails.monthlyBillingMXN || excelDetails.income) && (
        <Card>
          <CardHeader>
            <CardTitle>Financial Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {excelDetails.totalContractAmountMXN && (
              <DetailItem 
                icon={DollarSign} 
                label="Total Contract Amount (MXN)" 
                value={formatCurrency(excelDetails.totalContractAmountMXN, 'MXN')} 
              />
            )}

            {excelDetails.monthlyBillingMXN && (
              <DetailItem 
                icon={DollarSign} 
                label="Monthly Billing (MXN)" 
                value={formatCurrency(excelDetails.monthlyBillingMXN, 'MXN')} 
              />
            )}

            {excelDetails.income && (
              <DetailItem 
                icon={DollarSign} 
                label="Income" 
                value={formatCurrency(excelDetails.income, 'MXN')} 
              />
            )}

            {excelDetails.contractPeriodMonths && (
              <DetailItem 
                icon={Calendar} 
                label="Contract Period" 
                value={`${excelDetails.contractPeriodMonths} months`} 
              />
            )}

            {excelDetails.budgetControl && (
              <DetailItem 
                icon={Target} 
                label="Budget Control" 
                value={excelDetails.budgetControl} 
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Team & Contacts */}
      <Card>
        <CardHeader>
          <CardTitle>Team & Contacts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {excelDetails?.mentor && (
            <DetailItem 
              icon={User} 
              label="Mentor" 
              value={`${excelDetails.mentor.firstName} ${excelDetails.mentor.lastName}`} 
            />
          )}

          {excelDetails?.coordinator && (
            <DetailItem 
              icon={User} 
              label="Coordinator" 
              value={`${excelDetails.coordinator.firstName} ${excelDetails.coordinator.lastName}`} 
            />
          )}

          {project.assignments && project.assignments.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500 flex items-center">
                <User className="h-4 w-4 mr-1" />
                Team Members
              </p>
              <div className="space-y-1">
                {project.assignments.map((assignment) => (
                  <div key={assignment.user.id} className="text-sm text-gray-900 ml-5">
                    • {assignment.user.firstName} {assignment.user.lastName} ({assignment.user.role})
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Important Dates */}
      {excelDetails && (excelDetails.assignmentDate || excelDetails.estimatedEndDate || excelDetails.actualEndDate) && (
        <Card>
          <CardHeader>
            <CardTitle>Important Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {excelDetails.assignmentDate && (
              <DetailItem 
                icon={Calendar} 
                label="Assignment Date" 
                value={formatDate(excelDetails.assignmentDate)} 
              />
            )}

            {excelDetails.estimatedEndDate && (
              <DetailItem 
                icon={Calendar} 
                label="Estimated End Date" 
                value={formatDate(excelDetails.estimatedEndDate)} 
              />
            )}

            {excelDetails.updatedEstimatedEndDate && (
              <DetailItem 
                icon={Calendar} 
                label="Updated Estimated End Date" 
                value={formatDate(excelDetails.updatedEstimatedEndDate)} 
              />
            )}

            {excelDetails.actualEndDate && (
              <DetailItem 
                icon={Calendar} 
                label="Actual End Date" 
                value={formatDate(excelDetails.actualEndDate)} 
              />
            )}

            {excelDetails.awardDate && (
              <DetailItem 
                icon={Calendar} 
                label="Award Date" 
                value={formatDate(excelDetails.awardDate)} 
              />
            )}

            {excelDetails.designTransferDate && (
              <DetailItem 
                icon={Calendar} 
                label="Design Transfer Date" 
                value={formatDate(excelDetails.designTransferDate)} 
              />
            )}

            {excelDetails.tenderDeliveryDate && (
              <DetailItem 
                icon={Calendar} 
                label="Tender Delivery Date" 
                value={formatDate(excelDetails.tenderDeliveryDate)} 
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Additional Information */}
      {excelDetails && (excelDetails.providersInvolved || excelDetails.relatedOrders || excelDetails.justification) && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {excelDetails.providersInvolved && (
              <DetailItem 
                icon={Building} 
                label="Providers Involved" 
                value={excelDetails.providersInvolved} 
              />
            )}

            {excelDetails.relatedOrders && (
              <DetailItem 
                icon={FileText} 
                label="Related Orders (Siebel)" 
                value={excelDetails.relatedOrders} 
              />
            )}

            {excelDetails.orderInProgress && (
              <DetailItem 
                icon={Clock} 
                label="Order in Progress" 
                value={excelDetails.orderInProgress} 
              />
            )}

            {excelDetails.appliesChangeControl && (
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <Badge variant="warning">Change Control Applies</Badge>
              </div>
            )}

            {excelDetails.justification && (
              <DetailItem 
                icon={FileText} 
                label="Justification" 
                value={excelDetails.justification} 
              />
            )}

            {excelDetails.penalty && (
              <DetailItem 
                icon={AlertTriangle} 
                label="Penalty" 
                value={excelDetails.penalty} 
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProjectDetailsTab;