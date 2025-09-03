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

const StackedBarChart = ({ 
  data, 
  title, 
  xAxisLabel, 
  yAxisLabel,
  height = 300,
  stacked = true,
  horizontal = false,
  maxValue = null 
}) => {
  const chartData = {
    labels: data.labels || [],
    datasets: (data.datasets || []).map((dataset, index) => ({
      label: dataset.name,
      data: dataset.data,
      backgroundColor: dataset.color || [
        '#2563EB',
        '#059669',
        '#DC2626',
        '#D97706',
        '#7C3AED'
      ][index % 5],
      borderColor: 'transparent',
      borderWidth: 0
    }))
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? 'y' : 'x',
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
      title: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          footer: function(tooltipItems) {
            let sum = 0;
            tooltipItems.forEach(function(tooltipItem) {
              sum += tooltipItem.parsed[horizontal ? 'x' : 'y'];
            });
            return 'Total: ' + sum;
          }
        }
      }
    },
    scales: {
      x: {
        stacked: stacked,
        grid: {
          display: false
        },
        title: {
          display: xAxisLabel ? true : false,
          text: xAxisLabel
        }
      },
      y: {
        stacked: stacked,
        max: maxValue,
        grid: {
          borderDash: [3, 3],
          color: '#E5E7EB'
        },
        title: {
          display: yAxisLabel ? true : false,
          text: yAxisLabel
        },
        ticks: {
          callback: function(value) {
            return value + (yAxisLabel?.includes('Horas') ? 'h' : '');
          }
        }
      }
    }
  };

  // Si hay una línea de referencia (como máximo de horas)
  if (maxValue && data.referenceLine) {
    chartData.datasets.push({
      label: data.referenceLine.label || 'Límite',
      data: Array(data.labels.length).fill(data.referenceLine.value),
      type: 'line',
      borderColor: '#EF4444',
      borderWidth: 2,
      borderDash: [5, 5],
      fill: false,
      pointRadius: 0,
      order: 0
    });
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <div style={{ height: `${height}px` }}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

export default StackedBarChart;