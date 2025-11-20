'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/auth-context';
import { BusinessCard } from '@/types';
import { businessCards } from '@/lib/supabase/client';
import { ArrowLeft, Save, ChevronDown, Edit, Plus } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { createUserData, UserData, getUserFieldValue } from '@/utils/userDataUtils';
import toast from 'react-hot-toast';
import { 
  FaPalette, FaStar, FaHeart, FaThumbsUp, FaFire, FaLightbulb,
  FaRocket, FaGem, FaBullseye, FaDumbbell, FaGift,
  FaTrophy, FaHome, FaBuilding, FaStore, FaHospital, FaSchool,
  FaIndustry, FaMobile, FaLaptop, FaCamera, FaMusic, FaFilm,
  FaBook, FaGamepad, FaUser, FaEnvelope, FaPhone, FaGlobe,
  FaFacebook, FaLinkedin, FaTwitter, FaInstagram, FaVideo,
  FaTiktok, FaYoutube, FaTelegram, FaWhatsapp, FaSnapchat, 
  FaPinterest, FaReddit, FaDiscord, FaSlack, FaViber, FaSkype, 
  FaGithub, FaTwitch
} from 'react-icons/fa';

const CardView = dynamic(
  () =>
    import('@/components/card/CardView').then((mod) => ({
      default: mod.CardView,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="text-center text-gray-500">กำลังโหลดมุมมองนามบัตร...</div>
    ),
  }
);

const TemplatePreview = dynamic(
  () =>
    import('@/components/theme-customization/TemplatePreview').then((mod) => ({
      default: mod.TemplatePreview,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="text-center text-gray-400">กำลังโหลดตัวอย่างแม่แบบ...</div>
    ),
  }
);

export default function CardEditorPage() {
  // console.log('🎨 CardEditorPage: Component rendered');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  
  // Load addresses from profile data (same as other pages)
  const [addresses, setAddresses] = useState<any[]>([]);
  
  // Original form states
  const [formData, setFormData] = useState<BusinessCard>({
    id: '',
    name: '',
    job_title: '',
    company: '',
    phone: '',
    email: '',
    address: '',
    social_links: {
      website: '',
      facebook: '',
      linkedin: '',
      twitter: ''
    },
    custom_theme: {} as any,
    user_id: '',
    created_at: '',
    updated_at: ''
  });

  // Extended form data for personal/work phone/email/department
  const [extendedFormData, setExtendedFormData] = useState({
    personalPhone: '',
    personalEmail: '',
    workPhone: '',
    workEmail: '',
    workDepartment: '',
    workPosition: '',
    workName: ''
  });

  // Address data
  const [addressData, setAddressData] = useState({
    address: '',
    tambon: '',
    amphoe: '',
    province: '',
    postal_code: ''
  });

  // UI states
  const [isLoading, setIsLoading] = useState(false);

  // New states for template-based card editor
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [templateFields, setTemplateFields] = useState<any[]>([]);
  const [fieldValues, setFieldValues] = useState<{[key: string]: string}>({});
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  
  // Get current user role for permission checking
  const [currentUserRole, setCurrentUserRole] = useState<string>('user');
  
  // Track if profile data is loaded
  const [profileLoaded, setProfileLoaded] = useState<boolean>(false);
  
  // Store profile data from Supabase
  const [profileData, setProfileData] = useState<any>(null);
  
  // Store image URLs in separate state to prevent reset
  const [imageUrls, setImageUrls] = useState<{ avatar_url: string; company_logo: string }>({
    avatar_url: '',
    company_logo: ''
  });
  
  // Card limit states
  const [userCardsCount, setUserCardsCount] = useState<number>(0);
  const [maxCardsPerUser, setMaxCardsPerUser] = useState<number>(10);
  const [userPlan, setUserPlan] = useState<string>('Free');
  const [planCapabilities, setPlanCapabilities] = useState<any>(null);
  
  // Alternative: Get user role from auth context if available
  const userRoleFromAuth = user?.user_metadata?.user_type || 'user';
  
  // Preview controls state
  const [previewZoom, setPreviewZoom] = useState<number>(100);
  const [previewOriginalZoom, setPreviewOriginalZoom] = useState<number>(100);
  const [mobilePreviewZoom, setMobilePreviewZoom] = useState<number>(75);
  const [previewShowGrid, setPreviewShowGrid] = useState<boolean>(false);
  const [fitPercentage, setFitPercentage] = useState<number | null>(null);

  // Load addresses function is now handled by profile data

  // Set initial mobile preview zoom
  useEffect(() => {
    // Only apply zoom if template is selected (element exists in DOM)
    if (!selectedTemplate) return;
    
    // Use setTimeout to ensure DOM element is rendered
    const timer = setTimeout(() => {
    const previewContainer = document.getElementById('mobile-card-editor-preview');
    if (previewContainer) {
      previewContainer.style.transform = `scale(${mobilePreviewZoom / 100})`;
      previewContainer.style.transformOrigin = 'top center';
    }
    }, 0);
    
    return () => clearTimeout(timer);
  }, [mobilePreviewZoom, selectedTemplate]);

  // Check authentication and redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // Load user data and populate form
  useEffect(() => {
    if (user) {
      const editingCardId = searchParams.get('id');
      
      // Load user role for permission checking
      const loadUserRole = async () => {
        try {
          // console.log('🔍 Loading user role for card-editor...');
          
          // Get session token like Navbar does
          const { supabase } = await import('@/lib/supabase/client');
          if (!supabase) return;
          
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!session?.access_token) {
            // console.error('🔍 No session token available');
            return;
          }
          
          const response = await fetch('/api/get-profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              access_token: session.access_token
            }),
          });
          
          if (response.ok) {
            const result = await response.json();
            // console.log('🔍 Profile response:', result);
            if (result.success && result.profile) {
              const userType = result.profile.user_type || 'user';
              // console.log('🔍 Setting currentUserRole to:', userType);
              setCurrentUserRole(userType);
              
              // Store image URLs in separate state to prevent reset
              const avatarUrl = result.profile.avatar_url || user?.user_metadata?.avatar_url || '';
              const companyLogo = result.profile.company_logo || user?.user_metadata?.company_logo || '';
              
              setImageUrls({
                avatar_url: avatarUrl,
                company_logo: companyLogo
              });
              
              // Stored image URLs in state
              
              // Update user metadata with profile data for image binding
              if (user) {
                user.user_metadata = {
                  ...user.user_metadata,
                  avatar_url: avatarUrl,
                  company_logo: companyLogo
                };
                
                // Mark profile as loaded
                setProfileLoaded(true);
              }
            }
          } else {
            // console.error('🔍 Failed to load profile:', response.status, response.statusText);
          }
        } catch (error) {
          // console.error('Error loading user role:', error);
        }
      };
      
      loadUserRole();
      
      // Load basic form data. Do NOT clear name when editing an existing card
      setFormData((prev: any) => ({
        ...prev,
        name: (prev?.id || editingCardId) ? (prev.name || '') : '',
        job_title: user.user_metadata?.job_title || '',
        company: user.user_metadata?.company || '',
        phone: user.user_metadata?.phone || '',
        email: user.user_metadata?.email || '',
        address: user.user_metadata?.address || '',
        social_links: {
          website: user.user_metadata?.website || '',
          facebook: user.user_metadata?.social_links?.facebook || '',
          linkedin: user.user_metadata?.social_links?.linkedin || '',
          twitter: user.user_metadata?.social_links?.twitter || ''
        }
      }));

      // Load extended form data
      setExtendedFormData({
        personalPhone: user.user_metadata?.personal_phone || '',
        personalEmail: user.user_metadata?.personal_email || '',
        workPhone: user.user_metadata?.work_phone || '',
        workEmail: user.user_metadata?.work_email || '',
        workDepartment: user.user_metadata?.work_department || '',
        workPosition: user.user_metadata?.work_position || '',
        workName: user.user_metadata?.work_name || ''
      } as any);

      // Load address data
      setAddressData({
        address: user.user_metadata?.address || '',
        tambon: user.user_metadata?.tambon || '',
        amphoe: user.user_metadata?.amphoe || '',
        province: user.user_metadata?.province || '',
        postal_code: user.user_metadata?.postal_code || ''
      });

      // Load addresses from Supabase table (handled by profile data)
    }
  }, [user, searchParams]);

  // Load level capabilities
  useEffect(() => {
    const loadCapabilities = async () => {
      try {
        const response = await fetch('/api/admin/level-capabilities');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.capabilities) {
            setPlanCapabilities(data.capabilities);
            console.log('📊 Plan capabilities loaded:', data.capabilities);
          }
        }
      } catch (error) {
        console.error('Error loading capabilities:', error);
      }
    };

    loadCapabilities();
  }, []);

  // Load user data and card limits (similar to theme-customization)
  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        try {
          console.log('🔄 Loading user data for card limits');
          
          // Get session token for authorization
          const { supabase } = await import('@/lib/supabase/client');
          const { data: { session } } = await supabase!.auth.getSession();
          
          if (!session?.access_token) {
            console.warn('No session token');
            return;
          }
          
          const response = await fetch('/api/get-profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              access_token: session.access_token,
            }),
          });
          
          const result = await response.json();
          console.log('🔄 Profile response:', result);
          
          if (result.success && result.profile) {
            const profile = result.profile;
            console.log('Profile data from Supabase:', profile);
            console.log('📍 Addresses from profile:', profile.addresses);
            
            // Set addresses from profile (same as other pages)
            const addressesList = profile.addresses || [];
            setAddresses(addressesList);
            
            // Store profile data for use in userData
            setProfileData(profile);
            
            // Set current user role for permission checking
            setCurrentUserRole(profile.user_type || 'user');
            
            // Set user plan based on user_type and user_plan from profiles table
            let plan = 'Free';
            if (profile.user_type === 'admin' || profile.user_type === 'owner') {
              plan = 'Pro'; // Admin and Owner get Pro plan
            } else if (profile.user_plan) {
              plan = profile.user_plan; // Use user_plan from profiles table
            } else if (profile.subscription_level) {
              plan = profile.subscription_level; // Fallback to subscription_level
            }
            
            setUserPlan(plan);
            console.log('👤 User plan set to:', plan, 'from role:', profile.user_type);
            
            // Load user's current cards count
            const cardsResponse = await fetch(`/api/supabase-proxy?table=business_cards&select=id&user_id=${user.id}`);
            if (cardsResponse.ok) {
              const cards = await cardsResponse.json();
              console.log('📋 Cards loaded:', cards?.length || 0);
              setUserCardsCount(cards?.length || 0);
            } else {
              console.error('Failed to load cards:', cardsResponse.status);
              setUserCardsCount(0);
            }
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      }
    };

    loadUserData();
  }, [user]);

  // Create userData object for TemplatePreview using shared utility
  const userData = useMemo(() => {
    if (!user || !profileLoaded || !profileData) {
      return null;
    }

    return createUserData(profileData, user, addresses);
  }, [user, profileLoaded, profileData, addresses]);

  // Debug userData object
  useEffect(() => {
    if (userData) {
      console.log('🔍 CardEditorPage: userData created', {
        addressesCount: addresses?.length || 0,
        hasUserData: !!userData,
        userDataAddresses: userData?.addresses || [],
        userMetadata: userData?.user_metadata || {}
      });
    }
  }, [userData, addresses]);

  // Load templates
  const loadTemplates = useCallback(async () => {
    // console.log('🎨 CardEditorPage: Loading templates...');
    try {
      setIsLoadingTemplates(true);
      
      // Get session token for authorization
      const { supabase } = await import('@/lib/supabase/client');
      if (!supabase) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch('/api/templates', { headers });
      if (response.ok) {
        const data = await response.json();
        const templatesData = data.templates || [];
        // console.log('🔍 Templates loaded in card-editor:', templatesData.map(t => ({
        //   id: t.id,
        //   name: t.name,
        //   user_type: t.user_type
        // })));
        setTemplates(templatesData);
        
        // Don't auto-select here, let useEffect handle it
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setIsLoadingTemplates(false);
    }
  }, []);

  // Handle template selection
  const handleTemplateSelect = useCallback((template: any) => {
    setSelectedTemplate(template);
    
    // Extract all elements from template (not just those with field binding)
    const allElements = template.elements || [];
    
    // Create template fields array with all elements
    const fields = allElements.map((element: any) => ({
      id: element.id, // Use original element.id from template
      type: element.type,
      field: element.field || '', // Field binding (if any)
      content: element.content || '', // Original content from template
      label: element.label || `${element.type} element`,
      iconName: element.iconName || '',
      imageUrl: element.imageUrl || '',
      qrLogo: element.qrLogo || '',
      qrStyle: element.qrStyle || 'standard',
      qrColor: element.qrColor || '#000000',
      useAddressPrefix: element.useAddressPrefix !== false,
      // Add positioning data
      x: element.x || 0,
      y: element.y || 0,
      width: element.width || 100,
      height: element.height || 50,
      style: element.style || {}
    }));
    
    console.log('🔍 handleTemplateSelect: Element IDs:', {
      templateId: template.id,
      elementIds: fields.map((f: any) => f.id),
      firstElementId: fields[0]?.id
    });
    
    // Debug positioning data
    if (fields.length > 0) {
      console.log('🔍 handleTemplateSelect: First element positioning:', {
        id: fields[0].id,
        x: fields[0].x,
        y: fields[0].y,
        width: fields[0].width,
        height: fields[0].height,
        type: fields[0].type
      });
    }
    
    // Debug original template elements
    if (template.elements && template.elements.length > 0) {
      console.log('🔍 handleTemplateSelect: Original template element:', {
        id: template.elements[0].id,
        x: template.elements[0].x,
        y: template.elements[0].y,
        width: template.elements[0].width,
        height: template.elements[0].height,
        type: template.elements[0].type
      });
    }
    
    // Initialize field values from template elements or empty strings
    const initialValues: {[key: string]: string} = {};
    fields.forEach((field: any) => {
      // Try to get content from template element first
      const templateElement = template.elements.find((el: any) => el.id === field.id);
      const elementContent = templateElement?.content || '';
      
      // Always start with empty field values for Input Content (Optional)
      let fieldValue = '';
      
      initialValues[field.id] = fieldValue;
    });
    
    setTemplateFields(fields);
    setFieldValues(initialValues);
    
    // Update custom_theme from template if available
    if (template.custom_theme && Object.keys(template.custom_theme).length > 0) {
      setFormData(prev => ({
        ...prev,
        custom_theme: template.custom_theme
      }));
    }
  }, []);

  // Get field value from form data using shared utility
  const getFieldValue = useCallback((fieldName: string, useAddressPrefix: boolean = true) => {
    if (!userData) return '';
    
    // Use shared utility function for consistency
    return getUserFieldValue(fieldName, userData, useAddressPrefix);
  }, [userData]);

  // Check for card id/templateId from URL parameters
  useEffect(() => {
    const cardId = searchParams.get('id');
    const templateId = searchParams.get('templateId');
    
    // If editing an existing card: load the card, set form and template, and prefill only saved field_values
    if (cardId && templates.length > 0) {
      (async () => {
        try {
          const card: any = await businessCards.getById(cardId);
          if (card) {
            // Populate base form values
            setFormData((prev: any) => ({
              ...prev,
              id: card.id || '',
              name: card.name || '',
              job_title: card.job_title || '',
              company: card.company || '',
              phone: card.phone || '',
              email: card.email || '',
              address: card.address || '',
              social_links: card.social_links || prev.social_links,
              custom_theme: card.custom_theme || prev.custom_theme,
            }));
            
            // Select template using card.template_id (fallback to templateId from URL)
            const tplId = card.template_id || templateId;
            if (tplId) {
              const tpl = templates.find(t => t.id === tplId);
              if (tpl) {
                handleTemplateSelect(tpl);
              }
            }
            
            // Prefill Input Content (Optional) ONLY with user-entered overrides
            if (card.field_values && typeof card.field_values === 'object') {
              const computeOverrides = (tplLocal: any | undefined) => {
                if (!tplLocal || !tplLocal.elements) return card.field_values || {};

                const overrides: { [key: string]: string } = {};
                (tplLocal.elements as any[]).forEach((el: any) => {
                  const saved = card.field_values[el.id];

                  // Calculate auto value shown in Content column
                  let auto = '';
                  if (el.field) {
                    auto = getFieldValue(
                      el.field,
                      el.field && ['personalAddress1', 'personalAddress2', 'workAddress1', 'workAddress2'].includes(el.field)
                        ? (el.useAddressPrefix !== false)
                        : true
                    ) || '';
                  } else if (el.content) {
                    auto = el.content || '';
                  }
                  if (typeof saved === 'string' && saved.trim() !== '' && saved !== auto) {
                    overrides[el.id] = saved; // only keep true overrides
                  } else {
                    overrides[el.id] = '';
                  }
                });
                return overrides;
              };
              const overrides = computeOverrides(templates.find(t => t.id === (card.template_id || templateId)));
              setFieldValues(overrides);
            } else {
              setFieldValues({});
            }
          }
        } catch (e) {
          console.error('Failed to load card for editing:', e);
        }
      })();
      return; // Prefer edit flow
    }
    
    // New card with provided templateId → select template, keep Input Content empty
    if (templateId && templates.length > 0) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        handleTemplateSelect(template);
      }
    }
  }, [templates, searchParams]);

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Don't render content if user is not authenticated
  if (!user) {
    return null;
      }

  // No auto-select - let user choose template manually

  // Get field label for display
  const getFieldLabel = (fieldName: string) => {
    const labelMap: {[key: string]: string} = {
      'name': 'ชื่อ-นามสกุล',
      'nameEn': 'ชื่อ-นามสกุล (ภาษาอังกฤษ)',
      // Thailand specific IDs
      'personalId': 'เลขประจำตัวประชาชน',
      // User requested mapping: Branch = Head Office, Main = Branch
      'taxIdBranch': 'เลขประจำตัวผู้เสียภาษี (สำนักงานใหญ่)',
      'taxIdMain': 'เลขประจำตัวผู้เสียภาษี (สาขาย่อย)',
      'workPosition': 'ตำแหน่งงาน',
      'workPhone': 'เบอร์โทรศัพท์ที่ทำงาน',
      'personalPhone': 'เบอร์โทรศัพท์ส่วนตัว',
      'workEmail': 'อีเมลที่ทำงาน',
      'personalEmail': 'อีเมลส่วนตัว',
      'workName': 'ชื่อบริษัท',
      'workDepartment': 'แผนก',
      'address': 'ที่อยู่',
      'personalAddress1': 'ที่อยู่ส่วนตัว 1',
      'personalAddress2': 'ที่อยู่ส่วนตัว 2',
      'workAddress1': 'ที่อยู่ที่ทำงาน 1',
      'workAddress2': 'ที่อยู่ที่ทำงาน 2',
      'workWebsite': 'เว็บไซต์',
      'facebook': 'Facebook',
      'linkedin': 'LinkedIn',
      'twitter': 'Twitter',
      'instagram': 'Instagram',
      'lineId': 'Line ID',
      'youtube': 'YouTube',
      'telegram': 'Telegram',
      'whatsapp': 'WhatsApp',
      'wechat': 'WeChat',
      'snapchat': 'Snapchat',
      'pinterest': 'Pinterest',
      'reddit': 'Reddit',
      'discord': 'Discord',
      'slack': 'Slack',
      'viber': 'Viber',
      'skype': 'Skype',
      'zoom': 'Zoom',
      'github': 'GitHub',
      'twitch': 'Twitch',
      'tiktok': 'TikTok'
    };
    return labelMap[fieldName] || fieldName;
  };

  // Get icon component for rendering
  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      // FontAwesome icons (with Fa prefix)
      'FaPalette': FaPalette,
      'FaStar': FaStar,
      'FaHeart': FaHeart,
      'FaThumbsUp': FaThumbsUp,
      'FaFire': FaFire,
      'FaLightbulb': FaLightbulb,
      'FaRocket': FaRocket,
      'FaGem': FaGem,
      'FaBullseye': FaBullseye,
      'FaDumbbell': FaDumbbell,
      'FaGift': FaGift,
      'FaTrophy': FaTrophy,
      'FaHome': FaHome,
      'FaBuilding': FaBuilding,
      'FaStore': FaStore,
      'FaHospital': FaHospital,
      'FaSchool': FaSchool,
      'FaIndustry': FaIndustry,
      'FaMobile': FaMobile,
      'FaLaptop': FaLaptop,
      'FaCamera': FaCamera,
      'FaMusic': FaMusic,
      'FaFilm': FaFilm,
      'FaBook': FaBook,
      'FaGamepad': FaGamepad,
      'FaUser': FaUser,
      'FaEnvelope': FaEnvelope,
      'FaPhone': FaPhone,
      'FaGlobe': FaGlobe,
      'FaFacebook': FaFacebook,
      'FaLinkedin': FaLinkedin,
      'FaTwitter': FaTwitter,
      'FaInstagram': FaInstagram,
      
      // Common icon names (without Fa prefix)
      'phone': FaPhone,
      'email': FaEnvelope,
      'mail': FaEnvelope,
      'user': FaUser,
      'home': FaHome,
      'building': FaBuilding,
      'store': FaStore,
      'hospital': FaHospital,
      'school': FaSchool,
      'industry': FaIndustry,
      'mobile': FaMobile,
      'laptop': FaLaptop,
      'camera': FaCamera,
      'music': FaMusic,
      'film': FaFilm,
      'book': FaBook,
      'gamepad': FaGamepad,
      'globe': FaGlobe,
      'facebook': FaFacebook,
      'linkedin': FaLinkedin,
      'twitter': FaTwitter,
      'instagram': FaInstagram,
      'twitch': FaTwitch, // Use actual Twitch icon
      'youtube': FaYoutube, // Use actual YouTube icon
      'telegram': FaTelegram, // Use actual Telegram icon
      'whatsapp': FaWhatsapp, // Use actual WhatsApp icon
      'wechat': FaEnvelope, // Use envelope as fallback for wechat
      'snapchat': FaSnapchat, // Use actual Snapchat icon
      'pinterest': FaPinterest, // Use actual Pinterest icon
      'reddit': FaReddit, // Use actual Reddit icon
      'discord': FaDiscord, // Use actual Discord icon
      'slack': FaSlack, // Use actual Slack icon
      'viber': FaViber, // Use actual Viber icon
      'skype': FaSkype, // Use actual Skype icon
      'zoom': FaVideo, // Use video as fallback for zoom
      'github': FaGithub, // Use actual GitHub icon
      'tiktok': FaTiktok // Use actual TikTok icon
    };
    
    return iconMap[iconName] || FaStar;
  };

  // Handle field value changes
  const handleFieldValueChange = (fieldId: string, value: string) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  // Handle input changes
  const handleInputChange = (field: keyof BusinessCard, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle social links change
  const handleSocialLinksChange = (field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [field]: value
      }
    }));
  };

  // Handle extended form data changes
  const handleExtendedFormDataChange = (field: string, value: string) => {
    setExtendedFormData(prev => ({
        ...prev,
      [field]: value
    }));
  };

  // Handle address data changes
  const handleAddressDataChange = (field: string, value: string) => {
    setAddressData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save card
  // Prepare final field values: use Input Content (Optional) if filled, otherwise use Content (mapped value)
  const prepareFinalFieldValues = () => {
    const finalValues: { [key: string]: string } = {};
    
    if (selectedTemplate?.elements) {
      selectedTemplate.elements.forEach((element: any) => {
        const elementId = element.id;
        const inputValue = fieldValues[elementId] || ''; // Input Content (Optional)
        
        // Debug for address fields
        if (element.field === 'ที่อยู่' || element.field === 'homeAddress') {
          const mappedValue = getFieldValue(element.field, 
            element.field && ['personalAddress1', 'personalAddress2', 'workAddress1', 'workAddress2'].includes(element.field)
              ? (element.useAddressPrefix !== false)
              : true
          );
          console.log(`🔍 prepareFinalFieldValues Debug for ${element.field} (${elementId}):`, {
            elementContent: element.content,
            inputValue: inputValue,
            mappedValue: mappedValue,
            userAddresses: user?.user_metadata?.addresses,
            finalDecision: (inputValue && inputValue.trim() !== '') ? inputValue : (mappedValue || element.content || '')
          });
        }
        
        // If user filled Input Content (Optional), use it
        if (inputValue && inputValue.trim() !== '') {
          finalValues[elementId] = inputValue;
        } else {
          // For address fields, try to match the appropriate address from addresses array
          if (element.field === 'ที่อยู่') {
            const addresses = user?.user_metadata?.addresses || [];
            let selectedAddress = '';
            
            // Try to match based on element content
            if (element.content) {
              // First try exact match
              let matchingAddress = addresses.find((addr: any) => 
                addr.address && element.content === addr.address
              );
              
              // If no exact match, try partial match with longer substring
              if (!matchingAddress) {
                matchingAddress = addresses.find((addr: any) => 
                  addr.address && element.content.includes(addr.address.substring(0, 30))
                );
              }
              
              // If still no match, try with shorter substring as fallback
              if (!matchingAddress) {
                matchingAddress = addresses.find((addr: any) => 
                  addr.address && element.content.includes(addr.address.substring(0, 20))
                );
              }
              
              if (matchingAddress) {
                selectedAddress = matchingAddress.address;
              }
            }
            
            // If no match found, use the first available address
            if (!selectedAddress && addresses.length > 0) {
              const workAddress = addresses.find((addr: any) => addr.type === 'work');
              const homeAddress = addresses.find((addr: any) => addr.type === 'home');
              selectedAddress = (workAddress || homeAddress || addresses[0])?.address || '';
            }
            
            // Use selected address if available, otherwise empty
            finalValues[elementId] = selectedAddress || '';
          } else if (element.field) {
            finalValues[elementId] = getFieldValue(element.field, 
              element.field && ['personalAddress1', 'personalAddress2', 'workAddress1', 'workAddress2'].includes(element.field)
                ? (element.useAddressPrefix !== false)
                : true
            );
          } else if (element.content) {
            finalValues[elementId] = element.content;
          } else {
            finalValues[elementId] = '';
          }
        }
      });
    }
    
    console.log('🔍 Final field values being sent to Supabase:', finalValues);
    return finalValues;
  };

  const handleSave = async () => {
    if (!user) return;
    
    // Validate required fields
    let nameToUse = (formData.name || '').trim();
    if (!nameToUse) {
      const cardName = prompt('กรุณาใส่ชื่อนามบัตร:', '');
      if (!cardName || cardName.trim() === '') {
        toast.error('กรุณาใส่ชื่อนามบัตร');
        return;
      }
      nameToUse = cardName.trim();
      // Update local state for UI, but rely on nameToUse for immediate save
      setFormData(prev => ({ ...prev, name: nameToUse }));
    }
    
    setIsLoading(true);
    try {
      // Clean up formData before sending to Supabase
      const { created_at, updated_at, user_id, id, ...cleanFormData } = formData;
      
      // Prepare final field values
      const finalFieldValues = prepareFinalFieldValues();
      
      const cardData = {
        ...cleanFormData,
        name: nameToUse,
        social_links: formData.social_links,
        custom_theme: formData.custom_theme,
        // Add template information
        template_id: selectedTemplate?.id || null,
        // Add field values from template
        field_values: finalFieldValues,
        // Add paper card settings if available
        paper_card_settings: {
          size: selectedTemplate?.paper?.size || 'A4',
          orientation: selectedTemplate?.paper?.orientation || 'portrait'
        }
      };

      
      // Use businessCards.create from Supabase client
      const result = await businessCards.create(cardData);
      setFormData(prev => ({ ...prev, id: (result as any).id }));
      toast.success('บันทึกข้อมูลเรียบร้อยแล้ว');
      // Redirect to dashboard to show the newly created card
      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving card:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Update card
  const handleUpdate = async () => {
    if (!formData.id) return;
    
    setIsLoading(true);
    try {
      // Clean up formData before sending to Supabase
      const { created_at, updated_at, user_id, id, ...cleanFormData } = formData;
      
      // Prepare final field values
      const finalFieldValues = prepareFinalFieldValues();
      
      const updateData = {
        ...cleanFormData,
        social_links: formData.social_links,
        custom_theme: formData.custom_theme,
        // Add template information
        template_id: selectedTemplate?.id || null,
        // Add field values from template
        field_values: finalFieldValues,
        // Add paper card settings if available
        paper_card_settings: {
          size: selectedTemplate?.paper?.size || 'A4',
          orientation: selectedTemplate?.paper?.orientation || 'portrait'
        }
      };
      
      // Use businessCards.update from Supabase client
      await businessCards.update(formData.id, updateData);
      toast.success('อัปเดตข้อมูลเรียบร้อยแล้ว');
      // Redirect to dashboard after update
      router.push('/dashboard');
    } catch (error) {
      console.error('Error updating card:', error);
      toast.error('เกิดข้อผิดพลาดในการอัปเดตข้อมูล: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || !profileLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูลผู้ใช้...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6">
            {/* Unified layout: title and save button on same row */}
            <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {formData.id ? 'แก้ไขนามบัตร' : 'สร้างนามบัตรใหม่'}
                  </h1>
                  <p className="text-sm sm:text-base text-gray-500">สร้างและแก้ไขนามบัตรดิจิทัลของคุณ</p>
              </div>
            </div>
              {/* Save button - responsive */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
                {selectedTemplate && (
              <button
                onClick={formData.id ? handleUpdate : handleSave}
                disabled={isLoading}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                    title={isLoading ? 'กำลังบันทึก...' : (formData.id ? 'แก้ไขนามบัตร' : 'สร้างนามบัตรใหม่')}
              >
                <Save className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {isLoading 
                        ? 'กำลังบันทึก...' 
                        : (formData.id ? 'แก้ไขนามบัตร' : 'สร้างนามบัตรใหม่')
                      }
                    </span>
              </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Limit Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {planCapabilities && planCapabilities[userPlan] ? (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 shadow-sm mb-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    แผนของคุณ: <span className="text-blue-600">{userPlan}</span>
                  </h3>
                  {/* Upgrade Button - Show when plan is full */}
                  {userCardsCount >= planCapabilities[userPlan].max_cards && (
                    <button
                      onClick={() => {
                        // Redirect to pricing or upgrade page
                        window.location.href = '/#pricing';
                      }}
                      className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm rounded-md hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 shadow-md"
                      title="อัพเกรดแผนเพื่อสร้างนามบัตรเพิ่มเติม"
                    >
                      <div className="flex items-center space-x-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <span>อัพเกรด</span>
                      </div>
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  คุณสร้างนามบัตรไปแล้ว{' '}
                  <span className="font-bold text-blue-600">{userCardsCount}</span>
                  {' '}จาก{' '}
                  <span className="font-bold text-gray-900">
                    {planCapabilities[userPlan].max_cards}
                  </span>
                  {' '}นามบัตรที่สามารถสร้างได้
                </p>
              </div>
              <div className="flex flex-col items-end ml-4">
                <div className="text-3xl font-bold text-blue-600">
                  {planCapabilities[userPlan].max_cards - userCardsCount}
                </div>
                <div className="text-sm text-gray-500">นามบัตรที่เหลือ</div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    userCardsCount >= planCapabilities[userPlan].max_cards
                      ? 'bg-red-500'
                      : userCardsCount >= planCapabilities[userPlan].max_cards * 0.8
                      ? 'bg-yellow-500'
                      : 'bg-blue-500'
                  }`}
                  style={{
                    width: `${Math.min(
                      (userCardsCount / planCapabilities[userPlan].max_cards) * 100,
                      100
                    )}%`
                  }}
                />
              </div>
              {userCardsCount >= planCapabilities[userPlan].max_cards && (
                <p className="mt-2 text-sm text-red-600 font-medium">
                  ⚠️ คุณใช้งานครบตามแผนแล้ว กรุณาอัพเกรดแผนเพื่อสร้างนามบัตรเพิ่มเติม
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="text-yellow-800">
              <div className="font-medium">⚠️ ไม่พบข้อมูล Plan</div>
              <div className="text-sm mt-1">
                userPlan: {userPlan} | planCapabilities: {planCapabilities ? 'loaded' : 'not loaded'}
              </div>
              <div className="text-xs mt-2">
                Available plans: {planCapabilities ? Object.keys(planCapabilities).join(', ') : 'none'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Check if user has reached card limit */}
      {planCapabilities && planCapabilities[userPlan] && userCardsCount >= planCapabilities[userPlan].max_cards ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              คุณสร้างนามบัตรครบตามแผนแล้ว
            </h3>
            <p className="text-red-600 mb-4">
              คุณสร้างนามบัตรไปแล้ว {userCardsCount} จาก {planCapabilities[userPlan].max_cards} นามบัตรที่สามารถสร้างได้ตามแผน {userPlan}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  window.location.href = '/#pricing';
                }}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 shadow-lg font-medium"
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span>อัพเกรดแผน</span>
                </div>
              </button>
              <button
                onClick={() => {
                  router.push('/dashboard');
                }}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-medium"
              >
                กลับไป Dashboard
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Main Content */
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Show loading state when loading card data */}
        {isLoading && searchParams.get('id') && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">กำลังโหลดข้อมูลนามบัตร...</p>
            </div>
          </div>
        )}

        {/* Step 1: Template Selection 
            - Hide only when editing existing card (has id in URL and formData.id)
            - Show when creating new card or when coming from template selection (templateId in URL)
        */}
        {!(formData.id || searchParams.get('id')) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">เลือกแบบนามบัตร</h2>
            {selectedTemplate ? (
              <button
                onClick={() => {
                  // console.log('🔍 Edit button clicked:', {
                  //   currentUserRole,
                  //   selectedTemplateUserType: selectedTemplate.user_type,
                  //   isDisabled: currentUserRole === 'user' && (selectedTemplate.user_type === 'admin' || selectedTemplate.user_type === 'owner')
                  // });
                  window.location.href = `/theme-customization?editTemplateId=${selectedTemplate.id}`;
                }}
                disabled={currentUserRole === 'user' && (selectedTemplate.user_type === 'admin' || selectedTemplate.user_type === 'owner')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md focus:outline-none focus:ring-2 text-sm font-medium transition-colors ${
                  currentUserRole === 'user' && (selectedTemplate.user_type === 'admin' || selectedTemplate.user_type === 'owner')
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-red-200 text-red-800 hover:bg-red-300 focus:ring-red-200'
                }`}
                title={currentUserRole === 'user' && (selectedTemplate.user_type === 'admin' || selectedTemplate.user_type === 'owner') 
                  ? "ไม่สามารถแก้ไขแบบนามบัตรที่สร้างโดย Admin/Owner ได้" 
                  : "แก้ไขแบบนามบัตร"}
              >
                <Edit className="w-4 h-4" />
                <span className="hidden sm:inline">แก้ไขแบบ</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  window.location.href = '/theme-customization';
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-green-200 text-green-800 rounded-md hover:bg-green-300 focus:outline-none focus:ring-2 focus:ring-green-200 text-sm font-medium transition-colors"
                title="สร้างแบบนามบัตร"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">สร้างแบบนามบัตร</span>
              </button>
            )}
          </div>
          
          {isLoadingTemplates ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">กำลังโหลดแบบนามบัตร...</p>
            </div>
          ) : (
            <div className="relative">
              <select
                value={selectedTemplate?.id || ''}
                onChange={(e) => {
                  if (e.target.value === '') {
                    // Clear selected template when "เลือกแบบนามบัตร..." is selected
                    setSelectedTemplate(null);
                    setTemplateFields([]);
                    setFieldValues({});
                  } else {
                  const template = templates.find(t => t.id === e.target.value);
                  if (template) {
                    handleTemplateSelect(template);
                    }
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none bg-white"
              >
                <option value="">เลือกแบบนามบัตร...</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          )}
                </div>
        )}

        {/* Step 2 & 3: Template-based Editor */}
        {selectedTemplate && (
          <>

            {/* Desktop Grid Layout */}
            <div className="hidden lg:grid grid-cols-1 gap-16">
              {/* Left: Preview */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">ตัวอย่างนามบัตร</h2>
                  
                  {/* Preview Controls */}
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600">Zoom:</label>
                    <select 
                      className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={previewZoom}
                        onChange={(e) => {
                          const zoom = parseInt(e.target.value);
                          const previewContainer = document.getElementById('card-editor-preview');
                          if (previewContainer) {
                            previewContainer.style.transform = `scale(${zoom / 100})`;
                            previewContainer.style.transformOrigin = 'top center';
                            setPreviewZoom(zoom);
                            setPreviewOriginalZoom(zoom); // เก็บค่า zoom เดิม
                            // Reset fit percentage when manually changing zoom
                            setFitPercentage(null);
                          }
                        }}
                    >
                      <option value="25">25%</option>
                      <option value="50">50%</option>
                      <option value="75">75%</option>
                      <option value="100">100%</option>
                      <option value="125">125%</option>
                      <option value="150">150%</option>
                      <option value="200">200%</option>
                    </select>
                    
                <button
                      onClick={() => {
                        const previewContainer = document.getElementById('card-editor-preview');
                        if (previewContainer) {
                          const container = previewContainer.parentElement;
                          if (container) {
                            const containerWidth = container.clientWidth - 32; // Account for padding
                            const containerHeight = container.clientHeight - 32;
                            const previewWidth = previewContainer.scrollWidth;
                            const previewHeight = previewContainer.scrollHeight;
                            
                            const scaleX = containerWidth / previewWidth;
                            const scaleY = containerHeight / previewHeight;
                            const scale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond 100%
                            
                            const finalScale = Math.max(scale, 0.05);
                            previewContainer.style.transform = `scale(${finalScale})`;
                            previewContainer.style.transformOrigin = 'top center';
                            
                            // Update fit percentage display
                            const percentage = Math.round(finalScale * 100);
                            setFitPercentage(percentage);
                            // Don't change previewZoom - keep original zoom value
                          }
                        }
                      }}
                      className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      title="Fit to Paper"
                    >
                      📄
                </button>
                {fitPercentage && (
                  <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    Fit: {fitPercentage}%
                  </span>
                )}
                    
                <button
                      onClick={() => {
                        const previewContainer = document.getElementById('card-editor-preview');
                        if (previewContainer) {
                          previewContainer.style.transform = `scale(${previewOriginalZoom / 100})`;
                          previewContainer.style.transformOrigin = 'top center';
                          setPreviewZoom(previewOriginalZoom);
                          setFitPercentage(null);
                        }
                      }}
                      className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      title="Reset to Original Zoom"
                    >
                      ↺
                    </button>
                    
                    <button
                      onClick={() => setPreviewShowGrid(!previewShowGrid)}
                      className={`px-3 py-1 rounded text-sm focus:outline-none focus:ring-2 ${
                        previewShowGrid 
                          ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500' 
                          : 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500'
                      }`}
                      title={previewShowGrid ? 'Hide Grid' : 'Show Grid'}
                    >
                      {previewShowGrid ? '⊞' : '⊟'}
                </button>
              </div>
                </div>

                <div className="flex justify-center overflow-auto bg-gray-100 rounded-lg p-4" style={{ minHeight: '400px', maxHeight: '600px' }}>
                  <div className="relative border border-gray-200 rounded-lg p-4 bg-white min-w-0 flex-shrink-0">
                    {/* Grid Overlay */}
                    {previewShowGrid && (
                      <div 
                        className="absolute inset-0 pointer-events-none z-10"
                        style={{
                          backgroundImage: `
                            linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                            linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                          `,
                          backgroundSize: '20px 20px',
                          opacity: 0.5
                        }}
                      />
                    )}
                    
                    <div id="card-editor-preview">
                    <TemplatePreview 
                      key={`template-${selectedTemplate?.id}`}
                      template={selectedTemplate}
                      userData={userData || undefined}
                      scale={1.0}
                      previewImage={selectedTemplate.previewImage}
                      fieldValues={fieldValues}
                  />
                    </div>
                  </div>
                </div>
              </div>
              </div>

              {/* Right: Field Editor */}
              <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-8">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-6">แก้ไขข้อมูล</h2>
                
                {/* Card Name Field */}
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    ชื่อนามบัตร <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="กรุณาใส่ชื่อนามบัตร..."
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">ชื่อนี้จะใช้ในการแสดงผลในรายการนามบัตร</p>
                </div>
                
                {templateFields.length > 0 ? (
              <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">
                      <div className="truncate">Element</div>
                      <div className="truncate">Content</div>
                      <div className="truncate">Input Content (Optional)</div>
                </div>

                    {templateFields
                      .sort((a, b) => {
                        const aEditable = a.type !== 'picture' && a.type !== 'icon' && a.type !== 'qrcode';
                        const bEditable = b.type !== 'picture' && b.type !== 'icon' && b.type !== 'qrcode';
                        
                        if (aEditable && !bEditable) return -1;
                        if (!aEditable && bEditable) return 1;
                        return 0;
                      })
                      .map((field) => {
                        const fieldValue = field.field ? getFieldValue(field.field, 
                          field.field && ['personalAddress1', 'personalAddress2', 'workAddress1', 'workAddress2'].includes(field.field)
                            ? (selectedTemplate.elements.find((el: any) => el.id === field.id)?.useAddressPrefix !== false)
                            : true
                        ) : '';
                        // Get content from template element if available
                        const templateElement = selectedTemplate.elements.find((el: any) => el.id === field.id);
                        const elementContent = templateElement?.content || '';
                        // Use fieldValue (actual user data) as primary, fallback to elementContent
                        const originalValue = fieldValue || elementContent || field.content || '';
                        
                        
                        return (
                          <div key={field.id} className="grid grid-cols-3 gap-4 items-start">
                            <div className="text-sm text-gray-600 break-words">
                              <div className="font-medium truncate">
                                {field.type === 'icon' ? 'Icon' : 
                                 field.type === 'picture' ? 'Picture' : 
                                 field.type === 'qrcode' ? 'QR Code' : 
                                 field.field ? `${getFieldLabel(field.field)} (${field.type})` : `- (${field.type})`}
                </div>
              </div>
                            <div className={`text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded min-h-[40px] ${field.type === 'textarea' ? 'flex flex-col' : 'flex items-center'}`}>
                              {field.type === 'picture' ? (
                                (() => {
                                  // For bound fields, get image from userData
                                  let imageUrl = '';
                                  if (field.field) {
                                    if (field.field === 'profile' || field.field === 'profileImage') {
                                      imageUrl = userData?.profileImage || userData?.avatar_url || userData?.user_metadata?.avatar_url || '';
                                    } else if (field.field === 'logo' || field.field === 'companyLogo') {
                                      imageUrl = userData?.companyLogo || userData?.logo_url || userData?.user_metadata?.company_logo || '';
                                    }
                                  } else {
                                    // For non-bound fields, use element's imageUrl
                                    imageUrl = field.imageUrl || '';
                                  }
                                  
                                  return imageUrl ? (
                                    <img 
                                      src={imageUrl.startsWith('data:') ? imageUrl : 
                                           imageUrl.startsWith('http') ? imageUrl :
                                           `/api/supabase-proxy?table=storage&file=${encodeURIComponent(imageUrl)}`}
                                      alt="Picture" 
                                      className="w-6 h-6 object-contain rounded bg-white border border-gray-200"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded border border-gray-200">
                                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="2" y="2" width="20" height="20" rx="2" fill="#d4a574" stroke="#b8860b" strokeWidth="1"/>
                                        <rect x="3" y="3" width="18" height="18" rx="1" fill="#f5f5f5"/>
                                        <rect x="4" y="4" width="16" height="8" fill="#87ceeb"/>
                                        <circle cx="12" cy="7" r="1.5" fill="#ffd700"/>
                                        <path d="M12 4l0 1M12 9l0 1M8 7l1 0M15 7l1 0M9.5 5.5l0.7 0.7M13.8 8.2l0.7 0.7M9.5 8.5l0.7 -0.7M13.8 5.8l0.7 -0.7" stroke="#ffd700" strokeWidth="0.5"/>
                                        <ellipse cx="8" cy="6" rx="1.2" ry="0.8" fill="white" opacity="0.9"/>
                                        <ellipse cx="16" cy="5.5" rx="1" ry="0.6" fill="white" opacity="0.9"/>
                                        <path d="M4 12l4 -2l4 1l4 -1l4 2v6h-16z" fill="#90ee90"/>
                                        <path d="M4 14l3 -1l3 0.5l3 -0.5l3 1v4h-12z" fill="#7ccd7c"/>
                                      </svg>
                                    </div>
                                  );
                                })()
                              ) : field.type === 'icon' ? (
                                (() => {
                                  const IconComponent = getIconComponent(field.iconName || 'FaStar');
                                  const templateElement = selectedTemplate.elements.find((el: any) => el.id === field.id);
                                  const iconColor = templateElement?.style?.color || '#000000';
                                  return <IconComponent className="w-4 h-4" style={{ color: iconColor }} />;
                                })()
                              ) : field.type === 'qrcode' ? (
                                <div className="w-4 h-4 bg-white border border-gray-300 rounded flex items-center justify-center">
                                  <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M3 3h7v7H3V3zm2 2v3h3V5H5zM14 3h7v7h-7V3zm2 2v3h3V5h-3zM3 14h7v7H3v-7zm2 2v3h3v-3H5zM16 16h2v2h-2v-2zm4 0h2v2h-2v-2zm-4 4h2v2h-2v-2zm4 0h2v2h-2v-2z"/>
                                  </svg>
                                </div>
                              ) : field.type === 'textarea' ? (
                                (() => {
                                  // For address fields, use the same logic as prepareFinalFieldValues
                                  let content = '';
                                  if (field.field === 'ที่อยู่') {
                                    const addresses = user?.user_metadata?.addresses || [];
                                    
                                    // Debug for address field display
                                    console.log(`🔍 Address field display debug for ${field.id}:`, {
                                      fieldId: field.id,
                                      elementContent: templateElement?.content,
                                      addresses: addresses,
                                      addressesCount: addresses.length
                                    });
                                    
                                    // Debug each address in detail
                                    addresses.forEach((addr: any, index: number) => {
                                      console.log(`🔍 Address ${index}:`, {
                                        type: addr.type,
                                        address: addr.address,
                                        fullAddress: addr.address
                                      });
                                    });
                                    
                                    // Try to match based on element content
                                    if (templateElement?.content) {
                                      // First try exact match
                                      let matchingAddress = addresses.find((addr: any) => 
                                        addr.address && templateElement.content === addr.address
                                      );
                                      
                                      // If no exact match, try partial match with longer substring
                                      if (!matchingAddress) {
                                        matchingAddress = addresses.find((addr: any) => 
                                          addr.address && templateElement.content.includes(addr.address.substring(0, 30))
                                        );
                                      }
                                      
                                      // If still no match, try with shorter substring as fallback
                                      if (!matchingAddress) {
                                        matchingAddress = addresses.find((addr: any) => 
                                          addr.address && templateElement.content.includes(addr.address.substring(0, 20))
                                        );
                                      }
                                      
                                      if (matchingAddress) {
                                        content = matchingAddress.address;
                                        console.log(`🔍 Found matching address for ${field.id}:`, matchingAddress.address);
                                      }
                                    }
                                    
                                    // If no match found, use the first available address
                                    if (!content && addresses.length > 0) {
                                      const workAddress = addresses.find((addr: any) => addr.type === 'work');
                                      const homeAddress = addresses.find((addr: any) => addr.type === 'home');
                                      content = (workAddress || homeAddress || addresses[0])?.address || '';
                                      console.log(`🔍 Using fallback address for ${field.id}:`, content);
                                    }
                                    
                                    // Final fallback - use empty string if no address found
                                    if (!content) {
                                      content = '';
                                      console.log(`🔍 No address found for ${field.id}, using empty string`);
                                    }
                                    
                                    console.log(`🔍 Final content for ${field.id}:`, content);
                                  } else {
                                    content = fieldValue || '';
                                  }
                                  
                                  // Calculate height based on content
                                  const lines = content.split('\n').length;
                                  const calculatedHeight = Math.max(120, lines * 20 + 12); // 20px per line + padding, min 120px
                                  return (
                                    <textarea
                                      value={content}
                                      readOnly
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-white resize-none overflow-y-auto"
                                      style={{ 
                                        height: `${calculatedHeight}px`,
                                        minHeight: '120px',
                                        maxHeight: '200px'
                                      }}
                                    />
                                  );
                                })()
                              ) : (
                                <div className="w-full overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                  {fieldValue || '-'}
                                </div>
                              )}
                            </div>
                            <div className="min-h-[40px] flex items-center">
                              {field.type === 'picture' ? (
                                <div className="text-sm text-gray-400 italic">
                                  Picture (ไม่สามารถแก้ไขได้)
                                </div>
                              ) : field.type === 'icon' ? (
                                <div className="flex items-center space-x-2">
                                  {(() => {
                                    const IconComponent = getIconComponent(field.iconName || 'FaStar');
                                    return (
                                      <IconComponent 
                                        size={20}
                                        style={{ 
                                          color: field.style?.color || '#000000'
                                        }} 
                                      />
                                    );
                                  })()}
                                  <span className="text-sm text-gray-400 italic">
                                  Icon (ไม่สามารถแก้ไขได้)
                                  </span>
                                </div>
                              ) : field.type === 'qrcode' ? (
                                <div className="flex items-center space-x-2">
                                  <div className="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center">
                                    <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M3 3h7v7H3V3zm2 2v3h3V5H5zM14 3h7v7h-7V3zm2 2v3h3V5h-3zM3 14h7v7H3v-7zm2 2v3h3v-3H5zM16 16h2v2h-2v-2zm4 0h2v2h-2v-2zm-4 4h2v2h-2v-2zm4 0h2v2h-2v-2z"/>
                                    </svg>
                                  </div>
                                  <span className="text-sm text-gray-400 italic">
                                  QR Code (ไม่สามารถแก้ไขได้)
                                  </span>
                </div>
                              ) : field.field ? (
                                field.type === 'textarea' ? (
                                  (() => {
                                    const originalElement = selectedTemplate.elements.find((el: any) => el.id === field.id);
                                    const calculatedRows = originalElement && originalElement.height 
                                      ? Math.max(6, Math.ceil(originalElement.height / 20))
                                      : 6;
                                    
                                    return (
                                      <textarea
                                        value={fieldValues[field.id] || ''}
                                        onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-vertical min-h-[120px]"
                                        placeholder="กรอกข้อมูล..."
                                        rows={calculatedRows}
                                      />
                                    );
                                  })()
                                ) : (
                  <input
                                    type="text"
                                    value={fieldValues[field.id] || ''}
                                    onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="กรอกข้อมูล..."
                                  />
                                )
                              ) : (
                                field.type === 'textarea' ? (
                                  (() => {
                                    const originalElement = selectedTemplate.elements.find((el: any) => el.id === field.id);
                                    const calculatedRows = originalElement && originalElement.height 
                                      ? Math.max(6, Math.ceil(originalElement.height / 20))
                                      : 6;
                                    
                                    return (
                                      <textarea
                                        value={fieldValues[field.id] || ''}
                                        onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-vertical min-h-[120px]"
                                        placeholder="กรอกข้อมูล..."
                                        rows={calculatedRows}
                                      />
                                    );
                                  })()
                                ) : (
                  <input
                                        type="text"
                                        value={fieldValues[field.id] || ''}
                                        onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        placeholder="กรอกข้อมูล..."
                                      />
                                )
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">แบบนามบัตรนี้ไม่มี field ที่ผูกไว้</p>
                </div>
                )}
                
                {/* Remark Section */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">หมายเหตุ:</p>
                      <p>รูปภาพ (Picture), ไอคอน (Icon), และ QR Code ต้องแก้ไขในหน้า "สร้าง/แก้ไข แบบนามบัตร" เท่านั้น</p>
                </div>
              </div>
            </div>
          </div>

            {/* Mobile Content - No Tabs */}
            <div className="lg:hidden space-y-12">
              {/* Mobile Preview Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="mb-4">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">ตัวอย่างนามบัตร</h2>
                  
                  {/* Mobile Preview Controls */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center space-x-1">
                      <label className="text-xs text-gray-600">Zoom:</label>
                      <select 
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={mobilePreviewZoom}
                        onChange={(e) => {
                          const zoom = parseInt(e.target.value);
                          const previewContainer = document.getElementById('mobile-card-editor-preview');
                          if (previewContainer) {
                            previewContainer.style.transform = `scale(${zoom / 100})`;
                            previewContainer.style.transformOrigin = 'top center';
                            setMobilePreviewZoom(zoom);
                            // Reset fit percentage when manually changing zoom
                            setFitPercentage(null);
                          }
                        }}
                      >
                        <option value="25">25%</option>
                        <option value="50">50%</option>
                        <option value="75">75%</option>
                        <option value="100">100%</option>
                        <option value="125">125%</option>
                        <option value="150">150%</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          const previewContainer = document.getElementById('mobile-card-editor-preview');
                          if (previewContainer) {
                            const container = previewContainer.parentElement;
                            if (container) {
                              const containerWidth = container.clientWidth - 32;
                              const containerHeight = container.clientHeight - 32;
                              const previewWidth = previewContainer.scrollWidth;
                              const previewHeight = previewContainer.scrollHeight;
                              
                              const scaleX = containerWidth / previewWidth;
                              const scaleY = containerHeight / previewHeight;
                              const scale = Math.min(scaleX, scaleY, 1);
                              
                              const finalScale = Math.max(scale, 0.05);
                              previewContainer.style.transform = `scale(${finalScale})`;
                              previewContainer.style.transformOrigin = 'top center';
                              
                              // Update fit percentage display
                              const percentage = Math.round(finalScale * 100);
                              setFitPercentage(percentage);
                              // Don't change previewZoom - keep original zoom value
                            }
                          }
                        }}
                        className="px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-500"
                        title="Fit to Paper"
                      >
                        📄 Fit
                      </button>
                      
                      <button
                        onClick={() => {
                          const previewContainer = document.getElementById('mobile-card-editor-preview');
                          if (previewContainer) {
                            previewContainer.style.transform = `scale(${75 / 100})`;
                            previewContainer.style.transformOrigin = 'top center';
                            setMobilePreviewZoom(75);
                            setFitPercentage(null);
                          }
                        }}
                        className="px-3 py-2 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        title="Reset"
                      >
                        ↺ Reset
                      </button>
                    </div>
                    
                    {fitPercentage && (
                      <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded font-medium">
                        Fit: {fitPercentage}%
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="overflow-auto bg-gray-100 rounded-lg p-4" style={{ minHeight: '400px', textAlign: 'center', overflowX: 'auto', overflowY: 'auto' }}>
                  <div className="relative border border-gray-200 rounded-lg p-4 bg-white shadow-lg" style={{ display: 'inline-block', minWidth: 'fit-content' }}>
                    {/* Grid Overlay */}
                    {previewShowGrid && (
                      <div 
                        className="absolute inset-0 pointer-events-none z-10"
                        style={{
                          backgroundImage: `
                            linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                            linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                          `,
                          backgroundSize: '15px 15px',
                          opacity: 0.5
                        }}
                      />
                    )}
                    
                    <div id="mobile-card-editor-preview">
                        <TemplatePreview 
                          key={`mobile-template-${selectedTemplate?.id}`}
                          template={selectedTemplate}
                          userData={userData || undefined}
                          scale={1.0}
                          previewImage={selectedTemplate.previewImage}
                          fieldValues={fieldValues}
                        />
                      </div>
                  </div>
                </div>
            
              {/* Mobile Edit Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-8">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">แก้ไขข้อมูล</h2>
                  
                  {/* Card Name Field */}
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      ชื่อนามบัตร <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="กรุณาใส่ชื่อนามบัตร..."
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">ชื่อนี้จะใช้ในการแสดงผลในรายการนามบัตร</p>
                  </div>
                  
                  {templateFields.length > 0 ? (
                  <div className="space-y-4">
                      {templateFields
                        .sort((a, b) => {
                        // Sort by field type priority
                        const typeOrder = { 'text': 1, 'textarea': 2, 'number': 3, 'picture': 4 };
                        const aOrder = typeOrder[a.type as keyof typeof typeOrder] || 5;
                        const bOrder = typeOrder[b.type as keyof typeof typeOrder] || 5;
                        return aOrder - bOrder;
                        })
                        .map((field) => {
                          const fieldValue = field.field ? getFieldValue(field.field, 
                          field.field && ['personalAddress1', 'personalAddress2', 'workAddress1', 'workAddress2'].includes(field.field)
                            ? (selectedTemplate.elements.find((el: any) => el.id === field.id)?.useAddressPrefix !== false)
                            : true
                        ) : '';
                          const templateElement = selectedTemplate.elements.find((el: any) => el.id === field.id);
                          const elementContent = templateElement?.content || '';
                          // Use fieldValue (actual user data) as primary, fallback to elementContent
                          const originalValue = fieldValue || elementContent || field.content || '';
                          
                          return (
                          <div key={field.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="mb-3">
                              <label className="text-sm font-medium text-gray-700 block mb-2">
                                {field.field ? getFieldLabel(field.field) : `Element (${field.type})`}
                              </label>
                              <div className="text-sm text-gray-500 bg-white px-3 py-2 rounded border border-gray-300 min-h-[40px] flex items-center">
                                {field.type === 'icon' ? (
                                  <div className="flex items-center space-x-2">
                                    {(() => {
                                      const IconComponent = getIconComponent(field.iconName || 'FaStar');
                                      return (
                                        <IconComponent 
                                          size={20}
                                          style={{ 
                                            color: field.style?.color || '#000000'
                                          }} 
                                        />
                                      );
                                    })()}
                                    <span className="text-sm text-gray-400 italic">
                                      Icon
                                    </span>
                                  </div>
                                ) : field.type === 'qrcode' ? (
                                  <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center">
                                      <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M3 3h7v7H3V3zm2 2v3h3V5H5zM14 3h7v7h-7V3zm2 2v3h3V5h-3zM3 14h7v7H3v-7zm2 2v3h3v-3H5zM16 16h2v2h-2v-2zm4 0h2v2h-2v-2zm-4 4h2v2h-2v-2zm4 0h2v2h-2v-2z"/>
                                      </svg>
                                    </div>
                                    <span className="text-sm text-gray-400 italic">
                                      QR Code
                                    </span>
                                  </div>
                                ) : field.type === 'picture' ? (
                                  (() => {
                                    // For bound fields, get image from userData
                                    let imageUrl = '';
                                    if (field.field) {
                                      if (field.field === 'profile' || field.field === 'profileImage') {
                                        imageUrl = userData?.profileImage || userData?.avatar_url || userData?.user_metadata?.avatar_url || '';
                                      } else if (field.field === 'logo' || field.field === 'companyLogo') {
                                        imageUrl = userData?.companyLogo || userData?.logo_url || userData?.user_metadata?.company_logo || '';
                                      }
                                    } else {
                                      // For non-bound fields, use element's imageUrl
                                      imageUrl = field.imageUrl || '';
                                    }
                                    
                                    return imageUrl ? (
                                      <img 
                                        src={imageUrl.startsWith('data:') ? imageUrl : 
                                             imageUrl.startsWith('http') ? imageUrl :
                                             `/api/supabase-proxy?table=storage&file=${encodeURIComponent(imageUrl)}`}
                                        alt="Picture" 
                                        className="w-8 h-8 object-contain rounded bg-white border border-gray-200"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded border border-gray-200">
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                          <rect x="2" y="2" width="20" height="20" rx="2" fill="#d4a574" stroke="#b8860b" strokeWidth="1"/>
                                          <rect x="3" y="3" width="18" height="18" rx="1" fill="#f5f5f5"/>
                                          <rect x="4" y="4" width="16" height="8" fill="#87ceeb"/>
                                          <circle cx="12" cy="7" r="1.5" fill="#ffd700"/>
                                          <path d="M12 4l0 1M12 9l0 1M8 7l1 0M15 7l1 0M9.5 5.5l0.7 0.7M13.8 8.2l0.7 0.7M9.5 8.5l0.7 -0.7M13.8 5.8l0.7 -0.7" stroke="#ffd700" strokeWidth="0.5"/>
                                          <ellipse cx="8" cy="6" rx="1.2" ry="0.8" fill="white" opacity="0.9"/>
                                          <ellipse cx="16" cy="5.5" rx="1" ry="0.6" fill="white" opacity="0.9"/>
                                          <path d="M4 12l4 -2l4 1l4 -1l4 2v6h-16z" fill="#90ee90"/>
                                          <path d="M4 14l3 -1l3 0.5l3 -0.5l3 1v4h-12z" fill="#7ccd7c"/>
                                        </svg>
                                      </div>
                                    );
                                  })()
                                ) : (
                                  <div className="truncate">
                                    {fieldValue || '-'}
                                  </div>
                                )}
                              </div>
                              </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700 block mb-2">
                                {field.type === 'picture' || field.type === 'icon' || field.type === 'qrcode' ? 'สถานะ' : 'ข้อมูลใหม่'}
                              </label>
                              {field.type === 'picture' || field.type === 'icon' || field.type === 'qrcode' ? (
                                <div className="text-sm text-gray-400 italic bg-gray-100 px-3 py-2 rounded border border-gray-300">
                                  {field.type === 'icon' ? 'Icon' : field.type === 'qrcode' ? 'QR Code' : 'Picture'} (ไม่สามารถแก้ไขได้)
                                </div>
                              ) : field.type === 'textarea' ? (
                                        <textarea
                                          value={fieldValues[field.id] || ''}
                                          onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-vertical"
                                          placeholder="กรอกข้อมูล..."
                                  rows={3}
                                        />
                                  ) : (
                                    <input
                                      type="text"
                                      value={fieldValues[field.id] || ''}
                                      onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                      placeholder="กรอกข้อมูล..."
                                    />
                                )}
                              </div>
                            </div>
                          );
                        })}
              </div>
            ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">แบบนามบัตรนี้ไม่มี field ที่ผูกไว้</p>
              </div>
            )}
                  
                  {/* Remark Section */}
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <div className="flex-shrink-0">
                        <svg className="w-4 h-4 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="text-xs text-blue-800">
                        <p className="font-medium mb-1">หมายเหตุ:</p>
                        <p>รูปภาพ (Picture), ไอคอน (Icon), และ QR Code ต้องแก้ไขในหน้า "สร้าง/แก้ไข แบบนามบัตร" เท่านั้น</p>
                      </div>
          </div>
        </div>
                </div>
              </div>
            </div>
          </>
        )}

      </div>
      )}

    </div>
  );
}