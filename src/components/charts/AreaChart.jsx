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
  Filler,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

const AreaChart = ({ 
  data, 
  title, 
  xAxisLabel, 
  yAxisLabel,
  height = 300,
  showLegend = true 
}) => {
  const chartData = {
    labels: data.labels || [],
    datasets: (data.datasets || []).map((dataset, index) => ({
      label: dataset.name,
      data: dataset.data,
      borderColor: dataset.color || [
        '#2563EB',
        '#059669',
        '#DC2626',
        '#D97706',
        '#7C3AED'
      ][index % 5],
      backgroundColor: dataset.color ? `${dataset.color}20` : [
        '#2563EB20',
        '#05966920',
        '#DC262620',
        '#D9770620',
        '#7C3AED20'
      ][index % 5],
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: '#fff',
      pointBorderWidth: 2
    }))
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
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
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#333',
        borderWidth: 1,
        padding: 10,
        displayColors: true,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y;
              if (yAxisLabel?.includes('Horas')) {
                label += 'h';
              } else if (yAxisLabel?.includes('%')) {
                label += '%';
              }
            }
            return label;
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
          display: xAxisLabel ? true : false,
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
          display: yAxisLabel ? true : false,
          text: yAxisLabel
        },
        ticks: {
          callback: function(value) {
            if (yAxisLabel?.includes('Horas')) {
              return value + 'h';
            } else if (yAxisLabel?.includes('%')) {
              return value + '%';
            }
            return value;
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <div style={{ height: `${height}px` }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default AreaChart;