'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { 
  Download,
  Share2
} from 'lucide-react';
import { TemplatePreview } from '@/components/theme-customization/TemplatePreview';
import { Template } from '@/types/theme-customization';

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
  templates?: {
    id: string;
    name: string;
    elements?: any[];
    paper_settings?: {
      size?: string;
      width?: number;
      height?: number;
      orientation?: 'portrait' | 'landscape';
      background?: any;
    };
    paper?: {
      size?: string;
      width?: number;
      height?: number;
      orientation?: 'portrait' | 'landscape';
      background?: any;
    };
    preview_image?: string | null;
    preview_url?: string | null;
  };
  field_values?: { [key: string]: string };
  created_at: string;
  updated_at: string;
}

interface PublicCardViewProps {
  card: BusinessCard;
}

export const PublicCardView = ({ card }: PublicCardViewProps) => {
  const [isDownloadingVCard, setIsDownloadingVCard] = useState(false);

  const handleDownloadVCard = async () => {
    setIsDownloadingVCard(true);
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration is missing.');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-vcard`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
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

  // Convert card.templates to Template format for TemplatePreview
  const template: Template | null = card.templates ? (() => {
    const rawTemplate = card.templates;
    const rawPaper =
      (rawTemplate.paper as any) ||
      (rawTemplate.paper_settings as any) ||
      null;

    const paper = {
      size: rawPaper?.size || 'Business Card',
      width: rawPaper?.width || 90,
      height: rawPaper?.height || 55,
      orientation: rawPaper?.orientation || 'landscape',
      background:
        rawPaper?.background || {
          type: 'color',
          color: '#ffffff',
        },
    };

    return {
      id: rawTemplate.id,
      name: rawTemplate.name,
      paper,
      elements: rawTemplate.elements || [],
      createdAt: new Date(card.created_at),
      updatedAt: new Date(card.updated_at),
      previewImage:
        (rawTemplate.preview_image as string | undefined | null) ||
        (rawTemplate.preview_url as string | undefined | null) ||
        undefined,
    };
  })() : null;

  const fieldValues = card.field_values || {};

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl p-8">
      {/* Card Preview */}
      {template ? (
        <div className="mb-8 flex items-center justify-center py-8">
          <TemplatePreview 
            template={template} 
            fieldValues={fieldValues}
            scale={1.0}
          />
        </div>
      ) : (
        <div className="mb-6 p-8 bg-gray-100 rounded-lg text-center">
          <p className="text-gray-600">ไม่พบ template สำหรับนามบัตรนี้</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-6 grid grid-cols-2 gap-3">
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
  );
};
