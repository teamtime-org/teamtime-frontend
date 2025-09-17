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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  Download,
  Upload,
  TestTube,
  ArrowUp,
  ArrowDown,
  Settings
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import fieldMappingService from '@/services/fieldMappingService';
import areaService from '@/services/areaService';

export default function FieldMappingsView() {
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState([]);
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [mappings, setMappings] = useState([]);
  const [transformations, setTransformations] = useState([]);
  const [validationRules, setValidationRules] = useState([]);
  const [selectedMapping, setSelectedMapping] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedAreaId) {
      loadMappings();
    }
  }, [selectedAreaId]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [areasData, transformationsData, validationRulesData] = await Promise.all([
        areaService.getAreas(),
        fieldMappingService.getAvailableTransformations(),
        fieldMappingService.getAvailableValidationRules()
      ]);

      setAreas(Array.isArray(areasData) ? areasData : []);
      setTransformations(transformationsData);
      setValidationRules(validationRulesData);

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

  const loadMappings = async () => {
    if (!selectedAreaId) return;

    setLoading(true);
    try {
      const mappingsData = await fieldMappingService.getFieldMappings(selectedAreaId);
      setMappings(mappingsData);
    } catch (error) {
      console.error('Error loading mappings:', error);
      toast.error('Error cargando mapeos de campos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMapping = () => {
    setSelectedMapping(null);
    setIsDialogOpen(true);
  };

  const handleEditMapping = (mapping) => {
    setSelectedMapping(mapping);
    setIsDialogOpen(true);
  };

  const handleDeleteMapping = async (mappingId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este mapeo?')) return;

    try {
      await fieldMappingService.deleteFieldMapping(mappingId);
      toast.success('Mapeo eliminado exitosamente');
      loadMappings();
    } catch (error) {
      console.error('Error deleting mapping:', error);
      toast.error('Error eliminando mapeo');
    }
  };

  const handleCloneMappings = async (targetAreaId) => {
    if (!selectedAreaId || !targetAreaId) return;

    try {
      await fieldMappingService.cloneMappings(selectedAreaId, targetAreaId);
      toast.success('Mapeos clonados exitosamente');
    } catch (error) {
      console.error('Error cloning mappings:', error);
      toast.error('Error clonando mapeos');
    }
  };

  const handleExportMappings = async () => {
    if (!selectedAreaId) return;

    try {
      const exportData = await fieldMappingService.exportMappings(selectedAreaId);

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `field-mappings-${selectedAreaId}.json`;
      a.click();

      URL.revokeObjectURL(url);
      toast.success('Mapeos exportados exitosamente');
    } catch (error) {
      console.error('Error exporting mappings:', error);
      toast.error('Error exportando mapeos');
    }
  };

  const MappingDialog = ({ mapping, open, onClose }) => {
    const [formData, setFormData] = useState({
      sourceAreaId: selectedAreaId,
      sourceField: mapping?.sourceField || '',
      targetField: mapping?.targetField || '',
      targetTable: mapping?.targetTable || 'staging_projects',
      description: mapping?.description || '',
      isRequired: mapping?.isRequired || false,
      transformation: mapping?.transformation || '',
      validationRule: mapping?.validationRule || '',
      defaultValue: mapping?.defaultValue || '',
      orderIndex: mapping?.orderIndex || mappings.length + 1
    });

    const handleSubmit = async (e) => {
      e.preventDefault();

      try {
        if (mapping) {
          await fieldMappingService.updateFieldMapping(mapping.id, formData);
          toast.success('Mapeo actualizado exitosamente');
        } else {
          await fieldMappingService.createFieldMapping(formData);
          toast.success('Mapeo creado exitosamente');
        }

        onClose();
        loadMappings();
      } catch (error) {
        console.error('Error saving mapping:', error);
        toast.error('Error guardando mapeo');
      }
    };

    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {mapping ? 'Editar Mapeo' : 'Crear Nuevo Mapeo'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sourceField">Campo de Origen (Excel)</Label>
                <Input
                  id="sourceField"
                  value={formData.sourceField}
                  onChange={(e) => setFormData({...formData, sourceField: e.target.value})}
                  placeholder="Ej: Cliente"
                  required
                />
              </div>

              <div>
                <Label htmlFor="targetField">Campo de Destino (BD)</Label>
                <Input
                  id="targetField"
                  value={formData.targetField}
                  onChange={(e) => setFormData({...formData, targetField: e.target.value})}
                  placeholder="Ej: projectName"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Descripción del mapeo"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="transformation">Transformación</Label>
                <Select
                  value={formData.transformation || undefined}
                  onValueChange={(value) => setFormData({...formData, transformation: value || ''})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin transformación" />
                  </SelectTrigger>
                  <SelectContent>
                    {transformations.map(transform => (
                      <SelectItem key={transform.code} value={transform.code}>
                        {transform.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="validationRule">Regla de Validación</Label>
                <Select
                  value={formData.validationRule || undefined}
                  onValueChange={(value) => setFormData({...formData, validationRule: value || ''})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin validación" />
                  </SelectTrigger>
                  <SelectContent>
                    {validationRules.map(rule => (
                      <SelectItem key={rule.code} value={rule.code}>
                        {rule.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="defaultValue">Valor por Defecto</Label>
                <Input
                  id="defaultValue"
                  value={formData.defaultValue}
                  onChange={(e) => setFormData({...formData, defaultValue: e.target.value})}
                  placeholder="Valor opcional por defecto"
                />
              </div>

              <div>
                <Label htmlFor="orderIndex">Orden</Label>
                <Input
                  id="orderIndex"
                  type="number"
                  value={formData.orderIndex}
                  onChange={(e) => setFormData({...formData, orderIndex: parseInt(e.target.value)})}
                  min="1"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isRequired"
                checked={formData.isRequired}
                onCheckedChange={(checked) => setFormData({...formData, isRequired: checked})}
              />
              <Label htmlFor="isRequired">Campo Obligatorio</Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">
                {mapping ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  const TestMappingDialog = ({ open, onClose }) => {
    const [testData, setTestData] = useState('{}');
    const [testResult, setTestResult] = useState(null);
    const [testing, setTesting] = useState(false);

    const handleTest = async () => {
      if (!selectedAreaId) return;

      setTesting(true);
      try {
        const data = JSON.parse(testData);
        const result = await fieldMappingService.testMapping(selectedAreaId, data);
        setTestResult(result);
        toast.success('Prueba ejecutada exitosamente');
      } catch (error) {
        console.error('Error testing mapping:', error);
        toast.error('Error en la prueba de mapeo');
      } finally {
        setTesting(false);
      }
    };

    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Probar Mapeos de Campo</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="testData">Datos de Prueba (JSON)</Label>
              <Textarea
                id="testData"
                value={testData}
                onChange={(e) => setTestData(e.target.value)}
                placeholder='{"Cliente": "STPS", "Descripción del Requerimiento": "Internet Dedicado"}'
                rows={6}
              />
            </div>

            <Button onClick={handleTest} disabled={testing}>
              <TestTube className="w-4 h-4 mr-2" />
              {testing ? 'Ejecutando...' : 'Ejecutar Prueba'}
            </Button>

            {testResult && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold mb-2">Resultado:</h4>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}
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
          <p className="mt-2 text-sm text-gray-500">Cargando configuración de mapeos...</p>
        </div>
      </div>
    );
  }

  const selectedArea = (areas || []).find(area => area.id === selectedAreaId);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Configuración de Mapeos de Campos</h1>
          <p className="text-gray-600">Gestiona la correspondencia entre campos de Excel y base de datos</p>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setIsTestDialogOpen(true)}>
            <TestTube className="w-4 h-4 mr-2" />
            Probar
          </Button>
          <Button variant="outline" onClick={handleExportMappings}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={handleCreateMapping}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Mapeo
          </Button>
        </div>
      </div>

      {/* Selector de Área */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Área</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Select value={selectedAreaId} onValueChange={setSelectedAreaId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Seleccionar área" />
              </SelectTrigger>
              <SelectContent>
                {(areas || []).map(area => (
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

            {selectedAreaId && (
              <div className="flex space-x-2">
                <Select onValueChange={handleCloneMappings}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Clonar a otra área..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(areas || []).filter(area => area.id !== selectedAreaId).map(area => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mapeos de Campo */}
      {selectedArea && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                Mapeos para {selectedArea.name}
              </CardTitle>
              <Badge variant="outline">
                {mappings.length} mapeos configurados
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {mappings.length === 0 ? (
              <div className="text-center py-8">
                <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay mapeos configurados para esta área</p>
                <Button onClick={handleCreateMapping} className="mt-4">
                  Crear Primer Mapeo
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Orden</TableHead>
                    <TableHead>Campo Origen</TableHead>
                    <TableHead>Campo Destino</TableHead>
                    <TableHead>Transformación</TableHead>
                    <TableHead>Requerido</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappings.map(mapping => (
                    <TableRow key={mapping.id}>
                      <TableCell className="font-mono">
                        {mapping.orderIndex}
                      </TableCell>
                      <TableCell className="font-medium">
                        {mapping.sourceField}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {mapping.targetField}
                      </TableCell>
                      <TableCell>
                        {mapping.transformation ? (
                          <Badge variant="secondary">
                            {transformations.find(t => t.code === mapping.transformation)?.name || mapping.transformation}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={mapping.isRequired ? "default" : "outline"}>
                          {mapping.isRequired ? 'Sí' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {mapping.description || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditMapping(mapping)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteMapping(mapping.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <MappingDialog
        mapping={selectedMapping}
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />

      <TestMappingDialog
        open={isTestDialogOpen}
        onClose={() => setIsTestDialogOpen(false)}
      />
    </div>
  );
}