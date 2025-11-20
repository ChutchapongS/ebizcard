'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  Linkedin, 
  Twitter, 
  Facebook,
  Download,
  Share2,
  QrCode
} from 'lucide-react';

interface BusinessCard {
  id: string;
  name: string;
  job_title?: string;
  company?: string;
  phone?: string;
  email?: string;
  address?: string;
  social_links?: {
    website?: string;
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  theme?: string;
  created_at: string;
  updated_at: string;
}

interface DemoCardViewProps {
  card: BusinessCard;
}

export const DemoCardView = ({ card }: DemoCardViewProps) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [isDownloadingVCard, setIsDownloadingVCard] = useState(false);

  const socialLinks = card.social_links || {};

  const handleGenerateQR = async () => {
    setIsGeneratingQR(true);
    
    try {
      // Try to use real API first
      const response = await fetch('/api/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: card.id }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setQrCodeUrl(data.qrCode);
          setIsGeneratingQR(false);
          return;
        }
      }
    } catch (error) {
      // API failed, using fallback
    }
    
    // Fallback to simulated QR code
    setTimeout(() => {
      // Create a simple QR code-like pattern using SVG
      const qrCodeSvg = `
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="white" stroke="#000" stroke-width="2"/>
          <rect x="20" y="20" width="20" height="20" fill="#000"/>
          <rect x="60" y="20" width="20" height="20" fill="#000"/>
          <rect x="100" y="20" width="20" height="20" fill="#000"/>
          <rect x="140" y="20" width="20" height="20" fill="#000"/>
          <rect x="180" y="20" width="20" height="20" fill="#000"/>
          
          <rect x="20" y="60" width="20" height="20" fill="#000"/>
          <rect x="100" y="60" width="20" height="20" fill="#000"/>
          <rect x="180" y="60" width="20" height="20" fill="#000"/>
          
          <rect x="20" y="100" width="20" height="20" fill="#000"/>
          <rect x="60" y="100" width="20" height="20" fill="#000"/>
          <rect x="100" y="100" width="20" height="20" fill="#000"/>
          <rect x="140" y="100" width="20" height="20" fill="#000"/>
          <rect x="180" y="100" width="20" height="20" fill="#000"/>
          
          <rect x="20" y="140" width="20" height="20" fill="#000"/>
          <rect x="100" y="140" width="20" height="20" fill="#000"/>
          <rect x="180" y="140" width="20" height="20" fill="#000"/>
          
          <rect x="20" y="180" width="20" height="20" fill="#000"/>
          <rect x="60" y="180" width="20" height="20" fill="#000"/>
          <rect x="100" y="180" width="20" height="20" fill="#000"/>
          <rect x="140" y="180" width="20" height="20" fill="#000"/>
          <rect x="180" y="180" width="20" height="20" fill="#000"/>
          
          <text x="100" y="110" font-family="Arial" font-size="12" text-anchor="middle" fill="#000">Demo QR</text>
        </svg>
      `;
      
      const base64Svg = btoa(qrCodeSvg);
      setQrCodeUrl(`data:image/svg+xml;base64,${base64Svg}`);
      setIsGeneratingQR(false);
    }, 1500);
  };

  const handleDownloadVCard = async () => {
    setIsDownloadingVCard(true);
    // Simulate vCard generation
    setTimeout(() => {
      const vCardData = `BEGIN:VCARD
VERSION:3.0
FN:${card.name}
ORG:${card.company || ''}
TITLE:${card.job_title || ''}
TEL:${card.phone || ''}
EMAIL:${card.email || ''}
ADR:;;${card.address || ''};;;;
URL:${card.social_links?.website || ''}
END:VCARD`;

      const blob = new Blob([vCardData], { type: 'text/vcard' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${card.name.replace(/\s+/g, '_')}.vcf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setIsDownloadingVCard(false);
    }, 1000);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/card/${card.id}`;
    
    // Check if Web Share API is supported
    if (navigator.share) {
      try {
        await navigator.share({
          title: `นามบัตรดิจิทัล - ${card.name}`,
          text: `ดูนามบัตรดิจิทัลของ ${card.name}`,
          url: url,
        });
      } catch (error) {
        console.log('Error sharing:', error);
        // If share was cancelled or failed, fallback to copy link
        navigator.clipboard.writeText(url);
        toast.success('คัดลอกลิงก์เรียบร้อยแล้ว');
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(url);
      toast.success('คัดลอกลิงก์เรียบร้อยแล้ว');
    }
  };

  const handleCall = () => {
    if (card.phone) {
      window.open(`tel:${card.phone}`, '_self');
    }
  };

  const handleEmail = () => {
    if (card.email) {
      window.open(`mailto:${card.email}`, '_self');
    }
  };

  const handleWebsite = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Card Header */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-600 px-8 py-12 text-center">
        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl font-bold text-white">
            {card.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">{card.name}</h1>
        {card.job_title && (
          <p className="text-primary-100 text-lg">{card.job_title}</p>
        )}
        {card.company && (
          <p className="text-primary-200 text-sm">{card.company}</p>
        )}
      </div>

      {/* Contact Information */}
      <div className="p-6 space-y-4">
        {card.phone && (
          <button
            onClick={handleCall}
            className="w-full flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Phone className="w-5 h-5 text-primary-500 mr-3" />
            <span className="text-gray-900">{card.phone}</span>
          </button>
        )}

        {card.email && (
          <button
            onClick={handleEmail}
            className="w-full flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Mail className="w-5 h-5 text-primary-500 mr-3" />
            <span className="text-gray-900">{card.email}</span>
          </button>
        )}

        {card.address && (
          <div className="flex items-start p-3 rounded-lg">
            <MapPin className="w-5 h-5 text-primary-500 mr-3 mt-0.5" />
            <span className="text-gray-900">{card.address}</span>
          </div>
        )}

        {/* Social Links */}
        {Object.entries(socialLinks).map(([platform, url]) => {
          if (!url) return null;

          const iconMap: { [key: string]: React.ComponentType<any> } = {
            website: Globe,
            linkedin: Linkedin,
            twitter: Twitter,
            facebook: Facebook,
          };

          const Icon = iconMap[platform] || Globe;

          return (
            <button
              key={platform}
              onClick={() => handleWebsite(url)}
              className="w-full flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Icon className="w-5 h-5 text-primary-500 mr-3" />
              <span className="text-gray-900 capitalize">{platform}</span>
            </button>
          );
        })}
      </div>

      {/* QR Code Section */}
      <div className="px-6 pb-6">
        <div className="border-t border-gray-200 pt-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">QR Code</h3>
            
            {qrCodeUrl ? (
              <div className="space-y-4">
                <div className="w-48 h-48 mx-auto bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center">
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-gray-600 text-sm">
                  สแกนเพื่อดูนามบัตรดิจิทัล
                </p>
              </div>
            ) : (
              <button
                onClick={() => {
                  handleGenerateQR();
                }}
                disabled={isGeneratingQR}
                className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
              >
                <QrCode className="w-5 h-5 inline mr-2" />
                {isGeneratingQR ? 'กำลังสร้าง...' : 'สร้าง QR Code'}
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-3">
          <button
            onClick={handleDownloadVCard}
            disabled={isDownloadingVCard}
            className="w-full bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            <Download className="w-5 h-5 mr-2" />
            {isDownloadingVCard ? 'กำลังดาวน์โหลด...' : 'ดาวน์โหลด vCard'}
          </button>

          <button
            onClick={handleShare}
            className="w-full bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center"
          >
            <Share2 className="w-5 h-5 mr-2" />
            แชร์นามบัตร
          </button>
        </div>
      </div>
    </div>
  );
};
