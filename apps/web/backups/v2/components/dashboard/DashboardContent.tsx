// Backup v2 - DashboardContent
// This file is a snapshot of apps/web/src/components/dashboard/DashboardContent.tsx at v2

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Download, 
  Share2,
  Users,
  BarChart3,
  Settings,
  Palette,
  AlertCircle,
  Link as LinkIcon,
  Mail,
  MessageCircle,
  Facebook
} from 'lucide-react';
import { businessCards, supabase, testSupabaseConnection, testDirectConnection, templates as templatesService } from '@/lib/supabase/client';
import { createUserData, UserData } from '@/utils/userDataUtils';
import { TemplatePreview } from '@/components/theme-customization/TemplatePreview';
import { CardView } from '@/components/card/CardView';

interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

interface BusinessCard {
  id: string;
  name: string;
  job_title?: string;
  company?: string;
  phone?: string;
  email?: string;
  address?: string;
  social_links?: any;
  theme?: string;
  template_id?: string;
  field_values?: {[key: string]: string};
  custom_theme?: any;
  paper_card_settings?: any;
  created_at: string;
  updated_at: string;
}

interface DashboardContentProps {
  user: User;
}

const TemplateName = ({ templateId }: { templateId: string }) => {
  const [templateName, setTemplateName] = React.useState<string>('กำลังโหลด...');
  React.useEffect(() => {
    const loadTemplateName = async () => {
      try {
        const template = await templatesService.getById(templateId);
        setTemplateName((template as any)?.name || 'ไม่พบแบบ');
      } catch (error) {
        setTemplateName('ไม่พบแบบ');
      }
    };
    loadTemplateName();
  }, [templateId]);
  return <span>{templateName}</span>;
};

const CardPreview = ({ card, userProfileData }: { card: BusinessCard; userProfileData: any }) => {
  const [template, setTemplate] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  React.useEffect(() => {
    const loadTemplate = async () => {
      if (!card.template_id) {
        setIsLoading(false);
        return;
      }
      try {
        const tpl = await templatesService.getById(card.template_id);
        if (tpl) {
          const withValues = {
            ...(tpl as any),
            elements: ((tpl as any)?.elements || []).map((el: any) => ({
              ...el,
              content: (card.field_values && (card.field_values as any)[el.id]) ?? el.content ?? ''
            })),
          };
          setTemplate(withValues);
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadTemplate();
  }, [card.template_id, card.field_values]);
  if (isLoading) return <div className="w-full h-48 bg-gray-100" />;
  if (!template) return <div className="w-full h-48 bg-gray-100" />;
  return (
    <div className="w-full h-48 bg-gray-50 flex items-center justify-center overflow-hidden border-b border-gray-200">
      <TemplatePreview 
        template={template} 
        userData={userProfileData!}
        scale={0.6}
        previewImage={template.previewImage}
        fieldValues={(card.field_values as any) || {}}
      />
    </div>
  );
};

export const DashboardContent = ({ user }: DashboardContentProps) => {
  const router = useRouter();
  // ... existing code snapshot ...
  return <div />;
};
