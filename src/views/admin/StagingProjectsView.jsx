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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Eye,
  Edit,
  Trash2,
  Check,
  X,
  AlertCircle,
  Clock,
  CheckCircle2,
  Send,
  Database,
  FileSpreadsheet,
  TrendingUp
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import stagingService from '@/services/stagingService';
import areaService from '@/services/areaService';

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  VALIDATED: 'bg-green-100 text-green-800',
  ERROR: 'bg-red-100 text-red-800',
  TRANSFERRED: 'bg-blue-100 text-blue-800'
};

const STATUS_ICONS = {
  PENDING: Clock,
  VALIDATED: CheckCircle2,
  ERROR: AlertCircle,
  TRANSFERRED: Send
};

export default function StagingProjectsView() {
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState([]);
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [stagingProjects, setStagingProjects] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedAreaId) {
      loadStagingProjects();
      loadStatistics();
    }
  }, [selectedAreaId, statusFilter, pagination.page]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const areasData = await areaService.getAreas();
      setAreas(areasData);

      // Seleccionar la primera área por defecto
      if (areasData.length > 0) {
        setSelectedAreaId(areasData[0].id);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Error cargando datos iniciales');
    } finally {
      setLoading(false);
    }
  };

  const loadStagingProjects = async () => {
    if (!selectedAreaId) return;

    setLoading(true);
    try {
      const result = await stagingService.getStagingProjectsByArea(
        selectedAreaId,
        statusFilter,
        pagination.page,
        pagination.limit
      );

      setStagingProjects(result.projects);
      setPagination(prev => ({
        ...prev,
        total: result.pagination.total,
        pages: result.pagination.pages
      }));
    } catch (error) {
      console.error('Error loading staging projects:', error);
      toast.error('Error cargando proyectos en staging');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    if (!selectedAreaId) return;

    try {
      const stats = await stagingService.getStagingStatistics(selectedAreaId);
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleViewProject = (project) => {
    setSelectedProject(project);
    setIsDetailDialogOpen(true);
  };

  const handleEditProject = (project) => {
    setSelectedProject(project);
    setIsEditDialogOpen(true);
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este proyecto?')) return;

    try {
      await stagingService.deleteStagingProject(projectId);
      toast.success('Proyecto eliminado exitosamente');
      loadStagingProjects();
      loadStatistics();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Error eliminando proyecto');
    }
  };

  const handleUpdateStatus = async (projectId, status, notes = null) => {
    try {
      await stagingService.updateStagingProjectStatus(projectId, status, notes);
      toast.success('Estado actualizado exitosamente');
      loadStagingProjects();
      loadStatistics();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error actualizando estado');
    }
  };

  const handleTransferToActive = async (projectId) => {
    try {
      await stagingService.transferToActive(projectId);
      toast.success('Proyecto transferido exitosamente');
      loadStagingProjects();
      loadStatistics();
    } catch (error) {
      console.error('Error transferring project:', error);
      toast.error('Error transfiriendo proyecto');
    }
  };

  const handleBatchTransfer = async () => {
    if (selectedProjects.length === 0) {
      toast.error('Selecciona al menos un proyecto');
      return;
    }

    try {
      const result = await stagingService.batchTransferToActive(selectedProjects);
      toast.success(`${result.successful} proyectos transferidos exitosamente`);

      if (result.failed > 0) {
        toast.error(`${result.failed} proyectos no pudieron ser transferidos`);
      }

      setSelectedProjects([]);
      loadStagingProjects();
      loadStatistics();
    } catch (error) {
      console.error('Error batch transferring:', error);
      toast.error('Error en transferencia masiva');
    }
  };

  const handleSelectProject = (projectId) => {
    setSelectedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleSelectAll = () => {
    const validProjects = stagingProjects
      .filter(p => p.status === 'VALIDATED')
      .map(p => p.id);

    setSelectedProjects(prev =>
      prev.length === validProjects.length ? [] : validProjects
    );
  };

  const ProjectDetailDialog = ({ project, open, onClose }) => {
    if (!project) return null;

    const StatusIcon = STATUS_ICONS[project.status];

    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <StatusIcon className="w-5 h-5" />
              <span>{project.projectName}</span>
              <Badge className={STATUS_COLORS[project.status]}>
                {project.status}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="details" className="w-full">
            <TabsList>
              <TabsTrigger value="details">Detalles</TabsTrigger>
              <TabsTrigger value="rawData">Datos Originales</TabsTrigger>
              <TabsTrigger value="validation">Validación</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cliente</Label>
                  <p className="font-medium">{project.client?.name || 'N/A'}</p>
                </div>
                <div>
                  <Label>Etapa del Proyecto</Label>
                  <p className="font-medium">{project.projectStage?.name || 'N/A'}</p>
                </div>
                <div>
                  <Label>Descripción del Servicio</Label>
                  <p className="font-medium">{project.serviceDescription || 'N/A'}</p>
                </div>
                <div>
                  <Label>Estado General</Label>
                  <p className="font-medium">{project.generalStatus || 'N/A'}</p>
                </div>
                <div>
                  <Label>TCV (MXN)</Label>
                  <p className="font-medium">
                    {project.tcvMXN ? `$${parseFloat(project.tcvMXN).toLocaleString()}` : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label>Ingreso Mensual (MXN)</Label>
                  <p className="font-medium">
                    {project.monthlyIncomeMXN ? `$${parseFloat(project.monthlyIncomeMXN).toLocaleString()}` : 'N/A'}
                  </p>
                </div>
              </div>

              {project.transferredAt && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Información de Transferencia</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Transferido el</Label>
                      <p>{new Date(project.transferredAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <Label>Proyecto Activo</Label>
                      <p>{project.transferredToProject?.internalId || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="rawData">
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold mb-2">Datos Originales del Excel</h4>
                <pre className="text-sm overflow-auto whitespace-pre-wrap">
                  {JSON.stringify(project.rawData, null, 2)}
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="validation">
              {project.validationErrors ? (
                <div className="border rounded-lg p-4 bg-red-50">
                  <h4 className="font-semibold mb-2 text-red-700">Errores de Validación</h4>
                  <pre className="text-sm text-red-600">
                    {JSON.stringify(project.validationErrors, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="border rounded-lg p-4 bg-green-50">
                  <div className="flex items-center space-x-2 text-green-700">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">Proyecto validado correctamente</span>
                  </div>
                </div>
              )}

              {project.mappingNotes && (
                <div className="border rounded-lg p-4 bg-blue-50 mt-4">
                  <h4 className="font-semibold mb-2 text-blue-700">Notas de Mapeo</h4>
                  <p className="text-blue-600">{project.mappingNotes}</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 pt-4">
            {project.status === 'VALIDATED' && (
              <Button onClick={() => {
                handleTransferToActive(project.id);
                onClose();
              }}>
                <Send className="w-4 h-4 mr-2" />
                Transferir a Activo
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const EditProjectDialog = ({ project, open, onClose }) => {
    const [formData, setFormData] = useState({
      projectName: project?.projectName || '',
      serviceDescription: project?.serviceDescription || '',
      generalStatus: project?.generalStatus || '',
      mappingNotes: project?.mappingNotes || ''
    });

    const handleSubmit = async (e) => {
      e.preventDefault();

      try {
        await stagingService.updateStagingProject(project.id, formData);
        toast.success('Proyecto actualizado exitosamente');
        onClose();
        loadStagingProjects();
      } catch (error) {
        console.error('Error updating project:', error);
        toast.error('Error actualizando proyecto');
      }
    };

    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Proyecto en Staging</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="projectName">Nombre del Proyecto</Label>
              <Input
                id="projectName"
                value={formData.projectName}
                onChange={(e) => setFormData({...formData, projectName: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="serviceDescription">Descripción del Servicio</Label>
              <Textarea
                id="serviceDescription"
                value={formData.serviceDescription}
                onChange={(e) => setFormData({...formData, serviceDescription: e.target.value})}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="generalStatus">Estado General</Label>
              <Input
                id="generalStatus"
                value={formData.generalStatus}
                onChange={(e) => setFormData({...formData, generalStatus: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="mappingNotes">Notas de Mapeo</Label>
              <Textarea
                id="mappingNotes"
                value={formData.mappingNotes}
                onChange={(e) => setFormData({...formData, mappingNotes: e.target.value})}
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">
                Guardar Cambios
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Cargando proyectos en staging...</p>
        </div>
      </div>
    );
  }

  const selectedArea = areas.find(area => area.id === selectedAreaId);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Proyectos en Staging</h1>
          <p className="text-gray-600">Revisar y gestionar proyectos importados antes de activarlos</p>
        </div>

        <div className="flex space-x-2">
          {selectedProjects.length > 0 && (
            <Button onClick={handleBatchTransfer}>
              <Send className="w-4 h-4 mr-2" />
              Transferir Seleccionados ({selectedProjects.length})
            </Button>
          )}
        </div>
      </div>

      {/* Selector de Área y Estadísticas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Área de Trabajo</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedAreaId} onValueChange={setSelectedAreaId}>
              <SelectTrigger>
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
          </CardContent>
        </Card>

        {statistics && (
          <>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Database className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total en Staging</p>
                    <p className="text-2xl font-bold">{statistics.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Listos para Transferir</p>
                    <p className="text-2xl font-bold">{statistics.validated}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="PENDING">Pendientes</SelectItem>
                <SelectItem value="VALIDATED">Validados</SelectItem>
                <SelectItem value="ERROR">Con Error</SelectItem>
                <SelectItem value="TRANSFERRED">Transferidos</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-gray-500">
              Total: {pagination.total} proyectos
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Proyectos */}
      {selectedArea && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                Proyectos en Staging - {selectedArea.name}
              </CardTitle>
              {stagingProjects.filter(p => p.status === 'VALIDATED').length > 0 && (
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  {selectedProjects.length === stagingProjects.filter(p => p.status === 'VALIDATED').length
                    ? 'Deseleccionar Todo' : 'Seleccionar Validados'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {stagingProjects.length === 0 ? (
              <div className="text-center py-8">
                <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay proyectos en staging para esta área</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedProjects.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Proyecto</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Etapa</TableHead>
                    <TableHead>TCV (MXN)</TableHead>
                    <TableHead>Fecha Import.</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stagingProjects.map(project => {
                    const StatusIcon = STATUS_ICONS[project.status];

                    return (
                      <TableRow key={project.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedProjects.includes(project.id)}
                            onCheckedChange={() => handleSelectProject(project.id)}
                            disabled={project.status !== 'VALIDATED'}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <StatusIcon className="w-4 h-4" />
                            <Badge className={STATUS_COLORS[project.status]}>
                              {project.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium max-w-xs truncate">
                          {project.projectName}
                        </TableCell>
                        <TableCell>
                          {project.client?.acronym || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {project.projectStage?.name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {project.tcvMXN
                            ? `$${parseFloat(project.tcvMXN).toLocaleString()}`
                            : 'N/A'
                          }
                        </TableCell>
                        <TableCell>
                          {new Date(project.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewProject(project)}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditProject(project)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            {project.status === 'VALIDATED' && (
                              <Button
                                size="sm"
                                onClick={() => handleTransferToActive(project.id)}
                              >
                                <Send className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteProject(project.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            {/* Paginación */}
            {pagination.pages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-gray-500">
                  Página {pagination.page} de {pagination.pages}
                </p>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.pages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <ProjectDetailDialog
        project={selectedProject}
        open={isDetailDialogOpen}
        onClose={() => setIsDetailDialogOpen(false)}
      />

      <EditProjectDialog
        project={selectedProject}
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
      />
    </div>
  );
}