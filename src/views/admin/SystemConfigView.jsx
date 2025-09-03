import React, { useState, useEffect } from 'react';
import { Save, Settings, Calendar, Clock, RefreshCw, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Loading } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { systemConfigService } from '@/services/systemConfigService';

const SystemConfigView = () => {
  const { user } = useAuth();
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [futureDays, setFutureDays] = useState(7);
  const [dateRestrictions, setDateRestrictions] = useState({
    enabled: true,
    futureDaysAllowed: 7,
    pastDaysAllowed: 30
  });
  const [maxHoursPerDay, setMaxHoursPerDay] = useState(24);
  const [minHoursPerEntry, setMinHoursPerEntry] = useState(0.25);
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
    loadConfigs();
    loadFutureDaysConfig();
    loadDateRestrictionConfigs();
    loadHoursConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const response = await systemConfigService.getAll();
      setConfigs(response.data || []);
    } catch (error) {
      console.error('Error al cargar configuraciones:', error);
      showMessage('Error al cargar configuraciones', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadFutureDaysConfig = async () => {
    try {
      const response = await systemConfigService.getFutureDaysConfig();
      setFutureDays(response.data?.futureDaysAllowed || 7);
    } catch (error) {
      console.error('Error al cargar configuración de días futuros:', error);
    }
  };

  const loadDateRestrictionConfigs = async () => {
    try {
      const response = await systemConfigService.getDateRestrictionConfigs();
      setDateRestrictions(response.data || {
        enabled: true,
        futureDaysAllowed: 7,
        pastDaysAllowed: 30
      });
    } catch (error) {
      console.error('Error al cargar configuraciones de restricción de fecha:', error);
    }
  };

  const loadHoursConfigs = async () => {
    try {
      // Load max hours per day
      const maxHoursResponse = await systemConfigService.getConfig('TIME_ENTRY_MAX_HOURS_PER_DAY');
      if (maxHoursResponse?.data?.value) {
        setMaxHoursPerDay(parseFloat(maxHoursResponse.data.value));
      }
      
      // Load min hours per entry
      const minHoursResponse = await systemConfigService.getConfig('TIME_ENTRY_MIN_HOURS');
      if (minHoursResponse?.data?.value) {
        setMinHoursPerEntry(parseFloat(minHoursResponse.data.value));
      }
    } catch (error) {
      console.error('Error al cargar configuraciones de horas:', error);
      // Si no existen las configuraciones, mantener los valores por defecto
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

  const handleSaveFutureDays = async () => {
    try {
      setSaving(true);
      const days = parseInt(futureDays, 10);

      if (isNaN(days) || days < 0 || days > 365) {
        showMessage('El número de días debe estar entre 0 y 365', 'error');
        return;
      }

      await systemConfigService.setFutureDaysConfig(days);
      showMessage('Configuración de días futuros actualizada correctamente');
      await loadConfigs(); // Recargar todas las configuraciones
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      showMessage('Error al guardar configuración', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDateRestrictions = async () => {
    try {
      setSaving(true);

      // Validaciones
      if (dateRestrictions.enabled) {
        const futureDays = parseInt(dateRestrictions.futureDaysAllowed, 10);
        const pastDays = parseInt(dateRestrictions.pastDaysAllowed, 10);

        if (isNaN(futureDays) || futureDays < 0 || futureDays > 365) {
          showMessage('Los días futuros deben estar entre 0 y 365', 'error');
          return;
        }

        if (isNaN(pastDays) || pastDays < 0 || pastDays > 365) {
          showMessage('Los días pasados deben estar entre 0 y 365', 'error');
          return;
        }
      }

      await systemConfigService.setDateRestrictionConfigs(dateRestrictions);
      showMessage('Configuraciones de restricción de fecha actualizadas correctamente');
      await loadConfigs(); // Recargar todas las configuraciones
      await loadDateRestrictionConfigs();
    } catch (error) {
      console.error('Error al guardar configuraciones:', error);
      showMessage('Error al guardar configuraciones', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHoursConfig = async () => {
    try {
      setSaving(true);

      // Validaciones
      const maxHours = parseFloat(maxHoursPerDay);
      const minHours = parseFloat(minHoursPerEntry);

      if (isNaN(maxHours) || maxHours < 1 || maxHours > 24) {
        showMessage('El máximo de horas por día debe estar entre 1 y 24', 'error');
        return;
      }

      if (isNaN(minHours) || minHours < 0.25 || minHours > maxHours) {
        showMessage(`El mínimo de horas debe estar entre 0.25 y ${maxHours}`, 'error');
        return;
      }

      // Save max hours per day
      await systemConfigService.setConfig({
        key: 'TIME_ENTRY_MAX_HOURS_PER_DAY',
        value: maxHours.toString(),
        description: 'Máximo de horas permitidas por día'
      });
      
      // Save min hours per entry
      await systemConfigService.setConfig({
        key: 'TIME_ENTRY_MIN_HOURS',
        value: minHours.toString(),
        description: 'Mínimo de horas por entrada de tiempo'
      });

      showMessage('Configuración de horas actualizada correctamente');
      await loadConfigs(); // Recargar todas las configuraciones
      await loadHoursConfigs();
    } catch (error) {
      console.error('Error al guardar configuración de horas:', error);
      showMessage('Error al guardar configuración de horas', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleInitializeDefaults = async () => {
    try {
      setSaving(true);
      await systemConfigService.initializeDefaults();
      showMessage('Configuraciones por defecto inicializadas correctamente');
      await loadConfigs();
      await loadFutureDaysConfig();
      await loadDateRestrictionConfigs();
      await loadHoursConfigs();
    } catch (error) {
      console.error('Error al inicializar configuraciones:', error);
      showMessage('Error al inicializar configuraciones por defecto', 'error');
    } finally {
      setSaving(false);
    }
  };

  const formatConfigValue = (key, value) => {
    switch (key) {
      case 'TIME_ENTRY_FUTURE_DAYS':
        return `${value} día${value !== '1' ? 's' : ''}`;
      case 'TIME_ENTRY_PAST_DAYS':
        return `${value} día${value !== '1' ? 's' : ''}`;
      case 'TIME_ENTRY_MAX_HOURS_PER_DAY':
        return `${value} hora${value !== '1' ? 's' : ''}`;
      case 'TIME_ENTRY_MIN_HOURS':
        return `${value} hora${value !== '1' ? 's' : ''}`;
      case 'TIME_ENTRY_DATE_RESTRICTIONS_ENABLED':
        return value === 'true' ? 'Habilitado' : 'Deshabilitado';
      default:
        return value;
    }
  };

  const getConfigIcon = (key) => {
    switch (key) {
      case 'TIME_ENTRY_FUTURE_DAYS':
      case 'TIME_ENTRY_PAST_DAYS':
        return <Calendar className="w-5 h-5 text-blue-600" />;
      case 'TIME_ENTRY_DATE_RESTRICTIONS_ENABLED':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'TIME_ENTRY_MAX_HOURS_PER_DAY':
      case 'TIME_ENTRY_MIN_HOURS':
        return <Clock className="w-5 h-5 text-green-600" />;
      default:
        return <Settings className="w-5 h-5 text-gray-600" />;
    }
  };

  const getConfigName = (key) => {
    const names = {
      'TIME_ENTRY_FUTURE_DAYS': 'Días futuros permitidos',
      'TIME_ENTRY_PAST_DAYS': 'Días pasados permitidos',
      'TIME_ENTRY_DATE_RESTRICTIONS_ENABLED': 'Restricciones de fecha',
      'TIME_ENTRY_MAX_HOURS_PER_DAY': 'Máximo horas por día',
      'TIME_ENTRY_MIN_HOURS': 'Mínimo horas por entrada'
    };
    return names[key] || key;
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h1>
          <p className="text-gray-600 mt-1">
            Gestiona las configuraciones globales del sistema de registro de tiempo
          </p>
        </div>
        <Button
          onClick={handleInitializeDefaults}
          disabled={saving}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
          <span>Restaurar por Defecto</span>
        </Button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${messageType === 'error'
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
          {message}
        </div>
      )}

      {/* Configuración Principal: Restricciones de Fecha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span>Configuración de Restricciones de Fecha</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Control principal para habilitar/deshabilitar restricciones */}
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="enableRestrictions"
                checked={dateRestrictions.enabled}
                onChange={(e) => setDateRestrictions(prev => ({ ...prev, enabled: e.target.checked }))}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="enableRestrictions" className="text-lg font-medium text-gray-900">
                Habilitar restricciones de fecha para timesheet
              </label>
            </div>
            <p className="text-sm text-gray-600 mt-2 ml-8">
              {dateRestrictions.enabled
                ? 'Los usuarios solo podrán capturar tiempo dentro de los rangos configurados'
                : 'Los usuarios podrán capturar tiempo en cualquier fecha (sin restricciones)'
              }
            </p>
          </div>

          {/* Configuraciones de días permitidos - solo si están habilitadas las restricciones */}
          {dateRestrictions.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Días en el futuro permitidos
                </label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    min="0"
                    max="365"
                    value={dateRestrictions.futureDaysAllowed}
                    onChange={(e) => setDateRestrictions(prev => ({ ...prev, futureDaysAllowed: parseInt(e.target.value) || 0 }))}
                    className="w-24"
                  />
                  <span className="text-sm text-gray-600">días</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  0 = solo fechas pasadas y hoy. Recomendado: 7 días.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Días en el pasado permitidos
                </label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    min="0"
                    max="365"
                    value={dateRestrictions.pastDaysAllowed}
                    onChange={(e) => setDateRestrictions(prev => ({ ...prev, pastDaysAllowed: parseInt(e.target.value) || 0 }))}
                    className="w-24"
                  />
                  <span className="text-sm text-gray-600">días</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Cuántos días hacia atrás. Recomendado: 30 días.
                </p>
              </div>
            </div>
          )}

          {/* Botón guardar */}
          <div className="flex justify-end">
            <Button
              onClick={handleSaveDateRestrictions}
              disabled={saving}
              className="flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Configuración</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Configuración de Horas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-green-600" />
            <span>Configuración de Horas</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Máximo de horas por día */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Máximo de horas por día
              </label>
              <Input
                type="number"
                min="1"
                max="24"
                step="1"
                value={maxHoursPerDay}
                onChange={(e) => setMaxHoursPerDay(e.target.value)}
                className="w-full"
              />
              <p className="text-sm text-gray-500 mt-1">
                Límite máximo de horas que un usuario puede registrar por día (1-24 horas)
              </p>
            </div>

            {/* Mínimo de horas por entrada */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mínimo de horas por entrada
              </label>
              <Input
                type="number"
                min="0.25"
                max={maxHoursPerDay}
                step="0.25"
                value={minHoursPerEntry}
                onChange={(e) => setMinHoursPerEntry(e.target.value)}
                className="w-full"
              />
              <p className="text-sm text-gray-500 mt-1">
                Mínimo de horas permitidas por entrada de tiempo (0.25 = 15 minutos)
              </p>
            </div>
          </div>

          {/* Botón guardar */}
          <div className="flex justify-end">
            <Button
              onClick={handleSaveHoursConfig}
              disabled={saving}
              className="flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Configuración de Horas</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Todas las Configuraciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Todas las Configuraciones</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {configs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Settings className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>No hay configuraciones disponibles</p>
              <Button
                onClick={handleInitializeDefaults}
                className="mt-4"
                variant="outline"
              >
                Inicializar Configuraciones
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {configs.map((config) => (
                <div
                  key={config.key}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    {getConfigIcon(config.key)}
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {getConfigName(config.key)}
                      </h3>
                      <p className="text-sm text-gray-600">{config.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      {formatConfigValue(config.key, config.value)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Actualizado: {new Date(config.updatedAt).toLocaleDateString('es-ES')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información Adicional */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Información Importante</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700 space-y-2">
          <div className="mb-4">
            <h4 className="font-semibold text-blue-800 mb-2">Restricciones de Fecha:</h4>
            <p>
              • <strong>Deshabilitadas:</strong> Los usuarios pueden capturar tiempo en cualquier fecha (sin restricciones).
            </p>
            <p>
              • <strong>Habilitadas:</strong> Los usuarios solo pueden capturar dentro de los rangos configurados.
            </p>
            <p>
              • Los cambios afectan inmediatamente a todos los usuarios del sistema.
            </p>
          </div>

          <div className="mb-4">
            <h4 className="font-semibold text-blue-800 mb-2">Configuración Recomendada:</h4>
            <p>
              • <strong>Días futuros:</strong> 7 días (permite planificación semanal).
            </p>
            <p>
              • <strong>Días pasados:</strong> 30 días (permite correcciones mensuales).
            </p>
            <p>
              • Para equipos ágiles, considere 0-3 días futuros y 7-14 días pasados.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-blue-800 mb-2">Casos de Uso:</h4>
            <p>
              • <strong>Sin restricciones:</strong> Útil para migraciones de datos o correcciones históricas.
            </p>
            <p>
              • <strong>Restricciones estrictas:</strong> Ideal para control riguroso y cumplimiento.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemConfigView;