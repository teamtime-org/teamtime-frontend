import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

const DoughnutChart = ({ 
  data, 
  title, 
  centerText, 
  height = 300,
  showLegend = true,
  showDataLabels = true 
}) => {
  const chartData = {
    labels: data.labels || [],
    datasets: [{
      data: data.values || [],
      backgroundColor: data.colors || [
        '#2563EB', // Blue
        '#059669', // Green
        '#DC2626', // Red
        '#D97706', // Orange
        '#7C3AED', // Purple
        '#64748B', // Gray
      ],
      borderColor: '#ffffff',
      borderWidth: 2
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'bottom',
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
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            const formattedValue = Math.round(value * 10) / 10; // Redondear a 1 decimal
            return `${label}: ${formattedValue}h (${percentage}%)`;
          }
        }
      },
      datalabels: {
        display: showDataLabels,
        color: '#fff',
        font: {
          weight: 'bold',
          size: 14
        },
        formatter: (value, context) => {
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = ((value / total) * 100).toFixed(0);
          return percentage > 5 ? `${percentage}%` : '';
        }
      }
    },
    cutout: '60%'
  };

  // Plugin para texto central
  const centerTextPlugin = {
    id: 'centerText',
    beforeDraw: function(chart) {
      if (centerText) {
        const ctx = chart.ctx;
        const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
        const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;
        
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillStyle = '#1E293B';
        ctx.fillText(centerText, centerX, centerY);
        ctx.restore();
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <div style={{ height: `${height}px` }}>
        <Doughnut 
          data={chartData} 
          options={options}
          plugins={[centerTextPlugin]}
        />
      </div>
    </div>
  );
};

export default DoughnutChart;