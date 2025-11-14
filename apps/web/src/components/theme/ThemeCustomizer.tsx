'use client';

import React, { useState } from 'react';
import { CustomTheme, BusinessCard } from '@/types';
import { Palette, Type, Layout, Sparkles } from 'lucide-react';

interface ThemeCustomizerProps {
  card: BusinessCard;
  onThemeChange: (theme: CustomTheme) => void;
  onClose: () => void;
}

export const ThemeCustomizer = ({ card, onThemeChange, onClose }: ThemeCustomizerProps) => {
  const [activeTab, setActiveTab] = useState<'colors' | 'fonts' | 'layout' | 'effects'>('colors');
  const [customTheme, setCustomTheme] = useState<CustomTheme>(() => {
    if (card.custom_theme && typeof card.custom_theme === 'object') {
      return {
        name: card.custom_theme.name || 'Custom Theme',
        colors: card.custom_theme.colors || {
          primary: '#3b82f6',
          secondary: '#1e40af',
          background: '#ffffff',
          text: '#1f2937',
          accent: '#f59e0b',
        },
        fonts: card.custom_theme.fonts || {
          primary: 'Inter',
          secondary: 'Inter',
        },
        layout: card.custom_theme.layout || {
          type: 'horizontal',
          logo_position: 'left',
          text_alignment: 'left',
        },
        effects: card.custom_theme.effects || {
          gradient: {
            enabled: false,
            direction: 'to right',
            colors: ['#3b82f6', '#1e40af'],
          },
          shadow: {
            enabled: true,
            color: '#00000020',
            blur: 10,
            offset: { x: 0, y: 4 },
          },
          border: {
            enabled: false,
            color: '#e5e7eb',
            width: 1,
            radius: 8,
          },
        },
      };
    }
    
    return {
      name: 'Custom Theme',
      colors: {
        primary: '#3b82f6',
        secondary: '#1e40af',
        background: '#ffffff',
        text: '#1f2937',
        accent: '#f59e0b',
      },
      fonts: {
        primary: 'Inter',
        secondary: 'Inter',
      },
      layout: {
        type: 'horizontal',
        logo_position: 'left',
        text_alignment: 'left',
      },
      effects: {
        gradient: {
          enabled: false,
          direction: 'to right',
          colors: ['#3b82f6', '#1e40af'],
        },
        shadow: {
          enabled: true,
          color: '#00000020',
          blur: 10,
          offset: { x: 0, y: 4 },
        },
        border: {
          enabled: false,
          color: '#e5e7eb',
          width: 1,
          radius: 8,
        },
      },
    };
  });

  const handleColorChange = (colorType: keyof CustomTheme['colors'], value: string) => {
    setCustomTheme(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorType]: value,
      },
    }));
  };

  const handleFontChange = (fontType: keyof CustomTheme['fonts'], value: string) => {
    setCustomTheme(prev => ({
      ...prev,
      fonts: {
        ...prev.fonts,
        [fontType]: value,
      },
    }));
  };

  const handleLayoutChange = (layoutType: keyof CustomTheme['layout'], value: any) => {
    setCustomTheme(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        [layoutType]: value,
      },
    }));
  };

  const handleEffectChange = (effectType: keyof CustomTheme['effects'], value: any) => {
    setCustomTheme(prev => ({
      ...prev,
      effects: {
        ...prev.effects,
        [effectType]: value,
      },
    }));
  };

  const handleSave = () => {
    onThemeChange(customTheme);
    onClose();
  };

  const tabs = [
    { id: 'colors', label: 'Colors', icon: Palette },
    { id: 'fonts', label: 'Fonts', icon: Type },
    { id: 'layout', label: 'Layout', icon: Layout },
    { id: 'effects', label: 'Effects', icon: Sparkles },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customize Theme</h3>
            
            <div className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {tabs.find(tab => tab.id === activeTab)?.label}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {activeTab === 'colors' && (
                <div className="grid grid-cols-2 gap-4">
                  {customTheme.colors && Object.entries(customTheme.colors).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                        {key.replace('_', ' ')}
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={value}
                          onChange={(e) => handleColorChange(key as keyof CustomTheme['colors'], e.target.value)}
                          className="w-12 h-8 rounded border border-gray-300"
                        />
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => handleColorChange(key as keyof CustomTheme['colors'], e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'fonts' && (
                <div className="space-y-4">
                  {customTheme.fonts && Object.entries(customTheme.fonts).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                        {key.replace('_', ' ')} Font
                      </label>
                      <select
                        value={value}
                        onChange={(e) => handleFontChange(key as keyof CustomTheme['fonts'], e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="Inter">Inter</option>
                        <option value="Roboto">Roboto</option>
                        <option value="Open Sans">Open Sans</option>
                        <option value="Lato">Lato</option>
                        <option value="Montserrat">Montserrat</option>
                        <option value="Poppins">Poppins</option>
                        <option value="Source Sans Pro">Source Sans Pro</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'layout' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Layout Type
                    </label>
                    <select
                      value={customTheme.layout?.type || 'horizontal'}
                      onChange={(e) => handleLayoutChange('type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="horizontal">Horizontal</option>
                      <option value="vertical">Vertical</option>
                      <option value="centered">Centered</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Logo Position
                    </label>
                    <select
                      value={customTheme.layout?.logo_position || 'left'}
                      onChange={(e) => handleLayoutChange('logo_position', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                      <option value="top">Top</option>
                      <option value="bottom">Bottom</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Text Alignment
                    </label>
                    <select
                      value={customTheme.layout?.text_alignment || 'left'}
                      onChange={(e) => handleLayoutChange('text_alignment', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'effects' && (
                <div className="space-y-6">
                  {/* Gradient */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-gray-700">Gradient</label>
                      <input
                        type="checkbox"
                        checked={customTheme.effects?.gradient?.enabled || false}
                        onChange={(e) => handleEffectChange('gradient', {
                          ...customTheme.effects?.gradient,
                          enabled: e.target.checked,
                        })}
                        className="rounded border-gray-300"
                      />
                    </div>
                    {customTheme.effects?.gradient?.enabled && (
                      <div className="space-y-3 pl-4">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Direction</label>
                          <select
                            value={customTheme.effects?.gradient?.direction || 'to right'}
                            onChange={(e) => handleEffectChange('gradient', {
                              ...customTheme.effects?.gradient,
                              direction: e.target.value,
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="to right">Left to Right</option>
                            <option value="to left">Right to Left</option>
                            <option value="to bottom">Top to Bottom</option>
                            <option value="to top">Bottom to Top</option>
                            <option value="to bottom right">Diagonal</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Shadow */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-gray-700">Shadow</label>
                      <input
                        type="checkbox"
                        checked={customTheme.effects?.shadow?.enabled || false}
                        onChange={(e) => handleEffectChange('shadow', {
                          ...customTheme.effects?.shadow,
                          enabled: e.target.checked,
                        })}
                        className="rounded border-gray-300"
                      />
                    </div>
                  </div>

                  {/* Border */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-gray-700">Border</label>
                      <input
                        type="checkbox"
                        checked={customTheme.effects?.border?.enabled || false}
                        onChange={(e) => handleEffectChange('border', {
                          ...customTheme.effects?.border,
                          enabled: e.target.checked,
                        })}
                        className="rounded border-gray-300"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Apply Theme
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
