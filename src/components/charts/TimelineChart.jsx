import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const TimelineChart = ({ data, title, height = 400 }) => {
  // Transformar datos para el gráfico de barras horizontales flotantes
  const projects = data?.projects || [];
  const chartData = {
    labels: projects.map(p => p.name),
    datasets: [
      {
        label: 'En Progreso',
        data: projects.map(p => {
          const start = new Date(p.startDate).getTime();
          const current = new Date(p.currentDate || new Date()).getTime();
          return [start, current];
        }),
        backgroundColor: '#2563EB',
        barPercentage: 0.5
      },
      {
        label: 'Restante',
        data: projects.map(p => {
          const current = new Date(p.currentDate || new Date()).getTime();
          const end = new Date(p.endDate).getTime();
          return [current, end];
        }),
        backgroundColor: '#E5E7EB',
        barPercentage: 0.5
      }
    ]
  };

  const options = {
    indexAxis: 'y',
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
            const [start, end] = context.raw;
            const startDate = new Date(start).toLocaleDateString('es-MX');
            const endDate = new Date(end).toLocaleDateString('es-MX');
            return `${context.dataset.label}: ${startDate} - ${endDate}`;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'month',
          displayFormats: {
            month: 'MMM yyyy'
          }
        },
        title: {
          display: true,
          text: 'Período'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Proyectos'
        }
      }
    }
  };

  // Versión simplificada sin tiempo si no hay fechas disponibles
  const simpleChartData = {
    labels: data?.periods || ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'],
    datasets: data?.areas?.map((area, index) => ({
      label: area.name,
      data: area.data,
      backgroundColor: [
        '#2563EB',
        '#059669',
        '#DC2626',
        '#D97706',
        '#7C3AED'
      ][index % 5],
      stack: 'stack1'
    })) || []
  };

  const simpleOptions = {
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
        intersect: false
      }
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false
        }
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: 'Proyectos'
        }
      }
    }
  };

  const useSimpleChart = !data?.projects || projects.length === 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <div style={{ height: `${height}px` }}>
        <Bar 
          data={useSimpleChart ? simpleChartData : chartData} 
          options={useSimpleChart ? simpleOptions : options} 
        />
      </div>
    </div>
  );
};

export default TimelineChart;