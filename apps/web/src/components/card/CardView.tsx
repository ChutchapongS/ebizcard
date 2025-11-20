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
  Share2
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

interface CardViewProps {
  card: BusinessCard;
}

export const CardView = ({ card }: CardViewProps) => {
  const [isDownloadingVCard, setIsDownloadingVCard] = useState(false);

  const socialLinks = card.social_links || {};

  const handleDownloadVCard = async () => {
    // Check if card has an ID (saved to database)
    if (!card.id || card.id === 'undefined' || card.id.startsWith('demo-')) {
      toast.error('กรุณาบันทึกนามบัตรก่อนดาวน์โหลด vCard');
      return;
    }

    setIsDownloadingVCard(true);
    try {
      const response = await fetch('/api/generate-vcard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: card.id }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate vCard');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${card.name.replace(/\s+/g, '_')}.vcf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading vCard:', error);
      toast.error('ไม่สามารถดาวน์โหลด vCard ได้');
    } finally {
      setIsDownloadingVCard(false);
    }
  };

  const handleShare = async () => {
    // Check if card has an ID (saved to database)
    if (!card.id || card.id === 'undefined' || card.id.startsWith('demo-')) {
      toast.error('กรุณาบันทึกนามบัตรก่อนแชร์');
      return;
    }

    // Use the same share functionality as Dashboard
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

      {/* Action Buttons */}
      <div className="px-6 pb-6">
        <div className="border-t border-gray-200 pt-6">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleDownloadVCard}
              disabled={isDownloadingVCard}
              className="bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center text-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              {isDownloadingVCard ? 'กำลังดาวน์โหลด...' : 'ดาวน์โหลด vCard'}
            </button>

            <button
              onClick={handleShare}
              className="bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center text-sm"
            >
              <Share2 className="w-4 h-4 mr-2" />
              แชร์นามบัตร
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};