'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { PaperSettings, CanvasElement } from '@/types/theme-customization';
import { DraggableItem } from './DraggableItem';
import PropertyPanel from './PropertyPanel';

interface RightPanelProps {
  paperSettings: PaperSettings;
  onPaperSettingsChange: (settings: PaperSettings) => void;
  onSaveTemplate: () => void;
  selectedElement: CanvasElement | null;
  onElementUpdate: (element: CanvasElement) => void;
  onElementDelete: (elementId: string) => void;
  onElementClose: () => void;
  savedGradientColors: string[];
  savedGradientDirection: 'horizontal' | 'vertical' | 'diagonal';
  onGradientColorsChange: (colors: string[]) => void;
  onGradientDirectionChange: (direction: 'horizontal' | 'vertical' | 'diagonal') => void;
  userData?: any; // User data from Supabase
  isDragging?: boolean; // Add isDragging prop
  useAddressPrefix?: boolean; // Add useAddressPrefix prop
  setUseAddressPrefix?: (value: boolean) => void; // Add setUseAddressPrefix prop
}

export function RightPanel({
  paperSettings,
  onPaperSettingsChange,
  onSaveTemplate,
  selectedElement,
  onElementUpdate,
  onElementDelete,
  onElementClose,
  savedGradientColors,
  savedGradientDirection,
  onGradientColorsChange,
  onGradientDirectionChange,
  userData,
  isDragging = false,
  useAddressPrefix = true,
  setUseAddressPrefix
}: RightPanelProps) {
  const [activeSection, setActiveSection] = useState<'paper' | 'elements' | 'property'>('paper');

  // Auto-switch to property tab when element is selected (but not during drag)
  useEffect(() => {
    if (selectedElement && !isDragging) {
      setActiveSection('property');
    }
  }, [selectedElement, isDragging]);


  const handlePaperSizeChange = (size: 'A4' | 'A5' | 'Business Card' | 'Business Card (L)' | 'Custom') => {
    let width = paperSettings.width;
    let height = paperSettings.height;

    if (size === 'Business Card (L)') {
      width = 180; // Business Card (L) width in mm
      height = 110; // Business Card (L) height in mm
    } else if (size === 'Business Card') {
      width = 90; // Business Card width in mm
      height = 55; // Business Card height in mm
    } else if (size === 'A4') {
      width = 210; // A4 width in mm
      height = 297; // A4 height in mm
    } else if (size === 'A5') {
      width = 148; // A5 width in mm
      height = 210; // A5 height in mm
    }

    onPaperSettingsChange({
      ...paperSettings,
      size,
      width,
      height
    });
  };

  const handleOrientationChange = (orientation: 'portrait' | 'landscape') => {
    if (orientation !== paperSettings.orientation) {
      // Swap width and height when changing orientation
      onPaperSettingsChange({
        ...paperSettings,
        orientation,
        width: paperSettings.height,
        height: paperSettings.width
      });
    } else {
      // Just update orientation if it's the same
      onPaperSettingsChange({
        ...paperSettings,
        orientation
      });
    }
  };

  const handleBackgroundColorChange = (color: string) => {
    onPaperSettingsChange({
      ...paperSettings,
      background: {
        ...paperSettings.background,
        type: 'color',
        color
      }
    });
  };

  const handleBackgroundImageChange = (image: string) => {
    onPaperSettingsChange({
      ...paperSettings,
      background: {
        ...paperSettings.background,
        type: 'image',
        image
      }
    });
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Section Tabs */}
      <div>
        <nav className="flex">
          <button
            onClick={() => setActiveSection('paper')}
            className={`flex-1 px-3 py-3 text-sm font-medium whitespace-nowrap ${
              activeSection === 'paper'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Page Layout
          </button>
          <button
            onClick={() => setActiveSection('elements')}
            className={`flex-1 px-3 py-3 text-sm font-medium whitespace-nowrap ${
              activeSection === 'elements'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Elements
          </button>
          <button
            onClick={() => setActiveSection('property')}
            className={`flex-1 px-3 py-3 text-sm font-medium whitespace-nowrap ${
              activeSection === 'property'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Property
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pl-4 pr-4 py-0 pb-4">
        {activeSection === 'paper' && (
          <div className="space-y-6 pt-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size
              </label>
              <select
                value={paperSettings.size}
                onChange={(e) => handlePaperSizeChange(e.target.value as 'A4' | 'A5' | 'Business Card' | 'Business Card (L)' | 'Custom')}
                className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              >
                <option value="Business Card (L)">Business Card (L) (180 × 110 mm)</option>
                <option value="Business Card">Business Card (90 × 55 mm)</option>
                <option value="A4">A4 (210 × 297 mm)</option>
                <option value="A5">A5 (148 × 210 mm)</option>
                <option value="Custom">Custom</option>
              </select>
            </div>

            {paperSettings.size === 'Custom' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Width (mm)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={paperSettings.width === 0 ? '' : paperSettings.width}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numValue = value === '' ? 0 : parseInt(value);
                      onPaperSettingsChange({
                        ...paperSettings,
                        width: numValue
                      });
                    }}
                    onFocus={(e) => {
                      if (e.target.value === '0') {
                        e.target.select();
                      }
                    }}
                    className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Height (mm)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={paperSettings.height === 0 ? '' : paperSettings.height}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numValue = value === '' ? 0 : parseInt(value);
                      onPaperSettingsChange({
                        ...paperSettings,
                        height: numValue
                      });
                    }}
                    onFocus={(e) => {
                      if (e.target.value === '0') {
                        e.target.select();
                      }
                    }}
                    className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Orientation
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleOrientationChange('portrait')}
                  className={`px-4 h-10 rounded-md border flex items-center justify-center text-xs ${
                    paperSettings.orientation === 'portrait'
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700'
                  }`}
                >
                  Portrait
                </button>
                <button
                  onClick={() => handleOrientationChange('landscape')}
                  className={`px-4 h-10 rounded-md border flex items-center justify-center text-xs ${
                    paperSettings.orientation === 'landscape'
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700'
                  }`}
                >
                  Landscape
                </button>
              </div>
            </div>

            {/* Background Settings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Background Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onPaperSettingsChange({
                    ...paperSettings,
                    background: { ...paperSettings.background, type: 'color' }
                  })}
                  className={`px-4 h-10 rounded-md border flex items-center justify-center text-xs ${
                    paperSettings.background.type === 'color'
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700'
                  }`}
                >
                  Color
                </button>
                <button
                  onClick={() => onPaperSettingsChange({
                    ...paperSettings,
                    background: { ...paperSettings.background, type: 'image' }
                  })}
                  className={`px-4 h-10 rounded-md border flex items-center justify-center text-xs ${
                    paperSettings.background.type === 'image'
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700'
                  }`}
                >
                  Image
                </button>
              </div>
            </div>

            {paperSettings.background.type === 'color' && (
              <div className="space-y-4">
                {/* Background Style Selection */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Background Style
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        // เอาค่าใน Background: 1 ไปใส่ใน Background Color เมื่อเปลี่ยนจาก Gradient ไป Base
                        const firstColor = paperSettings.background.gradient?.colors?.[0] || paperSettings.background.color || '#ffffff';
                        onPaperSettingsChange({
                          ...paperSettings,
                          background: {
                            ...paperSettings.background,
                            color: firstColor,
                            gradient: {
                              type: 'base',
                              colors: [firstColor],
                              direction: 'horizontal'
                            }
                          }
                        });
                      }}
                      className={`px-3 h-10 rounded-md border text-sm flex items-center justify-center ${
                        paperSettings.background.gradient?.type === 'base'
                          ? 'bg-orange-50 border-orange-500 text-orange-700'
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    >
                      Base
                    </button>
                    <button
                      onClick={() => {
                        // ใช้ค่าเดิมที่เก็บไว้
                        onPaperSettingsChange({
                          ...paperSettings,
                          background: {
                            ...paperSettings.background,
                            gradient: {
                              type: 'gradient',
                              colors: savedGradientColors,
                              direction: savedGradientDirection
                            }
                          }
                        });
                      }}
                      className={`px-3 h-10 rounded-md border text-sm flex items-center justify-center ${
                        paperSettings.background.gradient?.type === 'gradient'
                          ? 'bg-orange-50 border-orange-500 text-orange-700'
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    >
                      Gradient
                    </button>
                  </div>
                </div>

                {/* Base Color Selection */}
                {paperSettings.background.gradient?.type === 'base' && (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Background Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={paperSettings.background.color || '#ffffff'}
                        onChange={(e) => handleBackgroundColorChange(e.target.value)}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={paperSettings.background.color || '#ffffff'}
                        onChange={(e) => handleBackgroundColorChange(e.target.value)}
                        className="flex-1 h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* Gradient Color Selection */}
                {paperSettings.background.gradient?.type === 'gradient' && (
                  <div className="space-y-4">
                    {/* Gradient Direction */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        Direction
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => onGradientDirectionChange('horizontal')}
                          className={`px-3 h-10 rounded-md border text-sm flex items-center justify-center ${
                            paperSettings.background.gradient?.direction === 'horizontal'
                              ? 'bg-blue-50 border-blue-500 text-blue-700'
                              : 'bg-white border-gray-300 text-gray-700'
                          }`}
                        >
                          Horizontal
                        </button>
                        <button
                          onClick={() => onGradientDirectionChange('vertical')}
                          className={`px-3 h-10 rounded-md border text-sm flex items-center justify-center ${
                            paperSettings.background.gradient?.direction === 'vertical'
                              ? 'bg-blue-50 border-blue-500 text-blue-700'
                              : 'bg-white border-gray-300 text-gray-700'
                          }`}
                        >
                          Vertical
                        </button>
                        <button
                          onClick={() => onGradientDirectionChange('diagonal')}
                          className={`px-3 h-10 rounded-md border text-sm flex items-center justify-center ${
                            paperSettings.background.gradient?.direction === 'diagonal'
                              ? 'bg-blue-50 border-blue-500 text-blue-700'
                              : 'bg-white border-gray-300 text-gray-700'
                          }`}
                        >
                          Diagonal
                        </button>
                      </div>
                    </div>

                    {/* Gradient Colors */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        Colors
                      </label>
                      <div className="space-y-2">
                        {paperSettings.background.gradient?.colors?.map((color, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <input
                              type="color"
                              value={color}
                              onChange={(e) => {
                                const newColors = [...(paperSettings.background.gradient?.colors || [])];
                                newColors[index] = e.target.value;
                                onGradientColorsChange(newColors);
                              }}
                              className="w-12 h-10 border border-gray-300 rounded cursor-pointer flex-shrink-0"
                            />
                            <input
                              type="text"
                              value={color}
                              onChange={(e) => {
                                const newColors = [...(paperSettings.background.gradient?.colors || [])];
                                newColors[index] = e.target.value;
                                onGradientColorsChange(newColors);
                              }}
                              className="w-48 h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0"
                            />
                            {paperSettings.background.gradient?.colors && paperSettings.background.gradient.colors.length > 0 && (
                              <button
                                onClick={() => {
                                  const newColors = paperSettings.background.gradient?.colors?.filter((_, i) => i !== index) || [];
                                  onGradientColorsChange(newColors);
                                }}
                                className="px-2 py-2 text-red-600 hover:text-red-700 flex-shrink-0"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const newColors = [...(paperSettings.background.gradient?.colors || []), '#ffffff'];
                            onGradientColorsChange(newColors);
                          }}
                          className="w-full h-10 px-3 border border-dashed border-gray-300 rounded-md text-gray-500 hover:text-gray-700 hover:border-gray-400 flex items-center justify-center"
                        >
                          + Add Color
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {paperSettings.background.type === 'image' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Background Image
                  </label>
                  
                  {/* Show current image if exists */}
                  {paperSettings.background.image && (
                    <div className="mb-3">
                      <div className="text-xs text-gray-600 mb-2">Current Image:</div>
                      <div className="relative w-full h-32 bg-gray-100 rounded-md overflow-hidden">
                        <Image
                          src={paperSettings.background.image}
                          alt="Background preview"
                          fill
                          className="object-cover"
                          sizes="100vw"
                          unoptimized
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <div className="hidden absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
                          Image Error
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          handleBackgroundImageChange(e.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full h-12 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </div>

                {/* Image Fit Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image Fit
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onPaperSettingsChange({
                        ...paperSettings,
                        background: {
                          ...paperSettings.background,
                          imageFit: 'cover'
                        }
                      })}
                      className={`px-3 h-10 rounded-md border text-xs flex items-center justify-center ${
                        paperSettings.background.imageFit === 'cover'
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    >
                      Cover
                    </button>
                    <button
                      onClick={() => onPaperSettingsChange({
                        ...paperSettings,
                        background: {
                          ...paperSettings.background,
                          imageFit: 'contain'
                        }
                      })}
                      className={`px-3 h-10 rounded-md border text-xs flex items-center justify-center ${
                        paperSettings.background.imageFit === 'contain'
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    >
                      Contain
                    </button>
                    <button
                      onClick={() => onPaperSettingsChange({
                        ...paperSettings,
                        background: {
                          ...paperSettings.background,
                          imageFit: 'fill'
                        }
                      })}
                      className={`px-3 h-10 rounded-md border text-xs flex items-center justify-center ${
                        paperSettings.background.imageFit === 'fill'
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    >
                      Fill
                    </button>
                    <button
                      onClick={() => onPaperSettingsChange({
                        ...paperSettings,
                        background: {
                          ...paperSettings.background,
                          imageFit: 'none'
                        }
                      })}
                      className={`px-3 h-10 rounded-md border text-xs flex items-center justify-center ${
                        paperSettings.background.imageFit === 'none'
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    >
                      None
                    </button>
                  </div>
                </div>

                {/* Image Position */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image Position
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => onPaperSettingsChange({
                        ...paperSettings,
                        background: {
                          ...paperSettings.background,
                          imagePosition: 'top left'
                        }
                      })}
                      className={`px-2 py-2 rounded-md border text-xs ${
                        paperSettings.background.imagePosition === 'top left'
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    >
                      Top Left
                    </button>
                    <button
                      onClick={() => onPaperSettingsChange({
                        ...paperSettings,
                        background: {
                          ...paperSettings.background,
                          imagePosition: 'top center'
                        }
                      })}
                      className={`px-2 py-2 rounded-md border text-xs ${
                        paperSettings.background.imagePosition === 'top center'
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    >
                      Top Center
                    </button>
                    <button
                      onClick={() => onPaperSettingsChange({
                        ...paperSettings,
                        background: {
                          ...paperSettings.background,
                          imagePosition: 'top right'
                        }
                      })}
                      className={`px-2 py-2 rounded-md border text-xs ${
                        paperSettings.background.imagePosition === 'top right'
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    >
                      Top Right
                    </button>
                    <button
                      onClick={() => onPaperSettingsChange({
                        ...paperSettings,
                        background: {
                          ...paperSettings.background,
                          imagePosition: 'center left'
                        }
                      })}
                      className={`px-2 py-2 rounded-md border text-xs ${
                        paperSettings.background.imagePosition === 'center left'
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    >
                      Center Left
                    </button>
                    <button
                      onClick={() => onPaperSettingsChange({
                        ...paperSettings,
                        background: {
                          ...paperSettings.background,
                          imagePosition: 'center'
                        }
                      })}
                      className={`px-2 py-2 rounded-md border text-xs ${
                        paperSettings.background.imagePosition === 'center'
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    >
                      Center
                    </button>
                    <button
                      onClick={() => onPaperSettingsChange({
                        ...paperSettings,
                        background: {
                          ...paperSettings.background,
                          imagePosition: 'center right'
                        }
                      })}
                      className={`px-2 py-2 rounded-md border text-xs ${
                        paperSettings.background.imagePosition === 'center right'
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    >
                      Center Right
                    </button>
                    <button
                      onClick={() => onPaperSettingsChange({
                        ...paperSettings,
                        background: {
                          ...paperSettings.background,
                          imagePosition: 'bottom left'
                        }
                      })}
                      className={`px-2 py-2 rounded-md border text-xs ${
                        paperSettings.background.imagePosition === 'bottom left'
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    >
                      Bottom Left
                    </button>
                    <button
                      onClick={() => onPaperSettingsChange({
                        ...paperSettings,
                        background: {
                          ...paperSettings.background,
                          imagePosition: 'bottom center'
                        }
                      })}
                      className={`px-2 py-2 rounded-md border text-xs ${
                        paperSettings.background.imagePosition === 'bottom center'
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    >
                      Bottom Center
                    </button>
                    <button
                      onClick={() => onPaperSettingsChange({
                        ...paperSettings,
                        background: {
                          ...paperSettings.background,
                          imagePosition: 'bottom right'
                        }
                      })}
                      className={`px-2 py-2 rounded-md border text-xs ${
                        paperSettings.background.imagePosition === 'bottom right'
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    >
                      Bottom Right
                    </button>
                  </div>
                </div>

                {/* Image Repeat */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image Repeat
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onPaperSettingsChange({
                        ...paperSettings,
                        background: {
                          ...paperSettings.background,
                          imageRepeat: 'no-repeat'
                        }
                      })}
                      className={`px-3 h-10 rounded-md border text-xs flex items-center justify-center ${
                        paperSettings.background.imageRepeat === 'no-repeat'
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    >
                      No Repeat
                    </button>
                    <button
                      onClick={() => onPaperSettingsChange({
                        ...paperSettings,
                        background: {
                          ...paperSettings.background,
                          imageRepeat: 'repeat'
                        }
                      })}
                      className={`px-3 h-10 rounded-md border text-xs flex items-center justify-center ${
                        paperSettings.background.imageRepeat === 'repeat'
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    >
                      Repeat
                    </button>
                    <button
                      onClick={() => onPaperSettingsChange({
                        ...paperSettings,
                        background: {
                          ...paperSettings.background,
                          imageRepeat: 'repeat-x'
                        }
                      })}
                      className={`px-3 h-10 rounded-md border text-xs flex items-center justify-center ${
                        paperSettings.background.imageRepeat === 'repeat-x'
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    >
                      Repeat X
                    </button>
                    <button
                      onClick={() => onPaperSettingsChange({
                        ...paperSettings,
                        background: {
                          ...paperSettings.background,
                          imageRepeat: 'repeat-y'
                        }
                      })}
                      className={`px-3 h-10 rounded-md border text-xs flex items-center justify-center ${
                        paperSettings.background.imageRepeat === 'repeat-y'
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    >
                      Repeat Y
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}


        {activeSection === 'elements' && (
          <div className="space-y-4 pt-2">
            <h3 className="text-xs sm:text-sm font-medium text-gray-700">Drag elements to canvas</h3>
            
            <div className="space-y-2">
              <DraggableItem
                type="text"
                label="Text"
                icon="📝"
                field=""
              />
              <DraggableItem
                type="textarea"
                label="Text Area"
                icon="📄"
                field=""
              />
              <DraggableItem
                type="picture"
                label="Picture"
                icon="🖼️"
                field=""
              />
              <DraggableItem
                type="social"
                label="Social Media"
                icon="📱"
                field=""
              />
              <DraggableItem
                type="icon"
                label="Icon"
                icon="🎨"
                field=""
              />
              <DraggableItem
                type="qrcode"
                label="QR Code"
                icon="📱"
                field=""
              />
            </div>
          </div>
        )}

        {activeSection === 'property' && (
          <div className="pt-2">
            {selectedElement ? (
              <div className="bg-gray-50 rounded-lg p-3">
                <PropertyPanel
                  element={selectedElement}
                  onElementChange={onElementUpdate}
                  onElementDelete={onElementDelete}
                  onElementClose={onElementClose}
                  userData={userData}
                  useAddressPrefix={useAddressPrefix}
                  setUseAddressPrefix={setUseAddressPrefix}
                />
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm">Select an element to edit properties</p>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
