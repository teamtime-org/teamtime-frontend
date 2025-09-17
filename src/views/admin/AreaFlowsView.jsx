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
  DialogTrigger,
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  GitBranch,
  Settings,
  Download,
  Upload,
  Eye
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import areaFlowService from '@/services/areaFlowService';
import areaService from '@/services/areaService';

export default function AreaFlowsView() {
  const [loading, setLoading] = useState(false);
  const [flowConfiguration, setFlowConfiguration] = useState([]);
  const [areas, setAreas] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [diagramData, setDiagramData] = useState(null);
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [flowConfig, areasData, stats, diagram] = await Promise.all([
        areaFlowService.getFlowConfiguration(),
        areaService.getAreas(),
        areaFlowService.getFlowStatistics(),
        areaFlowService.getFlowDiagram()
      ]);

      setFlowConfiguration(flowConfig);
      setAreas(Array.isArray(areasData) ? areasData : []);
      setStatistics(stats);
      setDiagramData(diagram);
    } catch (error) {
      console.error('Error loading area flows:', error);
      toast.error('Error cargando configuración de flujos');
      // Asegurar valores por defecto en caso de error
      setAreas([]);
      setFlowConfiguration([]);
      setStatistics(null);
      setDiagramData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFlow = () => {
    setSelectedFlow(null);
    setIsDialogOpen(true);
  };

  const handleEditFlow = (flow) => {
    setSelectedFlow(flow);
    setIsDialogOpen(true);
  };

  const handleDeleteFlow = async (flowId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este flujo?')) return;

    try {
      await areaFlowService.deleteAreaFlow(flowId);
      toast.success('Flujo eliminado exitosamente');
      loadData();
    } catch (error) {
      console.error('Error deleting flow:', error);
      toast.error('Error eliminando flujo');
    }
  };

  const FlowDialog = ({ flow, open, onClose }) => {
    const [formData, setFormData] = useState({
      fromAreaId: flow?.fromAreaId || '',
      toAreaId: flow?.toAreaId || '',
      flowOrder: flow?.flowOrder || 1,
      isRequired: flow?.isRequired || false,
      requiresApproval: flow?.requiresApproval || true,
      canSkip: flow?.canSkip || false,
      description: flow?.description || '',
      conditions: flow?.conditions || {}
    });

    const handleSubmit = async (e) => {
      e.preventDefault();

      try {
        if (flow) {
          await areaFlowService.updateAreaFlow(flow.id, formData);
          toast.success('Flujo actualizado exitosamente');
        } else {
          await areaFlowService.createAreaFlow(formData);
          toast.success('Flujo creado exitosamente');
        }

        onClose();
        loadData();
      } catch (error) {
        console.error('Error saving flow:', error);
        toast.error('Error guardando flujo');
      }
    };

    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {flow ? 'Editar Flujo' : 'Crear Nuevo Flujo'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fromAreaId">Área de Origen</Label>
                <Select
                  value={formData.fromAreaId}
                  onValueChange={(value) => setFormData({...formData, fromAreaId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar área" />
                  </SelectTrigger>
                  <SelectContent>
                    {(areas || []).map(area => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="toAreaId">Área de Destino</Label>
                <Select
                  value={formData.toAreaId}
                  onValueChange={(value) => setFormData({...formData, toAreaId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar área" />
                  </SelectTrigger>
                  <SelectContent>
                    {(areas || []).filter(area => area.id !== formData.fromAreaId).map(area => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Descripción del flujo"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="flowOrder">Orden de Flujo</Label>
                <Input
                  id="flowOrder"
                  type="number"
                  value={formData.flowOrder}
                  onChange={(e) => setFormData({...formData, flowOrder: parseInt(e.target.value)})}
                  min="0"
                />
              </div>

              <div className="space-y-3 pt-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isRequired"
                    checked={formData.isRequired}
                    onCheckedChange={(checked) => setFormData({...formData, isRequired: checked})}
                  />
                  <Label htmlFor="isRequired">Flujo Obligatorio</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="requiresApproval"
                    checked={formData.requiresApproval}
                    onCheckedChange={(checked) => setFormData({...formData, requiresApproval: checked})}
                  />
                  <Label htmlFor="requiresApproval">Requiere Aprobación</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="canSkip"
                    checked={formData.canSkip}
                    onCheckedChange={(checked) => setFormData({...formData, canSkip: checked})}
                  />
                  <Label htmlFor="canSkip">Se Puede Omitir</Label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">
                {flow ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  const DiagramViewer = ({ data, open, onClose }) => {
    if (!data) return null;

    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Diagrama de Flujos de Áreas</DialogTitle>
          </DialogHeader>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Áreas</h4>
              <div className="flex flex-wrap gap-2">
                {data.nodes.map(node => (
                  <Badge key={node.id} variant="outline" className="p-2">
                    {node.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Conexiones</h4>
              <div className="space-y-2">
                {data.edges.map((edge, index) => {
                  const fromNode = data.nodes.find(n => n.id === edge.from);
                  const toNode = data.nodes.find(n => n.id === edge.to);

                  return (
                    <div
                      key={index}
                      className={`p-2 rounded border-l-4 ${
                        edge.style.dashed ? 'border-l-orange-400 bg-orange-50' : 'border-l-green-400 bg-green-50'
                      }`}
                    >
                      <span className="font-medium">{fromNode?.label}</span>
                      <span className="mx-2">→</span>
                      <span className="font-medium">{toNode?.label}</span>
                      <Badge
                        variant={edge.style.dashed ? "secondary" : "default"}
                        className="ml-2"
                      >
                        {edge.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
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
          <p className="mt-2 text-sm text-gray-500">Cargando configuración de flujos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Configuración de Flujos de Áreas</h1>
          <p className="text-gray-600">Gestiona los flujos de transferencia entre áreas</p>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setIsViewerOpen(true)}>
            <Eye className="w-4 h-4 mr-2" />
            Ver Diagrama
          </Button>
          <Button onClick={handleCreateFlow}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Flujo
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <GitBranch className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Flujos</p>
                  <p className="text-2xl font-bold">{statistics.summary.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Activos</p>
                  <p className="text-2xl font-bold">{statistics.summary.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Obligatorios</p>
                  <p className="text-2xl font-bold">{statistics.summary.required}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Con Aprobación</p>
                  <p className="text-2xl font-bold">{statistics.summary.withApproval}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Configuración de Flujos */}
      <Card>
        <CardHeader>
          <CardTitle>Flujos Configurados</CardTitle>
        </CardHeader>
        <CardContent>
          {flowConfiguration.length === 0 ? (
            <div className="text-center py-8">
              <GitBranch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay flujos configurados</p>
              <Button onClick={handleCreateFlow} className="mt-4">
                Crear Primer Flujo
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {flowConfiguration.map(area => (
                <div key={area.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: area.color }}
                      ></div>
                      <h3 className="font-semibold">{area.name}</h3>
                      <Badge variant="outline">{area.code}</Badge>
                    </div>
                  </div>

                  {area.areaFlowFrom && area.areaFlowFrom.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Destino</TableHead>
                          <TableHead>Orden</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Opciones</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {area.areaFlowFrom.map(flow => (
                          <TableRow key={flow.id}>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: flow.toArea.color }}
                                ></div>
                                <span>{flow.toArea.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>{flow.flowOrder}</TableCell>
                            <TableCell>
                              <div className="flex space-x-1">
                                <Badge variant={flow.isRequired ? "default" : "secondary"}>
                                  {flow.isRequired ? 'Obligatorio' : 'Opcional'}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-1">
                                {flow.requiresApproval && (
                                  <Badge variant="outline" className="text-xs">Aprobación</Badge>
                                )}
                                {flow.canSkip && (
                                  <Badge variant="outline" className="text-xs">Omitible</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditFlow(flow)}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteFlow(flow.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-gray-500 text-sm">No hay flujos de salida configurados</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <FlowDialog
        flow={selectedFlow}
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />

      <DiagramViewer
        data={diagramData}
        open={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
      />
    </div>
  );
}