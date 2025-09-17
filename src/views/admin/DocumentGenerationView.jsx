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
  FileText,
  Plus,
  Edit,
  Eye,
  Download,
  Trash2,
  Send,
  Settings,
  TrendingUp,
  Copy,
  Code
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import documentService from '@/services/documentService';
import projectService from '@/services/projectService';

const TEMPLATE_TYPES = [
  { value: 'transfer', label: 'Transferencia' },
  { value: 'completion', label: 'Finalización' },
  { value: 'proposal', label: 'Propuesta' },
  { value: 'report', label: 'Reporte' }
];

export default function DocumentGenerationView() {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [projects, setProjects] = useState([]);
  const [generatedDocuments, setGeneratedDocuments] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [templateVariables, setTemplateVariables] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [activeTab, setActiveTab] = useState('generate');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [templatesData, projectsData, statsData, variablesData] = await Promise.all([
        documentService.getAvailableTemplates(),
        projectService.getProjects({ limit: 100 }),
        documentService.getDocumentStatistics(),
        documentService.getTemplateVariables()
      ]);

      setTemplates(templatesData);
      setProjects(projectsData.projects || projectsData);
      setStatistics(statsData);
      setTemplateVariables(variablesData);
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Error cargando datos iniciales');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setIsTemplateDialogOpen(true);
  };

  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
    setIsTemplateDialogOpen(true);
  };

  const handleGenerateDocument = (project = null) => {
    setSelectedProject(project);
    setIsGenerateDialogOpen(true);
  };

  const handlePreviewDocument = async (projectId, templateName, templateType) => {
    setLoading(true);
    try {
      const preview = await documentService.previewDocument(projectId, templateName, templateType);
      setPreviewContent(preview.content);
      setIsPreviewDialogOpen(true);
    } catch (error) {
      console.error('Error previewing document:', error);
      toast.error('Error previsualizando documento');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDocument = async (documentId) => {
    try {
      const blob = await documentService.downloadDocument(documentId);

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `documento-${documentId}.pdf`;
      a.click();

      URL.revokeObjectURL(url);
      toast.success('Documento descargado');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Error descargando documento');
    }
  };

  const TemplateDialog = ({ template, open, onClose }) => {
    const [formData, setFormData] = useState({
      name: template?.name || '',
      type: template?.type || 'transfer',
      format: template?.format || 'html',
      content: template?.content || '',
      variables: template?.variables || [],
      metadata: template?.metadata || {},
      isActive: template?.isActive !== undefined ? template.isActive : true
    });

    const handleSubmit = async (e) => {
      e.preventDefault();

      try {
        await documentService.saveTemplate(formData);
        toast.success(template ? 'Plantilla actualizada' : 'Plantilla creada');
        onClose();
        loadInitialData();
      } catch (error) {
        console.error('Error saving template:', error);
        toast.error('Error guardando plantilla');
      }
    };

    const insertVariable = (variable) => {
      const textarea = document.getElementById('template-content');
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formData.content;

      const before = text.substring(0, start);
      const after = text.substring(end);
      const newText = before + `{{${variable.name}}}` + after;

      setFormData({ ...formData, content: newText });
    };

    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {template ? 'Editar Plantilla' : 'Crear Nueva Plantilla'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre de la Plantilla</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ej: Transferencia PMO"
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">Tipo de Plantilla</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({...formData, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Variables Disponibles</Label>
                <div className="border rounded p-2 max-h-32 overflow-auto">
                  {templateVariables.map(variable => (
                    <div key={variable.name} className="flex items-center justify-between py-1">
                      <div>
                        <span className="font-mono text-xs">{variable.name}</span>
                        <p className="text-xs text-gray-500">{variable.description}</p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => insertVariable(variable)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="format">Formato</Label>
                <Select
                  value={formData.format}
                  onValueChange={(value) => setFormData({...formData, format: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="html">HTML</SelectItem>
                    <SelectItem value="markdown">Markdown</SelectItem>
                    <SelectItem value="text">Texto Plano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="template-content">Contenido de la Plantilla</Label>
              <Textarea
                id="template-content"
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                placeholder="Escriba el contenido de la plantilla aquí. Use {{variable}} para insertar variables."
                rows={12}
                className="font-mono text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ejemplo de Variables</Label>
                <div className="text-xs text-gray-600 space-y-1">
                  <div><code>{'{{projectName}}'}</code> - Nombre del proyecto</div>
                  <div><code>{'{{clientName}}'}</code> - Nombre del cliente</div>
                  <div><code>{'{{transferDate}}'}</code> - Fecha de transferencia</div>
                  <div><code>{'{{fromAreaName}}'}</code> - Área de origen</div>
                </div>
              </div>

              <div className="flex items-end">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  />
                  <Label htmlFor="isActive">Plantilla Activa</Label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">
                {template ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  const GenerateDocumentDialog = ({ project, open, onClose }) => {
    const [formData, setFormData] = useState({
      projectId: project?.id || '',
      templateName: '',
      templateType: 'transfer',
      generateMultiple: false,
      selectedProjects: []
    });

    const handleSubmit = async (e) => {
      e.preventDefault();

      try {
        if (formData.generateMultiple && formData.selectedProjects.length > 0) {
          await documentService.batchGenerateDocuments(
            formData.selectedProjects,
            formData.templateName,
            formData.templateType
          );
          toast.success(`${formData.selectedProjects.length} documentos generados`);
        } else {
          await documentService.generateDocument(
            formData.projectId,
            formData.templateName,
            formData.templateType
          );
          toast.success('Documento generado exitosamente');
        }

        onClose();
        loadInitialData();
      } catch (error) {
        console.error('Error generating document:', error);
        toast.error('Error generando documento');
      }
    };

    const filteredTemplates = templates.filter(t =>
      !formData.templateType || t.type === formData.templateType
    );

    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generar Documento</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Tipo de Generación</Label>
              <div className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="single"
                    checked={!formData.generateMultiple}
                    onChange={() => setFormData({...formData, generateMultiple: false})}
                  />
                  <Label htmlFor="single">Proyecto Individual</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="multiple"
                    checked={formData.generateMultiple}
                    onChange={() => setFormData({...formData, generateMultiple: true})}
                  />
                  <Label htmlFor="multiple">Múltiples Proyectos</Label>
                </div>
              </div>
            </div>

            {!formData.generateMultiple ? (
              <div>
                <Label htmlFor="projectId">Proyecto</Label>
                <Select
                  value={formData.projectId}
                  onValueChange={(value) => setFormData({...formData, projectId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar proyecto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        <div>
                          <span>{project.name}</span>
                          <Badge variant="outline" className="ml-2">{project.internalId}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <Label>Proyectos Seleccionados</Label>
                <div className="border rounded p-2 max-h-48 overflow-auto space-y-1">
                  {projects.slice(0, 10).map(project => (
                    <div key={project.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`project-${project.id}`}
                        checked={formData.selectedProjects.includes(project.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              selectedProjects: [...formData.selectedProjects, project.id]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              selectedProjects: formData.selectedProjects.filter(id => id !== project.id)
                            });
                          }
                        }}
                      />
                      <Label htmlFor={`project-${project.id}`} className="text-sm">
                        {project.name} ({project.internalId})
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {formData.selectedProjects.length} proyectos seleccionados
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="templateType">Tipo de Plantilla</Label>
              <Select
                value={formData.templateType}
                onValueChange={(value) => setFormData({...formData, templateType: value, templateName: ''})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="templateName">Plantilla</Label>
              <Select
                value={formData.templateName}
                onValueChange={(value) => setFormData({...formData, templateName: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar plantilla" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTemplates.map(template => (
                    <SelectItem key={template.name} value={template.name}>
                      <div className="flex items-center space-x-2">
                        <span>{template.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {TEMPLATE_TYPES.find(t => t.value === template.type)?.label}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              {formData.projectId && formData.templateName && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handlePreviewDocument(
                    formData.projectId,
                    formData.templateName,
                    formData.templateType
                  )}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Previsualizar
                </Button>
              )}
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">
                <FileText className="w-4 h-4 mr-2" />
                Generar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  const PreviewDialog = ({ content, open, onClose }) => {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Previsualización del Documento</DialogTitle>
          </DialogHeader>

          <div className="border rounded-lg p-6 bg-white">
            <div
              dangerouslySetInnerHTML={{ __html: content }}
              className="prose max-w-none"
            />
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
          <p className="mt-2 text-sm text-gray-500">Cargando generador de documentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Generación de Documentos</h1>
          <p className="text-gray-600">Gestiona plantillas y genera documentos automáticamente</p>
        </div>

        <div className="flex space-x-2">
          <Button onClick={() => handleGenerateDocument()} variant="outline">
            <Send className="w-4 h-4 mr-2" />
            Generar Documento
          </Button>
          <Button onClick={handleCreateTemplate}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Plantilla
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Plantillas</p>
                  <p className="text-2xl font-bold">{templates.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Send className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Docs. Generados</p>
                  <p className="text-2xl font-bold">{statistics.totalGenerated}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Download className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Descargas</p>
                  <p className="text-2xl font-bold">{statistics.totalDownloads}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
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
              <TabsTrigger value="generate">Generar Documentos</TabsTrigger>
              <TabsTrigger value="templates">Plantillas ({templates.length})</TabsTrigger>
              <TabsTrigger value="history">Historial</TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="space-y-4">
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Generar Documentos</h3>
                <p className="text-gray-600 mb-4">
                  Selecciona proyectos y plantillas para generar documentos automáticamente
                </p>
                <Button onClick={() => handleGenerateDocument()}>
                  <Send className="w-4 h-4 mr-2" />
                  Iniciar Generación
                </Button>
              </div>

              {projects.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Proyectos Recientes</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {projects.slice(0, 6).map(project => (
                      <div key={project.id} className="p-3 border rounded hover:bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{project.name}</span>
                          <Badge variant="outline">{project.internalId}</Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{project.client?.name}</p>
                        <Button
                          size="sm"
                          onClick={() => handleGenerateDocument(project)}
                          className="w-full"
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          Generar Doc
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              {templates.length === 0 ? (
                <div className="text-center py-8">
                  <Code className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay plantillas configuradas</p>
                  <Button onClick={handleCreateTemplate} className="mt-4">
                    Crear Primera Plantilla
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Formato</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map(template => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">
                          {template.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {TEMPLATE_TYPES.find(t => t.value === template.type)?.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="uppercase text-xs">
                          {template.format}
                        </TableCell>
                        <TableCell>
                          <Badge variant={template.isActive ? "default" : "secondary"}>
                            {template.isActive ? 'Activa' : 'Inactiva'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditTemplate(template)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                navigator.clipboard.writeText(template.content);
                                toast.success('Plantilla copiada');
                              }}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="history">
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Historial de documentos generados</p>
                <p className="text-sm text-gray-400">Esta funcionalidad estará disponible próximamente</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <TemplateDialog
        template={selectedTemplate}
        open={isTemplateDialogOpen}
        onClose={() => setIsTemplateDialogOpen(false)}
      />

      <GenerateDocumentDialog
        project={selectedProject}
        open={isGenerateDialogOpen}
        onClose={() => setIsGenerateDialogOpen(false)}
      />

      <PreviewDialog
        content={previewContent}
        open={isPreviewDialogOpen}
        onClose={() => setIsPreviewDialogOpen(false)}
      />
    </div>
  );
}