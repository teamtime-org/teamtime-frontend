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

  const handleInitializeDefaults = async () => {
    try {
      setSaving(true);
      await systemConfigService.initializeDefaults();
      showMessage('Configuraciones por defecto inicializadas correctamente');
      await loadConfigs();
      await loadFutureDaysConfig();
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
      case 'TIME_ENTRY_MAX_HOURS_PER_DAY':
        return `${value} hora${value !== '1' ? 's' : ''}`;
      case 'TIME_ENTRY_MIN_HOURS':
        return `${value} hora${value !== '1' ? 's' : ''}`;
      default:
        return value;
    }
  };

  const getConfigIcon = (key) => {
    switch (key) {
      case 'TIME_ENTRY_FUTURE_DAYS':
        return <Calendar className="w-5 h-5 text-blue-600" />;
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
        <div className={`p-4 rounded-lg ${
          messageType === 'error' 
            ? 'bg-red-50 text-red-700 border border-red-200' 
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {message}
        </div>
      )}

      {/* Configuración Principal: Días Futuros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span>Configuración de Fechas Futuras</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Días en el futuro permitidos para registro de tiempo
            </label>
            <div className="flex items-center space-x-4">
              <Input
                type="number"
                min="0"
                max="365"
                value={futureDays}
                onChange={(e) => setFutureDays(e.target.value)}
                className="w-32"
                placeholder="7"
              />
              <span className="text-sm text-gray-600">días</span>
              <Button
                onClick={handleSaveFutureDays}
                disabled={saving}
                className="flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Guardar</span>
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Configura cuántos días en el futuro pueden los usuarios registrar tiempo. 
              Recomendado: 7 días para planificación semanal.
            </p>
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
          <p>
            • Los cambios en la configuración de días futuros afectan inmediatamente a todos los usuarios.
          </p>
          <p>
            • Un valor de 0 días significa que solo se puede registrar tiempo para fechas pasadas y el día actual.
          </p>
          <p>
            • Un valor de 7 días permite planificación semanal hacia adelante.
          </p>
          <p>
            • Los valores recomendados son entre 1 y 14 días para la mayoría de organizaciones.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemConfigView;