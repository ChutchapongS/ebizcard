'use client';

import { Template, CanvasElement, PaperSettings } from '@/types/theme-customization';
import { MOCK_DATA } from '@/types/theme-customization';
import { useMemo, memo, useRef, useCallback, useState, useEffect } from 'react';
import { getUserFieldValue, UserData } from '@/utils/userDataUtils';
import { 
  FaPalette, FaStar, FaHeart, FaThumbsUp, FaFire, FaLightbulb,
  FaRocket, FaGem, FaBullseye, FaDumbbell, FaGift,
  FaTrophy, FaHome, FaBuilding, FaStore, FaHospital, FaSchool,
  FaIndustry, FaMobile, FaLaptop, FaCamera, FaMusic, FaFilm,
  FaBook, FaGamepad, FaUser, FaEnvelope, FaPhone, FaGlobe,
  FaFacebook, FaLinkedin, FaTwitter, FaInstagram, FaTiktok, FaYoutube, FaTelegram, FaWhatsapp, FaSnapchat, FaPinterest, FaReddit, FaDiscord, FaSlack, FaViber, FaSkype, FaGithub, FaTwitch
} from 'react-icons/fa';
import { Facebook, MessageCircle, Linkedin, Twitter, Instagram, Video } from 'lucide-react';
import QRCodeStyling from 'qr-code-styling';

interface TemplatePreviewProps {
  template: Template;
  userData?: UserData;
  scale?: number;
  previewImage?: string;
  fieldValues?: { [key: string]: string }; // Add fieldValues prop
}

const TemplatePreview = memo(function TemplatePreview({ template, userData, scale = 0.8, previewImage, fieldValues }: TemplatePreviewProps) {

  // Function to get QR Code styling options based on style
  const getQRCodeStyling = (qrStyle: string, qrColor?: string) => {
    const baseOptions = {
      width: 200,
      height: 200,
      type: 'svg' as const,
      data: '',
      backgroundOptions: {
        color: '#FFFFFF'
      }
    };

    const defaultColor = qrColor || '#000000';
    
    switch (qrStyle) {
      case 'standard':
        return {
          ...baseOptions,
          dotsOptions: {
            type: 'square' as const,
            color: defaultColor
          },
          cornersSquareOptions: {
            type: 'square' as const,
            color: defaultColor
          },
          cornersDotOptions: {
            type: 'square' as const,
            color: defaultColor
          }
        };
      case 'rounded':
        return {
          ...baseOptions,
          dotsOptions: {
            type: 'rounded' as const,
            color: defaultColor
          },
          cornersSquareOptions: {
            type: 'extra-rounded' as const,
            color: defaultColor
          },
          cornersDotOptions: {
            type: 'dot' as const,
            color: defaultColor
          }
        };
      case 'dots':
        return {
          ...baseOptions,
          dotsOptions: {
            type: 'dots' as const,
            color: defaultColor
          },
          cornersSquareOptions: {
            type: 'square' as const,
            color: defaultColor
          },
          cornersDotOptions: {
            type: 'dot' as const,
            color: defaultColor
          }
        };
      default:
        return {
          ...baseOptions,
          dotsOptions: {
            type: 'square' as const,
            color: defaultColor
          },
          cornersSquareOptions: {
            type: 'square' as const,
            color: defaultColor
          },
          cornersDotOptions: {
            type: 'square' as const,
            color: defaultColor
          }
        };
    }
  };

  // QR Code Canvas Component
  const QRCodeCanvas = ({ element, content }: { element: CanvasElement; content: string }) => {
    const qrRef = useRef<HTMLDivElement>(null);

    // Memoize QR code content to prevent unnecessary re-renders
    const memoizedContent = useMemo(() => content, [content]);

    useEffect(() => {
      if (qrRef.current) {
        qrRef.current.innerHTML = ''; // Clear previous content
        
        const stylingOptions = getQRCodeStyling(element.qrStyle || 'standard', element.qrColor);
        
        // Create QR Code options
        const qrOptions: any = {
          ...stylingOptions,
          width: Math.min(element.width - 8, element.height - 8),
          height: Math.min(element.width - 8, element.height - 8),
          data: memoizedContent,
          backgroundOptions: {
            ...stylingOptions.backgroundOptions,
            color: element.style?.backgroundColor || stylingOptions.backgroundOptions.color
          }
        };

        // Add imageOptions only if qrLogo exists
        if (element.qrLogo) {
          qrOptions.imageOptions = {
            hideBackgroundDots: true,
            imageSize: 0.4,
            margin: 0,
            crossOrigin: 'anonymous'
          };
          qrOptions.image = element.qrLogo;
        }

        const qrCode = new QRCodeStyling(qrOptions);
        qrCode.append(qrRef.current);
      }
    }, [element, memoizedContent]);

    return <div ref={qrRef} className="w-full h-full flex items-center justify-center" />;
  };
  
  // Debug logs removed for performance

  // Create a stable key based on userData to force re-mount when data changes
  const userDataKey = useMemo(() => {
    if (!userData) return 'no-user-data';
    return `${userData.avatar_url || 'no-avatar'}-${userData.companyLogo || 'no-logo'}`;
  }, [userData?.avatar_url, userData?.companyLogo]);

  // Debug logging for element IDs and positioning
  console.log('🔍 TemplatePreview: Element IDs:', {
    templateId: template.id,
    elementIds: template.elements.map(e => e.id),
    firstElementId: template.elements[0]?.id,
    fieldValuesKeys: fieldValues ? Object.keys(fieldValues) : [],
    fieldValues: fieldValues
  });
  
  // Debug element positioning
  if (template.elements.length > 0) {
    console.log('🔍 TemplatePreview: Element positioning:', {
      firstElement: {
        id: template.elements[0].id,
        x: template.elements[0].x,
        y: template.elements[0].y,
        width: template.elements[0].width,
        height: template.elements[0].height,
        type: template.elements[0].type
      },
      scale: scale
    });
  }


  // TemplatePreview: Component rendered

  // Use ref to store stable image URLs
  const imageUrlsRef = useRef<{
    profileImage?: string;
    companyLogo?: string;
  }>({});

  // Loading states for images - use ref to persist across re-renders
  const imageLoadingStatesRef = useRef<{
    [key: string]: boolean;
  }>({});
  
  // Cache for Base64 converted images to avoid repeated HTTP requests
  const imageBase64CacheRef = useRef<Record<string, string>>({});
  const [cachedImages, setCachedImages] = useState<Record<string, string>>({});

  // Convert image URL to Base64 for caching
  const convertImageToBase64 = useCallback(async (imageUrl: string): Promise<string> => {
    // Check if already in cache
    if (imageBase64CacheRef.current[imageUrl]) {
      // Using cached image
      return imageBase64CacheRef.current[imageUrl];
    }
    
    // If already Base64, return as is
    if (imageUrl.startsWith('data:')) {
      imageBase64CacheRef.current[imageUrl] = imageUrl;
      return imageUrl;
    }
    
    try {
      // Converting image to Base64
      
      // Fetch image and convert to Base64
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          
          // Cache the Base64 string
          imageBase64CacheRef.current[imageUrl] = base64String;
          // Image converted and cached
          
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('❌ Error converting image to Base64:', error);
      return imageUrl; // Return original URL if conversion fails
    }
  }, []);
  
  // Image loading handlers
  const handleImageLoad = useCallback((elementId: string) => {
    imageLoadingStatesRef.current[elementId] = true;
  }, []);

  const handleImageError = useCallback((elementId: string) => {
    imageLoadingStatesRef.current[elementId] = false;
  }, []);

  // Prevent auto-refresh by using stable userDataKey
  const stableUserDataKey = useMemo(() => {
    if (!userData) return 'no-user-data';
    
    // Create a stable key that doesn't change unless essential data changes
    const essentialData = {
      avatar_url: userData.avatar_url || userData.profileImage,
      companyLogo: userData.companyLogo || userData.logo_url
    };
    
    return JSON.stringify(essentialData);
  }, [userData?.avatar_url, userData?.companyLogo, userData?.profileImage, userData?.logo_url]);

  // Prevent auto-refresh by maintaining stable state
  useEffect(() => {
    // Don't reset loading states on re-render, only on mount
    return () => {
      // Component unmounting
    };
  }, [stableUserDataKey]);

  // Memoize userData to prevent unnecessary re-renders
  const memoizedUserData = useMemo(() => {
    
    // Update stable image URLs only when they actually change
    if (userData) {
      const newProfileImage = userData?.profileImage || 
                             userData?.avatar_url || 
                             userData?.profileImage ||
                             userData?.user_metadata?.avatar_url ||
                             userData?.user_metadata?.profileImage;
      
      const newCompanyLogo = userData?.companyLogo || 
                            userData?.logo_url ||
                            userData?.user_metadata?.companyLogo;

      if (newProfileImage && newProfileImage !== imageUrlsRef.current.profileImage) {
        imageUrlsRef.current.profileImage = newProfileImage;
        // Updated stable profile image URL
      }

      if (newCompanyLogo && newCompanyLogo !== imageUrlsRef.current.companyLogo) {
        imageUrlsRef.current.companyLogo = newCompanyLogo;
        // Updated stable company logo URL
      }
    }

    return userData;
  }, [
    userData?.avatar_url, 
    userData?.companyLogo, 
    userData?.profileImage, 
    userData?.companyLogo,
    userData?.logo_url,
    userData?.user_metadata?.avatar_url,
    userData?.user_metadata?.companyLogo
  ]);
  
  // Pre-load and cache images when userData changes
  useEffect(() => {
    const preloadImages = async () => {
      if (!userData) return;
      
      const profileImageUrl = userData?.profileImage || userData?.avatar_url || '';
      const companyLogoUrl = userData?.companyLogo || userData?.logo_url || '';
      
      // Convert profile image to Base64
      if (profileImageUrl && profileImageUrl.includes('supabase.co')) {
        const base64Image = await convertImageToBase64(profileImageUrl);
        setCachedImages(prev => ({ ...prev, profileImage: base64Image }));
      }
      
      // Convert company logo to Base64
      if (companyLogoUrl && companyLogoUrl.includes('supabase.co')) {
        const base64Logo = await convertImageToBase64(companyLogoUrl);
        setCachedImages(prev => ({ ...prev, companyLogo: base64Logo }));
      }
    };
    
    preloadImages();
  }, [userData?.avatar_url, userData?.companyLogo, convertImageToBase64]);
  
  // Listen for profile update events to clear cache
  useEffect(() => {
    const handleProfileUpdate = () => {
      // Profile updated - clearing image cache
      
      // Clear Base64 cache
      imageBase64CacheRef.current = {};
      setCachedImages({});
      
      // Image cache cleared
    };
    
    // Listen for profile update event from Settings page
    window.addEventListener('profileUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  // Get user field value using shared utility
  const getUserFieldValueLocal = (field: string, useAddressPrefix: boolean = true): string => {
    if (!memoizedUserData || !field) {
      return '';
    }
    
    // Use shared utility function
    const result = getUserFieldValue(field, memoizedUserData as UserData, useAddressPrefix);
    
    return result;
  };

  // Get fallback text for empty fields
  const getFallbackText = (field: string): string => {
    const fallbackMap: { [key: string]: string } = {
      // Basic Info
      'name': 'your name (Thai)',
      'nameEn': 'your name (English)',
      'personalId': 'your personal ID',
      'workPosition': 'your position',
      'workPhone': 'your phone number',
      'personalPhone': 'your phone number',
      'workEmail': 'your email',
      'personalEmail': 'your email',
      'workName': 'your company',
      'workDepartment': 'your department',
      'workWebsite': 'your website',
      'taxIdMain': 'your tax ID (main)',
      'taxIdBranch': 'your tax ID (branch)',
      // New address fields
      'personalAddress1': 'your personal address 1',
      'personalAddress2': 'your personal address 2',
      'workAddress1': 'your work address 1',
      'workAddress2': 'your work address 2',
      // Old address fields
      'address': 'your address',
      'ที่อยู่': 'your address',
      
      // Social Media
      'facebook': 'your facebook',
      'line': 'your line id',
      'linkedin': 'your linkedin',
      'twitter': 'your twitter',
      'instagram': 'your instagram',
      'tiktok': 'your tiktok',
      'youtube': 'your youtube',
      'telegram': 'your telegram',
      'whatsapp': 'your whatsapp',
      'wechat': 'your wechat',
      'snapchat': 'your snapchat',
      'pinterest': 'your pinterest',
      'reddit': 'your reddit',
      'discord': 'your discord',
      'slack': 'your slack',
      'viber': 'your viber',
      'skype': 'your skype',
      'zoom': 'your zoom',
      'github': 'your github',
      'twitch': 'your twitch',
      
      // Thai field names
      'ชื่อ-นามสกุล': 'your name (Thai)',
      'ชื่อ-นามสกุล (ภาษาอังกฤษ)': 'your name (English)',
      'ตำแหน่งงาน': 'your position',
      'เบอร์โทรศัพท์ที่ทำงาน': 'your phone number',
      'เบอร์โทรศัพท์ส่วนตัว': 'your phone number',
      'อีเมลที่ทำงาน': 'your email',
      'อีเมลส่วนตัว': 'your email',
      'ชื่อบริษัท': 'your company',
      'แผนก': 'your department',
      'เว็บไซต์': 'your website'
    };
    return fallbackMap[field] || '';
  };

  // Convert mm to pixels for preview (same as Canvas)
  const mmToPx = 3.7795275591; // 1mm = 3.7795275591px at 96 DPI
  const paperWidth = template.paper?.width || (template as any).paper_settings?.width || 85; // Default business card width
  const paperHeight = template.paper?.height || (template as any).paper_settings?.height || 55; // Default business card height
  
  // Calculate base size in pixels (same as Canvas)
  const baseWidthPx = paperWidth * mmToPx;
  const baseHeightPx = paperHeight * mmToPx;
  
  // Apply scale to container size
  const mmToPxWidth = baseWidthPx * scale;
  const mmToPxHeight = baseHeightPx * scale;

  const getBackgroundStyle = () => {

    // Check both paper and paper_settings for background
    const background = template.paper?.background || (template as any).paper_settings?.background;
    
    if (background?.type === 'image' && background.image) {
      return {
        backgroundImage: `url(${background.image})`,
        backgroundSize: background.imageFit || 'cover',
        backgroundPosition: background.imagePosition || 'center',
        backgroundRepeat: background.imageRepeat || 'no-repeat'
      };
    } else if (background?.type === 'gradient') {
      const gradient = background.gradient;
      if (gradient) {
        const direction = gradient.direction === 'vertical' ? 'to bottom' : 
                         gradient.direction === 'diagonal' ? 'to bottom right' : 'to right';
        return {
          background: `linear-gradient(${direction}, ${gradient.colors.join(', ')})`
        };
      }
    }
    
    return {
      backgroundColor: background?.color || '#f0f0f0' // Use light gray instead of white for visibility
    };
  };

  const getElementContent = (element: CanvasElement) => {
    
    if (element.type === 'picture') {
      // Debug logging removed for performance
      
      // Check if element has field binding for profile or logo
      if (element.field) {
        let imageUrl = '';
        
        // Handle field binding for images - use cached Base64 if available
        if (element.field === 'profile' || element.field === 'profileImage') {
          // Check if we have cached Base64 version
          if (cachedImages.profileImage) {
            imageUrl = cachedImages.profileImage;
          } else {
            // Get profile image from userData - try multiple sources
            imageUrl = memoizedUserData?.profileImage || 
                      memoizedUserData?.avatar_url || 
                      memoizedUserData?.profileImage ||
                      memoizedUserData?.user_metadata?.avatar_url ||
                      memoizedUserData?.user_metadata?.profileImage || '';
          }
          
          // Profile image binding
          
          // Only use fallback if no URL available
          if (!imageUrl) {
            // Use picture frame icon fallback
            imageUrl = 'data:image/svg+xml;base64,' + btoa(`
              <svg width="150" height="150" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="20" height="20" rx="2" fill="#d4a574" stroke="#b8860b" stroke-width="1"/>
                <rect x="3" y="3" width="18" height="18" rx="1" fill="#f5f5f5"/>
                <rect x="4" y="4" width="16" height="8" fill="#87ceeb"/>
                <circle cx="12" cy="7" r="1.5" fill="#ffd700"/>
                <path d="M12 4l0 1M12 9l0 1M8 7l1 0M15 7l1 0M9.5 5.5l0.7 0.7M13.8 8.2l0.7 0.7M9.5 8.5l0.7 -0.7M13.8 5.8l0.7 -0.7" stroke="#ffd700" stroke-width="0.5"/>
                <ellipse cx="8" cy="6" rx="1.2" ry="0.8" fill="white" opacity="0.9"/>
                <ellipse cx="16" cy="5.5" rx="1" ry="0.6" fill="white" opacity="0.9"/>
                <path d="M4 12l4 -2l4 1l4 -1l4 2v6h-16z" fill="#90ee90"/>
                <path d="M4 14l3 -1l3 0.5l3 -0.5l3 1v4h-12z" fill="#7ccd7c"/>
              </svg>
            `);
            // Using fallback picture frame icon
          }
        } else if (element.field === 'logo' || element.field === 'companyLogo') {
          // Check if we have cached Base64 version
          if (cachedImages.companyLogo) {
            imageUrl = cachedImages.companyLogo;
            // Using cached company logo
          } else {
            // Get company logo from userData
            imageUrl = memoizedUserData?.companyLogo || 
                      memoizedUserData?.logo_url ||
                      memoizedUserData?.user_metadata?.companyLogo || '';
          }
          
          // Logo image binding
          
          // Only use fallback if no URL available
          if (!imageUrl) {
            // Use picture frame icon fallback
            imageUrl = 'data:image/svg+xml;base64,' + btoa(`
              <svg width="150" height="150" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="20" height="20" rx="2" fill="#d4a574" stroke="#b8860b" stroke-width="1"/>
                <rect x="3" y="3" width="18" height="18" rx="1" fill="#f5f5f5"/>
                <rect x="4" y="4" width="16" height="8" fill="#87ceeb"/>
                <circle cx="12" cy="7" r="1.5" fill="#ffd700"/>
                <path d="M12 4l0 1M12 9l0 1M8 7l1 0M15 7l1 0M9.5 5.5l0.7 0.7M13.8 8.2l0.7 0.7M9.5 8.5l0.7 -0.7M13.8 5.8l0.7 -0.7" stroke="#ffd700" stroke-width="0.5"/>
                <ellipse cx="8" cy="6" rx="1.2" ry="0.8" fill="white" opacity="0.9"/>
                <ellipse cx="16" cy="5.5" rx="1" ry="0.6" fill="white" opacity="0.9"/>
                <path d="M4 12l4 -2l4 1l4 -1l4 2v6h-16z" fill="#90ee90"/>
                <path d="M4 14l3 -1l3 0.5l3 -0.5l3 1v4h-12z" fill="#7ccd7c"/>
              </svg>
            `);
            // Using fallback picture frame icon
          }
        }
        
        // If we have a bound image URL, use it
        if (imageUrl) {
          const isImageLoaded = imageLoadingStatesRef.current[element.id];
          
          // Using bound image
          
          return (
            <div className="w-full h-full relative">
              {/* Show loading placeholder only if image hasn't loaded yet */}
              {!isImageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              )}
              
              <img 
                src={imageUrl} 
                alt="Bound Image" 
                className={`w-full h-full object-contain transition-opacity duration-300 ${
                  isImageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => {
                  // Image loaded successfully
                  handleImageLoad(element.id);
                }}
                onError={(e) => {
                  console.error('❌ Image failed to load:', imageUrl.substring(0, 50) + '...');
                  console.error('❌ Full URL length:', imageUrl.length);
                  console.error('❌ URL type:', imageUrl.startsWith('data:') ? 'base64' : 'url');
                  
                  handleImageError(element.id);
                  
                  // Try to reload the image once
                  const img = e.currentTarget;
                  const originalSrc = img.src;
                  
                  // Add a small delay and retry
                  setTimeout(() => {
                    if (img.src === originalSrc) {
                      // Retrying image load
                      img.src = originalSrc + '?retry=' + Date.now();
                    }
                  }, 1000);
                }}
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '100%',
                  display: 'block'
                }}
              />
            </div>
          );
        }
      }
      
      // Fallback to element's own imageUrl
      if (element.imageUrl) {
        // Using element imageUrl
        return <img src={element.imageUrl} alt="Picture" className="w-full h-full object-contain" />;
      }
      
      // If no image available, show placeholder
      // No image available, showing placeholder
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
    }
    
    if (element.type === 'social') {

      // Function to get icon component by name (moved here to be accessible by getSocialIcon)
      const getIconComponent = (iconName: string) => {
        // Map PropertyPanel icon values to FontAwesome components
        const iconMap: { [key: string]: any } = {
          // Original FontAwesome icons
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
          'FaTiktok': FaTiktok,
          
          // PropertyPanel icon values mapped to FontAwesome components
          'phone': FaPhone,
          'email': FaEnvelope,
          'website': FaGlobe,
          'location': FaHome,
          'facebook': Facebook, // Use Lucide React icon like Canvas
          'instagram': Instagram, // Use Lucide React icon like Canvas
          'twitter': Twitter, // Use Lucide React icon like Canvas
          'linkedin': Linkedin, // Use Lucide React icon like Canvas
          'youtube': FaYoutube,
          'line': MessageCircle, // Use Lucide React icon like Canvas
          'whatsapp': FaWhatsapp,
          'telegram': FaTelegram,
          'github': FaGithub,
          'skype': FaSkype,
          'zoom': Video, // Use Lucide React icon like Canvas
          'tiktok': FaTiktok,
          'discord': FaDiscord,
          'slack': FaSlack,
          'wechat': MessageCircle, // Use Lucide React icon like Canvas
          'viber': FaViber,
          'snapchat': FaSnapchat,
          'pinterest': FaPinterest,
          'reddit': FaReddit,
          'twitch': FaTwitch
        };
        return iconMap[iconName] || FaStar;
      };

      const getSocialIcon = (field: string) => {
        const iconSize = 12; // Smaller icon for preview
        const IconComponent = getIconComponent(field);
        const brandClassMap: { [k: string]: string } = {
          facebook: 'text-blue-600',
          line: 'text-green-500',
          linkedin: 'text-blue-700',
          twitter: 'text-blue-400',
          instagram: 'text-pink-500',
          tiktok: 'text-black',
          youtube: 'text-red-600',
          telegram: 'text-blue-500',
          whatsapp: 'text-green-600',
          wechat: 'text-green-700',
          snapchat: 'text-yellow-500',
          pinterest: 'text-red-700',
          reddit: 'text-orange-600',
          discord: 'text-indigo-600',
          slack: 'text-purple-600',
          viber: 'text-purple-700',
          skype: 'text-blue-600',
          zoom: 'text-blue-800',
          github: 'text-gray-800',
          twitch: 'text-purple-800'
        };
        const brandClass = brandClassMap[field] || '';
        return (
          <IconComponent 
            size={iconSize}
            className={brandClass}
            style={{ display: 'block' }}
          />
        );
      };

      return (
        <div 
          className="w-full h-full flex items-center space-x-1"
          style={{
            justifyContent: element.style.textAlign === 'center' ? 'center' : 
                           element.style.textAlign === 'right' ? 'flex-end' : 'flex-start'
          }}
        >
          {getSocialIcon(element.field || '')}
          <span 
            className="truncate text-xs"
            style={{
              fontSize: `${(element.style.fontSize || 14) * scale}px`,
              fontFamily: element.style.fontFamily || 'Arial',
              fontWeight: element.style.fontWeight,
              // fontStyle: element.style.fontStyle,
              color: (element.style && (
                (element.style as any).color ||
                (element.style as any).iconColor ||
                ((element.style as any).border && (element.style as any).border.color) ||
                (element.style as any).backgroundColor
              )),
              // textDecoration: element.style.textDecoration,
              // textDecorationStyle: element.style.textDecorationStyle,
            }}
          >
            {(() => {
              const userValue = getUserFieldValueLocal(element.field || '', 
                element.field && ['personalAddress1', 'personalAddress2', 'workAddress1', 'workAddress2'].includes(element.field) 
                  ? element.useAddressPrefix !== false 
                  : true
              );
              // Use fieldValues if available and not empty, otherwise use userValue
              const displayValue = (fieldValues?.[element.id] && fieldValues[element.id].trim() !== '') 
                ? fieldValues[element.id] 
                : userValue;
              // Mirror Canvas behavior: if no value, show nothing (do not use fallback/content)
              if (displayValue) return displayValue;
              return '';
            })()}
          </span>
        </div>
      );
    }

    if (element.type === 'qrcode') {
      // QR Code cannot be edited, so use element content or user data only
      // Memoize QR content to prevent unnecessary re-renders
      const qrContent = useMemo(() => {
        return element.content || getUserFieldValueLocal(element.field || '', true) || 'https://www.scgjwd.com/';
      }, [element.content, element.field]);
      
      return (
        <div className="w-full h-full flex items-center justify-center">
          <QRCodeCanvas
            element={element}
            content={qrContent}
          />
        </div>
      );
    }

    if (element.type === 'icon') {

      // Function to get icon component by name
      const getIconComponent = (iconName: string) => {
        // Map PropertyPanel icon values to FontAwesome components
        const iconMap: { [key: string]: any } = {
          // Original FontAwesome icons
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
          'FaTiktok': FaTiktok,
          
          // PropertyPanel icon values mapped to FontAwesome components
          'phone': FaPhone,
          'email': FaEnvelope,
          'website': FaGlobe,
          'location': FaHome,
          'facebook': Facebook, // Use Lucide React icon like Canvas
          'instagram': Instagram, // Use Lucide React icon like Canvas
          'twitter': Twitter, // Use Lucide React icon like Canvas
          'linkedin': Linkedin, // Use Lucide React icon like Canvas
          'youtube': FaYoutube,
          'line': MessageCircle, // Use Lucide React icon like Canvas
          'whatsapp': FaWhatsapp,
          'telegram': FaTelegram,
          'github': FaGithub,
          'skype': FaSkype,
          'zoom': Video, // Use Lucide React icon like Canvas
          'tiktok': FaTiktok,
          'discord': FaDiscord,
          'slack': FaSlack,
          'wechat': MessageCircle, // Use Lucide React icon like Canvas
          'viber': FaViber,
          'snapchat': FaSnapchat,
          'pinterest': FaPinterest,
          'reddit': FaReddit,
          'twitch': FaTwitch
        };
        return iconMap[iconName] || FaStar;
      };

      const IconComponent = getIconComponent(element.iconName || 'FaStar');
      const iconSize = Math.min(element.width, element.height) * 0.6 * scale;
      const finalIconSize = Math.max(8, Math.min(iconSize, 32)); // Min 8px, Max 32px for preview

      return (
        <div 
          className="w-full h-full flex items-center justify-center"
          style={{
            backgroundColor: element.style?.backgroundColor || 'transparent',
            border: element.style?.border ? `${(element.style.border.width || 0) * scale}px solid ${element.style.border.color || '#000000'}` : 'none',
            borderRadius: element.style?.border?.radius ? `${(element.style.border.radius || 0) * scale}px` : '0px',
            padding: element.style?.padding ? `${(element.style.padding || 0) * scale}px` : '2px',
            boxShadow: element.style?.boxShadow || 'none',
            filter: element.style?.filter || 'none',
            opacity: element.style?.opacity || 1
          }}
        >
          <IconComponent 
            size={finalIconSize}
            style={{ 
              color: element.style.color || '#000000',
              display: 'block'
            }} 
          />
        </div>
      );
    }

    return (
      <div
        className="w-full h-full text-xs"
        style={{
          fontSize: `${(element.style.fontSize || 14) * scale}px`,
          fontFamily: element.style.fontFamily || 'Arial',
          fontWeight: element.style.fontWeight,
          // fontStyle: element.style.fontStyle,
          color: element.style.color,
          textAlign: element.style.textAlign,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          // textDecoration: element.style.textDecoration,
          // textDecorationStyle: element.style.textDecorationStyle,
        }}
      >
        {(() => {
          // Prefer live input value from fieldValues ("Input Content (Optional)") when provided
          const inputOverride = (fieldValues?.[element.id] && fieldValues[element.id].trim() !== '')
            ? fieldValues[element.id]
            : '';

          if (inputOverride) return inputOverride;

          const userValue = getUserFieldValueLocal(element.field || '', 
            element.field && ['personalAddress1', 'personalAddress2', 'workAddress1', 'workAddress2'].includes(element.field) 
              ? element.useAddressPrefix !== false 
              : true
          );
          if (userValue) return userValue;
          if (element.field) return getFallbackText(element.field);
          return element.content || 'Sample Text';
        })()}
      </div>
    );
  }

  // Always render elements instead of using preview image to show dynamic data
  
  // Skip preview image and always render elements
  // if (previewImage && previewImage.trim() !== '') {
  //   console.log('🔍 TemplatePreview: Using preview image');
  //   console.log('  - previewImage length:', previewImage.length);
  //   console.log('  - previewImage starts with data:', previewImage.startsWith('data:image/'));
  //   
  //   // Check if preview image is valid
  //   const isValidImage = previewImage.startsWith('data:image/') && previewImage.length > 100;
  //   
  //   console.log('  - isValidImage:', isValidImage);
  //   
  //   if (!isValidImage) {
  //     console.log('  - Invalid preview image, falling back to element rendering');
  //     // Fall through to element rendering
  //   } else {
  //     console.log('  - Valid preview image, rendering image instead of elements');
  //     return (
  //     return (
  //       <div 
  //         className="relative border border-gray-300 rounded-lg overflow-hidden shadow-sm bg-white"
  //         style={{
  //           width: mmToPxWidth,
  //           height: mmToPxHeight,
  //           minWidth: '300px',
  //           minHeight: '200px',
  //         }}
  //       >
  //         <img 
  //           src={previewImage} 
  //           alt={`${template.name} preview`}
  //           className="w-full h-full object-contain"
  //           style={{
  //             width: '100%',
  //             height: '100%',
  //             objectFit: 'contain',
  //             display: 'block'
  //           }}
  //           onLoad={() => {
  //           }}
  //           onError={(e) => {
  //             // Preview image failed to load
  //             // Show fallback content instead of hiding
  //             e.currentTarget.style.display = 'none';
  //             const fallback = document.createElement('div');
  //             fallback.className = 'w-full h-full flex items-center justify-center bg-gray-100 text-gray-500 text-xs';
  //             fallback.innerHTML = `
  //               <div class="text-center">
  //                 <svg class="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
  //                 </svg>
  //                 <div>Preview Error</div>
  //               </div>
  //             `;
  //             e.currentTarget.parentNode?.appendChild(fallback);
  //           }}
  //         />
  //       </div>
  //     );
  //   }
  // }

  // Render template elements (fallback when preview image is not available or invalid)
  const backgroundStyle = getBackgroundStyle();
  
  // Container size must match paper size exactly (same as Canvas component)
  // This ensures element positions match the dashboard preview
  const finalStyle = {
    width: mmToPxWidth,
    height: mmToPxHeight,
    minWidth: '300px',
    minHeight: '200px',
    ...backgroundStyle,
    // Ensure background is visible
    backgroundAttachment: 'scroll',
    backgroundClip: 'border-box',
    backgroundOrigin: 'border-box'
  };
  
  
  return (
    <div 
      className="relative border border-gray-300 rounded-lg overflow-visible shadow-sm"
      style={finalStyle}
    >
      {template.elements.length > 0 ? (
        template.elements.map((element) => (
          <div
            key={element.id}
            className="absolute"
            style={{
              left: (element.x || 0) * scale,
              top: (element.y || 0) * scale,
              width: (element.width || 100) * scale,
              height: (element.height || 50) * scale,
              border: element.style.border?.width 
                ? `${(element.style.border.width || 0) * scale}px solid ${element.style.border.color || '#000000'}`
                : 'none',
              borderRadius: element.style.border?.radius 
                ? `${(element.style.border.radius || 0) * scale}px`
                : '0',
            backgroundColor: element.style.backgroundColor || 'transparent',
            // boxShadow: element.style.boxShadow || 'none',
            // filter: element.style.filter || 'none',
            }}
          >
            {getElementContent(element)}
          </div>
        ))
      ) : (
        // Show placeholder when no elements
        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
          <div className="text-center">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>Empty Template</div>
          </div>
        </div>
      )}
    </div>
  );
});

export { TemplatePreview };
