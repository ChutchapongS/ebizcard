'use client';

import React, { useState, useRef } from 'react';
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
  Facebook,
  TrendingUp,
} from 'lucide-react';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { businessCards, supabase, testSupabaseConnection, testDirectConnection, templates as templatesService } from '@/lib/supabase/client';
import { createUserData, UserData } from '@/utils/userDataUtils';
import { TemplatePreview } from '@/components/theme-customization/TemplatePreview';
import { CardView } from '@/components/card/CardView';
import type { CardView as CardViewLog } from '@/types';

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

interface TemplateDownloadStat {
  templateId: string | null;
  cardId: string;
  cardName: string;
  count: number;
}

interface DashboardContentProps {
  user: User;
}

// Component to display template name
const TemplateName = ({ templateId }: { templateId: string }) => {
  const [templateName, setTemplateName] = React.useState<string>('กำลังโหลด...');

  React.useEffect(() => {
    const loadTemplateName = async () => {
      try {
        const template = await templatesService.getById(templateId);
        setTemplateName((template as any)?.name || 'ไม่พบแบบ');
      } catch (error) {
        console.error('Error loading template name:', error);
        setTemplateName('ไม่พบแบบ');
      }
    };
    loadTemplateName();
  }, [templateId]);

  return <span>{templateName}</span>;
};

// Component to display card preview with template
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
          // Merge template with card field values
          const withValues = {
            ...(tpl as any),
            elements: ((tpl as any)?.elements || []).map((el: any) => ({
              ...el,
              content: (card.field_values && (card.field_values as any)[el.id]) ?? el.content ?? ''
            })),
          };
          setTemplate(withValues);
        }
      } catch (error) {
        console.error('Error loading template for preview:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTemplate();
  }, [card.template_id, card.field_values]);

  if (isLoading) {
    return (
      <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
        <div className="transform scale-[0.35] origin-center">
          <CardView card={card} />
        </div>
      </div>
    );
  }

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
  const [selectedCard, setSelectedCard] = useState<BusinessCard | null>(null);
  const [shareModalCard, setShareModalCard] = useState<BusinessCard | null>(null);
  const [shareQRCode, setShareQRCode] = useState<string>('');
  const [isGeneratingShareQR, setIsGeneratingShareQR] = useState(false);
  const [userProfileData, setUserProfileData] = useState<any>(null);
  
  // Load user profile data
  React.useEffect(() => {
    const loadUserProfile = async () => {
      if (!user?.id) return;
      
      try {
        // Get current session for authentication
        const { data: { session } } = await supabase!.auth.getSession();
        const accessToken = session?.access_token;
        
        if (!accessToken) {
          console.error('❌ No access token available');
          return;
        }
        
        const response = await fetch('/api/get-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_token: accessToken
          })
        });
        
        const data = await response.json();
        
        if (data.success && data.profile) {
          const userData = createUserData(data.profile, user, data.profile.addresses || []);
          setUserProfileData(userData);
        }
      } catch (error) {
        console.error('❌ Error loading user profile for Dashboard:', error);
      }
    };
    
    loadUserProfile();
  }, [user?.id]);
  
  // Function to get display data from field_values or fallback to basic fields
  const getDisplayData = (card: BusinessCard) => {
    if (card.field_values && Object.keys(card.field_values).length > 0) {
      const fieldValues = card.field_values;
      
      // Extract all non-empty values from field_values
      const allValues = Object.values(fieldValues).filter(value => 
        value && value.trim() !== ''
      );
      
      // Use the first few values for display
      const name = allValues[0] || card.name;
      const jobTitle = allValues[1] || card.job_title;
      const company = allValues[2] || card.company;
      
      // Also include additional fields if available
      const phone = allValues.find(value => 
        value && (value.includes('081') || value.includes('0') || /^\d+$/.test(value))
      ) || card.phone;
      
      const email = allValues.find(value => 
        value && value.includes('@')
      ) || card.email;
      
      const address = allValues.find(value => 
        value && (value.includes('ถ.') || value.includes('กรุงเทพ') || value.includes('บาง'))
      ) || card.address;
      
      // New fields
      const personalId = allValues.find(value => 
        value && /^\d{13}$/.test(value.replace(/\D/g, ''))
      ) || '';
      
      const taxIdMain = allValues.find(value => 
        value && value.includes('Tax') && value.includes('Main')
      ) || '';
      
      const taxIdBranch = allValues.find(value => 
        value && value.includes('Tax') && value.includes('Branch')
      ) || '';
      
      const personalAddress1 = allValues.find(value => 
        value && value.includes('Personal') && value.includes('1')
      ) || '';
      
      const personalAddress2 = allValues.find(value => 
        value && value.includes('Personal') && value.includes('2')
      ) || '';
      
      const workAddress1 = allValues.find(value => 
        value && value.includes('Work') && value.includes('1')
      ) || '';
      
      const workAddress2 = allValues.find(value => 
        value && value.includes('Work') && value.includes('2')
      ) || '';
      
      // Social Media Fields
      const facebook = allValues.find(value => 
        value && (value.includes('facebook.com') || value.includes('fb.com'))
      ) || '';
      
      const line = allValues.find(value => 
        value && value.includes('Line')
      ) || '';
      
      const linkedin = allValues.find(value => 
        value && value.includes('linkedin.com')
      ) || '';
      
      const twitter = allValues.find(value => 
        value && value.includes('twitter.com')
      ) || '';
      
      const instagram = allValues.find(value => 
        value && value.includes('instagram.com')
      ) || '';
      
      const youtube = allValues.find(value => 
        value && value.includes('youtube.com')
      ) || '';
      
      const telegram = allValues.find(value => 
        value && value.includes('@') && value.includes('telegram')
      ) || '';
      
      const whatsapp = allValues.find(value => 
        value && (value.includes('+66') || value.includes('whatsapp'))
      ) || '';
      
      const wechat = allValues.find(value => 
        value && value.includes('wechat')
      ) || '';
      
      const snapchat = allValues.find(value => 
        value && value.includes('snapchat')
      ) || '';
      
      const pinterest = allValues.find(value => 
        value && value.includes('pinterest.com')
      ) || '';
      
      const reddit = allValues.find(value => 
        value && value.includes('reddit.com')
      ) || '';
      
      const discord = allValues.find(value => 
        value && value.includes('discord')
      ) || '';
      
      const slack = allValues.find(value => 
        value && value.includes('slack.com')
      ) || '';
      
      const viber = allValues.find(value => 
        value && value.includes('viber')
      ) || '';
      
      const skype = allValues.find(value => 
        value && value.includes('skype')
      ) || '';
      
      const zoom = allValues.find(value => 
        value && value.includes('zoom.us')
      ) || '';
      
      const github = allValues.find(value => 
        value && value.includes('github.com')
      ) || '';
      
      const twitch = allValues.find(value => 
        value && value.includes('twitch.tv')
      ) || '';
      
      const result = {
        name: name || card.name,
        job_title: jobTitle || card.job_title,
        company: company || card.company,
        phone: phone || card.phone,
        email: email || card.email,
        address: address || card.address,
        // New fields
        personalId: personalId,
        taxIdMain: taxIdMain,
        taxIdBranch: taxIdBranch,
        personalAddress1: personalAddress1,
        personalAddress2: personalAddress2,
        workAddress1: workAddress1,
        workAddress2: workAddress2,
        // Social Media Fields
        facebook: facebook,
        line: line,
        linkedin: linkedin,
        twitter: twitter,
        instagram: instagram,
        youtube: youtube,
        telegram: telegram,
        whatsapp: whatsapp,
        wechat: wechat,
        snapchat: snapchat,
        pinterest: pinterest,
        reddit: reddit,
        discord: discord,
        slack: slack,
        viber: viber,
        skype: skype,
        zoom: zoom,
        github: github,
        twitch: twitch,
        // Include all field_values for complete data
        field_values: fieldValues
      } as any;
      
      return result;
    }
    
    // Fallback to basic fields
    const fallbackResult = {
      name: card.name,
      job_title: card.job_title,
      company: card.company,
      phone: card.phone,
      email: card.email,
      address: card.address
    };
    
    return fallbackResult;
  };
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const hasLoadedRef = React.useRef(false);
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const [templateNames, setTemplateNames] = useState<Record<string, string>>({});
  const [viewCount, setViewCount] = useState<number>(0);
  const [leadCount, setLeadCount] = useState<number>(0);
  const [templateDownloadStats, setTemplateDownloadStats] = useState<TemplateDownloadStat[]>([]);
  const [isLoadingTemplateStats, setIsLoadingTemplateStats] = useState<boolean>(false);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);
  const [activeStat, setActiveStat] = useState<'cards' | 'leads' | 'views'>('cards');
  const [viewLogs, setViewLogs] = useState<CardViewLog[]>([]);
  const [isLoadingViewLogs, setIsLoadingViewLogs] = useState<boolean>(false);
  const [viewLogsError, setViewLogsError] = useState<string | null>(null);
  const viewLogsFetchInProgressRef = React.useRef(false);

  const sortedTemplateDownloadStats = React.useMemo(
    () => [...templateDownloadStats].sort((a, b) => b.count - a.count),
    [templateDownloadStats],
  );

  const getTemplateDisplayName = React.useCallback(
    (stat: TemplateDownloadStat) => {
      if (stat.templateId && templateNames[stat.templateId]) {
        return templateNames[stat.templateId];
      }
      if (stat.templateId) {
        return `Template ${stat.templateId.slice(0, 8)}...`;
      }
      return stat.cardName ? `นามบัตร: ${stat.cardName}` : 'นามบัตรไม่ระบุ';
    },
    [templateNames],
  );

  const fetchDashboardStats = React.useCallback(async (ownerId: string, cardList: BusinessCard[]) => {
    if (!supabase) {
      setViewCount(0);
      setIsLoadingStats(false);
      setLeadCount(0);
      setTemplateDownloadStats([]);
      setIsLoadingTemplateStats(false);
      return;
    }

    setIsLoadingStats(true);
    setIsLoadingTemplateStats(true);

    try {
      const cardIds = cardList.map((card) => card.id).filter(Boolean);

      if (cardIds.length === 0) {
        setViewCount(0);
      } else {
        const { count: viewsCount, error: viewsError } = await supabase
          .from('card_views')
          .select('id', { count: 'exact', head: true })
          .in('card_id', cardIds);

        if (viewsError) {
          throw viewsError;
        }

        setViewCount(viewsCount ?? 0);
      }

      const cardMap = new Map(cardList.map((card) => [card.id, card]));
      const { data: leadRows, error: leadError } = await supabase
        .from('contact_leads')
        .select('card_id')
        .eq('owner_id', ownerId);

      if (leadError) {
        console.error('Error loading contact lead stats:', leadError);
        setLeadCount(0);
        setTemplateDownloadStats([]);
      } else {
        const rows = Array.isArray(leadRows) ? leadRows : [];
        setLeadCount(rows.length);

        if (rows.length > 0) {
          const statsMap = new Map<string, TemplateDownloadStat>();

          rows.forEach((row: { card_id?: string | null }) => {
            const cardId = row?.card_id ?? 'unknown';
            const card = cardMap.get(cardId);
            const templateId = card?.template_id ?? null;
            const key = templateId ?? `card:${cardId}`;

            let stat = statsMap.get(key);
            if (!stat) {
              stat = {
                templateId,
                cardId,
                cardName: card?.name || 'ไม่พบนามบัตร',
                count: 0,
              };
              statsMap.set(key, stat);
            }
            stat.count += 1;
          });

          setTemplateDownloadStats(Array.from(statsMap.values()));
        } else {
          setTemplateDownloadStats([]);
        }
      }
    } catch (statsError) {
      console.error('Error loading dashboard stats:', statsError);
      setViewCount(0);
      setLeadCount(0);
      setTemplateDownloadStats([]);
    } finally {
      setIsLoadingStats(false);
      setIsLoadingTemplateStats(false);
    }
  }, [supabase]);

  const fetchCardViewLogs = React.useCallback(async (ownerId: string, cardList: BusinessCard[]) => {
    if (!supabase || !ownerId) {
      setViewLogs([]);
      setViewLogsError(null);
      setIsLoadingViewLogs(false);
      return;
    }

    const cardIds = cardList.map((card) => card.id).filter(Boolean);
    if (cardIds.length === 0) {
      setViewLogs([]);
      setViewLogsError(null);
      setIsLoadingViewLogs(false);
      return;
    }

    if (viewLogsFetchInProgressRef.current) {
      return;
    }

    viewLogsFetchInProgressRef.current = true;
    setIsLoadingViewLogs(true);
    setViewLogsError(null);

    try {
      const { data, error } = await supabase!
        .from('card_views')
        .select('id, card_id, card_name, viewer_ip, device_info, created_at')
        .in('card_id', cardIds)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) {
        throw error;
      }

      setViewLogs((data as CardViewLog[]) ?? []);
    } catch (fetchError) {
      console.error('Error loading card view logs:', fetchError);
      setViewLogs([]);
      setViewLogsError(
        fetchError instanceof Error ? fetchError.message : 'ไม่สามารถโหลดข้อมูลการดูได้'
      );
    } finally {
      setIsLoadingViewLogs(false);
      viewLogsFetchInProgressRef.current = false;
    }
  }, [supabase]);

  // Load all template names for search matching
  React.useEffect(() => {
    const loadTemplateNames = async () => {
      try {
        const list: any[] = await templatesService.getAll();
        const map: Record<string, string> = {};
        (list || []).forEach((t: any) => {
          if (t?.id) map[t.id] = t.name || '';
        });
        setTemplateNames(map);
      } catch (e) {
        console.warn('Failed to load template names for search');
      }
    };
    loadTemplateNames();
  }, []);

  // Match function: search against card.name and every element value in field_values
  const matchesSearch = (card: BusinessCard, query: string): boolean => {
    const q = (query || '').toLowerCase().trim();
    if (!q) return true;
    const haystack: string[] = [];
    if (card.name) haystack.push(card.name.toLowerCase());
    if (card.field_values) {
      Object.values(card.field_values).forEach((v) => {
        if (typeof v === 'string' && v) haystack.push(v.toLowerCase());
      });
    }
    // Include template name
    if (card.template_id && templateNames[card.template_id]) {
      haystack.push(templateNames[card.template_id].toLowerCase());
    }
    return haystack.some((s) => s.includes(q));
  };

  const handleDownloadVCardPreview = async () => {
    if (!selectedCard?.id || selectedCard.id === 'undefined' || selectedCard.id.startsWith('demo-')) {
      toast.error('กรุณาบันทึกนามบัตรก่อนดาวน์โหลด vCard');
      return;
    }
    try {
      // Get current session for authentication
      const { data: { session } } = await supabase!.auth.getSession();
      const authToken = session?.access_token;
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-vcard`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        },
        body: JSON.stringify({ cardId: selectedCard.id }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to generate vCard: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(selectedCard.name || 'card').replace(/\s+/g, '_')}.vcf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading vCard:', error);
      toast.error('ไม่สามารถดาวน์โหลด vCard ได้');
    }
  };

  const handleDownloadVCard = async (card: BusinessCard) => {
    if (!card?.id || card.id === 'undefined' || card.id.startsWith('demo-')) {
      toast.error('กรุณาบันทึกนามบัตรก่อนดาวน์โหลด vCard');
      return;
    }
    try {
      // Use Supabase client to invoke the function
      const { data, error } = await supabase!.functions.invoke('generate-vcard', {
        body: { cardId: card.id }
      });
      
      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }
      
      // Convert the response to a blob
      const vcardContent = typeof data === 'string' ? data : JSON.stringify(data);
      const blob = new Blob([vcardContent], { type: 'text/vcard' });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(card.name || 'card').replace(/\s+/g, '_')}.vcf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Error downloading vCard:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      toast.error('ไม่สามารถดาวน์โหลด vCard ได้: ' + (error.message || 'Unknown error'));
    }
  };

  const handleSharePreview = async () => {
    if (!selectedCard?.id || selectedCard.id === 'undefined' || selectedCard.id.startsWith('demo-')) {
      toast.error('กรุณาบันทึกนามบัตรก่อนแชร์');
      return;
    }

    // ใช้ share modal แทนการ copy link
    setShareModalCard(selectedCard);
    setIsGeneratingShareQR(true);
    setShareQRCode('');
    
    try {
      // Generate QR Code automatically
      const response = await fetch('/api/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: selectedCard.id }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.qrCode) {
          setShareQRCode(data.qrCode);
        }
      }
    } catch (error) {
      console.error('Error generating QR for share:', error);
    } finally {
      setIsGeneratingShareQR(false);
    }
  };


  // Handle case when user is not available
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">กรุณาเข้าสู่ระบบ</h2>
          <p className="text-gray-600 mb-4">ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่</p>
          <button
            onClick={() => window.location.href = '/auth/login'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            ไปหน้าเข้าสู่ระบบ
          </button>
        </div>
      </div>
    );
  }

  // Load business cards with offline fallback
  React.useEffect(() => {
    const loadCards = async () => {
      // Check if user is still authenticated
      if (!user?.id) {
        setIsLoading(false);
        setError('กรุณาเข้าสู่ระบบใหม่');
        return;
      }

      try {
        // Check current session
        const { data: { session } } = await supabase!.auth.getSession();
        
        const data = await businessCards.getAll(user.id);
        
        if (data && data.length > 0) {
          setCards(data);
          setError(null);
          setIsOfflineMode(false);
          
          // Cache the data for offline use
          localStorage.setItem(`cards_${user.id}`, JSON.stringify(data));
        } else {
          // No cards found - this is normal for new users
          setCards([]);
          setError(null); // Don't show error for empty state
          setIsOfflineMode(false);
        }
      } catch (err) {
        console.error('Error loading cards:', err);
        
        // Check if user is still authenticated after error
        // Skip auth check to avoid ERR_CONNECTION_CLOSED issues
        
        // Try to load cached data first
        const cachedData = localStorage.getItem(`cards_${user.id}`);
        if (cachedData) {
          try {
            const parsedCards = JSON.parse(cachedData);
            setCards(parsedCards);
            setIsOfflineMode(true);
            setError('กำลังแสดงข้อมูลที่บันทึกไว้ (ออฟไลน์)');
            return;
          } catch (cacheError) {
            console.error('Error parsing cached data:', cacheError);
          }
        }
        
        // More specific error messages
        let errorMessage = 'ไม่สามารถโหลดนามบัตรได้';
        if (err instanceof Error) {
          if (err.message.includes('Failed to fetch') || 
              err.message.includes('ERR_CONNECTION_CLOSED') ||
              err.message.includes('ERR_HTTP2_PROTOCOL_ERROR')) {
            errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
          } else if (err.message.includes('AuthRetryableFetchError')) {
            errorMessage = 'เกิดข้อผิดพลาดในการยืนยันตัวตน กรุณาลองใหม่อีกครั้ง';
          } else if (err.message.includes('User not authenticated')) {
            errorMessage = 'กรุณาเข้าสู่ระบบใหม่';
          } else if (err.message.includes('No connection to Supabase')) {
            errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
          } else if (err.message.includes('permission denied') || err.message.includes('RLS')) {
            errorMessage = 'ไม่มีสิทธิ์เข้าถึงข้อมูล กรุณาติดต่อผู้ดูแลระบบ';
          } else if (err.message.includes('relation') && err.message.includes('does not exist')) {
            errorMessage = 'ตารางข้อมูลยังไม่ได้สร้าง กรุณาติดต่อผู้ดูแลระบบ';
          } else {
            errorMessage = `เกิดข้อผิดพลาด: ${err.message}`;
          }
        }
        
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadCards();
    } else if (!user?.id) {
      setIsLoading(false);
      setError('กรุณาเข้าสู่ระบบใหม่');
    }
  }, [user?.id]); // Only run when user.id changes

  // Reset hasLoaded when user changes
  React.useEffect(() => {
    hasLoadedRef.current = false;
  }, [user?.id]);

  React.useEffect(() => {
    if (!user?.id) {
      setLeadCount(0);
      setTemplateDownloadStats([]);
      setViewCount(0);
      setIsLoadingStats(false);
      setIsLoadingTemplateStats(false);
      return;
    }

    fetchDashboardStats(user.id, cards);
  }, [user?.id, cards, fetchDashboardStats]);

  React.useEffect(() => {
    if (activeStat === 'views' && user?.id) {
      fetchCardViewLogs(user.id, cards);
    }
  }, [activeStat, user?.id, cards, fetchCardViewLogs]);

  const handleDeleteCard = async (cardId: string) => {
    if (confirm('คุณต้องการลบนามบัตรนี้หรือไม่?')) {
      try {
        await businessCards.delete(cardId);
        setCards(cards.filter(card => card.id !== cardId));
        toast.success('ลบนามบัตรเรียบร้อยแล้ว');
      } catch (error) {
        console.error('Error deleting card:', error);
        toast.error('ไม่สามารถลบนามบัตรได้');
      }
    }
  };

  const handlePreviewCard = async (card: BusinessCard) => {
    setSelectedCard(card);
    setPreviewTemplate(null);
    try {
      if (card.template_id) {
        setIsLoadingPreview(true);
        const tpl: any = await templatesService.getById(card.template_id);
        const withValues = {
          ...tpl,
          elements: (tpl?.elements || []).map((el: any) => ({
            ...el,
            content: (card.field_values && (card.field_values as any)[el.id]) ?? el.content ?? ''
          })),
        };
        setPreviewTemplate(withValues);
      }
    } catch (e) {
      console.error('Error loading preview template:', e);
    } finally {
      setIsLoadingPreview(false);
    }
  };


  const handleShareCard = async (card: BusinessCard) => {
    setShareModalCard(card);
    setIsGeneratingShareQR(true);
    setShareQRCode('');
    
    try {
      // Generate QR Code automatically
      const response = await fetch('/api/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: card.id }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.qrCode) {
          setShareQRCode(data.qrCode);
        }
      }
    } catch (error) {
      console.error('Error generating QR for share:', error);
    } finally {
      setIsGeneratingShareQR(false);
    }
  };

  const handleCopyLink = (card: BusinessCard) => {
    const url = `${window.location.origin}/card/${card.id}`;
    navigator.clipboard.writeText(url);
    toast.success('คัดลอกลิงก์เรียบร้อยแล้ว');
  };

  const downloadQRCodeImage = async () => {
    if (!shareQRCode) return;
    
    try {
      const response = await fetch(shareQRCode);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-code-${shareModalCard?.name.replace(/\s+/g, '-')}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error('ไม่สามารถดาวน์โหลด QR Code ได้');
    }
  };

  const shareQRCodeImage = async () => {
    if (!shareQRCode || !shareModalCard) return;

    try {
      // Check if Web Share API is supported
      if (navigator.share) {
        // Fetch QR Code image as blob
        const response = await fetch(shareQRCode);
        const blob = await response.blob();
        const file = new File([blob], `qr-code-${shareModalCard.name}.png`, { type: 'image/png' });

        await navigator.share({
          title: `QR Code - ${shareModalCard.name}`,
          text: `สแกน QR Code เพื่อดูนามบัตรของฉัน`,
          files: [file]
        });
      } else {
        // Fallback: download the image
        toast.error('เบราว์เซอร์ของคุณไม่รองรับการแชร์โดยตรง กรุณาดาวน์โหลด QR Code แล้วแชร์เอง');
        downloadQRCodeImage();
      }
    } catch (error) {
      console.error('Error sharing QR code:', error);
      // If share was cancelled or failed, just close quietly
    }
  };

  const shareToEmail = (card: BusinessCard) => {
    const url = `${window.location.origin}/card/${card.id}`;
    const subject = encodeURIComponent(`นามบัตรดิจิทัล - ${card.name}`);
    const body = encodeURIComponent(`ดูนามบัตรของฉันได้ที่: ${url}\n\nสแกน QR Code เพื่อบันทึกข้อมูลติดต่อ`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const shareToLine = (card: BusinessCard) => {
    const url = `${window.location.origin}/card/${card.id}`;
    const text = encodeURIComponent(`ดูนามบัตรของฉัน: ${card.name}\n${url}\n\nสแกน QR Code เพื่อบันทึกข้อมูลติดต่อ`);
    window.open(`https://line.me/R/msg/text/?${text}`, '_blank');
  };

  const shareToFacebook = (card: BusinessCard) => {
    const url = `${window.location.origin}/card/${card.id}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  const shareToTwitter = (card: BusinessCard) => {
    const url = `${window.location.origin}/card/${card.id}`;
    const text = encodeURIComponent(`ดูนามบัตรของฉัน: ${card.name}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const handleCreateCard = () => {
    router.push('/card-editor');
  };

  const handleEditCard = (card: BusinessCard) => {
    router.push(`/card-editor?id=${card.id}`);
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  const handleThemeCustomization = () => {
    router.push('/theme-customization');
  };

  if (isLoading && !error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="กำลังโหลดข้อมูล..." />
      </div>
    );
  }

  // Offline mode with cached data
  if (isOfflineMode && cards.length > 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Offline Banner */}
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>โหมดออฟไลน์:</strong> กำลังแสดงข้อมูลที่บันทึกไว้ล่าสุด
              </p>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">นามบัตรของฉัน</h1>
                <p className="mt-1 text-sm text-gray-500">
                  กำลังแสดง {cards.length} นามบัตร (ออฟไลน์)
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  ลองเชื่อมต่อใหม่
                </button>
                <button
                  onClick={async () => {
                    const isConnected = await testSupabaseConnection();
                    if (isConnected) {
                      toast.success('การเชื่อมต่อ Supabase สำเร็จ!');
                      window.location.reload();
                    } else {
                      toast.error('ไม่สามารถเชื่อมต่อ Supabase ได้');
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  ทดสอบการเชื่อมต่อ
                </button>
                
                <button
                  onClick={async () => {
                    const isConnected = await testDirectConnection();
                    if (isConnected) {
                      toast.success('การเชื่อมต่อโดยตรงสำเร็จ!');
                    } else {
                      toast.error('การเชื่อมต่อโดยตรงล้มเหลว');
                    }
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  ทดสอบการเชื่อมต่อโดยตรง
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card) => {
              return (
                <div key={card.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{card.name}</h3>
                    <p className="text-gray-600 mb-4">{card.job_title}</p>
                    <p className="text-sm text-gray-500">{card.company}</p>
                  </div>
                  <div className="bg-gray-50 px-6 py-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">โหมดออฟไลน์</span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push(`/card/${card.id}`)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          ดู
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (error && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-4">
          <ErrorMessage
            title="เกิดข้อผิดพลาด"
            message={error}
            variant="error"
          />
          
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              ลองใหม่
            </button>
            
            <button
              onClick={() => {
                // Try to reload cards without full page refresh
                setError(null);
                setIsLoading(true);
                const loadCards = async () => {
                  try {
                    const data = await businessCards.getAll(user.id);
                    setCards(data || []);
                    setError(null);
                  } catch (err) {
                    console.error('Error loading cards:', err);
                    setError('ไม่สามารถโหลดนามบัตรได้ กรุณาตรวจสอบการเชื่อมต่อ');
                  } finally {
                    setIsLoading(false);
                  }
                };
                loadCards();
              }}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              ลองโหลดอีกครั้ง
            </button>
            
            <button
              onClick={async () => {
                const isConnected = await testDirectConnection();
                if (isConnected) {
                  toast.success('การเชื่อมต่อโดยตรงสำเร็จ! ลองโหลดข้อมูลใหม่');
                  window.location.reload();
                } else {
                  toast.error('การเชื่อมต่อโดยตรงล้มเหลว - ปัญหาอยู่ที่ network/firewall');
                }
              }}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              ทดสอบการเชื่อมต่อโดยตรง
            </button>
            
            <button
              onClick={async () => {
                const isConnected = await testSupabaseConnection();
                if (isConnected) {
                  toast.success('การเชื่อมต่อ Supabase สำเร็จ!');
                  window.location.reload();
                } else {
                  toast.error('ไม่สามารถเชื่อมต่อ Supabase ได้');
                }
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              ทดสอบการเชื่อมต่อ Supabase
            </button>
            
            <button
              onClick={async () => {
                const { data: { session } } = await supabase!.auth.getSession();
                
                const debugInfo = `User ID: ${user?.id}\nSession: ${session ? 'Active' : 'None'}\nAuth Status: ${user ? 'Valid' : 'Invalid'}`;
                console.log('Debug Info:', debugInfo);
                toast.success('ดูข้อมูล Debug ใน Console', { duration: 3000 });
              }}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Debug User & Session
            </button>
          </div>
          
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>คำแนะนำ:</strong> หากปัญหายังคงอยู่ กรุณา:
            </p>
            <ul className="text-sm text-yellow-700 mt-2 text-left">
              <li>• ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต</li>
              <li>• ลองรีเฟรชหน้าเว็บ</li>
              <li>• ตรวจสอบไฟร์วอลล์หรือ VPN</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">แดชบอร์ด</h1>
              <p className="text-sm sm:text-base text-gray-500">สร้างและแก้ไขนามบัตรดิจิทัลของคุณ</p>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleCreateCard}
                className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors"
                title="สร้างนามบัตรใหม่"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2 md:gap-6 mb-8">
          <button
            type="button"
            onClick={() => setActiveStat('cards')}
            className={`bg-white rounded-lg p-2 md:p-6 shadow-sm border text-left transition-all ${
              activeStat === 'cards'
                ? 'border-blue-500 shadow-md ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
            }`}
          >
            <div className="flex flex-col md:flex-row items-center md:items-start">
              <div className="p-1 md:p-2 bg-primary-100 rounded-lg flex-shrink-0 mb-2 md:mb-0">
                <Share2 className="w-4 h-4 md:w-6 md:h-6 text-primary-600" />
              </div>
              <div className="md:ml-4 flex-1 min-w-0 text-center md:text-left w-full md:w-auto">
                <p className="text-xs md:text-sm font-medium text-gray-600 break-words leading-tight">นามบัตรทั้งหมด</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900 mt-0.5">{cards?.length || 0}</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveStat('leads')}
            className={`bg-white rounded-lg p-2 md:p-6 shadow-sm border text-left transition-all ${
              activeStat === 'leads'
                ? 'border-blue-500 shadow-md ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
            }`}
          >
            <div className="flex flex-col md:flex-row items-center md:items-start">
              <div className="p-1 md:p-2 bg-green-100 rounded-lg flex-shrink-0 mb-2 md:mb-0">
                <Users className="w-4 h-4 md:w-6 md:h-6 text-green-600" />
              </div>
              <div className="md:ml-4 flex-1 min-w-0 text-center md:text-left w-full md:w-auto">
                <p className="text-xs md:text-sm font-medium text-gray-600 break-words leading-tight">การดาวน์โหลด vCard</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900 mt-0.5">
                  {isLoadingTemplateStats ? '...' : leadCount.toLocaleString()}
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveStat('views')}
            className={`bg-white rounded-lg p-2 md:p-6 shadow-sm border text-left transition-all ${
              activeStat === 'views'
                ? 'border-blue-500 shadow-md ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
            }`}
          >
            <div className="flex flex-col md:flex-row items-center md:items-start">
              <div className="p-1 md:p-2 bg-yellow-100 rounded-lg flex-shrink-0 mb-2 md:mb-0">
                <BarChart3 className="w-4 h-4 md:w-6 md:h-6 text-yellow-600" />
              </div>
              <div className="md:ml-4 flex-1 min-w-0 text-center md:text-left w-full md:w-auto">
                <p className="text-xs md:text-sm font-medium text-gray-600 break-words leading-tight">การเข้าดู</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900 mt-0.5">
                  {isLoadingStats ? '...' : viewCount.toLocaleString()}
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Search Box */}
        {activeStat === 'cards' && cards && cards.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                  placeholder="ค้นหานามบัตร..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {searchQuery && (
                <p className="mt-2 text-sm text-gray-500">
                  ค้นหา: <span className="font-medium text-gray-700">{searchQuery}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {activeStat === 'leads' && (
          <div className="mt-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">สถิติการดาวน์โหลด</h2>
                  <p className="text-sm text-gray-500">
                    {isLoadingTemplateStats
                      ? 'กำลังโหลด...'
                      : leadCount > 0
                      ? `รวม ${leadCount.toLocaleString()} ครั้ง`
                      : 'ยังไม่มีข้อมูลการดาวน์โหลด'}
                  </p>
                </div>
                <div className="p-2 bg-blue-50 rounded-full">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="p-6">
                {isLoadingTemplateStats ? (
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 bg-gray-100 rounded animate-pulse" />
                  </div>
                ) : sortedTemplateDownloadStats.length > 0 ? (
                  <ul className="space-y-4">
                    {sortedTemplateDownloadStats.slice(0, 5).map((stat, index) => {
                      const percentage = leadCount > 0 ? Math.round((stat.count / leadCount) * 100) : 0;
                      const displayName = getTemplateDisplayName(stat);
                      const showCardName = !stat.templateId || !templateNames[stat.templateId];
                      const barWidth =
                        percentage > 0 ? Math.min(Math.max(percentage, 4), 100) : 0;

                      return (
                        <li
                          key={`${stat.templateId ?? 'no-template'}-${stat.cardId}`}
                          className="flex flex-col gap-2"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {index + 1}. {displayName}
                              </p>
                              {showCardName && (
                                <p className="text-xs text-gray-500">จากนามบัตร: {stat.cardName}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-gray-900">
                                {stat.count.toLocaleString()} ครั้ง
                              </p>
                              <p className="text-xs text-gray-500">{percentage}%</p>
                            </div>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">ยังไม่มีข้อมูลการดาวน์โหลด vCard จากผู้เยี่ยมชม</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeStat === 'cards' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">นามบัตรของฉัน</h2>
            </div>

            {cards && cards.length > 0 ? (
              <div className="p-6">
                {searchQuery && (
                  <div className="mb-4 text-sm text-gray-600">
                    พบ{' '}
                    <span className="font-semibold text-blue-600">
                      {cards.filter((card) => matchesSearch(card, searchQuery)).length}
                    </span>
                    {' '}รายการจากทั้งหมด {cards.length} รายการ
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cards
                    .filter((card) => {
                      if (!searchQuery) return true;
                      return matchesSearch(card, searchQuery);
                    })
                    .map((card) => {
                      return (
                        <div key={card.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                          <CardPreview card={card} userProfileData={userProfileData} />
                          
                          <div className="p-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{card.name}</h3>
                            {card.template_id && (
                              <p className="text-sm text-gray-600 mb-1">
                                <span className="font-medium">แบบ:</span> <TemplateName templateId={card.template_id} />
                              </p>
                            )}
                            {card.field_values && Object.keys(card.field_values).length > 0 && (
                              <p className="text-sm text-blue-600">
                                <span className="font-medium">ฟิลด์:</span> {Object.keys(card.field_values).length} รายการ
                              </p>
                            )}
                          </div>

                          <div className="border-t border-gray-200 p-4 flex items-center justify-between">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handlePreviewCard(card)}
                                className="p-2 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors"
                                title="ดูตัวอย่าง"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDownloadVCard(card)}
                                className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                                title="ดาวน์โหลด vCard"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleCopyLink(card)}
                                className="p-2 rounded-lg bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors"
                                title="คัดลอกลิงก์"
                              >
                                <LinkIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleShareCard(card)}
                                className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                                title="แชร์"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => handleEditCard(card)}
                                className="p-2 rounded-lg bg-amber-100 text-amber-600 hover:bg-amber-200 transition-colors"
                                title="แก้ไข"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCard(card.id)}
                                className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                title="ลบ"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {searchQuery && cards.filter((card) => matchesSearch(card, searchQuery)).length === 0 && (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="mt-2 text-gray-500">ไม่พบนามบัตรที่ค้นหา</p>
                    <p className="text-sm text-gray-400">ลองค้นหาด้วยคำอื่น</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center">
                <Share2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีนามบัตร</h3>
                <p className="text-gray-600 mb-6">เริ่มต้นสร้างนามบัตรดิจิทัลของคุณ</p>
                <button 
                  onClick={handleCreateCard}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors"
                  title="สร้างนามบัตรใหม่"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            )}
          </div>
        )}

        {activeStat === 'views' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">การเข้าดูนามบัตร</h2>
                <p className="text-sm text-gray-500">แสดง 200 รายการล่าสุดจากข้อมูล</p>
              </div>
              <button
                type="button"
                onClick={() => user?.id && fetchCardViewLogs(user.id, cards)}
                className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                รีเฟรช
              </button>
            </div>

            <div className="p-6">
              {isLoadingViewLogs ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center space-x-3 text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    <span>กำลังโหลดข้อมูลการดู...</span>
                  </div>
                </div>
              ) : viewLogsError ? (
                <div className="py-12 text-center text-red-500">
                  ไม่สามารถโหลดข้อมูลการดูได้: {viewLogsError}
                </div>
              ) : viewLogs.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  ยังไม่มีข้อมูลการดูนามบัตร
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          วันที่ / เวลา
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          ชื่อนามบัตร
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          ผู้เข้าชม
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {viewLogs.map((log) => {
                        const dateText = new Date(log.created_at).toLocaleString('th-TH', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        });
                        const cardName = log.card_name || cards.find((card) => card.id === log.card_id)?.name || 'ไม่ทราบชื่อ';

                        return (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{dateText}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{cardName}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              <div className="font-medium text-gray-900">{log.viewer_ip || 'ไม่ทราบ IP'}</div>
                              {log.device_info && (
                                <div className="text-xs text-gray-500 break-all">{log.device_info}</div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </div>


      {/* Card Preview Modal */}
      {selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">ตัวอย่างนามบัตร</h3>
                <button
                  onClick={() => setSelectedCard(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              {isLoadingPreview ? (
                <div className="text-center py-8 text-gray-500">กำลังโหลดตัวอย่าง...</div>
              ) : previewTemplate ? (
                <>
                  <TemplatePreview 
                    template={previewTemplate}
                    userData={userProfileData!}
                    scale={1.0}
                    fieldValues={(selectedCard?.field_values as any) || {}}
                  />
                  <div className="mt-6 border-t border-gray-200 pt-4">
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={handleDownloadVCardPreview}
                        className="bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center text-sm"
                      >
                        ดาวน์โหลด vCard
                      </button>
                      <button
                        onClick={handleSharePreview}
                        className="bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center text-sm"
                      >
                        แชร์นามบัตร
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <CardView card={{
                  ...selectedCard,
                  ...getDisplayData(selectedCard)
                }} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareModalCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">แชร์นามบัตร</h3>
                <button
                  onClick={() => {
                    setShareModalCard(null);
                    setShareQRCode('');
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              {/* QR Code Display */}
              <div className="mb-6 bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl border-2 border-blue-200">
                <p className="text-sm text-gray-700 mb-3 text-center font-medium">แชร์: {shareModalCard.name}</p>
                <div className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-center">
                  {isGeneratingShareQR ? (
                    <div className="w-48 h-48 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                  ) : shareQRCode ? (
                    <img src={shareQRCode} alt="QR Code" className="w-48 h-48" />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-gray-400">
                      ไม่สามารถสร้าง QR Code ได้
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-3 text-center">
                  สแกน QR Code เพื่อดูนามบัตร
                </p>
              </div>

              <div className="space-y-3">
                {/* Download QR Code */}
                <button
                  onClick={downloadQRCodeImage}
                  disabled={!shareQRCode}
                  className="w-full flex items-center space-x-3 p-3 border-2 border-purple-500 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                    <Download className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-purple-900">ดาวน์โหลด QR Code</p>
                    <p className="text-sm text-purple-700">บันทึกรูป QR ไว้แชร์</p>
                  </div>
                </button>

                {/* Share QR Code via Web Share API */}
                <button
                  onClick={shareQRCodeImage}
                  disabled={!shareQRCode}
                  className="w-full flex items-center space-x-3 p-3 border-2 border-green-500 bg-green-50 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <Share2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-green-900">แชร์รูป QR Code</p>
                    <p className="text-sm text-green-700">แชร์ผ่านแอปอื่นๆ</p>
                  </div>
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">หรือแชร์ลิงก์ผ่าน</span>
                  </div>
                </div>

                {/* Email */}
                <button
                  onClick={() => {
                    shareToEmail(shareModalCard);
                    setShareModalCard(null);
                  }}
                  className="w-full flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-500">แชร์ผ่านอีเมล</p>
                  </div>
                </button>

                {/* LINE */}
                <button
                  onClick={() => {
                    shareToLine(shareModalCard);
                    setShareModalCard(null);
                  }}
                  className="w-full flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900">LINE</p>
                    <p className="text-sm text-gray-500">แชร์ผ่าน LINE</p>
                  </div>
                </button>

                {/* Facebook */}
                <button
                  onClick={() => {
                    shareToFacebook(shareModalCard);
                    setShareModalCard(null);
                  }}
                  className="w-full flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Facebook className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900">Facebook</p>
                    <p className="text-sm text-gray-500">แชร์ผ่าน Facebook</p>
                  </div>
                </button>

                {/* Twitter/X */}
                <button
                  onClick={() => {
                    shareToTwitter(shareModalCard);
                    setShareModalCard(null);
                  }}
                  className="w-full flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-sky-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900">Twitter/X</p>
                    <p className="text-sm text-gray-500">แชร์ผ่าน Twitter</p>
                  </div>
                </button>

                {/* Copy Link */}
                <button
                  onClick={() => {
                    handleCopyLink(shareModalCard);
                    setShareModalCard(null);
                  }}
                  className="w-full flex items-center space-x-3 p-3 border-2 border-blue-500 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <LinkIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-blue-900">คัดลอกลิงก์</p>
                    <p className="text-sm text-blue-700">คัดลอกลิงก์ไปแชร์เอง</p>
                  </div>
                </button>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShareModalCard(null);
                    setShareQRCode('');
                  }}
                  className="w-full py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
