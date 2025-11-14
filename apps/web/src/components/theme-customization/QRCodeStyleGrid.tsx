import React, { useEffect, useRef } from 'react';
import QRCodeStyling from 'qr-code-styling';

interface QRCodeStyle {
  id: string;
  name: string;
  dotsOptions: {
    type: 'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'square' | 'extra-rounded';
    color: string;
  };
  backgroundOptions: {
    color: string;
  };
  cornersSquareOptions?: {
    type: 'dot' | 'square' | 'extra-rounded';
    color: string;
  };
  cornersDotOptions?: {
    type: 'dot' | 'square';
    color: string;
  };
}

interface QRCodeStyleGridProps {
  selectedStyle: string;
  onStyleSelect: (styleId: string) => void;
  qrValue: string;
  qrColor?: string;
  qrLogo?: string;
}

const QR_STYLES: QRCodeStyle[] = [
  {
    id: 'standard',
    name: 'Standard Square',
    dotsOptions: {
      type: 'square',
      color: '#000000'
    },
    backgroundOptions: {
      color: '#FFFFFF'
    }
  } as any,
  {
    id: 'rounded',
    name: 'Rounded Dots',
    dotsOptions: {
      type: 'rounded',
      color: '#1877F2'
    },
    backgroundOptions: {
      color: '#FFFFFF'
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: 0.4,
      margin: 0,
      crossOrigin: 'anonymous'
    }
  },
  {
    id: 'dots',
    name: 'Classic Dots',
    dotsOptions: {
      type: 'dots',
      color: '#E60023'
    },
    backgroundOptions: {
      color: '#FFFFFF'
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: 0.4,
      margin: 0,
      crossOrigin: 'anonymous'
    }
  },
  {
    id: 'classy',
    name: 'Classy Style',
    dotsOptions: {
      type: 'classy',
      color: '#0077B5'
    },
    backgroundOptions: {
      color: '#FFFFFF'
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: 0.4,
      margin: 0,
      crossOrigin: 'anonymous'
    }
  },
  {
    id: 'classy-rounded',
    name: 'Classy Rounded',
    dotsOptions: {
      type: 'classy-rounded',
      color: '#FF6B35'
    },
    backgroundOptions: {
      color: '#FFFFFF'
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: 0.4,
      margin: 0,
      crossOrigin: 'anonymous'
    }
  },
  {
    id: 'extra-rounded',
    name: 'Extra Rounded',
    dotsOptions: {
      type: 'extra-rounded',
      color: '#01875F'
    },
    backgroundOptions: {
      color: '#FFFFFF'
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: 0.4,
      margin: 0,
      crossOrigin: 'anonymous'
    }
  },
  {
    id: 'custom-corners',
    name: 'Custom Corners',
    dotsOptions: {
      type: 'square',
      color: '#9C27B0'
    },
    backgroundOptions: {
      color: '#FFFFFF'
    },
    cornersSquareOptions: {
      type: 'extra-rounded',
      color: '#9C27B0'
    },
    cornersDotOptions: {
      type: 'dot',
      color: '#9C27B0'
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: 0.4,
      margin: 0,
      crossOrigin: 'anonymous'
    }
  },
  {
    id: 'gradient-style',
    name: 'Gradient Style',
    dotsOptions: {
      type: 'rounded',
      color: '#FF5722'
    },
    backgroundOptions: {
      color: '#F5F5F5'
    },
    cornersSquareOptions: {
      type: 'square',
      color: '#FF5722'
    },
    cornersDotOptions: {
      type: 'square',
      color: '#FF5722'
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: 0.4,
      margin: 0,
      crossOrigin: 'anonymous'
    }
  }
];

export default function QRCodeStyleGrid({ selectedStyle, onStyleSelect, qrValue, qrColor, qrLogo }: QRCodeStyleGridProps) {
  const sampleValue = qrValue || 'https://example.com';
  const qrRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    
    QR_STYLES.forEach((style) => {
      const container = qrRefs.current[style.id];
      if (container) {
        container.innerHTML = ''; // Clear previous content
        
        const defaultColor = qrColor || style.dotsOptions.color;
        const qrCode = new QRCodeStyling({
          width: 80,
          height: 80,
          type: 'svg',
          data: sampleValue,
          dotsOptions: {
            ...style.dotsOptions,
            color: defaultColor
          },
          backgroundOptions: style.backgroundOptions,
          cornersSquareOptions: style.cornersSquareOptions ? {
            ...style.cornersSquareOptions,
            color: defaultColor
          } : undefined,
          cornersDotOptions: style.cornersDotOptions ? {
            ...style.cornersDotOptions,
            color: defaultColor
          } : undefined,
          imageOptions: qrLogo ? {
            hideBackgroundDots: true,
            imageSize: 0.15, // Smaller logo for preview (back to original size)
            margin: 0,
            crossOrigin: 'anonymous'
          } : (style as any).imageOptions,
          image: qrLogo || undefined
        });
        
        qrCode.append(container);
      }
    });
  }, [sampleValue, qrColor, qrLogo]);

  return (
    <div className="grid grid-cols-4 gap-2">
      {QR_STYLES.map((style) => (
        <div
          key={style.id}
          onClick={() => onStyleSelect(style.id)}
          className={`relative cursor-pointer rounded-lg border p-1 transition-all hover:shadow-md ${
            selectedStyle === style.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div 
            className="w-full h-16 flex items-center justify-center"
            ref={(el) => { qrRefs.current[style.id] = el; }}
          />
        </div>
      ))}
    </div>
  );
}
