import { useState, useEffect, useRef } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  Eye,
  Settings,
  Clock,
  TrendingUp,
  Database,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import excelImportV2Service from '@/services/excelImportV2Service';
import fieldMappingService from '@/services/fieldMappingService';
import areaService from '@/services/areaService';

export default function ExcelImportV2View() {
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState([]);
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [fieldMappings, setFieldMappings] = useState([]);
  const [importHistory, setImportHistory] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [importProgress, setImportProgress] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importOptions, setImportOptions] = useState({
    skipValidation: false,
    batchSize: 100,
    startRow: 2
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedAreaId) {
      loadFieldMappings();
    }
  }, [selectedAreaId]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [areasData, historyData, statsData] = await Promise.all([
        areaService.getAreas(),
        excelImportV2Service.getImportHistory(),
        excelImportV2Service.getImportStatistics()
      ]);

      console.log('ExcelImportV2View - Areas data received:', areasData);
      console.log('ExcelImportV2View - Areas data type:', typeof areasData, Array.isArray(areasData));

      const safeAreasData = Array.isArray(areasData) ? areasData : [];
      setAreas(safeAreasData);
      setImportHistory(historyData.imports || historyData);
      setStatistics(statsData);

      console.log('ExcelImportV2View - Areas set to state:', safeAreasData);

      // Seleccionar la primera área por defecto
      if (safeAreasData.length > 0) {
        setSelectedAreaId(safeAreasData[0].id);
        console.log('ExcelImportV2View - Selected area ID:', safeAreasData[0].id);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Error cargando datos iniciales');
      // Asegurar valores por defecto en caso de error
      setAreas([]);
      setImportHistory([]);
      setStatistics(null);
    } finally {
      setLoading(false);
    }
  };

  const loadFieldMappings = async () => {
    if (!selectedAreaId) return;

    try {
      const mappings = await fieldMappingService.getFieldMappings(selectedAreaId);
      setFieldMappings(mappings);
    } catch (error) {
      console.error('Error loading field mappings:', error);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/)) {
      toast.error('Por favor selecciona un archivo Excel (.xlsx o .xls)');
      return;
    }

    setSelectedFile(file);
    setPreviewData(null);
  };

  const handlePreviewData = async () => {
    if (!selectedFile || !selectedAreaId) return;

    setLoading(true);
    try {
      const preview = await excelImportV2Service.previewExcelData(
        selectedFile,
        selectedAreaId,
        10
      );
      setPreviewData(preview);
      setIsPreviewDialogOpen(true);
    } catch (error) {
      console.error('Error previewing data:', error);
      toast.error('Error previsualizando datos');
    } finally {
      setLoading(false);
    }
  };

  const handleValidateFile = async () => {
    if (!selectedFile || !selectedAreaId) return;

    setLoading(true);
    try {
      const validation = await excelImportV2Service.validateExcelStructure(
        selectedFile,
        selectedAreaId
      );

      if (validation.isValid) {
        toast.success('Estructura del archivo válida');
      } else {
        toast.error('La estructura del archivo tiene errores');
        console.error('Validation errors:', validation.errors);
      }
    } catch (error) {
      console.error('Error validating file:', error);
      toast.error('Error validando archivo');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !selectedAreaId) {
      toast.error('Selecciona un archivo y área antes de importar');
      return;
    }

    setIsImporting(true);
    setImportProgress({ progress: 0, status: 'Iniciando importación...' });

    try {
      const result = await excelImportV2Service.importExcelToStaging(
        selectedFile,
        selectedAreaId,
        importOptions
      );

      // Simular progreso (en una implementación real, esto vendría del backend)
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          const newProgress = Math.min(prev.progress + 10, 90);
          return {
            progress: newProgress,
            status: `Procesando... ${newProgress}%`
          };
        });
      }, 500);

      // Limpiar interval cuando termine
      setTimeout(() => {
        clearInterval(progressInterval);
        setImportProgress({
          progress: 100,
          status: 'Importación completada'
        });

        setTimeout(() => {
          setImportProgress(null);
          setIsImporting(false);
          setSelectedFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }, 1000);
      }, 3000);

      toast.success(
        `Importación exitosa: ${result.imported} proyectos importados, ${result.errors} errores`
      );

      // Recargar datos
      loadInitialData();

    } catch (error) {
      console.error('Error importing file:', error);
      toast.error('Error durante la importación');
      setImportProgress(null);
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    if (!selectedAreaId) {
      toast.error('Selecciona un área primero');
      return;
    }

    try {
      const templateBlob = await excelImportV2Service.downloadExcelTemplate(selectedAreaId);

      const url = URL.createObjectURL(templateBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `plantilla-${selectedAreaId}.xlsx`;
      a.click();

      URL.revokeObjectURL(url);
      toast.success('Plantilla descargada exitosamente');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Error descargando plantilla');
    }
  };

  const PreviewDialog = ({ data, open, onClose }) => {
    if (!data) return null;

    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Previsualización de Datos</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Mostrando las primeras {data.previewRows?.length || 0} filas
                </p>
                <p className="text-sm text-gray-600">
                  Total de filas en el archivo: {data.totalRows}
                </p>
              </div>
              <Badge variant="outline">
                {data.mappedFields} campos mapeados
              </Badge>
            </div>

            {data.previewRows && data.previewRows.length > 0 && (
              <div className="border rounded-lg overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(data.previewRows[0]).map(key => (
                        <th key={key} className="px-3 py-2 text-left border-b">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.previewRows.map((row, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {Object.values(row).map((value, cellIndex) => (
                          <td key={cellIndex} className="px-3 py-2 border-b">
                            {value !== null && value !== undefined ? String(value) : '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {data.mappingResults && (
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">Resultado del Mapeo</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Campos reconocidos:</span> {data.mappingResults.recognized}
                  </div>
                  <div>
                    <span className="font-medium">Campos no mapeados:</span> {data.mappingResults.unmapped}
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const selectedArea = (areas || []).find(area => area.id === selectedAreaId);

  // Debug log para verificar el estado de areas durante el render
  console.log('ExcelImportV2View - Render areas state:', areas, 'length:', areas.length);
  console.log('ExcelImportV2View - Render selectedAreaId:', selectedAreaId);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Importación de Excel - Schema v2</h1>
          <p className="text-gray-600">Importa proyectos desde Excel con mapeo automático de campos</p>
        </div>

        <Button onClick={handleDownloadTemplate} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Descargar Plantilla
        </Button>
      </div>

      {/* Estadísticas */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Importaciones</p>
                  <p className="text-2xl font-bold">{statistics.totalImports}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Proyectos Importados</p>
                  <p className="text-2xl font-bold">{statistics.totalProjects}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Exitosas</p>
                  <p className="text-2xl font-bold">{statistics.successful}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel de Importación */}
        <Card>
          <CardHeader>
            <CardTitle>Importar Archivo Excel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selector de Área */}
            <div>
              <Label htmlFor="area">Área de Destino</Label>
              <Select value={selectedAreaId} onValueChange={setSelectedAreaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar área" />
                </SelectTrigger>
                <SelectContent>
                  {(areas || []).map(area => (
                    <SelectItem key={area.id} value={area.id}>
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: area.color || '#ccc' }}
                        ></div>
                        <span>{area.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Campo de Mapeos Configurados */}
            {selectedArea && (
              <div className="p-4 bg-white border border-blue-200 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: selectedArea.color }}
                    ></div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Área Seleccionada: {selectedArea.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {fieldMappings.length} mapeos de campo configurados
                      </p>
                    </div>
                  </div>
                  <Settings className="w-5 h-5 text-gray-500" />
                </div>
              </div>
            )}

            {/* Selector de Archivo */}
            <div>
              <Label htmlFor="file">Archivo Excel</Label>
              <Input
                ref={fileInputRef}
                id="file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                disabled={isImporting}
              />
            </div>

            {/* Opciones de Importación */}
            <div className="space-y-3">
              <Label>Opciones de Importación</Label>

              <div className="flex items-center space-x-2">
                <Switch
                  id="skipValidation"
                  checked={importOptions.skipValidation}
                  onCheckedChange={(checked) =>
                    setImportOptions({...importOptions, skipValidation: checked})
                  }
                />
                <Label htmlFor="skipValidation">Omitir validación</Label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="batchSize">Tamaño de lote</Label>
                  <Input
                    id="batchSize"
                    type="number"
                    value={importOptions.batchSize}
                    onChange={(e) =>
                      setImportOptions({...importOptions, batchSize: parseInt(e.target.value)})
                    }
                    min="1"
                    max="1000"
                  />
                </div>
                <div>
                  <Label htmlFor="startRow">Fila inicial</Label>
                  <Input
                    id="startRow"
                    type="number"
                    value={importOptions.startRow}
                    onChange={(e) =>
                      setImportOptions({...importOptions, startRow: parseInt(e.target.value)})
                    }
                    min="1"
                  />
                </div>
              </div>
            </div>

            {/* Progreso de Importación */}
            {importProgress && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Progreso</Label>
                  <span className="text-sm text-gray-500">{importProgress.progress}%</span>
                </div>
                <Progress value={importProgress.progress} className="w-full" />
                <p className="text-sm text-gray-600">{importProgress.status}</p>
              </div>
            )}

            {/* Botones de Acción */}
            <div className="flex space-x-2">
              <Button
                onClick={handlePreviewData}
                variant="outline"
                disabled={!selectedFile || !selectedAreaId || isImporting}
              >
                <Eye className="w-4 h-4 mr-2" />
                Previsualizar
              </Button>

              <Button
                onClick={handleValidateFile}
                variant="outline"
                disabled={!selectedFile || !selectedAreaId || isImporting}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Validar
              </Button>

              <Button
                onClick={handleImport}
                disabled={!selectedFile || !selectedAreaId || isImporting}
              >
                <Upload className="w-4 h-4 mr-2" />
                {isImporting ? 'Importando...' : 'Importar'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Historial de Importaciones */}
        <Card>
          <CardHeader>
            <CardTitle>Historial de Importaciones</CardTitle>
          </CardHeader>
          <CardContent>
            {importHistory.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay importaciones registradas</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-auto">
                {importHistory.slice(0, 10).map(importRecord => (
                  <div
                    key={importRecord.id}
                    className="flex items-center justify-between p-3 border rounded"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={importRecord.status === 'COMPLETED' ? 'default' :
                                 importRecord.status === 'ERROR' ? 'destructive' : 'secondary'}
                        >
                          {importRecord.status}
                        </Badge>
                        <span className="font-medium">{importRecord.fileName}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <span>{importRecord.area?.name}</span>
                        <span>{importRecord.recordsProcessed} registros</span>
                        <span>{new Date(importRecord.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      {importRecord.status === 'COMPLETED' && (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      )}
                      {importRecord.status === 'ERROR' && (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      )}
                      {importRecord.status === 'PROCESSING' && (
                        <Clock className="w-4 h-4 text-yellow-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mapeos de Campo Actuales */}
      {selectedArea && fieldMappings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mapeos de Campo Configurados - {selectedArea.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {fieldMappings.slice(0, 12).map(mapping => (
                <div key={mapping.id} className="p-3 border rounded bg-gray-50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{mapping.sourceField}</span>
                    {mapping.isRequired && (
                      <Badge variant="outline" className="text-xs">Requerido</Badge>
                    )}
                  </div>
                  <div className="text-xs text-gray-600">→ {mapping.targetField}</div>
                  {mapping.transformation && (
                    <div className="text-xs text-blue-600 mt-1">{mapping.transformation}</div>
                  )}
                </div>
              ))}
            </div>

            {fieldMappings.length > 12 && (
              <div className="text-center mt-3">
                <span className="text-sm text-gray-500">
                  Y {fieldMappings.length - 12} mapeos más...
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog de Previsualización */}
      <PreviewDialog
        data={previewData}
        open={isPreviewDialogOpen}
        onClose={() => setIsPreviewDialogOpen(false)}
      />
    </div>
  );
}