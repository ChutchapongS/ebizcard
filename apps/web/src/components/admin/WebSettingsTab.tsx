'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  Image as ImageIcon,
  Home as HomeIcon,
  CreditCard,
  FileText,
  Save,
  Upload,
  AlertCircle,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  X,
  Shield,
} from 'lucide-react';
import { GradientEditor } from './GradientEditor';
import { RichTextEditor } from './RichTextEditor';
import toast from 'react-hot-toast';

interface WebSettingsTabProps {
  userRole: string;
}

interface WebSettings {
  logo_url?: string;
  site_name?: string;
  site_description?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  social_line?: string;
  social_facebook?: string;
  social_youtube?: string;
  features_title?: string;
  features_description?: string;
  features_items?: FeatureItem[] | string;
  home_slider?: SliderItem[] | string;
  slider_section_background?: string;
  navbar_color?: string;
  navbar_font_color?: string;
  footer_color?: string;
  footer_font_color?: string;
  privacy_policy?: string;
}

interface SliderItem {
  id: string;
  title: string;
  description: string;
  highlights: string[];
  accent?: string;
  image_url?: string;
  background_type?: 'color' | 'image';
}

interface FeatureItem {
  id: string;
  title: string;
  description: string;
  icon_url?: string;
}

const defaultSliderItems: SliderItem[] = [
  {
    id: 'slide-1',
    title: 'สร้างนามบัตรดิจิทัลได้ในไม่กี่คลิก',
    description:
      'เลือกรูปแบบที่ต้องการ ปรับแต่งข้อมูลครบถ้วน พร้อมลิงก์แชร์ทันที รองรับทั้งไทยและอังกฤษ',
    highlights: ['Template มืออาชีพ', 'แก้ไขแบบเรียลไทม์', 'แสดงผลได้ทุกอุปกรณ์'],
    accent: '#3b82f6',
    background_type: 'color',
  },
  {
    id: 'slide-2',
    title: 'แชร์ข้อมูลครบ ใช้งานสะดวก',
    description:
      'ส่งต่อผ่าน QR Code, ลิงก์, หรือดาวน์โหลด vCard ให้ผู้รับเก็บข้อมูลติดต่อได้ทันที',
    highlights: ['QR Code & vCard', 'เมนู Contact เดียวจบ', 'รองรับ Social & Map'],
    accent: '#10b981',
    background_type: 'color',
  },
];

const defaultFeatureItems: FeatureItem[] = [
  {
    id: 'feature-1',
    title: 'Multi-Platform',
    description: 'ใช้งานได้ทั้งบนมือถือ (iOS/Android) และเว็บไซต์ พร้อม PWA support',
  },
  {
    id: 'feature-2',
    title: 'QR Code Generation',
    description: 'สร้าง QR Code สำหรับแชร์นามบัตรได้ทันที พร้อมการติดตาม',
  },
  {
    id: 'feature-3',
    title: 'vCard Export',
    description: 'ดาวน์โหลดนามบัตรเป็นไฟล์ .vcf เพื่อเพิ่มใน Contact',
  },
  {
    id: 'feature-4',
    title: 'Analytics',
    description: 'ติดตามการดูนามบัตร จำนวนการสแกน QR และข้อมูลผู้เยี่ยมชม',
  },
  {
    id: 'feature-5',
    title: 'Contact Management',
    description: 'จัดการรายชื่อผู้ติดต่อที่สแกน QR Code ของคุณ',
  },
  {
    id: 'feature-6',
    title: 'Customizable Templates',
    description: 'เลือกธีมสำเร็จรูปหรือปรับแต่งสีและรูปแบบตามต้องการ',
  },
  {
    id: 'feature-7',
    title: 'Secure & Private',
    description: 'ข้อมูลปลอดภัยด้วย Supabase และ Row Level Security',
  },
  {
    id: 'feature-8',
    title: 'Real-time Updates',
    description: 'อัปเดตข้อมูลแบบ real-time พร้อมการแจ้งเตือน',
  },
];

export default function WebSettingsTab({ userRole }: WebSettingsTabProps) {
  const { session } = useAuth();
  const [settings, setSettings] = useState<WebSettings>({
    site_name: 'e-BizCard',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [logoRemoved, setLogoRemoved] = useState<boolean>(false);
  const [sliderItems, setSliderItems] = useState<SliderItem[]>(defaultSliderItems);
  const [slideImages, setSlideImages] = useState<Record<string, File | null>>({});
  const [slidePreviews, setSlidePreviews] = useState<Record<string, string>>({});
  const [newHighlightInputs, setNewHighlightInputs] = useState<Record<string, string>>({});
  const [backgroundTypes, setBackgroundTypes] = useState<Record<string, 'color' | 'image'>>({});
  const [useTransparent, setUseTransparent] = useState<Record<string, boolean>>({});
  const [featureItems, setFeatureItems] = useState<FeatureItem[]>(defaultFeatureItems);
  const [featureIcons, setFeatureIcons] = useState<Record<string, File | null>>({});
  const [featureIconPreviews, setFeatureIconPreviews] = useState<Record<string, string>>({});
  const [isSliderExpanded, setIsSliderExpanded] = useState<boolean>(false);
  const [isHomeSettingsExpanded, setIsHomeSettingsExpanded] = useState<boolean>(false);
  const [isBasicSettingsExpanded, setIsBasicSettingsExpanded] = useState<boolean>(true);
  const [isPolicyExpanded, setIsPolicyExpanded] = useState<boolean>(false);

  const handleAddSlide = () => {
    const newId = createSlideId(sliderItems.length);
    setSliderItems((prev) => [
      ...prev,
      {
        id: newId,
        title: '',
        description: '',
        highlights: [],
        accent: '',
        image_url: '',
        background_type: 'color',
      },
    ]);
    setBackgroundTypes((prev) => ({ ...prev, [newId]: 'color' }));
  };

  const handleRemoveSlide = (id: string) => {
    setSliderItems((prev) => (prev.length <= 1 ? prev : prev.filter((item) => item.id !== id)));
  };

  const handleUpdateSlide = (id: string, updates: Partial<Omit<SliderItem, 'id'>>) => {
    setSliderItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );
  };

  const handleAddHighlight = (slideId: string) => {
    const newHighlight = newHighlightInputs[slideId]?.trim();
    if (newHighlight) {
      const slide = sliderItems.find((item) => item.id === slideId);
      if (slide) {
        handleUpdateSlide(slideId, {
          highlights: [...slide.highlights, newHighlight],
        });
        setNewHighlightInputs((prev) => ({ ...prev, [slideId]: '' }));
      }
    }
  };

  const handleRemoveHighlight = (slideId: string, index: number) => {
    const slide = sliderItems.find((item) => item.id === slideId);
    if (slide) {
      const updatedHighlights = slide.highlights.filter((_, i) => i !== index);
      handleUpdateSlide(slideId, {
        highlights: updatedHighlights,
      });
    }
  };

  // Feature items handlers
  const createFeatureId = (index: number) => `feature-${index + 1}`;

  const handleAddFeature = () => {
    const newId = createFeatureId(featureItems.length);
    setFeatureItems((prev) => [
      ...prev,
      {
        id: newId,
        title: '',
        description: '',
        icon_url: '',
      },
    ]);
  };

  const handleRemoveFeature = (id: string) => {
    setFeatureItems((prev) => prev.filter((item) => item.id !== id));
    // Clear icon preview and file for removed feature
    setFeatureIconPreviews((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
    setFeatureIcons((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  const handleUpdateFeature = (id: string, updates: Partial<Omit<FeatureItem, 'id'>>) => {
    setFeatureItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );
  };

  const handleFeatureIconChange = (featureId: string, file: File | null) => {
    if (file) {
      setFeatureIcons((prev) => ({ ...prev, [featureId]: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setFeatureIconPreviews((prev) => ({
          ...prev,
          [featureId]: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFeatureIcon = (featureId: string) => {
    // Clear uploaded file
    setFeatureIcons((prev) => {
      const updated = { ...prev };
      delete updated[featureId];
      return updated;
    });
    
    // Clear preview
    setFeatureIconPreviews((prev) => {
      const updated = { ...prev };
      delete updated[featureId];
      return updated;
    });
    
    // Clear icon_url from feature item
    handleUpdateFeature(featureId, { icon_url: '' });
  };

  // Load settings from API/database
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/web-settings');
      
      if (!response.ok) {
        throw new Error('Failed to load settings');
      }
      
      const data = await response.json();
      
      if (data.success && data.settings) {
        const loadedSettings: WebSettings = { ...data.settings };

        if (loadedSettings.home_slider) {
          try {
            const sliderRaw = loadedSettings.home_slider;
            const parsed =
              typeof sliderRaw === 'string' ? JSON.parse(sliderRaw) : sliderRaw;
            if (Array.isArray(parsed)) {
              const loadedItems = parsed.map((item: any, index: number) => ({
                  id: item.id ?? `slide-${index + 1}`,
                  title: item.title ?? '',
                  description: item.description ?? '',
                  highlights: Array.isArray(item.highlights)
                    ? item.highlights
                    : typeof item.highlights === 'string'
                    ? item.highlights.split(',').map((s: string) => s.trim()).filter(Boolean)
                    : [],
                  accent: item.accent ?? '',
                image_url: item.image_url ?? '',
                background_type: item.background_type ?? (item.image_url ? 'image' : 'color'),
              }));
              setSliderItems(loadedItems);
              
              // Set previews for existing images
              const previews: Record<string, string> = {};
              const types: Record<string, 'color' | 'image'> = {};
              const transparent: Record<string, boolean> = {};
              loadedItems.forEach((item: any) => {
                if (item.image_url) {
                  previews[item.id] = item.image_url;
                }
                types[item.id] = item.background_type ?? (item.image_url ? 'image' : 'color');
                transparent[item.id] = item.use_transparent || (!item.accent && !item.image_url);
              });
              setSlidePreviews(previews);
              setBackgroundTypes(types);
              setUseTransparent(transparent);
            }
          } catch (error) {
            console.warn('Failed to parse slider settings', error);
            setSliderItems(defaultSliderItems);
          }
        } else {
          setSliderItems(defaultSliderItems);
        }

        // Load features_items
        if (loadedSettings.features_items) {
          try {
            const featuresRaw = loadedSettings.features_items;
            const parsed = typeof featuresRaw === 'string' ? JSON.parse(featuresRaw) : featuresRaw;
            if (Array.isArray(parsed) && parsed.length > 0) {
              const loadedFeatures = parsed.map((item: any, index: number) => ({
                id: item.id ?? `feature-${index + 1}`,
                title: item.title ?? '',
                description: item.description ?? '',
                icon_url: item.icon_url ?? '',
              }));
              setFeatureItems(loadedFeatures);
              
              // Set previews for existing icons
              const iconPreviews: Record<string, string> = {};
              loadedFeatures.forEach((item: any) => {
                if (item.icon_url) {
                  iconPreviews[item.id] = item.icon_url;
                }
              });
              setFeatureIconPreviews(iconPreviews);
            }
          } catch (error) {
            console.error('Error parsing features data:', error);
          }
        }

        setSettings(loadedSettings);
        
        // Set logo preview if exists
        if (data.settings.logo_url) {
          setLogoPreview(data.settings.logo_url);
        } else {
          setLogoPreview('');
        }
        setLogoRemoved(false);
        
        // Set default colors if not set
        if (!loadedSettings.slider_section_background) {
          loadedSettings.slider_section_background = '#111827';
        }
        if (!loadedSettings.navbar_color) {
          loadedSettings.navbar_color = '#ffffff';
        }
        if (!loadedSettings.navbar_font_color) {
          loadedSettings.navbar_font_color = '#000000';
        }
        if (!loadedSettings.footer_color) {
          loadedSettings.footer_color = '#111827';
        }
        if (!loadedSettings.footer_font_color) {
          loadedSettings.footer_font_color = '#ffffff';
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('ไม่สามารถโหลดการตั้งค่าได้');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    // Clear uploaded file
    setLogoFile(null);
    
    // Clear preview
    setLogoPreview('');
    
    // Mark logo as removed
    setLogoRemoved(true);
    
    // Clear logo_url from settings
    setSettings({ ...settings, logo_url: '' });
  };

  const handleSlideImageChange = (slideId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSlideImages((prev) => ({ ...prev, [slideId]: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setSlidePreviews((prev) => ({ ...prev, [slideId]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveSlideImage = (slideId: string) => {
    // Clear uploaded file
    setSlideImages((prev) => {
      const updated = { ...prev };
      delete updated[slideId];
      return updated;
    });
    
    // Clear preview
    setSlidePreviews((prev) => {
      const updated = { ...prev };
      delete updated[slideId];
      return updated;
    });
    
    // Clear image_url from slide item
    handleUpdateSlide(slideId, { image_url: '' });
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);

      let updatedSettings = { ...settings };

      // Handle logo removal or upload
      if (logoRemoved) {
        // If logo was removed, set logo_url to empty string
        updatedSettings.logo_url = '';
        setLogoRemoved(false);
      } else if (logoFile) {
        // Upload logo if changed
        const formData = new FormData();
        formData.append('logo', logoFile);
        
        const uploadResponse = await fetch('/api/admin/upload-website-logo', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || 'Failed to upload logo');
        }
        
        const uploadData = await uploadResponse.json();
        updatedSettings.logo_url = uploadData.logo_url;
        
        // Clear logo file after upload
        setLogoFile(null);
      }

      // Upload slide images if changed and collect updated image URLs
      const updatedImageUrls: Record<string, string> = {};
      for (const [slideId, imageFile] of Object.entries(slideImages)) {
        if (imageFile) {
          const formData = new FormData();
          formData.append('slide_image', imageFile);
          formData.append('slide_id', slideId);
          
          const uploadResponse = await fetch('/api/admin/upload-slide-image', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session?.access_token}`,
            },
            body: formData,
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            throw new Error(errorData.error || `Failed to upload image for slide ${slideId}`);
          }
          
          const uploadData = await uploadResponse.json();
          updatedImageUrls[slideId] = uploadData.image_url;
          
          // Update the slide item with the new image URL
          setSliderItems((prev) =>
            prev.map((item) =>
              item.id === slideId ? { ...item, image_url: uploadData.image_url } : item
            )
          );
        }
      }
      
      // Clear slide image files after upload
      setSlideImages({});

      // Upload feature icons if changed and collect updated icon URLs
      const updatedIconUrls: Record<string, string> = {};
      for (const [featureId, iconFile] of Object.entries(featureIcons)) {
        if (iconFile) {
          const formData = new FormData();
          formData.append('icon', iconFile);
          formData.append('featureId', featureId);
          
          const uploadResponse = await fetch('/api/admin/upload-feature-icon', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session?.access_token}`,
            },
            body: formData,
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            throw new Error(errorData.error || `Failed to upload icon for feature ${featureId}`);
          }
          
          const uploadData = await uploadResponse.json();
          updatedIconUrls[featureId] = uploadData.icon_url;
          
          // Update the feature item with the new icon URL
          setFeatureItems((prev) =>
            prev.map((item) =>
              item.id === featureId ? { ...item, icon_url: uploadData.icon_url } : item
            )
          );
        }
      }
      
      // Clear feature icon files after upload
      setFeatureIcons({});

      // Create slider payload with updated image URLs
      const sliderPayload = sliderItems.map((item, index) => ({
        id: item.id || `slide-${index + 1}`,
        title: item.title,
        description: item.description,
        highlights: item.highlights,
        accent: useTransparent[item.id] ? undefined : item.accent,
        image_url: updatedImageUrls[item.id] || item.image_url || '',
        background_type: backgroundTypes[item.id] || (item.image_url ? 'image' : 'color'),
        use_transparent: useTransparent[item.id] || false,
      }));

      // Create features payload with updated icon URLs
      const featuresPayload = featureItems.map((item, index) => ({
        id: item.id || `feature-${index + 1}`,
        title: item.title,
        description: item.description,
        icon_url: updatedIconUrls[item.id] || item.icon_url || '',
      }));

      const payloadSettings = {
        ...updatedSettings,
        home_slider: sliderPayload,
        features_items: featuresPayload,
      };

      // Save settings
      const response = await fetch('/api/admin/web-settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: payloadSettings }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }

      const data = await response.json();
      
      // Update local state
      setSettings(payloadSettings);
      
      toast.success('บันทึกการตั้งค่าสำเร็จ');
      
      // Notify other components that settings have been updated
      window.dispatchEvent(new CustomEvent('webSettingsUpdated'));
      
      // Reload settings to ensure sync
      await loadSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(error instanceof Error ? error.message : 'ไม่สามารถบันทึกการตั้งค่าได้');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">การตั้งค่าเว็บไซต์</h2>
        <p className="mt-1 text-sm text-gray-600">
          จัดการการตั้งค่าทั่วไปของเว็บไซต์
        </p>
      </div>

      {/* Basic Website Settings */}
      <div className="bg-gray-50 rounded-lg p-4 sm:p-6 border border-gray-300">
        <button
          type="button"
          onClick={() => setIsBasicSettingsExpanded(!isBasicSettingsExpanded)}
          className="flex items-center justify-between w-full mb-4"
        >
          <div className="flex items-center">
          <ImageIcon className="w-5 h-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">ค่าพื้นฐานของเว็บไซต์</h3>
        </div>
          {isBasicSettingsExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </button>
        {isBasicSettingsExpanded && (
          <div className="space-y-6">
            {/* Logo Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                โลโก้เว็บไซต์
              </label>
        <div className="flex items-start space-x-4 sm:space-x-6 flex-col sm:flex-row gap-4 sm:gap-0">
          {/* Logo Preview */}
          <div className="flex-shrink-0">
            <div className="w-32 h-32 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
              {logoPreview || settings.logo_url ? (
                <img 
                  src={logoPreview || settings.logo_url} 
                  alt="Logo preview" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">E</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Upload Button */}
          <div className="flex-1 min-w-0">
            <div className="flex gap-2">
              <label className="cursor-pointer flex-1 min-w-0">
                <div className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 whitespace-nowrap overflow-hidden">
                  <Upload className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{logoPreview || settings.logo_url ? 'เปลี่ยนโลโก้' : 'เลือกไฟล์โลโก้'}</span>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleLogoChange}
                />
              </label>
              {(logoPreview || settings.logo_url) && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-red-50 transition-colors flex-shrink-0"
                  title="ยกเลิกโลโก้"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              แนะนำขนาด 256x256 พิกเซล รองรับไฟล์ PNG, JPG, SVG
            </p>
          </div>
        </div>
      </div>

      {/* Site Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อเว็บไซต์
              </label>
        <input
          type="text"
          value={settings.site_name ?? ''}
          onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e-BizCard"
        />
            </div>

            {/* Site Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                คำอธิบายเว็บไซต์
              </label>
              <textarea
                value={settings.site_description ?? ''}
                onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="แพลตฟอร์มสร้างและแชร์นามบัตรดิจิทัลที่ทันสมัย พร้อม QR Code และการติดตาม Analytics"
              />
            </div>

            {/* Navbar and Footer Colors - 2 Columns */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-md font-semibold text-gray-900 mb-4">สี Navbar และ Footer</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Navbar Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    สี Navbar
                  </label>
                  <GradientEditor
                    value={settings.navbar_color || '#ffffff'}
                    onChange={(value) => setSettings({ ...settings, navbar_color: value })}
                  />
                  <p className="mt-2 text-xs text-gray-500 mb-3">
                    เลือกสีพื้นหลังสำหรับ Navbar
                  </p>
                  {/* Navbar Font Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      สีตัวอักษร Navbar
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={settings.navbar_font_color || '#000000'}
                        onChange={(e) => setSettings({ ...settings, navbar_font_color: e.target.value })}
                        className="w-12 h-12 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.navbar_font_color || '#000000'}
                        onChange={(e) => setSettings({ ...settings, navbar_font_color: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="#000000"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      เลือกสีตัวอักษรสำหรับ Navbar
                    </p>
                  </div>
                </div>

                {/* Footer Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    สี Footer
                  </label>
                  <GradientEditor
                    value={settings.footer_color || '#111827'}
                    onChange={(value) => setSettings({ ...settings, footer_color: value })}
                  />
                  <p className="mt-2 text-xs text-gray-500 mb-3">
                    เลือกสีพื้นหลังสำหรับ Footer
                  </p>
                  {/* Footer Font Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      สีตัวอักษร Footer
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={settings.footer_font_color || '#ffffff'}
                        onChange={(e) => setSettings({ ...settings, footer_font_color: e.target.value })}
                        className="w-12 h-12 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.footer_font_color || '#ffffff'}
                        onChange={(e) => setSettings({ ...settings, footer_font_color: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="#ffffff"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      เลือกสีตัวอักษรสำหรับ Footer
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-md font-semibold text-gray-900 mb-4">ข้อมูลติดต่อ</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={settings.contact_email ?? ''}
                    onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="hello@ebizcard.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    เบอร์โทร
                  </label>
                  <input
                    type="tel"
                    value={settings.contact_phone ?? ''}
                    onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+66 2-123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={settings.contact_address ?? ''}
                    onChange={(e) => setSettings({ ...settings, contact_address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="กรุงเทพมหานคร, ประเทศไทย"
                  />
                </div>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-md font-semibold text-gray-900 mb-4">Social Media</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Line
                  </label>
                  <input
                    type="text"
                    value={settings.social_line ?? ''}
                    onChange={(e) => setSettings({ ...settings, social_line: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://line.me/ti/p/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facebook
                  </label>
                  <input
                    type="text"
                    value={settings.social_facebook ?? ''}
                    onChange={(e) => setSettings({ ...settings, social_facebook: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://facebook.com/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Youtube
                  </label>
                  <input
                    type="text"
                    value={settings.social_youtube ?? ''}
                    onChange={(e) => setSettings({ ...settings, social_youtube: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://youtube.com/..."
                  />
                </div>
              </div>
            </div>

          </div>
        )}
      </div>



      {/* Slider Settings */}
      <div className="bg-gray-50 rounded-lg p-4 sm:p-6 border border-gray-300">
        <button
          type="button"
          onClick={() => setIsSliderExpanded(!isSliderExpanded)}
          className="flex items-center justify-between w-full mb-4"
        >
          <div className="flex items-center">
          <CreditCard className="w-5 h-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">สไลด์โชว์</h3>
        </div>
          {isSliderExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </button>
        {isSliderExpanded && (
          <>
        <p className="text-sm text-gray-600 mb-4">
          จัดการเนื้อหาในสไลด์ที่จะแสดงในหน้าแรก (Slider Showcase) เพื่อเน้นจุดเด่นของแพลตฟอร์ม
        </p>

        {/* Slider Section Background */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            สีพื้นหลังส่วนสไลด์
          </label>
          <GradientEditor
            value={settings.slider_section_background || '#111827'}
            onChange={(value) => setSettings({ ...settings, slider_section_background: value })}
          />
          <p className="mt-2 text-xs text-gray-500">
            เลือกสีพื้นหลังสำหรับส่วนสไลด์ทั้งหมด (กรอบใหญ่)
          </p>
        </div>

        <div className="space-y-6">
          {sliderItems.map((item, index) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 shadow-sm overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <h4 className="text-base font-semibold text-gray-900 truncate">
                    สไลด์ที่ {index + 1}
                  </h4>
                </div>
                {sliderItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSlide(item.id)}
                    className="inline-flex items-center gap-1 text-sm text-red-500 hover:text-red-600 self-start sm:self-auto flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                    ลบ
                  </button>
                )}
              </div>

              <div className="grid gap-4 min-w-0">
                <div className="min-w-0">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    หัวข้อสไลด์
                  </label>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => handleUpdateSlide(item.id, { title: e.target.value })}
                    className="w-full min-w-0 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="สร้างนามบัตรดิจิทัลได้ในไม่กี่คลิก"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    คำอธิบาย
                  </label>
                  <textarea
                    value={item.description}
                    onChange={(e) =>
                      handleUpdateSlide(item.id, { description: e.target.value })
                    }
                    rows={3}
                    className="w-full min-w-0 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                    placeholder="อธิบายจุดเด่นของสไลด์นี้..."
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ไฮไลต์
                  </label>
                  
                  {/* Existing Highlights List */}
                  {item.highlights.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {item.highlights.map((highlight, highlightIndex) => (
                        <div
                          key={highlightIndex}
                          className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 min-w-0"
                        >
                          <span className="flex-1 text-sm text-gray-700 truncate min-w-0">{highlight}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveHighlight(item.id, highlightIndex)}
                            className="text-red-500 hover:text-red-600 transition-colors flex-shrink-0"
                            aria-label="ลบไฮไลต์"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add New Highlight Input */}
                  <div className="flex flex-col sm:flex-row gap-2 min-w-0">
                  <input
                    type="text"
                      value={newHighlightInputs[item.id] || ''}
                    onChange={(e) =>
                        setNewHighlightInputs((prev) => ({
                          ...prev,
                          [item.id]: e.target.value,
                        }))
                      }
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddHighlight(item.id);
                        }
                      }}
                      className="flex-1 min-w-0 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="เพิ่มไฮไลต์ใหม่..."
                    />
                    <button
                      type="button"
                      onClick={() => handleAddHighlight(item.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      เพิ่ม
                    </button>
                  </div>
                </div>

                <div className="min-w-0">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    รูปแบบพื้นหลัง
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        setBackgroundTypes((prev) => ({ ...prev, [item.id]: 'color' }));
                        handleUpdateSlide(item.id, { background_type: 'color' });
                      }}
                      className={`px-4 py-2 rounded-md border-2 text-sm font-medium transition-colors flex-shrink-0 ${
                        (backgroundTypes[item.id] || (item.image_url ? 'image' : 'color')) === 'color'
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      สี
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBackgroundTypes((prev) => ({ ...prev, [item.id]: 'image' }));
                        handleUpdateSlide(item.id, { background_type: 'image' });
                      }}
                      className={`px-4 py-2 rounded-md border-2 text-sm font-medium transition-colors flex-shrink-0 ${
                        (backgroundTypes[item.id] || (item.image_url ? 'image' : 'color')) === 'image'
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      รูปภาพ
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
                    {/* Color/Gradient Section */}
                    {(backgroundTypes[item.id] || (item.image_url ? 'image' : 'color')) === 'color' ? (
                      <div className="min-w-0 overflow-hidden">
                        {!useTransparent[item.id] ? (
                          <>
                            <GradientEditor
                              value={item.accent || '#3b82f6'}
                              onChange={(value) => handleUpdateSlide(item.id, { accent: value })}
                              onTransparentChange={(isTransparent) => {
                                setUseTransparent((prev) => ({ ...prev, [item.id]: isTransparent }));
                              }}
                              isTransparent={useTransparent[item.id] || false}
                            />
                            <p className="mt-2 text-xs text-gray-500">
                              เลือกสีพื้นหลังสำหรับสไลด์
                            </p>
                          </>
                        ) : (
                          <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                            <p className="text-sm text-gray-600 mb-3">
                              สี Default ของระบบ
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setUseTransparent((prev) => ({ ...prev, [item.id]: false }));
                              }}
                              className="px-3 py-1.5 rounded-md border-2 text-xs font-medium bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                              เปลี่ยนเป็นสีกำหนดเอง
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="hidden md:block opacity-50 pointer-events-none">
                        <GradientEditor
                          value={item.accent || '#3b82f6'}
                          onChange={() => {}}
                        />
                        <p className="mt-2 text-xs text-gray-500">
                          เลือก Color เพื่อแก้ไขสีพื้นหลัง
                        </p>
                      </div>
                    )}

                    {/* Image Section */}
                    {(backgroundTypes[item.id] || (item.image_url ? 'image' : 'color')) === 'image' ? (
                      <div className="min-w-0 overflow-hidden">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          รูปภาพสไลด์
                        </label>
                        <div className="flex flex-col items-start space-y-3">
                          {/* Image Preview */}
                          <div className="w-full">
                            <div className="w-full h-48 bg-gray-100 border-2 border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                              {slidePreviews[item.id] || item.image_url ? (
                                <img 
                                  src={slidePreviews[item.id] || item.image_url} 
                                  alt={`Slide ${index + 1} preview`} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="text-gray-400 text-xs text-center px-2">
                                  ไม่มีรูปภาพ
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Upload Button */}
                          <div className="w-full">
                            <div className="flex gap-2">
                              <label className="cursor-pointer flex-1">
                                <div className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                                  <Upload className="w-4 h-4 mr-2" />
                                  {slidePreviews[item.id] || item.image_url ? 'เปลี่ยนรูปภาพ' : 'อัปโหลดรูปภาพ'}
                                </div>
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  onChange={(e) => handleSlideImageChange(item.id, e)}
                                />
                              </label>
                              {(slidePreviews[item.id] || item.image_url) && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSlideImage(item.id)}
                                  className="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-red-50 transition-colors"
                                  title="ยกเลิกรูปภาพ"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            <p className="mt-2 text-xs text-gray-500">
                              แนะนำขนาด 1200x600 พิกเซล รองรับไฟล์ PNG, JPG, WebP
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="hidden md:block opacity-50 pointer-events-none">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          รูปภาพสไลด์
                        </label>
                        <div className="flex flex-col items-start space-y-3">
                          <div className="w-full h-48 bg-gray-100 border-2 border-gray-200 rounded-lg flex items-center justify-center">
                            <div className="text-gray-400 text-xs text-center px-2">
                              ไม่มีรูปภาพ
                            </div>
                          </div>
                          <div className="w-full">
                            <div className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-400 bg-gray-50">
                              <Upload className="w-4 h-4 mr-2" />
                              อัปโหลดรูปภาพ
                            </div>
                            <p className="mt-2 text-xs text-gray-500">
                              เลือก Image เพื่ออัปโหลดรูปภาพ
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddSlide}
            className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-md text-sm font-medium text-gray-600 hover:text-gray-800 hover:border-gray-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            เพิ่มสไลด์ใหม่
          </button>
        </div>
          </>
        )}
      </div>
      
      {/* Home Page Settings */}
      <div className="bg-gray-50 rounded-lg p-4 sm:p-6 border border-gray-300">
        <button
          type="button"
          onClick={() => setIsHomeSettingsExpanded(!isHomeSettingsExpanded)}
          className="flex items-center justify-between w-full mb-4"
        >
          <div className="flex items-center">
          <HomeIcon className="w-5 h-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">เนื้อหา</h3>
        </div>
          {isHomeSettingsExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </button>
        {isHomeSettingsExpanded && (
          <div className="space-y-4">
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4">ส่วน Features</h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                    หัวข้อ Features
            </label>
            <input
              type="text"
                    value={settings.features_title ?? ''}
                    onChange={(e) => setSettings({ ...settings, features_title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ฟีเจอร์ครบครัน"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                    คำอธิบาย Features
                  </label>
                  <textarea
                    value={settings.features_description ?? ''}
                    onChange={(e) => setSettings({ ...settings, features_description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="ทุกสิ่งที่คุณต้องการสำหรับการสร้างและจัดการนามบัตรดิจิทัล"
                  />
                </div>

                {/* Feature Items Management */}
                <div className="mt-6">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      รายการ Features
                    </label>
                  </div>

                  <div className="space-y-4">
                    {featureItems.map((feature, index) => (
                      <div key={feature.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-white">
                        <div className="flex items-start justify-between mb-4">
                          <h5 className="text-sm font-medium text-gray-700">
                            Feature #{index + 1}
                          </h5>
                          {featureItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveFeature(feature.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="space-y-4">
                          {/* Feature Icon Upload */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              ไอคอน Features
                            </label>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                              <div className="w-20 h-20 flex-shrink-0 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                                {featureIconPreviews[feature.id] || feature.icon_url ? (
                                  <img
                                    src={featureIconPreviews[feature.id] || feature.icon_url}
                                    alt="Icon preview"
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <ImageIcon className="w-8 h-8 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1 w-full sm:w-auto">
                                <div className="flex gap-2">
                                  <label className="cursor-pointer flex-1">
                                    <div className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                                      <Upload className="w-4 h-4 mr-2" />
                                      {featureIconPreviews[feature.id] || feature.icon_url ? 'เปลี่ยนไอคอน' : 'อัปโหลดไอคอน'}
                                    </div>
                                    <input
                                      type="file"
                                      className="hidden"
                                      accept="image/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0] || null;
                                        handleFeatureIconChange(feature.id, file);
                                      }}
                                    />
                                  </label>
                                  {(featureIconPreviews[feature.id] || feature.icon_url) && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveFeatureIcon(feature.id)}
                                      className="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-red-50 transition-colors"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                  รองรับไฟล์ PNG, JPG, SVG, WebP (ขนาดไม่เกิน 2MB)
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Feature Title */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              หัวข้อ Features
            </label>
            <input
              type="text"
                              value={feature.title}
                              onChange={(e) => handleUpdateFeature(feature.id, { title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="เช่น Multi-Platform"
            />
          </div>
          
                          {/* Feature Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                              คำอธิบาย Features
            </label>
            <textarea
                              value={feature.description}
                              onChange={(e) => handleUpdateFeature(feature.id, { description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              rows={2}
                              placeholder="เช่น ใช้งานได้ทั้งบนมือถือ (iOS/Android) และเว็บไซต์ พร้อม PWA support"
            />
          </div>
        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddFeature}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-md text-sm font-medium text-gray-600 hover:text-gray-800 hover:border-gray-400 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      เพิ่ม Feature
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Policy Section */}
      <div className="bg-gray-50 rounded-lg p-4 sm:p-6 border border-gray-300">
        <button
          type="button"
          onClick={() => setIsPolicyExpanded(!isPolicyExpanded)}
          className="flex items-center justify-between w-full mb-4"
        >
          <div className="flex items-center">
            <Shield className="w-5 h-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">นโยบาย</h3>
          </div>
          {isPolicyExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </button>
        {isPolicyExpanded && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                นโยบายความเป็นส่วนตัว
              </label>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Editor */}
                <div>
                  <RichTextEditor
                    value={settings.privacy_policy ?? ''}
                    onChange={(value) => setSettings({ ...settings, privacy_policy: value })}
                    placeholder="กรุณาใส่เนื้อหานโยบายความเป็นส่วนตัว..."
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    ใช้ toolbar ด้านบนเพื่อจัดรูปแบบข้อความ: ขนาดฟอนต์, หนา, เอียง, ขีดเส้นใต้, ขีดเส้นท้าย, จัดชิดซ้าย/ขวา/กลาง
                  </p>
                </div>
                {/* Preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ตัวอย่างการแสดงผล
                  </label>
                  <div className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white min-h-[200px] max-h-[500px] overflow-y-auto">
                    {settings.privacy_policy ? (
                      <div 
                        className="ql-editor"
                        style={{
                          fontFamily: 'inherit',
                          fontSize: '14px',
                          lineHeight: '1.5',
                          padding: 0,
                        }}
                        dangerouslySetInnerHTML={{ __html: settings.privacy_policy }}
                      />
                    ) : (
                      <p className="text-gray-400 text-sm">ยังไม่มีเนื้อหา</p>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    ตัวอย่างการแสดงผลบนหน้าเว็บ
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              กำลังบันทึก...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              บันทึกการตั้งค่า
            </>
          )}
        </button>
      </div>

      {/* Info Message */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">หมายเหตุ</h3>
            <p className="mt-1 text-sm text-blue-700">
              การเปลี่ยนแปลงการตั้งค่าจะมีผลทันทีหลังจากบันทึก และจะส่งผลกับผู้ใช้ทั้งหมดในระบบ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function createSlideId(length: number) {
  return `slide-${length + 1}-${Math.random().toString(36).slice(2, 6)}`;
}

