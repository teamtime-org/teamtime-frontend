import React, { useState, useEffect } from 'react';
import { Calendar, Save, Eye, AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Loading } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { timePeriodService } from '@/services/timePeriodService';
import { formatDate } from '@/utils';

const TimePeriodsView = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [periodType, setPeriodType] = useState('weekly'); // 'weekly' or 'biweekly'
  const [referenceHours, setReferenceHours] = useState(40);
  const [previewPeriods, setPreviewPeriods] = useState([]);
  const [existingPeriods, setExistingPeriods] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // Verificar que el usuario sea administrador
  if (user?.role !== 'ADMINISTRADOR') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600">Solo los administradores pueden acceder a esta página</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadExistingPeriods();
  }, []);

  const loadExistingPeriods = async () => {
    try {
      setLoading(true);
      const response = await timePeriodService.getAll();
      setExistingPeriods(response.data?.timePeriods || []);
    } catch (error) {
      console.error('Error al cargar períodos:', error);
      showMessage('Error al cargar períodos existentes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const generatePeriods = () => {
    if (!startDate || !endDate) {
      showMessage('Por favor seleccione fechas de inicio y fin', 'error');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      showMessage('La fecha de inicio debe ser anterior a la fecha de fin', 'error');
      return;
    }

    // Ajustar al lunes más cercano
    const dayOfWeek = start.getDay();
    const diff = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7;
    if (diff > 0) {
      start.setDate(start.getDate() + diff);
    }

    const periods = [];
    let currentPeriodStart = new Date(start);
    let periodNumber = 1;
    const daysPerPeriod = periodType === 'biweekly' ? 14 : 7;

    while (currentPeriodStart <= end) {
      const currentPeriodEnd = new Date(currentPeriodStart);
      currentPeriodEnd.setDate(currentPeriodEnd.getDate() + daysPerPeriod - 1);
      
      // No exceder la fecha final
      if (currentPeriodEnd > end) {
        currentPeriodEnd.setTime(end.getTime());
      }

      const year = currentPeriodStart.getFullYear();
      const month = currentPeriodStart.getMonth() + 1;
      
      // Calcular semana del año
      const firstDayOfYear = new Date(year, 0, 1);
      const daysSinceStart = Math.floor((currentPeriodStart - firstDayOfYear) / (24 * 60 * 60 * 1000));
      const weekOfYear = Math.ceil((daysSinceStart + firstDayOfYear.getDay() + 1) / 7);

      periods.push({
        year,
        month,
        periodNumber: periodType === 'biweekly' ? Math.ceil(periodNumber / 2) : weekOfYear,
        weekNumber: weekOfYear,
        startDate: new Date(currentPeriodStart),
        endDate: new Date(currentPeriodEnd),
        referenceHours: parseFloat(referenceHours),
        type: periodType,
        description: `${periodType === 'biweekly' ? 'Quincena' : 'Semana'} ${weekOfYear} - ${year}`
      });

      currentPeriodStart.setDate(currentPeriodStart.getDate() + daysPerPeriod);
      periodNumber++;
    }

    setPreviewPeriods(periods);
  };

  const handleGeneratePeriods = () => {
    generatePeriods();
  };

  const handleSavePeriods = async () => {
    if (previewPeriods.length === 0) {
      showMessage('No hay períodos para guardar', 'error');
      return;
    }

    try {
      setSaving(true);
      
      // Formatear períodos para el backend
      const periodsToSave = previewPeriods.map(period => ({
        year: period.year,
        month: period.month,
        periodNumber: period.periodNumber,
        startDate: period.startDate.toISOString(),
        endDate: period.endDate.toISOString(),
        referenceHours: period.referenceHours,
        type: period.type,
        description: period.description
      }));

      const response = await timePeriodService.createBulk(periodsToSave);
      
      const createdCount = response.data?.created?.length || response.data?.length || previewPeriods.length;
      showMessage(`${createdCount} períodos creados exitosamente`, 'success');
      
      // Limpiar preview y recargar existentes
      setPreviewPeriods([]);
      setStartDate('');
      setEndDate('');
      await loadExistingPeriods();
      
    } catch (error) {
      console.error('Error al guardar períodos:', error);
      showMessage('Error al guardar los períodos', 'error');
    } finally {
      setSaving(false);
    }
  };

  const formatDateDisplay = (date) => {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getDayName = (date) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[new Date(date).getDay()];
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Períodos de Tiempo</h1>
          <p className="text-gray-600 mt-1">
            Precarga períodos semanales o quincenales con horas de referencia para análisis de carga de trabajo
          </p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${messageType === 'error'
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
          {message}
        </div>
      )}

      {/* Configuración de Períodos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span>Configurar Nuevos Períodos</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Rango de fechas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Inicio
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Se ajustará automáticamente al lunes más cercano
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Fin
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Tipo de período */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Período
              </label>
              <select
                value={periodType}
                onChange={(e) => setPeriodType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="weekly">Semanal (7 días)</option>
                <option value="biweekly">Quincenal (14 días)</option>
              </select>
            </div>

            {/* Horas de referencia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horas de Referencia
              </label>
              <Input
                type="number"
                min="1"
                max="168"
                step="1"
                value={referenceHours}
                onChange={(e) => setReferenceHours(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Horas esperadas para el período (ej: 40 horas semanales)
              </p>
            </div>
          </div>

          {/* Botón de previsualización */}
          <div className="flex justify-center">
            <Button
              onClick={handleGeneratePeriods}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>Previsualizar Períodos</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Previsualización de Períodos */}
      {previewPeriods.length > 0 && (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-blue-600" />
                <span>Previsualización de Períodos a Generar</span>
              </div>
              <span className="text-sm font-normal text-gray-600">
                {previewPeriods.length} períodos
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">#</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Período</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Fecha Inicio</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Fecha Fin</th>
                    <th className="text-center py-2 px-3 text-sm font-medium text-gray-700">Días</th>
                    <th className="text-center py-2 px-3 text-sm font-medium text-gray-700">Horas Ref.</th>
                  </tr>
                </thead>
                <tbody>
                  {previewPeriods.map((period, index) => {
                    const days = Math.ceil((period.endDate - period.startDate) / (1000 * 60 * 60 * 24)) + 1;
                    return (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-3 text-sm">{index + 1}</td>
                        <td className="py-2 px-3 text-sm font-medium">{period.description}</td>
                        <td className="py-2 px-3 text-sm">
                          {getDayName(period.startDate)} {formatDateDisplay(period.startDate)}
                        </td>
                        <td className="py-2 px-3 text-sm">
                          {getDayName(period.endDate)} {formatDateDisplay(period.endDate)}
                        </td>
                        <td className="py-2 px-3 text-sm text-center">{days}</td>
                        <td className="py-2 px-3 text-sm text-center font-medium">
                          {period.referenceHours}h
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Botón para guardar */}
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                onClick={() => setPreviewPeriods([])}
                variant="outline"
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSavePeriods}
                disabled={saving}
                className="flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Guardando...' : 'Guardar Períodos'}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Períodos Existentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-gray-600" />
            <span>Períodos Existentes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {existingPeriods.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>No hay períodos configurados</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Año</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Mes</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Período</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Fecha Inicio</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Fecha Fin</th>
                    <th className="text-center py-2 px-3 text-sm font-medium text-gray-700">Horas Ref.</th>
                  </tr>
                </thead>
                <tbody>
                  {existingPeriods.map((period) => (
                    <tr key={period.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3 text-sm">{period.year}</td>
                      <td className="py-2 px-3 text-sm">{period.month}</td>
                      <td className="py-2 px-3 text-sm font-medium">
                        Período {period.periodNumber}
                      </td>
                      <td className="py-2 px-3 text-sm">
                        {formatDateDisplay(period.startDate)}
                      </td>
                      <td className="py-2 px-3 text-sm">
                        {formatDateDisplay(period.endDate)}
                      </td>
                      <td className="py-2 px-3 text-sm text-center font-medium">
                        {period.referenceHours || '-'}h
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Información Importante</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700 space-y-2">
          <p>
            • Los períodos siempre comienzan en <strong>lunes</strong> para mantener consistencia.
          </p>
          <p>
            • Las <strong>horas de referencia</strong> se utilizan para comparar con las horas reales trabajadas.
          </p>
          <p>
            • Los períodos <strong>semanales</strong> son de 7 días, los <strong>quincenales</strong> de 14 días.
          </p>
          <p>
            • Puede generar múltiples períodos de una vez seleccionando un rango amplio de fechas.
          </p>
          <p>
            • Los períodos generados servirán para análisis de carga de trabajo y reportes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimePeriodsView;