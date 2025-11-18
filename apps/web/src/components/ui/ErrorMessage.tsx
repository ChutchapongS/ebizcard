'use client';

import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onDismiss?: () => void;
  variant?: 'error' | 'warning' | 'info';
  className?: string;
  showIcon?: boolean;
}

/**
 * Reusable Error Message Component
 * 
 * Displays an error, warning, or info message with optional dismiss button.
 * 
 * @param {ErrorMessageProps} props - Component props
 * @param {string} [props.title] - Optional title for the error
 * @param {string} props.message - Error message to display
 * @param {() => void} [props.onDismiss] - Callback when dismiss button is clicked
 * @param {'error' | 'warning' | 'info'} [props.variant='error'] - Message variant
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.showIcon=true] - Whether to show icon
 * 
 * @returns {JSX.Element} Error message component
 * 
 * @example
 * ```typescript
 * // Simple error
 * <ErrorMessage message="เกิดข้อผิดพลาดในการโหลดข้อมูล" />
 * 
 * // Error with title and dismiss
 * <ErrorMessage 
 *   title="การเชื่อมต่อล้มเหลว"
 *   message="ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้"
 *   onDismiss={() => setError(null)}
 * />
 * 
 * // Warning message
 * <ErrorMessage 
 *   message="กรุณาตรวจสอบข้อมูลอีกครั้ง"
 *   variant="warning"
 * />
 * ```
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  message,
  onDismiss,
  variant = 'error',
  className = '',
  showIcon = true,
}) => {
  const variantClasses = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const iconColors = {
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
  };

  return (
    <div
      className={`rounded-lg border p-4 ${variantClasses[variant]} ${className}`}
      role="alert"
    >
      <div className="flex items-start">
        {showIcon && (
          <AlertCircle className={`h-5 w-5 ${iconColors[variant]} flex-shrink-0 mt-0.5 mr-3`} />
        )}
        <div className="flex-1">
          {title && (
            <h3 className="font-semibold mb-1">{title}</h3>
          )}
          <p className="text-sm">{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`ml-4 flex-shrink-0 ${iconColors[variant]} hover:opacity-70 transition-opacity`}
            aria-label="Dismiss error"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

