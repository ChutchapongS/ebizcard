'use client';

import React from 'react';

interface QRCodeProps {
  value: string;
  size?: 'sm' | 'md' | 'lg';
  style?: string;
  color?: string;
  className?: string;
}

export const QRCode: React.FC<QRCodeProps> = ({ 
  value, 
  size = 'md', 
  style = 'standard',
  color = '#000000',
  className = ''
}) => {
  // Generate QR code data URL
  const generateQRCode = () => {
    // For now, we'll use a simple placeholder
    // In a real implementation, you would use a QR code library like qrcode.js
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size based on size prop
    const sizeMap = {
      sm: 48,
      md: 64,
      lg: 96
    };
    
    const canvasSize = sizeMap[size];
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    
    if (ctx) {
      // Create a simple QR code pattern (placeholder)
      const cellSize = canvasSize / 25; // 25x25 grid
      
      // Fill background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasSize, canvasSize);
      
      // Create QR code pattern
      ctx.fillStyle = color;
      
      // Simple pattern based on value hash
      const hash = value.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      
      for (let i = 0; i < 25; i++) {
        for (let j = 0; j < 25; j++) {
          if ((hash + i + j) % 3 === 0) {
            ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
          }
        }
      }
      
      // Add corner markers
      const markerSize = 7;
      const markerPositions = [
        [0, 0], [18, 0], [0, 18]
      ];
      
      markerPositions.forEach(([x, y]) => {
        // Outer marker
        ctx.fillStyle = color;
        ctx.fillRect(x * cellSize, y * cellSize, markerSize * cellSize, markerSize * cellSize);
        
        // Inner white space
        ctx.fillStyle = '#ffffff';
        ctx.fillRect((x + 1) * cellSize, (y + 1) * cellSize, 5 * cellSize, 5 * cellSize);
        
        // Inner marker
        ctx.fillStyle = color;
        ctx.fillRect((x + 2) * cellSize, (y + 2) * cellSize, 3 * cellSize, 3 * cellSize);
      });
    }
    
    return canvas.toDataURL();
  };

  const qrCodeDataUrl = generateQRCode();

  return (
    <img
      src={qrCodeDataUrl}
      alt={`QR Code for ${value}`}
      className={`inline-block ${className}`}
      style={{
        width: size === 'sm' ? '48px' : size === 'md' ? '64px' : '96px',
        height: size === 'sm' ? '48px' : size === 'md' ? '64px' : '96px',
      }}
    />
  );
};

export default QRCode;
