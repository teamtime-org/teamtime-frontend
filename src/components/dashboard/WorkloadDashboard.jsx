import { useState, useEffect, useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { timePeriodService } from '@/services/timePeriodService';
import { timesheetService } from '@/services/timesheetService';
import userService from '@/services/userService';
import { useAuth } from '@/hooks/useAuth';
import { CalendarDays, TrendingUp, Users, Clock, X, ChevronDown, UserCheck } from 'lucide-react';
import GaugeChart from '@/components/ui/GaugeChart';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const WorkloadDashboard = () => {
  const { user } = useAuth();
  const [periods, setPeriods] = useState([]);
  const [selectedPeriods, setSelectedPeriods] = useState([]);
  const [workloadData, setWorkloadData] = useState([]);
  const [teamData, setTeamData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPeriodSelector, setShowPeriodSelector] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [teamWorkloadData, setTeamWorkloadData] = useState([]);

  // Determinar qué datos mostrar según el rol
  const userRole = user?.role;
  const isCollaborator = userRole === 'COLABORADOR';
  const isCoordinator = userRole === 'COORDINADOR';
  const isAdmin = userRole === 'ADMINISTRADOR';

  // Cargar períodos disponibles y usuarios si es coordinador/admin
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Cargar períodos
        const periodsResponse = await timePeriodService.getAll({ 
          limit: 100,
          orderBy: 'startDate',
          orderDirection: 'desc'
        });
        
        const periodsData = periodsResponse.data?.timePeriods || periodsResponse.data || [];
        setPeriods(periodsData);
        
        // Cargar usuarios si es coordinador o admin
        if (isCoordinator || isAdmin) {
          const usersResponse = await userService.getUsers(1, 100, '', 'COLABORADOR');
          const users = usersResponse.data?.users || usersResponse.users || [];
          setAvailableUsers(users);
        }
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
        setError('Error al cargar los datos iniciales');
      }
    };

    loadInitialData();
  }, [isCoordinator, isAdmin]);

  // Cargar datos de workload cuando cambian los períodos o usuarios seleccionados
  useEffect(() => {
    if (selectedPeriods.length === 0) {
      setWorkloadData([]);
      setTeamWorkloadData([]);
      setLoading(false);
      return;
    }

    const loadWorkloadData = async () => {
      setLoading(true);
      try {
        // Cargar datos principales del usuario
        const promises = selectedPeriods.map(async (period) => {
          let comparison;
          if (isCollaborator) {
            // Colaborador: solo sus propios datos
            comparison = await timePeriodService.getComparison(period.id, user.userId);
          } else {
            // Coordinador/Admin: sus propios datos primero
            comparison = await timePeriodService.getComparison(period.id, user.userId);
          }
          return {
            ...comparison.data,
            period: period
          };
        });
        
        const results = await Promise.all(promises);
        setWorkloadData(results);
        
        // Si es coordinador/admin y hay usuarios seleccionados, cargar sus datos
        if ((isCoordinator || isAdmin) && selectedUsers.length > 0 && selectedPeriods.length > 0) {
          const teamPromises = selectedUsers.map(async (selectedUser) => {
            const periodData = await Promise.all(
              selectedPeriods.map(async (period) => {
                const comparison = await timePeriodService.getComparison(period.id, selectedUser.id);
                return {
                  ...comparison.data,
                  period: period
                };
              })
            );
            return {
              user: selectedUser,
              data: periodData
            };
          });
          
          const teamResults = await Promise.all(teamPromises);
          setTeamWorkloadData(teamResults);
        }
      } catch (error) {
        console.error('Error al cargar datos de workload:', error);
        setError('Error al cargar los datos de carga de trabajo');
      } finally {
        setLoading(false);
      }
    };

    loadWorkloadData();
  }, [selectedPeriods, selectedUsers, user, isCollaborator, isCoordinator, isAdmin]);

  // Función para formatear fechas
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { 
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Función para agregar/quitar período de la selección
  const togglePeriodSelection = (period) => {
    const isSelected = selectedPeriods.some(p => p.id === period.id);
    
    if (isSelected) {
      setSelectedPeriods(selectedPeriods.filter(p => p.id !== period.id));
    } else {
      // Máximo 2 períodos
      if (selectedPeriods.length < 2) {
        setSelectedPeriods([...selectedPeriods, period]);
      } else {
        // Reemplazar el más antiguo
        setSelectedPeriods([selectedPeriods[1], period]);
      }
    }
  };

  // Función para agregar/quitar usuario de la selección
  const toggleUserSelection = (targetUser) => {
    const isSelected = selectedUsers.some(u => u.id === targetUser.id);
    
    if (isSelected) {
      setSelectedUsers(selectedUsers.filter(u => u.id !== targetUser.id));
    } else {
      setSelectedUsers([...selectedUsers, targetUser]);
    }
  };

  // Calcular datos para el gauge
  const gaugeData = useMemo(() => {
    if (workloadData.length === 0) return null;
    
    if (workloadData.length === 1) {
      const data = workloadData[0];
      const percentage = data.percentage || 0;
      return {
        value: percentage,
        horasPMO: data.horasPMO || 0,
        horasCliente: data.horasCliente || 0,
        horasReferencia: data.referenceHours || 0,
        period: data.period
      };
    }
    
    // Para múltiples períodos, mostrar el promedio
    const totalActual = workloadData.reduce((sum, data) => sum + Number(data.actualHours || 0), 0);
    const totalReferencia = workloadData.reduce((sum, data) => sum + Number(data.referenceHours || 0), 0);
    const totalPMO = workloadData.reduce((sum, data) => sum + Number(data.horasPMO || 0), 0);
    const totalCliente = workloadData.reduce((sum, data) => sum + Number(data.horasCliente || 0), 0);
    const averagePercentage = totalReferencia > 0 ? (totalActual / totalReferencia) * 100 : 0;
    
    return {
      value: averagePercentage,
      horasPMO: totalPMO,
      horasCliente: totalCliente,
      horasReferencia: totalReferencia,
      isComparison: true
    };
  }, [workloadData]);


  const getStatusColor = (percentage) => {
    if (percentage >= 100) return 'text-red-600';
    if (percentage >= 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusText = (percentage) => {
    if (percentage >= 100) return 'Sobrecarga';
    if (percentage >= 80) return 'Alta carga';
    if (percentage >= 60) return 'Carga normal';
    return 'Baja carga';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-600 text-center">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selector de período */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-indigo-600" />
            Carga de Trabajo
          </h2>
          
          <div className="relative">
            <button
              onClick={() => setShowPeriodSelector(!showPeriodSelector)}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <CalendarDays className="h-4 w-4" />
              <span className="text-sm font-medium">
                {selectedPeriods.length === 0 ? 'Seleccionar períodos' :
                 selectedPeriods.length === 1 ? '1 período seleccionado' :
                 `${selectedPeriods.length} períodos seleccionados`}
              </span>
            </button>
            
            {/* Dropdown de selección de períodos */}
            {showPeriodSelector && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-gray-900">Seleccionar Períodos (máx. 2)</h3>
                    <button
                      onClick={() => setShowPeriodSelector(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto p-2">
                  {periods.map(period => {
                    const isSelected = selectedPeriods.some(p => p.id === period.id);
                    return (
                      <button
                        key={period.id}
                        onClick={() => togglePeriodSelection(period)}
                        className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors ${
                          isSelected
                            ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium text-sm">
                              {period.description || 
                               `${period.type === 'weekly' ? 'Semana' : 'Quincena'} ${period.periodNumber} - ${period.month}/${period.year}`}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {formatDate(period.startDate)} - {formatDate(period.endDate)}
                              {period.referenceHours && (
                                <span className="ml-2">({period.referenceHours}h referencia)</span>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              ✓
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {selectedPeriods.length > 0 && (
                  <div className="p-3 border-t border-gray-200 bg-gray-50">
                    <div className="text-xs text-gray-600 mb-2">Períodos seleccionados:</div>
                    <div className="space-y-1">
                      {selectedPeriods.map((period, idx) => (
                        <div key={period.id} className="text-xs bg-white rounded px-2 py-1 flex justify-between items-center">
                          <span>{idx + 1}. {formatDate(period.startDate)} - {formatDate(period.endDate)}</span>
                          <button
                            onClick={() => togglePeriodSelection(period)}
                            className="text-red-500 hover:text-red-700 ml-2"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {workloadData.length > 0 && gaugeData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Medidor Gauge */}
            <div className="flex justify-center">
              <GaugeChart
                value={gaugeData.value}
                title={gaugeData.isComparison ? "PROMEDIO CARGA LABORAL" : "PORCENTAJE DE CARGA LABORAL"}
                horasPMO={gaugeData.horasPMO}
                horasCliente={gaugeData.horasCliente}
                horasReferencia={gaugeData.horasReferencia}
                className="w-full"
              />
            </div>

            {/* Estadísticas detalladas por período */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-gray-900 mb-3">
                Detalles por Período
              </h4>
              {workloadData.map((data, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="font-medium text-sm text-gray-700 border-b border-gray-200 pb-2">
                    {workloadData.length > 1 ? `Período ${index + 1}: ` : ''}
                    {formatDate(data.period?.startDate)} - {formatDate(data.period?.endDate)}
                  </div>
                  
                  {/* Clasificación de horas */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Users className="h-4 w-4 text-blue-600 mr-1" />
                      </div>
                      <p className="text-xs text-blue-700 font-medium">Horas PMO</p>
                      <p className="text-lg font-semibold text-blue-900">
                        {Number(data.horasPMO || 0).toFixed(1)}h
                      </p>
                      <p className="text-xs text-blue-600">
                        ({data.referenceHours > 0 ? ((Number(data.horasPMO || 0) / Number(data.referenceHours)) * 100).toFixed(1) : '0.0'}%)
                      </p>
                    </div>

                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Clock className="h-4 w-4 text-green-600 mr-1" />
                      </div>
                      <p className="text-xs text-green-700 font-medium">Horas Cliente</p>
                      <p className="text-lg font-semibold text-green-900">
                        {Number(data.horasCliente || 0).toFixed(1)}h
                      </p>
                      <p className="text-xs text-green-600">
                        ({data.referenceHours > 0 ? ((Number(data.horasCliente || 0) / Number(data.referenceHours)) * 100).toFixed(1) : '0.0'}%)
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Clock className="h-4 w-4 text-gray-500 mr-1" />
                      </div>
                      <p className="text-xs text-gray-600">Total Trabajadas</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {Number(data.actualHours || 0).toFixed(1)}h
                      </p>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <TrendingUp className="h-4 w-4 text-gray-500 mr-1" />
                      </div>
                      <p className="text-xs text-gray-600">Referencia</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {Number(data.referenceHours || 0).toFixed(1)}h
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-xs text-gray-600 mb-1">Porcentaje</p>
                      <p className={`text-lg font-semibold ${
                        getStatusColor(data.percentage || 0)
                      }`}>
                        {Math.round(data.percentage || 0)}%
                      </p>
                      <p className={`text-xs font-medium ${getStatusColor(data.percentage || 0)}`}>
                        {getStatusText(data.percentage || 0)}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Diferencia:</span>
                      <span className={`font-semibold ${
                        (data.difference || 0) >= 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {Number(data.difference || 0) >= 0 ? '+' : ''}
                        {Number(data.difference || 0).toFixed(1)}h
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Resumen cuando hay múltiples períodos */}
              {workloadData.length > 1 && (
                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                  <h5 className="font-semibold text-indigo-900 mb-3">Resumen Total</h5>
                  
                  {/* Clasificación PMO vs Cliente */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-blue-100 rounded-lg p-2 text-center">
                      <p className="text-xs text-blue-700 font-medium">Total PMO</p>
                      <p className="text-lg font-bold text-blue-900">
                        {workloadData.reduce((sum, data) => sum + Number(data.horasPMO || 0), 0).toFixed(1)}h
                      </p>
                    </div>
                    <div className="bg-green-100 rounded-lg p-2 text-center">
                      <p className="text-xs text-green-700 font-medium">Total Cliente</p>
                      <p className="text-lg font-bold text-green-900">
                        {workloadData.reduce((sum, data) => sum + Number(data.horasCliente || 0), 0).toFixed(1)}h
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 text-center text-sm">
                    <div>
                      <p className="text-indigo-700">Total Trabajadas</p>
                      <p className="font-bold text-indigo-900">
                        {workloadData.reduce((sum, data) => sum + Number(data.actualHours || 0), 0).toFixed(1)}h
                      </p>
                    </div>
                    <div>
                      <p className="text-indigo-700">Total Referencia</p>
                      <p className="font-bold text-indigo-900">
                        {workloadData.reduce((sum, data) => sum + Number(data.referenceHours || 0), 0).toFixed(1)}h
                      </p>
                    </div>
                    <div>
                      <p className="text-indigo-700">Promedio</p>
                      <p className="font-bold text-indigo-900">
                        {Math.round(gaugeData.value)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mensaje cuando no hay período seleccionado */}
        {workloadData.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <CalendarDays className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-lg font-medium">Selecciona un período para ver tu carga de trabajo</p>
            <p className="text-sm mt-1">El medidor mostrará tu porcentaje de carga laboral</p>
          </div>
        )}
      </div>

      {/* Vista específica por rol - Coordinador/Admin */}
      {(isCoordinator || isAdmin) && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                {isCoordinator ? 'Equipo de Trabajo' : 'Vista Global'}
              </h3>
            </div>
            
            {/* Selector de usuarios */}
            <div className="relative">
              <button
                onClick={() => setShowUserSelector(!showUserSelector)}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <UserCheck className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {selectedUsers.length === 0 ? 'Seleccionar colaboradores' :
                   `${selectedUsers.length} colaborador${selectedUsers.length > 1 ? 'es' : ''} seleccionado${selectedUsers.length > 1 ? 's' : ''}`}
                </span>
                <ChevronDown className="h-4 w-4" />
              </button>
              
              {/* Dropdown de selección de usuarios */}
              {showUserSelector && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-semibold text-gray-900">Seleccionar Colaboradores</h3>
                      <button
                        onClick={() => setShowUserSelector(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto p-2">
                    {availableUsers.map(availableUser => {
                      const isSelected = selectedUsers.some(u => u.id === availableUser.id);
                      return (
                        <button
                          key={availableUser.id}
                          onClick={() => toggleUserSelection(availableUser)}
                          className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors ${
                            isSelected
                              ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium text-sm">
                                {availableUser.name || `${availableUser.firstName} ${availableUser.lastName}`}
                              </div>
                              <div className="text-xs text-gray-500">
                                {availableUser.email}
                              </div>
                            </div>
                            {isSelected && (
                              <div className="bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                ✓
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Mostrar datos del equipo */}
          {teamWorkloadData.length > 0 && selectedPeriods.length > 0 ? (
            <div className="space-y-4">
              {/* Gráfico de barras comparativo */}
              <div className="bg-gray-50 rounded-lg p-4">
                <Bar
                  data={{
                    labels: teamWorkloadData.map(item => 
                      item.user.name || `${item.user.firstName} ${item.user.lastName}`
                    ),
                    datasets: selectedPeriods.map((period, idx) => ({
                      label: `${formatDate(period.startDate)} - ${formatDate(period.endDate)}`,
                      data: teamWorkloadData.map(item => item.data[idx]?.percentage || 0),
                      backgroundColor: idx === 0 ? 'rgba(59, 130, 246, 0.8)' : 'rgba(139, 92, 246, 0.8)',
                    }))
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 120,
                        ticks: {
                          callback: function(value) {
                            return value + '%';
                          }
                        }
                      }
                    }
                  }}
                  height={300}
                />
              </div>
              
              {/* Tabla detallada */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Colaborador
                      </th>
                      {selectedPeriods.map((period, idx) => (
                        <th key={idx} className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" colSpan={3}>
                          Período {idx + 1}
                        </th>
                      ))}
                    </tr>
                    <tr>
                      <th></th>
                      {selectedPeriods.map((period, idx) => (
                        <>
                          <th key={`${idx}-worked`} className="px-2 py-1 text-center text-xs text-gray-500">Trabajadas</th>
                          <th key={`${idx}-ref`} className="px-2 py-1 text-center text-xs text-gray-500">Referencia</th>
                          <th key={`${idx}-perc`} className="px-2 py-1 text-center text-xs text-gray-500">%</th>
                        </>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teamWorkloadData.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {item.user.name || `${item.user.firstName} ${item.user.lastName}`}
                        </td>
                        {item.data.map((periodData, idx) => (
                          <>
                            <td key={`${idx}-worked`} className="px-2 py-3 text-sm text-center text-gray-600">
                              {periodData.actualHours || 0}h
                            </td>
                            <td key={`${idx}-ref`} className="px-2 py-3 text-sm text-center text-gray-600">
                              {periodData.referenceHours || 0}h
                            </td>
                            <td key={`${idx}-perc`} className={`px-2 py-3 text-sm text-center font-medium ${
                              getStatusColor(periodData.percentage || 0)
                            }`}>
                              {Math.round(periodData.percentage || 0)}%
                            </td>
                          </>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>Selecciona colaboradores y períodos para ver el análisis del equipo</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkloadDashboard;