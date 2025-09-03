import React from 'react';

const HeatmapChart = ({ data, title, xAxis, yAxis }) => {
  // Encontrar valores mínimos y máximos para la escala de colores
  const allValues = data.flat();
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);

  const getIntensity = (value) => {
    const percentage = (value - minValue) / (maxValue - minValue);
    
    if (percentage < 0.25) return { bg: '#DCFCE7', text: '#166534', label: 'Baja' };
    if (percentage < 0.5) return { bg: '#FEF3C7', text: '#92400E', label: 'Media' };
    if (percentage < 0.75) return { bg: '#FED7AA', text: '#9A3412', label: 'Alta' };
    return { bg: '#FEE2E2', text: '#991B1B', label: 'Muy Alta' };
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {/* Celda vacía para la esquina */}
              </th>
              {xAxis.map((label, index) => (
                <th 
                  key={index}
                  className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {yAxis.map((yLabel, yIndex) => (
              <tr key={yIndex}>
                <td className="px-4 py-2 text-sm font-medium text-gray-900 whitespace-nowrap">
                  {yLabel}
                </td>
                {xAxis.map((xLabel, xIndex) => {
                  const value = data[yIndex]?.[xIndex] || 0;
                  const intensity = getIntensity(value);
                  
                  return (
                    <td 
                      key={xIndex}
                      className="px-4 py-2 text-center"
                    >
                      <div 
                        className="relative group cursor-pointer rounded-lg px-3 py-2 transition-all hover:shadow-md"
                        style={{ 
                          backgroundColor: intensity.bg,
                          color: intensity.text
                        }}
                      >
                        <span className="font-semibold text-sm">{value}%</span>
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                          <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                            <div>{yLabel}</div>
                            <div>{xLabel}: {value}%</div>
                            <div>Carga: {intensity.label}</div>
                          </div>
                          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 mx-auto"></div>
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Leyenda */}
      <div className="mt-6 flex items-center justify-center space-x-4">
        <span className="text-sm text-gray-600">Carga de trabajo:</span>
        {[
          { bg: '#DCFCE7', text: '#166534', label: 'Baja (< 25%)' },
          { bg: '#FEF3C7', text: '#92400E', label: 'Media (25-50%)' },
          { bg: '#FED7AA', text: '#9A3412', label: 'Alta (50-75%)' },
          { bg: '#FEE2E2', text: '#991B1B', label: 'Muy Alta (> 75%)' }
        ].map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div 
              className="w-4 h-4 rounded"
              style={{ backgroundColor: item.bg }}
            ></div>
            <span className="text-xs text-gray-600">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeatmapChart;