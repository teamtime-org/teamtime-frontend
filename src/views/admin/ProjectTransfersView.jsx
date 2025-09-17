import { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Send,
  Check,
  X,
  Clock,
  AlertCircle,
  Eye,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Filter
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import transferService from '@/services/transferService';
import areaService from '@/services/areaService';
import projectService from '@/services/projectService';

const TRANSFER_STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-gray-100 text-gray-800'
};

const TRANSFER_STATUS_ICONS = {
  PENDING: Clock,
  APPROVED: CheckCircle2,
  REJECTED: XCircle,
  COMPLETED: Send,
  CANCELLED: AlertCircle
};

export default function ProjectTransfersView() {
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState([]);
  const [projects, setProjects] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [filters, setFilters] = useState({
    areaId: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadTransfers();
  }, [activeTab, filters]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [areasData, projectsData, stats] = await Promise.all([
        areaService.getAreas(),
        projectService.getProjects({ limit: 100 }),
        transferService.getTransferStatistics()
      ]);

      setAreas(areasData);
      setProjects(projectsData.projects || projectsData);
      setStatistics(stats);

      // Cargar aprobaciones pendientes
      loadPendingApprovals();
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Error cargando datos iniciales');
    } finally {
      setLoading(false);
    }
  };

  const loadTransfers = async () => {
    if (activeTab === 'pending') return; // Ya se cargan en loadPendingApprovals

    setLoading(true);
    try {
      let transfersData = [];

      if (activeTab === 'by-area' && filters.areaId) {
        transfersData = await transferService.getTransfersByArea(filters.areaId, 'outgoing');
      } else if (activeTab === 'all') {
        // Para 'all', necesitaríamos un endpoint general
        transfersData = [];
      }

      setTransfers(transfersData);
    } catch (error) {
      console.error('Error loading transfers:', error);
      toast.error('Error cargando transferencias');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingApprovals = async () => {
    try {
      const pendingData = await transferService.getPendingApprovals();
      setPendingApprovals(pendingData.transfers || pendingData);
    } catch (error) {
      console.error('Error loading pending approvals:', error);
    }
  };

  const handleApproveTransfer = async (transferId, approved, notes = '') => {
    try {
      await transferService.processTransferApproval(transferId, approved, notes);
      toast.success(approved ? 'Transferencia aprobada' : 'Transferencia rechazada');
      loadPendingApprovals();
      loadInitialData(); // Recargar estadísticas
    } catch (error) {
      console.error('Error processing approval:', error);
      toast.error('Error procesando aprobación');
    }
  };

  const handleCreateTransfer = () => {
    setIsTransferDialogOpen(true);
  };

  const handleViewTransfer = (transfer) => {
    setSelectedTransfer(transfer);
    setIsDetailDialogOpen(true);
  };

  const TransferDialog = ({ open, onClose }) => {
    const [formData, setFormData] = useState({
      projectId: '',
      toAreaId: '',
      notes: '',
      priority: 'NORMAL'
    });
    const [availableFlows, setAvailableFlows] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);

    useEffect(() => {
      if (selectedProject) {
        loadAvailableFlows();
      }
    }, [selectedProject]);

    const loadAvailableFlows = async () => {
      if (!selectedProject?.currentAreaId) return;

      try {
        const flows = await transferService.getAvailableNextSteps(selectedProject.currentAreaId);
        setAvailableFlows(flows);
      } catch (error) {
        console.error('Error loading available flows:', error);
      }
    };

    const handleProjectSelect = (projectId) => {
      const project = projects.find(p => p.id === projectId);
      setSelectedProject(project);
      setFormData(prev => ({ ...prev, projectId, toAreaId: '' }));
    };

    const handleSubmit = async (e) => {
      e.preventDefault();

      try {
        await transferService.transferProject(formData);
        toast.success('Transferencia iniciada exitosamente');
        onClose();
        loadPendingApprovals();
        loadInitialData();
      } catch (error) {
        console.error('Error creating transfer:', error);
        toast.error('Error creando transferencia');
      }
    };

    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Nueva Transferencia</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="projectId">Proyecto a Transferir</Label>
              <Select
                value={formData.projectId}
                onValueChange={handleProjectSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar proyecto" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center space-x-2">
                        <span>{project.name}</span>
                        <Badge variant="outline">{project.internalId}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProject && (
              <div className="p-3 bg-blue-50 rounded border">
                <p className="text-sm">
                  <span className="font-medium">Área actual:</span> {selectedProject.area?.name}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Cliente:</span> {selectedProject.client?.name}
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="toAreaId">Área de Destino</Label>
              <Select
                value={formData.toAreaId}
                onValueChange={(value) => setFormData({...formData, toAreaId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar área de destino" />
                </SelectTrigger>
                <SelectContent>
                  {availableFlows.map(flow => (
                    <SelectItem key={flow.toArea.id} value={flow.toArea.id}>
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: flow.toArea.color }}
                        ></div>
                        <span>{flow.toArea.name}</span>
                        <Badge variant={flow.isRequired ? "default" : "secondary"} className="text-xs">
                          {flow.isRequired ? 'Requerido' : 'Opcional'}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Prioridad</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({...formData, priority: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Baja</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="HIGH">Alta</SelectItem>
                  <SelectItem value="URGENT">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notas de Transferencia</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Notas opcionales sobre la transferencia..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">
                Crear Transferencia
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  const TransferDetailDialog = ({ transfer, open, onClose }) => {
    if (!transfer) return null;

    const StatusIcon = TRANSFER_STATUS_ICONS[transfer.status] || Clock;

    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <StatusIcon className="w-5 h-5" />
              <span>Transferencia - {transfer.project?.name}</span>
              <Badge className={TRANSFER_STATUS_COLORS[transfer.status]}>
                {transfer.status}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Proyecto</Label>
                <p className="font-medium">{transfer.project?.name}</p>
                <p className="text-sm text-gray-500">{transfer.project?.internalId}</p>
              </div>
              <div>
                <Label>Cliente</Label>
                <p className="font-medium">{transfer.project?.client?.name}</p>
              </div>
              <div>
                <Label>Área de Origen</Label>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: transfer.fromArea?.color }}
                  ></div>
                  <span>{transfer.fromArea?.name}</span>
                </div>
              </div>
              <div>
                <Label>Área de Destino</Label>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: transfer.toArea?.color }}
                  ></div>
                  <span>{transfer.toArea?.name}</span>
                </div>
              </div>
              <div>
                <Label>Solicitado por</Label>
                <p className="font-medium">{transfer.requestedBy?.firstName} {transfer.requestedBy?.lastName}</p>
              </div>
              <div>
                <Label>Fecha de Solicitud</Label>
                <p>{new Date(transfer.requestedAt).toLocaleString()}</p>
              </div>
            </div>

            {transfer.notes && (
              <div>
                <Label>Notas de Transferencia</Label>
                <p className="p-3 bg-gray-50 rounded border">{transfer.notes}</p>
              </div>
            )}

            {transfer.approvalNotes && (
              <div>
                <Label>Notas de Aprobación</Label>
                <p className="p-3 bg-blue-50 rounded border">{transfer.approvalNotes}</p>
              </div>
            )}

            {transfer.status === 'PENDING' && (
              <div className="flex space-x-2 pt-4">
                <Button
                  onClick={() => {
                    handleApproveTransfer(transfer.id, false);
                    onClose();
                  }}
                  variant="outline"
                  className="text-red-600 hover:bg-red-50"
                >
                  <X className="w-4 h-4 mr-2" />
                  Rechazar
                </Button>
                <Button
                  onClick={() => {
                    handleApproveTransfer(transfer.id, true);
                    onClose();
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Aprobar
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const ApprovalDialog = ({ transfer, open, onClose }) => {
    const [notes, setNotes] = useState('');
    const [decision, setDecision] = useState(null);

    const handleSubmit = () => {
      if (decision !== null) {
        handleApproveTransfer(transfer.id, decision, notes);
        onClose();
      }
    };

    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprobar Transferencia</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded">
              <h4 className="font-medium mb-2">Detalles de la Transferencia</h4>
              <p><span className="font-medium">Proyecto:</span> {transfer?.project?.name}</p>
              <p><span className="font-medium">De:</span> {transfer?.fromArea?.name}</p>
              <p><span className="font-medium">Hacia:</span> {transfer?.toArea?.name}</p>
            </div>

            <div>
              <Label htmlFor="approval-notes">Notas de Aprobación</Label>
              <Textarea
                id="approval-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Comentarios sobre la decisión..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDecision(false);
                  handleSubmit();
                }}
                className="text-red-600 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-2" />
                Rechazar
              </Button>
              <Button
                onClick={() => {
                  setDecision(true);
                  handleSubmit();
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4 mr-2" />
                Aprobar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Cargando transferencias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Transferencias</h1>
          <p className="text-gray-600">Gestiona las transferencias de proyectos entre áreas</p>
        </div>

        <Button onClick={handleCreateTransfer}>
          <Send className="w-4 h-4 mr-2" />
          Nueva Transferencia
        </Button>
      </div>

      {/* Estadísticas */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Send className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Transferencias</p>
                  <p className="text-2xl font-bold">{statistics.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold">{statistics.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Aprobadas</p>
                  <p className="text-2xl font-bold">{statistics.approved}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Este Mes</p>
                  <p className="text-2xl font-bold">{statistics.thisMonth}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="pending">
                Pendientes de Aprobación ({pendingApprovals.length})
              </TabsTrigger>
              <TabsTrigger value="by-area">Por Área</TabsTrigger>
              <TabsTrigger value="all">Todas las Transferencias</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {pendingApprovals.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay transferencias pendientes de aprobación</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proyecto</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Transferencia</TableHead>
                      <TableHead>Solicitado por</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingApprovals.map(transfer => (
                      <TableRow key={transfer.id}>
                        <TableCell className="font-medium">
                          <div>
                            <p>{transfer.project?.name}</p>
                            <p className="text-sm text-gray-500">{transfer.project?.internalId}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {transfer.project?.client?.acronym}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: transfer.fromArea?.color }}
                            ></div>
                            <span className="text-sm">{transfer.fromArea?.name}</span>
                            <ArrowRight className="w-3 h-3" />
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: transfer.toArea?.color }}
                            ></div>
                            <span className="text-sm">{transfer.toArea?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {transfer.requestedBy?.firstName} {transfer.requestedBy?.lastName}
                        </TableCell>
                        <TableCell>
                          {new Date(transfer.requestedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewTransfer(transfer)}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApproveTransfer(transfer.id, false)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApproveTransfer(transfer.id, true)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="by-area" className="space-y-4">
              <div className="flex items-center space-x-4">
                <Select
                  value={filters.areaId}
                  onValueChange={(value) => setFilters({...filters, areaId: value})}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Seleccionar área" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map(area => (
                      <SelectItem key={area.id} value={area.id}>
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: area.color }}
                          ></div>
                          <span>{area.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {transfers.length === 0 ? (
                <div className="text-center py-8">
                  <Send className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {filters.areaId
                      ? 'No hay transferencias para el área seleccionada'
                      : 'Selecciona un área para ver las transferencias'
                    }
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Estado</TableHead>
                      <TableHead>Proyecto</TableHead>
                      <TableHead>Hacia</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transfers.map(transfer => {
                      const StatusIcon = TRANSFER_STATUS_ICONS[transfer.status];

                      return (
                        <TableRow key={transfer.id}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <StatusIcon className="w-4 h-4" />
                              <Badge className={TRANSFER_STATUS_COLORS[transfer.status]}>
                                {transfer.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {transfer.project?.name}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: transfer.toArea?.color }}
                              ></div>
                              <span>{transfer.toArea?.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(transfer.requestedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewTransfer(transfer)}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="all">
              <div className="text-center py-8">
                <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Vista de todas las transferencias</p>
                <p className="text-sm text-gray-400">Esta funcionalidad estará disponible próximamente</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <TransferDialog
        open={isTransferDialogOpen}
        onClose={() => setIsTransferDialogOpen(false)}
      />

      <TransferDetailDialog
        transfer={selectedTransfer}
        open={isDetailDialogOpen}
        onClose={() => setIsDetailDialogOpen(false)}
      />
    </div>
  );
}