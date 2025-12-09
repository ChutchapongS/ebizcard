'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { BusinessCard, PaperCardTemplate, PaperCardSettings } from '@/types';
import { Download, Printer, FileText, Settings } from 'lucide-react';

interface PaperCardExporterProps {
  card: BusinessCard;
  onClose: () => void;
}

export const PaperCardExporter = ({ card, onClose }: PaperCardExporterProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('classic');
  const [paperSettings, setPaperSettings] = useState<PaperCardSettings>({
    template_id: 'classic',
    size: {
      width: 85,
      height: 55,
      unit: 'mm',
    },
    print_settings: {
      bleed: 3,
      safe_area: 5,
      resolution: 300,
    },
    layout: {
      orientation: 'landscape',
      margins: {
        top: 5,
        right: 5,
        bottom: 5,
        left: 5,
      },
    },
  });

  const templates: PaperCardTemplate[] = [
    {
      id: 'classic',
      name: 'Classic',
      description: 'Traditional business card design',
      template_config: {
        width: 85,
        height: 55,
        unit: 'mm',
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        layout: 'horizontal',
      },
      preview_url: '/templates/classic-preview.png',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'modern',
      name: 'Modern',
      description: 'Clean minimalist design',
      template_config: {
        width: 85,
        height: 55,
        unit: 'mm',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none',
        layout: 'vertical',
      },
      preview_url: '/templates/modern-preview.png',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'corporate',
      name: 'Corporate',
      description: 'Professional corporate style',
      template_config: {
        width: 85,
        height: 55,
        unit: 'mm',
        background: '#f8fafc',
        border: '2px solid #1e40af',
        layout: 'horizontal',
      },
      preview_url: '/templates/corporate-preview.png',
      is_active: true,
      created_at: new Date().toISOString(),
    },
  ];

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setPaperSettings(prev => ({
        ...prev,
        template_id: templateId,
        size: {
          width: template.template_config.width,
          height: template.template_config.height,
          unit: template.template_config.unit as 'mm' | 'in' | 'px',
        },
      }));
    }
  };

  const handleExport = async (format: 'pdf' | 'png' | 'svg') => {
    try {
      // Use Edge Function
      const { exportPaperCard } = await import('@/lib/api-client');
      const blob = await exportPaperCard({
        cardId: card.id,
        template: selectedTemplate,
        settings: paperSettings,
        format,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${card.name.replace(/\s+/g, '-')}-business-card.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export business card. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-80 bg-gray-50 border-r border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Paper Card</h3>
            
            {/* Template Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Choose Template
              </label>
              <div className="space-y-2">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => handleTemplateChange(template.id)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedTemplate === template.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                        <p className="text-sm text-gray-600">{template.description}</p>
                      </div>
                      {selectedTemplate === template.id && (
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Size
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={paperSettings.size.width}
                    onChange={(e) => setPaperSettings(prev => ({
                      ...prev,
                      size: { ...prev.size, width: Number(e.target.value) }
                    }))}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Width"
                  />
                  <input
                    type="number"
                    value={paperSettings.size.height}
                    onChange={(e) => setPaperSettings(prev => ({
                      ...prev,
                      size: { ...prev.size, height: Number(e.target.value) }
                    }))}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Height"
                  />
                </div>
                <select
                  value={paperSettings.size.unit}
                  onChange={(e) => setPaperSettings(prev => ({
                    ...prev,
                    size: { ...prev.size, unit: e.target.value as 'mm' | 'in' | 'px' }
                  }))}
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="mm">Millimeters (mm)</option>
                  <option value="in">Inches (in)</option>
                  <option value="px">Pixels (px)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resolution (DPI)
                </label>
                <input
                  type="number"
                  value={paperSettings.print_settings.resolution}
                  onChange={(e) => setPaperSettings(prev => ({
                    ...prev,
                    print_settings: { ...prev.print_settings, resolution: Number(e.target.value) }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Preview & Export</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {/* Preview */}
            <div className="mb-6">
              <div className="bg-gray-100 p-8 rounded-lg flex justify-center">
                <div
                  className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                  style={{
                    width: `${paperSettings.size.width * 2}px`,
                    height: `${paperSettings.size.height * 2}px`,
                    transform: 'scale(0.8)',
                    transformOrigin: 'center',
                  }}
                >
                  <div className="h-full flex items-center">
                    {card.company_logo_url && (
                      <div className="w-12 h-12 mr-4 flex-shrink-0">
                        <img
                          src={card.company_logo_url}
                          alt="Company Logo"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-sm">{card.name}</h3>
                      {card.job_title && (
                        <p className="text-gray-600 text-xs">{card.job_title}</p>
                      )}
                      {card.company && (
                        <p className="text-gray-500 text-xs">{card.company}</p>
                      )}
                      {card.phone && (
                        <p className="text-gray-500 text-xs">{card.phone}</p>
                      )}
                      {card.email && (
                        <p className="text-gray-500 text-xs">{card.email}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => handleExport('pdf')}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <FileText className="w-4 h-4 mr-2" />
                Export PDF
              </button>
              <button
                onClick={() => handleExport('png')}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export PNG
              </button>
              <button
                onClick={() => handleExport('svg')}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export SVG
              </button>
            </div>

            <div className="mt-4 text-center text-sm text-gray-600">
              <p>Ready for professional printing</p>
              <p>High resolution • Print-ready format</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
