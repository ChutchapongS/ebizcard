'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, X, ArrowRight, ArrowDown, ArrowUp, ArrowLeft, Move } from 'lucide-react';

export interface GradientStop {
  position: number; // 0-100
  color: string; // hex color
}

export type GradientDirection = 
  | 'to right'
  | 'to bottom'
  | 'to left'
  | 'to top'
  | 'to bottom right'
  | 'to bottom left'
  | 'to top right'
  | 'to top left';

interface GradientEditorProps {
  value: string; // gradient string or hex color
  onChange: (value: string) => void;
  onTransparentChange?: (isTransparent: boolean) => void;
  isTransparent?: boolean;
}

// Parse gradient string to extract direction and stops
const parseGradient = (value: string): { direction: GradientDirection; stops: GradientStop[] } => {
  const defaultStops: GradientStop[] = [
    { position: 0, color: '#3b82f6' },
    { position: 100, color: '#3b82f6' },
  ];
  const defaultDirection: GradientDirection = 'to right';

  if (!value) {
    return { direction: defaultDirection, stops: defaultStops };
  }

  // Single hex color, create default gradient
  if (value.startsWith('#') && /^#[0-9a-fA-F]{3,6}$/.test(value)) {
    return {
      direction: defaultDirection,
      stops: [
        { position: 0, color: value },
        { position: 100, color: value },
      ],
    };
  }

  // Try to parse as CSS gradient: linear-gradient(to right, #color1 0%, #color2 100%)
  if (value.includes('linear-gradient')) {
    // Extract direction and stops
    const gradientMatch = value.match(/linear-gradient\s*\(([^,]+),\s*(.+)\)/);
    if (gradientMatch) {
      const directionStr = gradientMatch[1].trim();
      const stopsStr = gradientMatch[2].trim();
      
      // Parse direction
      let direction: GradientDirection = defaultDirection;
      const directionMap: Record<string, GradientDirection> = {
        'to right': 'to right',
        'to bottom': 'to bottom',
        'to left': 'to left',
        'to top': 'to top',
        'to bottom right': 'to bottom right',
        'to bottom left': 'to bottom left',
        'to top right': 'to top right',
        'to top left': 'to top left',
      };
      
      if (directionMap[directionStr]) {
        direction = directionMap[directionStr];
      } else if (directionStr.includes('deg')) {
        // Handle angle-based directions (convert to closest named direction)
        const angleMatch = directionStr.match(/(\d+)deg/);
        if (angleMatch) {
          const angle = parseInt(angleMatch[1]);
          // Convert angle to named direction
          if (angle >= 337.5 || angle < 22.5) direction = 'to top';
          else if (angle >= 22.5 && angle < 67.5) direction = 'to top right';
          else if (angle >= 67.5 && angle < 112.5) direction = 'to right';
          else if (angle >= 112.5 && angle < 157.5) direction = 'to bottom right';
          else if (angle >= 157.5 && angle < 202.5) direction = 'to bottom';
          else if (angle >= 202.5 && angle < 247.5) direction = 'to bottom left';
          else if (angle >= 247.5 && angle < 292.5) direction = 'to left';
          else if (angle >= 292.5 && angle < 337.5) direction = 'to top left';
        }
      }
      
      const parsed: GradientStop[] = [];
      
      // Match color and position: #color position% or #color position%
      const stopPattern = /(#[0-9a-fA-F]{3,6})\s+(\d+(?:\.\d+)?)%/gi;
      let match;
      
      while ((match = stopPattern.exec(stopsStr)) !== null) {
        const color = match[1];
        const normalizedColor = color.length === 4 
          ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
          : color;
        const position = parseFloat(match[2]);
        
        parsed.push({
          color: normalizedColor,
          position: Math.round(position),
        });
      }
      
      if (parsed.length >= 2) {
        return {
          direction,
          stops: parsed.sort((a, b) => a.position - b.position),
        };
      }
      
      if (parsed.length === 1) {
        return {
          direction,
          stops: [
            { position: 0, color: parsed[0].color },
            { position: 100, color: parsed[0].color },
          ],
        };
      }
    }
  }

  // Default gradient if parsing fails
  console.warn('Failed to parse gradient:', value);
  return { direction: defaultDirection, stops: defaultStops };
};

// Convert stops and direction to CSS gradient string
const stopsToGradient = (stops: GradientStop[], direction: GradientDirection): string => {
  if (stops.length === 0) return '#3b82f6';
  if (stops.length === 1) return stops[0].color;
  
  // Sort by position
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  const gradientStops = sorted
    .map((stop) => `${stop.color} ${stop.position}%`)
    .join(', ');
  
  return `linear-gradient(${direction}, ${gradientStops})`;
};

export const GradientEditor = ({ value, onChange, onTransparentChange, isTransparent = false }: GradientEditorProps) => {
  const parsed = parseGradient(value);
  const [stops, setStops] = useState<GradientStop[]>(parsed.stops);
  const [direction, setDirection] = useState<GradientDirection>(parsed.direction);
  const [selectedStopIndex, setSelectedStopIndex] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const selectedIndexRef = useRef(0);
  
  // Keep ref in sync with state
  useEffect(() => {
    selectedIndexRef.current = selectedStopIndex;
  }, [selectedStopIndex]);

  const prevValueRef = useRef<string>(value);
  const isInternalUpdateRef = useRef(false);
  const stopsRef = useRef<GradientStop[]>(stops);
  const directionRef = useRef<GradientDirection>(direction);

  // Keep refs in sync with state
  useEffect(() => {
    stopsRef.current = stops;
  }, [stops]);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  // Update stops when value changes externally (only if different)
  useEffect(() => {
    // Skip if this is an internal update (from our own onChange)
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      prevValueRef.current = value;
      return;
    }

    // Only update if value actually changed and is different from current gradient
    if (value !== prevValueRef.current) {
      const parsed = parseGradient(value);
      const currentGradient = stopsToGradient(stopsRef.current, directionRef.current);
      
      // Only update if the parsed gradient is different from what we currently have
      // This prevents unnecessary resets when the value is the same gradient
      if (value !== currentGradient) {
        setStops(parsed.stops);
        setDirection(parsed.direction);
        // Reset selected index if needed
        if (parsed.stops.length > 0 && selectedStopIndex >= parsed.stops.length) {
          setSelectedStopIndex(parsed.stops.length - 1);
        }
      }
      prevValueRef.current = value;
    }
  }, [value, selectedStopIndex]);

  // Update parent when stops or direction change (prevent infinite loop)
  useEffect(() => {
    const gradient = stopsToGradient(stops, direction);
    if (gradient !== prevValueRef.current) {
      isInternalUpdateRef.current = true;
      onChange(gradient);
      prevValueRef.current = gradient;
    }
  }, [stops, direction, onChange]);

  const handleAddStop = () => {
    if (stops.length >= 10) return; // Max 10 stops
    
    // Calculate position between existing stops or at the end
    const sortedStops = [...stops].sort((a, b) => a.position - b.position);
    const lastStop = sortedStops[sortedStops.length - 1];
    const newPosition = lastStop.position < 90 
      ? Math.min(100, lastStop.position + 10)
      : 50;
    
    const newStop: GradientStop = {
      position: newPosition,
      color: stops[selectedStopIndex]?.color || '#3b82f6',
    };
    
    const newStops = [...stops, newStop].sort((a, b) => a.position - b.position);
    setStops(newStops);
    
    // Set selected index to the newly added stop
    const newIndex = newStops.findIndex(
      (stop) => stop.position === newPosition && stop.color === newStop.color
    );
    if (newIndex !== -1) {
      setSelectedStopIndex(newIndex);
    }
  };

  const handleRemoveStop = (index: number) => {
    if (stops.length <= 2) return; // Keep at least 2 stops
    
    const newStops = stops.filter((_, i) => i !== index);
    setStops(newStops);
    
    if (selectedStopIndex >= newStops.length) {
      setSelectedStopIndex(newStops.length - 1);
    }
  };

  const handleStopColorChange = (index: number, color: string) => {
    const newStops = [...stops];
    newStops[index].color = color;
    setStops(newStops);
  };

  const handleMouseDown = (e: React.MouseEvent, index: number) => {
    setIsDragging(true);
    setSelectedStopIndex(index);
    e.preventDefault();
  };

  const updateStopPosition = useCallback((clientX: number) => {
    if (!isDragging || !sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const currentIndex = selectedIndexRef.current;
    
    setStops((prevStops) => {
      const newStops = [...prevStops];
      const currentStop = newStops[currentIndex];
      newStops[currentIndex] = { ...currentStop, position };
      const sorted = newStops.sort((a, b) => a.position - b.position);
      
      // Update selected index after sort
      const newIndex = sorted.findIndex(
        (stop) => Math.abs(stop.position - position) < 0.1 && stop.color === currentStop.color
      );
      if (newIndex !== -1) {
        selectedIndexRef.current = newIndex;
        setSelectedStopIndex(newIndex);
      }
      
      return sorted;
    });
  }, [isDragging]);

  const handleDocumentMouseMove = useCallback((e: MouseEvent) => {
    updateStopPosition(e.clientX);
  }, [updateStopPosition]);

  const handleSliderMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    updateStopPosition(e.clientX);
  }, [updateStopPosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDocumentMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleDocumentMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleDocumentMouseMove, handleMouseUp]);

  const gradientString = stopsToGradient(stops, direction);
  const selectedStop = stops[selectedStopIndex];

  const directionOptions: { value: GradientDirection; icon: any; label: string; shortLabel: string }[] = [
    { value: 'to right', icon: ArrowRight, label: 'To Right', shortLabel: '→' },
    { value: 'to bottom', icon: ArrowDown, label: 'To Bottom', shortLabel: '↓' },
    { value: 'to left', icon: ArrowLeft, label: 'To Left', shortLabel: '←' },
    { value: 'to top', icon: ArrowUp, label: 'To Top', shortLabel: '↑' },
    { value: 'to bottom right', icon: Move, label: 'To Bottom Right', shortLabel: '↘' },
    { value: 'to bottom left', icon: Move, label: 'To Bottom Left', shortLabel: '↙' },
    { value: 'to top right', icon: Move, label: 'To Top Right', shortLabel: '↗' },
    { value: 'to top left', icon: Move, label: 'To Top Left', shortLabel: '↖' },
  ];

  return (
    <div className="space-y-3">
      {/* Direction Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">ทิศทางการไล่สี</label>
        <div className="grid grid-cols-4 gap-1.5">
          {directionOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = direction === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setDirection(option.value)}
                className={`flex flex-col items-center justify-center p-1.5 rounded border-2 transition-colors ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                }`}
                title={option.label}
              >
                <Icon className="w-3 h-3 mb-0.5" />
                <span className="text-[10px] leading-tight hidden sm:inline">{option.label}</span>
                <span className="text-[10px] sm:hidden">{option.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">Gradient stops</label>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={handleAddStop}
            disabled={stops.length >= 10}
            className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            title="Add stop"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleRemoveStop(selectedStopIndex)}
            disabled={stops.length <= 2}
            className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            title="Remove stop"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Gradient Slider */}
      <div className="relative">
        <div
          ref={sliderRef}
          className="relative h-8 rounded-md overflow-hidden border border-gray-300 cursor-crosshair"
          style={{
            background: gradientString,
          }}
          onMouseMove={handleSliderMouseMove}
          onMouseUp={handleMouseUp}
        />
        {/* Gradient Stops - positioned below the slider */}
        <div className="relative h-6 mt-1">
          {stops.map((stop, index) => (
            <div
              key={`stop-${index}-${stop.position}-${stop.color}`}
              className="absolute top-0 transform -translate-x-1/2 cursor-grab active:cursor-grabbing z-10"
              style={{ left: `${stop.position}%` }}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDown(e, index);
              }}
            >
              {/* Triangle indicator above */}
              <div
                className={`w-0 h-0 border-l-[5px] border-r-[5px] border-b-[10px] border-l-transparent border-r-transparent mb-0.5 ${
                  index === selectedStopIndex
                    ? 'border-b-orange-500'
                    : 'border-b-gray-400'
                }`}
              />
              {/* Square stop marker */}
              <div
                className={`w-5 h-5 border-2 rounded-sm ${
                  index === selectedStopIndex
                    ? 'border-orange-500 shadow-lg ring-2 ring-orange-200'
                    : 'border-gray-300 shadow-sm'
                }`}
                style={{
                  backgroundColor: stop.color,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Color Picker */}
      {selectedStop && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
          <label className="text-sm text-gray-700 underline whitespace-nowrap">Color</label>
          <div className="flex items-center gap-2 w-full sm:w-auto sm:flex-1 min-w-0">
            <input
              type="color"
              value={selectedStop.color || '#3b82f6'}
              onChange={(e) => {
                e.stopPropagation();
                handleStopColorChange(selectedStopIndex, e.target.value);
              }}
              className="w-10 h-10 flex-shrink-0 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              value={selectedStop.color || ''}
              onChange={(e) => {
                e.stopPropagation();
                const value = e.target.value;
                // Normalize hex color
                let hexColor = value.trim();
                if (hexColor && !hexColor.startsWith('#')) {
                  hexColor = `#${hexColor}`;
                }
                if (hexColor === '#' || /^#[0-9A-Fa-f]{0,6}$/i.test(hexColor)) {
                  handleStopColorChange(selectedStopIndex, hexColor || '#3b82f6');
                }
              }}
              className="flex-1 min-w-0 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="#3b82f6"
            />
            {onTransparentChange && (
              <button
                type="button"
                onClick={() => {
                  onTransparentChange(!isTransparent);
                }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-md border-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  isTransparent
                    ? 'bg-gray-50 border-gray-400 text-gray-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {isTransparent ? '✓ Default' : 'Default'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

