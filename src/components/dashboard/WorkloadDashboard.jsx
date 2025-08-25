import { useState, useEffect, useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { timePeriodService } from '@/services/timePeriodService';
import { timesheetService } from '@/services/timesheetService';
import userService from '@/services/userService';
import { useAuth } from '@/hooks/useAuth';
import { CalendarDays, TrendingUp, Users, Clock, X, ChevronDown, UserCheck } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

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

  // Configuración del gráfico gauge (doughnut modificado) para comparación
  const chartData = useMemo(() => {
    if (workloadData.length === 0) return null;

    // Si hay un solo período seleccionado
    if (workloadData.length === 1) {
      const percentage = workloadData[0].percentage || 0;
      const remaining = Math.max(0, 100 - percentage);

      return {
        labels: ['Carga de trabajo', 'Disponible'],
        datasets: [{
          data: [percentage, remaining],
          backgroundColor: [
            percentage >= 100 ? '#ef4444' : // Rojo si está sobrecargado
            percentage >= 80 ? '#f59e0b' :  // Amarillo si está cerca del límite
            '#10b981', // Verde si está bien
            '#f3f4f6'  // Gris para el resto
          ],
          borderWidth: 0,
          cutout: '75%',
        }],
      };
    }

    // Si hay dos períodos para comparar
    return {
      labels: ['Carga de trabajo', 'Disponible'],
      datasets: workloadData.map((data, index) => ({
        label: data.period?.description || `Período ${index + 1}`,
        data: [data.percentage || 0, Math.max(0, 100 - (data.percentage || 0))],
        backgroundColor: [
          index === 0 ? '#3b82f6' : '#8b5cf6', // Azul y púrpura para diferenciar
          '#f3f4f6'
        ],
        borderWidth: 0,
        cutout: index === 0 ? '75%' : '60%',
      })),
    };
  }, [workloadData]);

  const chartOptions = {
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            if (context.dataIndex === 0) {
              return `Carga de trabajo: ${context.parsed}%`;
            }
            return '';
          }
        }
      }
    },
    maintainAspectRatio: false,
  };

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

        {workloadData.length > 0 && chartData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico gauge */}
            <div className="relative">
              <div className="h-64 relative">
                <Doughnut data={chartData} options={chartOptions} />
                {/* Texto central del gauge */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {workloadData.length === 1 ? (
                    <>
                      <div className={`text-3xl font-bold ${getStatusColor(workloadData[0].percentage || 0)}`}>
                        {Math.round(workloadData[0].percentage || 0)}%
                      </div>
                      <div className="text-sm text-gray-500">
                        {getStatusText(workloadData[0].percentage || 0)}
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Comparación</div>
                      {workloadData.map((data, idx) => (
                        <div key={idx} className="text-xs mt-1">
                          <span className={idx === 0 ? 'text-blue-600' : 'text-purple-600'}>
                            P{idx+1}: {Math.round(data.percentage || 0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Estadísticas detalladas */}
            <div className="space-y-4">
              {workloadData.map((data, index) => (
                <div key={index} className="space-y-3">
                  {workloadData.length > 1 && (
                    <div className="font-medium text-sm text-gray-700 border-b pb-1">
                      Período {index + 1}: {formatDate(data.period?.startDate)} - {formatDate(data.period?.endDate)}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-blue-500 mr-2" />
                        <div>
                          <p className="text-xs text-gray-600">Horas Trabajadas</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {data.actualHours || 0}h
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center">
                        <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                        <div>
                          <p className="text-xs text-gray-600">Horas Referencia</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {data.referenceHours || 0}h
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600">Diferencia</p>
                        <p className={`text-base font-semibold ${
                          (data.difference || 0) >= 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {(data.difference || 0) >= 0 ? '+' : ''}
                          {(data.difference || 0).toFixed(1)}h
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600">Estado</p>
                        <p className={`text-sm font-medium ${getStatusColor(data.percentage || 0)}`}>
                          {getStatusText(data.percentage || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mensaje cuando no hay período seleccionado */}
        {workloadData.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <CalendarDays className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-lg font-medium">Selecciona un período para ver tu carga de trabajo</p>
            <p className="text-sm mt-1">Puedes comparar hasta 2 períodos a la vez</p>
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