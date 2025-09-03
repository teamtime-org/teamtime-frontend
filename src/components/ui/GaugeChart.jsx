import { useEffect, useRef, useState } from 'react';

const GaugeChart = ({ 
  value, 
  title = "PORCENTAJE DE CARGA LABORAL",
  horasPMO = 0,
  horasCliente = 0,
  horasReferencia = 0,
  className = ""
}) => {
  // Convertir a números para evitar errores
  const numHorasPMO = Number(horasPMO) || 0;
  const numHorasCliente = Number(horasCliente) || 0;
  const numHorasReferencia = Number(horasReferencia) || 0;
  const numValue = Number(value) || 0;
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [animatedValue, setAnimatedValue] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width: 300, height: 200 });
  
  // Clamp value between 10 and 180
  const clampedValue = Math.max(10, Math.min(180, numValue));
  
  // Definir zonas de color
  const getZoneInfo = (percentage) => {
    if (percentage >= 90 && percentage <= 100) {
      return { 
        color: '#10b981', 
        message: 'Carga en rango ideal',
        zone: 'ideal'
      };
    } else if ((percentage >= 60 && percentage < 90) || (percentage > 100 && percentage <= 120)) {
      return { 
        color: '#f59e0b', 
        message: 'Atención: zona de alerta',
        zone: 'alert'
      };
    } else {
      return { 
        color: '#ef4444', 
        message: 'Riesgo: ajustar asignación',
        zone: 'risk'
      };
    }
  };

  const zoneInfo = getZoneInfo(clampedValue);

  // Animación de la aguja
  useEffect(() => {
    const duration = 500; // ms
    const startTime = Date.now();
    const startValue = animatedValue;
    const targetValue = clampedValue;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (targetValue - startValue) * easeOut;
      
      setAnimatedValue(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }, [clampedValue]);

  // Responsive canvas sizing
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const newWidth = Math.max(300, Math.min(500, containerWidth));
        const newHeight = Math.max(200, newWidth * 0.67);
        setCanvasSize({ width: newWidth, height: newHeight });
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set canvas resolution for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = canvasSize;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    
    const centerX = width / 2;
    const centerY = height * 0.85; // Semicírculo
    const radius = Math.min(width, height * 2) * 0.35;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, width, height);
    
    // Configurar texto
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Dibujar arco de fondo
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI);
    ctx.stroke();
    
    // Dibujar zonas de color
    const zones = [
      { start: 10, end: 50, color: '#ef4444' },   // Rojo
      { start: 50, end: 60, color: '#f59e0b' },   // Transición amarillo
      { start: 60, end: 80, color: '#f59e0b' },   // Amarillo
      { start: 80, end: 90, color: '#84cc16' },   // Verde claro
      { start: 90, end: 100, color: '#10b981' },  // Verde ideal
      { start: 100, end: 110, color: '#84cc16' }, // Verde claro
      { start: 110, end: 120, color: '#f59e0b' }, // Amarillo
      { start: 120, end: 130, color: '#f59e0b' }, // Transición rojo
      { start: 130, end: 180, color: '#ef4444' }  // Rojo
    ];
    
    zones.forEach(zone => {
      const startAngle = Math.PI + (zone.start - 10) / 170 * Math.PI;
      const endAngle = Math.PI + (zone.end - 10) / 170 * Math.PI;
      
      ctx.strokeStyle = zone.color;
      ctx.lineWidth = 20;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.stroke();
    });
    
    // Dibujar marcas de escala
    ctx.strokeStyle = '#374151';
    ctx.fillStyle = '#374151';
    ctx.font = '12px sans-serif';
    
    for (let i = 10; i <= 180; i += 10) {
      const angle = Math.PI + (i - 10) / 170 * Math.PI;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      
      // Marca larga cada 20%
      const tickLength = i % 20 === 0 ? 15 : 8;
      const outerRadius = radius + 25;
      const innerRadius = outerRadius - tickLength;
      
      ctx.lineWidth = i % 20 === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(centerX + cos * innerRadius, centerY + sin * innerRadius);
      ctx.lineTo(centerX + cos * outerRadius, centerY + sin * outerRadius);
      ctx.stroke();
      
      // Números cada 20%
      if (i % 20 === 0) {
        const textRadius = outerRadius + 15;
        const textX = centerX + cos * textRadius;
        const textY = centerY + sin * textRadius;
        
        ctx.fillStyle = '#374151';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(i + '%', textX, textY);
      }
    }
    
    // Dibujar aguja
    const needleAngle = Math.PI + (animatedValue - 10) / 170 * Math.PI;
    const needleCos = Math.cos(needleAngle);
    const needleSin = Math.sin(needleAngle);
    
    // Base de la aguja (círculo)
    ctx.fillStyle = '#374151';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
    ctx.fill();
    
    // Aguja (triángulo)
    const needleLength = radius - 10;
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(centerX + needleCos * needleLength, centerY + needleSin * needleLength);
    ctx.lineTo(centerX + needleCos * 15 - needleSin * 4, centerY + needleSin * 15 + needleCos * 4);
    ctx.lineTo(centerX + needleCos * 15 + needleSin * 4, centerY + needleSin * 15 - needleCos * 4);
    ctx.closePath();
    ctx.fill();
    
  }, [animatedValue, canvasSize]);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Título */}
      <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
        {title}
      </h3>
      
      {/* Canvas del gauge */}
      <div ref={containerRef} className="relative w-full flex justify-center">
        <canvas
          ref={canvasRef}
          className="max-w-full h-auto"
          aria-label={`Carga laboral ${numValue.toFixed(1)} por ciento, estado: ${zoneInfo.message.toLowerCase()}`}
          role="img"
        />
        
        {/* Valor actual en el centro */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center">
          <div className={`text-2xl font-bold ${
            zoneInfo.zone === 'ideal' ? 'text-green-600' :
            zoneInfo.zone === 'alert' ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {numValue.toFixed(1)}%
          </div>
          <div className={`text-sm font-medium mt-1 ${
            zoneInfo.zone === 'ideal' ? 'text-green-700' :
            zoneInfo.zone === 'alert' ? 'text-yellow-700' :
            'text-red-700'
          }`}>
            {zoneInfo.message}
          </div>
        </div>
      </div>
      
      {/* Resumen de horas */}
      {numHorasReferencia > 0 && (
        <div className="mt-4 text-center bg-gray-50 rounded-lg p-3 w-full max-w-md mx-auto">
          <div className="text-xs sm:text-sm text-gray-600 space-y-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              <div>
                <span className="font-medium">Horas PMO:</span> {numHorasPMO.toFixed(1)}h 
                <span className="text-gray-500">({numHorasReferencia > 0 ? ((numHorasPMO / numHorasReferencia) * 100).toFixed(1) : '0.0'}%)</span>
              </div>
              <div>
                <span className="font-medium">Horas Cliente:</span> {numHorasCliente.toFixed(1)}h 
                <span className="text-gray-500">({numHorasReferencia > 0 ? ((numHorasCliente / numHorasReferencia) * 100).toFixed(1) : '0.0'}%)</span>
              </div>
            </div>
            <div className="border-t pt-1 font-medium">
              <span>Total:</span> {(numHorasPMO + numHorasCliente).toFixed(1)}h 
              <span className="text-lg">({numValue.toFixed(1)}%)</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Leyenda de colores (para accesibilidad) */}
      <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs sm:text-sm">
        <div className="flex items-center space-x-1 bg-white px-2 py-1 rounded-full border">
          <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0"></div>
          <span className="text-gray-600 whitespace-nowrap">Riesgo</span>
        </div>
        <div className="flex items-center space-x-1 bg-white px-2 py-1 rounded-full border">
          <div className="w-3 h-3 bg-yellow-500 rounded-full flex-shrink-0"></div>
          <span className="text-gray-600 whitespace-nowrap">Alerta</span>
        </div>
        <div className="flex items-center space-x-1 bg-white px-2 py-1 rounded-full border">
          <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
          <span className="text-gray-600 whitespace-nowrap">Ideal</span>
        </div>
      </div>
      
      {/* Tooltip/ayuda para accesibilidad */}
      <div className="mt-2 text-xs text-gray-500 text-center max-w-md mx-auto">
        <div className="hidden sm:block">
          Riesgo: 10-50% y 130-180% | Alerta: 60-80% y 110-120% | Ideal: 90-100%
        </div>
        <div className="sm:hidden">
          Medidor de carga laboral quincenal
        </div>
      </div>
    </div>
  );
};

export default GaugeChart;