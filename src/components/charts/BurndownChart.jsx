import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const BurndownChart = ({ 
  data, 
  title = 'Burndown de Tareas',
  xAxisLabel = 'Días del Sprint',
  yAxisLabel = 'Tareas Restantes',
  height = 300 
}) => {
  const chartData = {
    labels: data.labels || data.days || ['Día 1', 'Día 2', 'Día 3', 'Día 4', 'Día 5'],
    datasets: [
      {
        label: 'Ideal',
        data: data.ideal,
        borderColor: '#6B7280',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
        tension: 0,
        pointRadius: 0,
        pointHoverRadius: 0
      },
      {
        label: 'Actual',
        data: data.actual,
        borderColor: '#2563EB',
        backgroundColor: '#2563EB20',
        borderWidth: 3,
        fill: true,
        tension: 0.1,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#2563EB',
        pointBorderWidth: 2
      }
    ]
  };

  // Si hay proyección, agregarla
  if (data.projected) {
    chartData.datasets.push({
      label: 'Proyección',
      data: data.projected,
      borderColor: '#D97706',
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderDash: [3, 3],
      tension: 0.1,
      pointRadius: 0,
      pointHoverRadius: 0
    });
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          padding: 15,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          afterLabel: function(context) {
            if (context.dataset.label === 'Actual' && data.ideal) {
              const idealValue = data.ideal[context.dataIndex];
              const actualValue = context.parsed.y;
              const difference = actualValue - idealValue;
              
              if (difference > 0) {
                return `Retraso: ${difference} tareas`;
              } else if (difference < 0) {
                return `Adelanto: ${Math.abs(difference)} tareas`;
              }
              return 'A tiempo';
            }
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        title: {
          display: true,
          text: xAxisLabel
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          borderDash: [3, 3],
          color: '#E5E7EB'
        },
        title: {
          display: true,
          text: yAxisLabel
        },
        ticks: {
          stepSize: Math.ceil(Math.max(...data.ideal) / 5),
          callback: function(value) {
            return Math.round(value);
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  // Calcular métricas
  const currentDay = data.actual.filter(v => v !== null && v !== undefined).length;
  const tasksRemaining = data.actual[currentDay - 1] || 0;
  const tasksCompleted = data.ideal[0] - tasksRemaining;
  const velocity = tasksCompleted / currentDay;
  const estimatedCompletion = tasksRemaining > 0 ? Math.ceil(tasksRemaining / velocity) : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      
      <div style={{ height: `${height}px` }}>
        <Line data={chartData} options={options} />
      </div>

      {/* Métricas del Sprint */}
      <div className="mt-6 grid grid-cols-4 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase">Completadas</p>
          <p className="text-xl font-bold text-green-600">{tasksCompleted}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase">Restantes</p>
          <p className="text-xl font-bold text-blue-600">{tasksRemaining}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase">Velocidad</p>
          <p className="text-xl font-bold text-purple-600">{velocity.toFixed(1)}/día</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase">Días Estimados</p>
          <p className="text-xl font-bold text-orange-600">{estimatedCompletion}</p>
        </div>
      </div>
    </div>
  );
};

export default BurndownChart;