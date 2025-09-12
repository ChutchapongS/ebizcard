'use client';

import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { Download, Share2, Copy } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface QRCodeGeneratorProps {
  cardId: string;
  cardName: string;
  publicUrl: string;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  cardId,
  cardName,
  publicUrl,
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  const generateQRCodeDataURL = async () => {
    try {
      const response = await fetch('/api/generate-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cardId }),
      });

      const data = await response.json();
      if (data.success) {
        setQrCodeDataUrl(data.qrCode);
        return data.qrCode;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('ไม่สามารถสร้าง QR Code ได้');
      throw error;
    }
  };

  const downloadQRCode = async () => {
    try {
      let dataUrl = qrCodeDataUrl;
      if (!dataUrl) {
        dataUrl = await generateQRCodeDataURL();
      }

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${cardName.replace(/\s+/g, '_')}_QR.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('ดาวน์โหลด QR Code เรียบร้อยแล้ว');
    } catch (error) {
      toast.error('ไม่สามารถดาวน์โหลด QR Code ได้');
    }
  };

  const copyPublicUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success('คัดลอกลิงก์เรียบร้อยแล้ว');
    } catch (error) {
      toast.error('ไม่สามารถคัดลอกลิงก์ได้');
    }
  };

  const shareCard = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `นามบัตรของ ${cardName}`,
          text: `ดูนามบัตรดิจิทัลของ ${cardName}`,
          url: publicUrl,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      copyPublicUrl();
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        แชร์นามบัตรของคุณ
      </h3>
      
      <div className="space-y-4">
        {/* QR Code Display */}
        <div className="flex justify-center">
          <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
            <QRCode
              value={publicUrl}
              size={200}
              style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
            />
          </div>
        </div>

        {/* Public URL */}
        <div>
          <label className="label">ลิงก์สาธารณะ</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={publicUrl}
              readOnly
              className="input flex-1 text-sm"
            />
            <button
              onClick={copyPublicUrl}
              className="btn-secondary flex items-center gap-2"
            >
              <Copy size={16} />
              คัดลอก
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={downloadQRCode}
            className="btn-primary flex items-center gap-2 flex-1"
          >
            <Download size={16} />
            ดาวน์โหลด QR Code
          </button>
          
          <button
            onClick={shareCard}
            className="btn-secondary flex items-center gap-2 flex-1"
          >
            <Share2 size={16} />
            แชร์
          </button>
        </div>

        {/* Instructions */}
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
          <p className="font-medium mb-1">วิธีใช้งาน:</p>
          <ul className="space-y-1 text-xs">
            <li>• สแกน QR Code เพื่อเปิดนามบัตรดิจิทัล</li>
            <li>• แชร์ลิงก์ให้ผู้อื่นเพื่อดูนามบัตรของคุณ</li>
            <li>• ดาวน์โหลด QR Code เพื่อพิมพ์หรือใช้ในสื่อต่างๆ</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
