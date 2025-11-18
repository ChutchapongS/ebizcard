'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

/**
 * Reusable Loading Spinner Component
 * 
 * Displays a loading spinner with optional text. Can be used as inline spinner
 * or full-screen loading overlay.
 * 
 * @param {LoadingSpinnerProps} props - Component props
 * @param {'sm' | 'md' | 'lg'} [props.size='md'] - Size of the spinner
 * @param {string} [props.text] - Optional text to display below spinner
 * @param {boolean} [props.fullScreen=false] - If true, displays as full-screen overlay
 * @param {string} [props.className] - Additional CSS classes
 * 
 * @returns {JSX.Element} Loading spinner component
 * 
 * @example
 * ```typescript
 * // Inline spinner
 * <LoadingSpinner text="กำลังโหลด..." />
 * 
 * // Full-screen loading
 * <LoadingSpinner fullScreen text="กำลังโหลดข้อมูล..." />
 * ```
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  fullScreen = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} />
      {text && (
        <p className={`mt-2 text-gray-600 ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : ''}`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-75 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
};

