'use client';

import React, { useState, useEffect } from 'react';
import { QrCode, Download, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface QRCodeGeneratorProps {
  cardId: string;
  cardName: string;
  className?: string;
}

/**
 * React Component: QRCodeGenerator
 * 
 * A component that generates and displays a QR code for a business card.
 * Provides functionality to generate, download, and copy the QR code URL.
 * 
 * The QR code automatically generates when the component mounts (if cardId is valid).
 * Users can download the QR code image or copy the public URL to share.
 * 
 * @param {QRCodeGeneratorProps} props - Component props
 * @param {string} props.cardId - The unique identifier of the business card
 * @param {string} props.cardName - The name/title of the business card (for display)
 * @param {string} [props.className] - Optional CSS class names for styling
 * 
 * @returns {JSX.Element} QR code generator component with controls
 * 
 * @example
 * ```typescript
 * <QRCodeGenerator 
 *   cardId="card-123" 
 *   cardName="John Doe's Business Card"
 *   className="my-custom-class"
 * />
 * ```
 */
export const QRCodeGenerator = ({ cardId, cardName, className = '' }: QRCodeGeneratorProps) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [publicUrl, setPublicUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate QR code when component mounts
  useEffect(() => {
    if (cardId && cardId !== 'undefined' && !cardId.startsWith('demo-')) {
      generateQRCode();
    }
  }, [cardId]);

  const generateQRCode = async () => {
    // Check if card has an ID (saved to database)
    if (!cardId || cardId === 'undefined' || cardId.startsWith('demo-')) {
      const errorMsg = 'กรุณาบันทึกนามบัตรก่อนสร้าง QR Code';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const response = await fetch('/api/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('QR API error:', errorData);
        throw new Error(errorData.error || 'Failed to generate QR code');
      }

      const data = await response.json();
      
      if (data.success) {
        setQrCodeUrl(data.qrCode);
        setPublicUrl(data.publicUrl);
        toast.success('สร้าง QR Code สำเร็จ');
      } else {
        throw new Error(data.error || 'Failed to generate QR code');
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      const err = error as Error;
      const errorMsg = `ไม่สามารถสร้าง QR Code ได้: ${err.message}`;
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = async () => {
    if (!qrCodeUrl) return;

    setIsDownloading(true);
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-code-${cardName.replace(/\s+/g, '-')}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error('ไม่สามารถดาวน์โหลด QR Code ได้');
    } finally {
      setIsDownloading(false);
    }
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setIsCopied(true);
      toast.success('คัดลอกลิงก์สำเร็จ');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Error copying URL:', error);
      toast.error('ไม่สามารถคัดลอกลิงก์ได้');
    }
  };

  const shareUrl = async () => {
    const shareData = {
      title: `นามบัตรดิจิทัล - ${cardName}`,
      text: `ดูนามบัตรดิจิทัลของ ${cardName}`,
      url: publicUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      copyUrl();
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">QR Code</h3>
        
        {/* Error Message */}
        {error && (
          <div className="mb-4">
            <ErrorMessage 
              message={error} 
              onDismiss={() => setError(null)}
              variant="error"
            />
          </div>
        )}
        
        {/* Loading State */}
        {isGenerating && !qrCodeUrl && (
          <div className="mb-4">
            <LoadingSpinner text="กำลังสร้าง QR Code..." />
          </div>
        )}
        
        {qrCodeUrl ? (
          <div className="space-y-4">
            <div className="w-48 h-48 mx-auto bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center">
              <img 
                src={qrCodeUrl} 
                alt="QR Code" 
                className="w-full h-full object-contain"
              />
            </div>
            
            <div className="space-y-2">
              <p className="text-gray-600 text-sm">
                สแกนเพื่อดูนามบัตรดิจิทัล
              </p>
              
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={downloadQRCode}
                  disabled={isDownloading}
                  className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isDownloading ? 'กำลังดาวน์โหลด...' : 'ดาวน์โหลด'}
                </button>
                
                <button
                  onClick={shareUrl}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  แชร์
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-48 h-48 mx-auto bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
              <QrCode className="w-16 h-16 text-gray-400" />
            </div>
            
            <button
              onClick={generateQRCode}
              disabled={isGenerating}
              className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center mx-auto"
            >
              <QrCode className="w-5 h-5 mr-2" />
              {isGenerating ? 'กำลังสร้าง...' : 'สร้าง QR Code'}
            </button>
          </div>
        )}

        {/* Public URL */}
        {publicUrl && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">ลิงก์สาธารณะ:</p>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={publicUrl}
                readOnly
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50"
              />
              <button
                onClick={copyUrl}
                className="bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center"
              >
                {isCopied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};