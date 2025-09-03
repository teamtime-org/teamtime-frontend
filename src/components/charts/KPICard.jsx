import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const KPICard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue, 
  color = 'indigo',
  format = 'number',
  suffix = '',
  prefix = ''
}) => {
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  const formatValue = (val) => {
    if (format === 'currency') {
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
      }).format(val);
    }
    if (format === 'percent') {
      return `${val}%`;
    }
    if (format === 'number') {
      return new Intl.NumberFormat('es-MX').format(val);
    }
    return val;
  };

  const colorClasses = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    gray: 'bg-gray-50 text-gray-600 border-gray-200'
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
      data-kpi
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            {Icon && (
              <div className={`p-2 rounded-lg ${colorClasses[color]} mr-3`}>
                <Icon className="h-5 w-5" />
              </div>
            )}
            <p className="text-sm font-medium text-gray-600" data-kpi-title>{title}</p>
          </div>
          <div className="flex items-baseline">
            <p className="text-2xl font-bold text-gray-900" data-kpi-value>
              {prefix}{formatValue(value)}{suffix}
            </p>
            {trendValue !== undefined && (
              <div className={`flex items-center ml-3 ${getTrendColor()}`}>
                {getTrendIcon()}
                <span className="text-sm font-medium ml-1">
                  {trendValue}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPICard;