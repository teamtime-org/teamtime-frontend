import React, { useState, useEffect } from 'react';
import { 
  Filter, 
  X, 
  Calendar,
  Building2,
  Users,
  AlertTriangle,
  Download,
  FileText,
  FileSpreadsheet,
  Image,
  RefreshCw
} from 'lucide-react';
import { areaService } from '@/services/areaService';
import userService from '@/services/userService';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

const DashboardFilters = ({ 
  onFilterChange, 
  onExport,
  dashboardType = 'admin',
  showExportOptions = true,
  customFilters = {}
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [areas, setAreas] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [filters, setFilters] = useState({
    period: '30days',
    area: 'all',
    coordinator: 'all',
    status: 'all',
    risk: 'all',
    startDate: '',
    endDate: '',
    ...customFilters
  });

  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      // Cargar áreas
      const areasRes = await areaService.getAreas(1, 100);
      setAreas(areasRes.data?.areas || []);

      // Cargar coordinadores
      const coordRes = await userService.getUsers(1, 100, '', 'COORDINADOR');
      setCoordinators(coordRes.data?.users || []);
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    
    // Si cambia el período, ajustar las fechas automáticamente
    if (key === 'period') {
      const today = new Date();
      let startDate = new Date();
      
      switch(value) {
        case '7days':
          startDate.setDate(today.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(today.getDate() - 30);
          break;
        case 'quarter':
          startDate.setMonth(today.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(today.getFullYear() - 1);
          break;
        case 'custom':
          // No cambiar las fechas en modo custom
          break;
        default:
          startDate.setDate(today.getDate() - 30);
      }
      
      if (value !== 'custom') {
        newFilters.startDate = startDate.toISOString().split('T')[0];
        newFilters.endDate = today.toISOString().split('T')[0];
      }
    }
    
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const resetFilters = () => {
    const defaultFilters = {
      period: '30days',
      area: 'all',
      coordinator: 'all',
      status: 'all',
      risk: 'all',
      startDate: '',
      endDate: '',
      ...customFilters
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  // Exportar a PDF
  const exportToPDF = async () => {
    setLoading(true);
    try {
      // Capturar el contenido del dashboard
      const dashboardElement = document.getElementById('dashboard-content');
      if (!dashboardElement) {
        throw new Error('No se encontró el contenido del dashboard');
      }

      const canvas = await html2canvas(dashboardElement, {
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 297; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Agregar metadata
      pdf.setProperties({
        title: `Dashboard ${dashboardType} - ${new Date().toLocaleDateString()}`,
        author: 'TeamTime',
        subject: 'Reporte de Dashboard',
        keywords: 'dashboard, reporte, teamtime'
      });
      
      pdf.save(`dashboard-${dashboardType}-${Date.now()}.pdf`);
      
      if (onExport) {
        onExport('pdf', filters);
      }
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Error al exportar el PDF. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Exportar a Excel
  const exportToExcel = async () => {
    setLoading(true);
    try {
      // Recopilar datos de todas las tablas y gráficos
      const tables = document.querySelectorAll('.data-table');
      const workbook = XLSX.utils.book_new();
      
      // Hoja principal con KPIs
      const kpiData = [];
      const kpiCards = document.querySelectorAll('[data-kpi]');
      kpiCards.forEach(card => {
        const title = card.querySelector('[data-kpi-title]')?.textContent || '';
        const value = card.querySelector('[data-kpi-value]')?.textContent || '';
        kpiData.push({ Métrica: title, Valor: value });
      });
      
      if (kpiData.length > 0) {
        const kpiSheet = XLSX.utils.json_to_sheet(kpiData);
        XLSX.utils.book_append_sheet(workbook, kpiSheet, 'KPIs');
      }
      
      // Agregar cada tabla como una hoja separada
      tables.forEach((table, index) => {
        const tableData = [];
        const rows = table.querySelectorAll('tr');
        
        rows.forEach(row => {
          const rowData = [];
          const cells = row.querySelectorAll('th, td');
          cells.forEach(cell => {
            rowData.push(cell.textContent);
          });
          tableData.push(rowData);
        });
        
        const ws = XLSX.utils.aoa_to_sheet(tableData);
        const sheetName = table.getAttribute('data-table-name') || `Tabla ${index + 1}`;
        XLSX.utils.book_append_sheet(workbook, ws, sheetName.substring(0, 31));
      });
      
      // Generar el archivo
      XLSX.writeFile(workbook, `dashboard-${dashboardType}-${Date.now()}.xlsx`);
      
      if (onExport) {
        onExport('excel', filters);
      }
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Error al exportar el Excel. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Exportar como imagen
  const exportToImage = async () => {
    setLoading(true);
    try {
      const dashboardElement = document.getElementById('dashboard-content');
      if (!dashboardElement) {
        throw new Error('No se encontró el contenido del dashboard');
      }

      const canvas = await html2canvas(dashboardElement, {
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      // Convertir a blob y descargar
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `dashboard-${dashboardType}-${Date.now()}.png`;
        link.click();
        URL.revokeObjectURL(url);
      });
      
      if (onExport) {
        onExport('image', filters);
      }
    } catch (error) {
      console.error('Error exporting to image:', error);
      alert('Error al exportar la imagen. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900">Filtros y Exportación</h3>
          
          {/* Botón de filtros */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <Filter className="h-4 w-4" />
            <span>Filtros</span>
            {Object.values(filters).filter(v => v && v !== 'all').length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-indigo-600 text-white text-xs rounded-full">
                {Object.values(filters).filter(v => v && v !== 'all').length}
              </span>
            )}
          </button>

          {/* Botón de reset */}
          {Object.values(filters).filter(v => v && v !== 'all' && v !== '30days').length > 0 && (
            <button
              onClick={resetFilters}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Limpiar</span>
            </button>
          )}
        </div>

        {/* Opciones de exportación */}
        {showExportOptions && (
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
              disabled={loading}
            >
              <Download className="h-4 w-4" />
              <span>Exportar</span>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <button
                  onClick={() => {
                    exportToPDF();
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  <FileText className="h-4 w-4 text-red-600" />
                  <span>Exportar como PDF</span>
                </button>
                <button
                  onClick={() => {
                    exportToExcel();
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  <span>Exportar como Excel</span>
                </button>
                <button
                  onClick={() => {
                    exportToImage();
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  <Image className="h-4 w-4 text-blue-600" />
                  <span>Exportar como Imagen</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Panel de filtros expandible */}
      {showFilters && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Período */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Período
              </label>
              <select
                value={filters.period}
                onChange={(e) => handleFilterChange('period', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="7days">Últimos 7 días</option>
                <option value="30days">Últimos 30 días</option>
                <option value="quarter">Este trimestre</option>
                <option value="year">Este año</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>

            {/* Área */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Área
              </label>
              <select
                value={filters.area}
                onChange={(e) => handleFilterChange('area', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="all">Todas las áreas</option>
                {areas.map(area => (
                  <option key={area.id} value={area.id}>{area.name}</option>
                ))}
              </select>
            </div>

            {/* Coordinador */}
            {dashboardType === 'admin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Coordinador
                </label>
                <select
                  value={filters.coordinator}
                  onChange={(e) => handleFilterChange('coordinator', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="all">Todos los coordinadores</option>
                  {coordinators.map(coord => (
                    <option key={coord.id} value={coord.id}>
                      {coord.firstName} {coord.lastName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="paused">En pausa</option>
                <option value="completed">Completados</option>
                <option value="cancelled">Cancelados</option>
              </select>
            </div>

            {/* Nivel de riesgo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nivel de Riesgo
              </label>
              <select
                value={filters.risk}
                onChange={(e) => handleFilterChange('risk', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="all">Todos los niveles</option>
                <option value="high">Alto</option>
                <option value="medium">Medio</option>
                <option value="low">Bajo</option>
              </select>
            </div>

            {/* Fechas personalizadas */}
            {filters.period === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>
              </>
            )}
          </div>

          {/* Filtros activos */}
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(filters).map(([key, value]) => {
              if (value && value !== 'all' && value !== '30days' && value !== '') {
                return (
                  <span
                    key={key}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800"
                  >
                    {key}: {value}
                    <button
                      onClick={() => handleFilterChange(key, key === 'period' ? '30days' : 'all')}
                      className="ml-2 hover:text-indigo-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span>Exportando dashboard...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardFilters;