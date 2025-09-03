import { Fragment } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils';
import Button from './Button';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  size = 'default',
  className 
}) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    default: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 sm:p-0">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      <div className={cn(
        'relative bg-white rounded-lg shadow-xl w-full mx-0 sm:mx-4 max-h-[95vh] sm:max-h-[90vh] flex flex-col',
        'mt-4 sm:mt-0',
        sizes[size],
        className
      )}>
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 truncate pr-4">{title}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </div>
        
        {/* Footer - Fixed */}
        {footer && (
          <div className="flex items-center justify-end gap-2 p-4 sm:p-6 border-t bg-gray-50 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;