'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Check } from 'lucide-react';

interface LogoUploadProps {
  currentLogoUrl?: string;
  onLogoChange: (logoUrl: string) => void;
  onRemove: () => void;
}

export const LogoUpload = ({ currentLogoUrl, onLogoChange, onRemove }: LogoUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Use Edge Function
      const { uploadLogo } = await import('@/lib/api-client');
      const result = await uploadLogo(file, 'logo');
      onLogoChange(result.url);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Failed to upload logo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    onRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Company Logo
      </label>

      {currentLogoUrl ? (
        <div className="relative">
          <div className="w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
            <img
              src={currentLogoUrl}
              alt="Company Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <button
            onClick={handleRemove}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={handleClick}
          className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
        >
          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-xs text-gray-500 mt-2">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="w-8 h-8 text-gray-400" />
              <span className="text-xs text-gray-500 mt-2">Upload Logo</span>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {uploadError && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {uploadError}
        </div>
      )}

      <div className="text-xs text-gray-500">
        <p>• Supported formats: JPG, PNG, SVG</p>
        <p>• Max file size: 5MB</p>
        <p>• Recommended size: 200x200px or larger</p>
      </div>
    </div>
  );
};
