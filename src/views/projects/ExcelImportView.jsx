import { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  Info,
  Users,
  Building,
  TrendingUp
} from 'lucide-react';
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
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { ROLES } from '@/constants';
import api from '@/services/api';
import { areaService } from '@/services/areaService';

const ExcelImportView = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const fileInputRef = useRef();

  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedArea, setSelectedArea] = useState('');
  const [areas, setAreas] = useState([]);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const isAdmin = user?.role === ROLES.ADMINISTRADOR;

  // Cargar estadísticas al montar el componente
  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const response = await api.get('/excel-import/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Cargar áreas disponibles
  const loadAreas = async () => {
    try {
      setLoadingAreas(true);
      const response = await areaService.getAll();
      setAreas(response.data?.areas || []);
    } catch (error) {
      console.error('Error loading areas:', error);
    } finally {
      setLoadingAreas(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadAreas();
  }, []);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validar que sea un archivo Excel
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      
      if (!validTypes.includes(file.type)) {
        alert('Por favor selecciona un archivo Excel válido (.xlsx o .xls)');
        return;
      }

      // Validar tamaño (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Máximo 10MB permitido.');
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    
    if (!selectedArea) {
      alert('Por favor selecciona un área para asignar los proyectos');
      return;
    }

    try {
      setImporting(true);
      
      const formData = new FormData();
      formData.append('excelFile', selectedFile);
      formData.append('areaId', selectedArea);

      const response = await api.post('/excel-import/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutos de timeout
      });

      setImportResult(response.data.data);
      setShowResultModal(true);
      setSelectedFile(null);
      setSelectedArea('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Recargar estadísticas
      await loadStats();

    } catch (error) {
      console.error('Error importing Excel:', error);
      setImportResult({
        processed: 0,
        errors: 1,
        created: 0,
        updated: 0,
        errorDetails: [{
          row: 1,
          error: error.response?.data?.message || 'Error durante la importación'
        }]
      });
      setShowResultModal(true);
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/excel-import/template', {
        responseType: 'blob',
      });

      // Crear un enlace de descarga
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'plantilla-importacion-proyectos.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading template:', error);
      alert('Error descargando la plantilla');
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Acceso Denegado</h3>
          <p className="text-gray-600">
            Solo los administradores pueden importar proyectos desde Excel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Importación de Proyectos</h1>
          <p className="text-gray-600">
            Importa proyectos desde archivos Excel con todos sus datos y catálogos
          </p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileSpreadsheet className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Proyectos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loadingStats ? '...' : (stats?.totalProjects || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Riesgo Bajo</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loadingStats ? '...' : (stats?.projectsByRisk?.LOW || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Riesgo Medio</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loadingStats ? '...' : (stats?.projectsByRisk?.MEDIUM || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Riesgo Alto</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loadingStats ? '...' : (stats?.projectsByRisk?.HIGH || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instrucciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Info className="h-5 w-5 mr-2 text-blue-500" />
            Instrucciones de Importación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Formato de Archivo</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• El archivo debe ser Excel (.xlsx o .xls)</li>
                <li>• Tamaño máximo: 10MB</li>
                <li>• La primera fila debe contener los headers/columnas</li>
                <li>• Los datos empiezan desde la fila 2</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Campos Importantes</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• <strong>Mentor:</strong> Usuario con rol colaborador (formato: "Nombre Apellido;#ID")</li>
                <li>• <strong>Coordinador:</strong> Usuario con rol coordinador (formato: "Nombre Apellido;#ID")</li>
                <li>• <strong>Riesgo:</strong> Valores permitidos: Bajo, Medio, Alto</li>
                <li>• <strong>Proyecto Estratégico:</strong> SI/NO</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">Usuarios y Catálogos</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Los usuarios que no existan se crearán automáticamente</li>
                <li>• Los catálogos (líneas de negocio, segmentos, etc.) se crearán si no existen</li>
                <li>• Los proveedores se pueden listar separados por comas</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Área de importación */}
      <Card>
        <CardHeader>
          <CardTitle>Importar Archivo Excel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Selección de área */}
            <div className="space-y-3">
              <label htmlFor="areaSelect" className="block text-sm font-medium text-gray-700">
                Área donde se asignarán los proyectos *
              </label>
              <select
                id="areaSelect"
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loadingAreas}
              >
                <option value="">
                  {loadingAreas ? 'Cargando áreas...' : 'Selecciona un área'}
                </option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
              {!selectedArea && (
                <p className="text-sm text-gray-500">
                  Todos los proyectos importados se asignarán al área seleccionada
                </p>
              )}
            </div>

            {/* Descarga de plantilla */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Download className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <h4 className="font-medium text-gray-900">Plantilla de Excel</h4>
                  <p className="text-sm text-gray-600">
                    Descarga la plantilla con el formato correcto para la importación
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleDownloadTemplate}
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar Plantilla
              </Button>
            </div>

            {/* Selección de archivo */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              
              {selectedFile ? (
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-900">
                    Archivo Seleccionado
                  </p>
                  <p className="text-sm text-gray-600">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <div className="flex justify-center space-x-3 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedFile(null);
                        setSelectedArea('');
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleImport}
                      disabled={importing || !selectedArea}
                    >
                      {importing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Importando...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Importar Proyectos
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-900">
                    Selecciona un archivo Excel
                  </p>
                  <p className="text-sm text-gray-600">
                    Arrastra y suelta o haz clic para seleccionar
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Seleccionar Archivo
                  </Button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de resultados */}
      {showResultModal && importResult && (
        <Modal
          isOpen={showResultModal}
          onClose={() => setShowResultModal(false)}
          title="Resultado de Importación"
          size="xl"
        >
          <div className="space-y-6">
            {/* Resumen */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">
                  {importResult.processed}
                </div>
                <div className="text-sm text-green-600">Procesados</div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <FileSpreadsheet className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">
                  {importResult.created}
                </div>
                <div className="text-sm text-blue-600">Creados</div>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-yellow-600">
                  {importResult.updated}
                </div>
                <div className="text-sm text-yellow-600">Actualizados</div>
              </div>
              
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-600">
                  {importResult.errors}
                </div>
                <div className="text-sm text-red-600">Errores</div>
              </div>
            </div>

            {/* Errores */}
            {importResult.errorDetails && importResult.errorDetails.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Errores Encontrados</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {importResult.errorDetails.map((error, index) => (
                    <div key={index} className="p-3 bg-red-50 border border-red-200 rounded">
                      <div className="flex items-start">
                        <XCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-800">
                            Fila {error.row}
                          </p>
                          <p className="text-sm text-red-600">{error.error}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={() => setShowResultModal(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ExcelImportView;