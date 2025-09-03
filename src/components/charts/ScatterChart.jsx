import React from 'react';
import { Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);

const ScatterChart = ({ 
  data, 
  title, 
  xAxisLabel = 'Progreso (%)', 
  yAxisLabel = 'Nivel de Riesgo',
  height = 400 
}) => {
  // Agrupar datos por área con colores distintos
  const areas = [...new Set(data.map(item => item.area))];
  const colors = [
    '#2563EB', // Blue
    '#059669', // Green
    '#DC2626', // Red
    '#D97706', // Orange
    '#7C3AED', // Purple
    '#64748B', // Gray
  ];

  const datasets = areas.map((area, index) => ({
    label: area,
    data: data
      .filter(item => item.area === area)
      .map(item => ({
        x: item.progress,
        y: item.risk,
        projectName: item.project
      })),
    backgroundColor: colors[index % colors.length],
    borderColor: colors[index % colors.length],
    pointRadius: 8,
    pointHoverRadius: 10
  }));

  const chartData = {
    datasets: datasets
  };

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
        callbacks: {
          label: function(context) {
            const point = context.raw;
            return [
              `Proyecto: ${point.projectName}`,
              `Progreso: ${point.x}%`,
              `Riesgo: ${point.y}/10`,
              `Área: ${context.dataset.label}`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        min: 0,
        max: 100,
        title: {
          display: true,
          text: xAxisLabel
        },
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        },
        grid: {
          borderDash: [3, 3],
          color: '#E5E7EB'
        }
      },
      y: {
        min: 0,
        max: 10,
        title: {
          display: true,
          text: yAxisLabel
        },
        grid: {
          borderDash: [3, 3],
          color: '#E5E7EB'
        }
      }
    }
  };


  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      
      {/* Cuadrantes de fondo */}
      <div className="relative" style={{ height: `${height}px` }}>
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none">
          <div className="bg-blue-50 opacity-20 border-r border-b border-gray-300"></div>
          <div className="bg-yellow-50 opacity-20 border-b border-gray-300"></div>
          <div className="bg-red-50 opacity-20 border-r border-gray-300"></div>
          <div className="bg-green-50 opacity-20"></div>
        </div>
        
        {/* Etiquetas de cuadrantes */}
        <div className="absolute top-2 left-2 text-xs text-gray-500 font-medium">
          Bajo progreso<br/>Bajo riesgo
        </div>
        <div className="absolute top-2 right-2 text-xs text-gray-500 font-medium text-right">
          Alto progreso<br/>Bajo riesgo
        </div>
        <div className="absolute bottom-2 left-2 text-xs text-gray-500 font-medium">
          Bajo progreso<br/>Alto riesgo
        </div>
        <div className="absolute bottom-2 right-2 text-xs text-gray-500 font-medium text-right">
          Alto progreso<br/>Alto riesgo
        </div>
        
        {/* Gráfico */}
        <Scatter data={chartData} options={options} />
      </div>

      {/* Leyenda adicional */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-200 rounded"></div>
          <span className="text-gray-600">Ideal: Alto progreso, bajo riesgo</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-200 rounded"></div>
          <span className="text-gray-600">Crítico: Bajo progreso, alto riesgo</span>
        </div>
      </div>
    </div>
  );
};

export default ScatterChart;