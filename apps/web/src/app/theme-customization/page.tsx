'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import dynamic from 'next/dynamic';
import { Navbar } from '@/components/layout/Navbar';
import { Template, CanvasElement, PaperSettings, MOCK_DATA } from '@/types/theme-customization';
import { SAMPLE_TEMPLATES } from '@/data/sample-templates';
import { useAuth } from '@/lib/auth-context';
import { createUserData, UserData } from '@/utils/userDataUtils';
import { Edit, Trash2, Eye, Copy, Plus, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const Canvas = dynamic(
  () =>
    import('@/components/theme-customization/Canvas').then((mod) => ({
      default: mod.Canvas,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="text-center text-gray-400 p-6">กำลังโหลดผืนผ้าใบ...</div>
    ),
  }
);

const RightPanel = dynamic(
  () =>
    import('@/components/theme-customization/RightPanel').then((mod) => ({
      default: mod.RightPanel,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="text-center text-gray-400 p-6">กำลังโหลดแผงปรับแต่ง...</div>
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
      <div className="text-center text-gray-400 p-6">กำลังโหลดตัวอย่างแม่แบบ...</div>
    ),
  }
);

export default function ThemeCustomizationPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'create' | 'templates'>('create');
  const [selectedElement, setSelectedElement] = useState<CanvasElement | null>(null);
  const [paperSettings, setPaperSettings] = useState<PaperSettings>({
    size: 'Business Card (L)', // Default size
    width: 180,
    height: 110,
    orientation: 'portrait',
    background: {
      type: 'color',
      color: '#ffffff',
      gradient: {
        type: 'base',
        colors: ['#ffffff'],
        direction: 'horizontal'
      }
    }
  });
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [templates, setTemplates] = useState<Template[]>(SAMPLE_TEMPLATES);
  const [useAddressPrefix, setUseAddressPrefix] = useState<boolean>(true);
  
  // State for editing existing template
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editingTemplateName, setEditingTemplateName] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  // State for preview popup and copy dialog
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [showCopyDialog, setShowCopyDialog] = useState<boolean>(false);
  const [copyTemplate, setCopyTemplate] = useState<Template | null>(null);
  const [newTemplateName, setNewTemplateName] = useState<string>('');
  const [loadingTemplates, setLoadingTemplates] = useState<boolean>(true);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [previewZoom, setPreviewZoom] = useState<number>(100);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  // เก็บค่าเดิมของ gradient colors ไว้
  const [savedGradientColors, setSavedGradientColors] = useState<string[]>(['#ffffff', '#ffffff', '#ffffff']);
  const [savedGradientDirection, setSavedGradientDirection] = useState<'horizontal' | 'vertical' | 'diagonal'>('horizontal');
  
  // User data from auth context
  const [userData, setUserData] = useState<any>(null);
  
  // Get current user role for permission checking
  const [currentUserRole, setCurrentUserRole] = useState<string>('user');
  
  // User plan and capabilities
  const [userPlan, setUserPlan] = useState<string>('Free');
  const [planCapabilities, setPlanCapabilities] = useState<any>(null);
  const [userTemplatesCount, setUserTemplatesCount] = useState<number>(0);
  const [isLoadingUserData, setIsLoadingUserData] = useState<boolean>(false);
  
  // Track last fetch time to prevent rapid successive calls
  const lastFetchTimeRef = useRef<number>(0);
  const fetchCooldown = 5000; // 5 seconds cooldown between fetches
  
  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Template usage count (cards using each template)
  const [templateUsage, setTemplateUsage] = useState<{ [key: string]: number }>({});
  // Highlight info for newly created/updated template (shows once)
  const [highlightInfo, setHighlightInfo] = useState<{ id: string; type: 'new' | 'update' } | null>(null);
  // Flag to reset create tab on next open
  const [resetCreateOnOpen, setResetCreateOnOpen] = useState<boolean>(false);
  
  // Delete template confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [templateToDelete, setTemplateToDelete] = useState<{ id: string; name: string; cards: any[] } | null>(null);

  // Helper: reset Create/Edit tab to initial state
  const resetCreateTabState = useCallback(() => {
    setElements([]);
    setPaperSettings({
      size: 'Business Card (L)',
      width: 180,
      height: 110,
      orientation: 'portrait',
      background: {
        type: 'color',
        color: '#ffffff',
        gradient: {
          type: 'base',
          colors: ['#ffffff'],
          direction: 'horizontal'
        }
      }
    });
    setSelectedElement(null);
    setEditingTemplateId(null);
    setEditingTemplateName('');
    setHasUnsavedChanges(false);
    setUseAddressPrefix(true);
    setSavedGradientColors(['#ffffff', '#ffffff', '#ffffff']);
    setSavedGradientDirection('horizontal');
  }, []);

  // Load user data function
  const loadUserData = useCallback(async () => {
      // Check cooldown period to prevent rapid successive calls
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTimeRef.current;
      
      if (timeSinceLastFetch < fetchCooldown) {
        console.log(`⏳ Skipping fetch - cooldown active (${Math.ceil((fetchCooldown - timeSinceLastFetch) / 1000)}s remaining)`);
        return;
      }
      
      if (user && !isLoadingUserData) { // Prevent multiple simultaneous calls
        try {
          setIsLoadingUserData(true);
          lastFetchTimeRef.current = now; // Update last fetch time
          
          // ใช้ API เดียวกันกับหน้า Settings
          console.log('🔄 Fetching profile data via /api/get-profile');
          
          const { supabase } = await import('@/lib/supabase/client');
          const { data: { session } } = await supabase!.auth.getSession();
          
          if (!session?.access_token) {
            console.warn('No session token');
            setIsLoadingUserData(false);
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
          
          // Handle rate limit error
          if (response.status === 429) {
            console.warn('⚠️ Rate limit exceeded, will retry after cooldown');
            // Extend cooldown period when rate limited
            const retryAfter = result.retryAfter || 30;
            lastFetchTimeRef.current = now - (fetchCooldown - retryAfter * 1000);
            return;
          }
          
          if (result.success && result.profile) {
            const profile = result.profile;
              console.log('Profile data from Supabase:', profile);
              console.log('📍 Addresses from profile:', profile.addresses);
              
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
              
              // Only update if plan has changed
              if (plan !== userPlan) {
                setUserPlan(plan);
                
                // Reload templates to get updated count (without page reload)
              }
              
              // Addresses มาจาก /api/get-profile แล้ว
              const addressesList = profile.addresses || [];
              let addressData = '';
              
              if (addressesList.length > 0) {
                const primaryAddress = addressesList.find((addr: any) => addr.is_primary) || addressesList[0];
                addressData = `${primaryAddress.address}, ${primaryAddress.district}, ${primaryAddress.province} ${primaryAddress.postalCode || ''}`.trim();
                console.log('📍 Address data:', addressData);
              }
              
              const userDataToSet = createUserData(profile, user, addressesList);
              
              console.log('🖼️ Setting userData with image data:', {
                avatar_url: userDataToSet.avatar_url,
                company_logo: userDataToSet.user_metadata.company_logo,
                profile_avatar_url: profile.avatar_url,
                user_avatar_url: user.user_metadata?.avatar_url
              });
              
              console.log('📍 Address data debug:', {
                addressesList: addressesList,
                addressesLength: addressesList.length,
                personal_address_1_id: profile.personal_address_1_id,
                personal_address_2_id: profile.personal_address_2_id,
                work_address_1_id: profile.work_address_1_id,
                work_address_2_id: profile.work_address_2_id
              });
              
              // เพิ่ม addresses array ลงใน userDataToSet
              userDataToSet.addresses = addressesList;
              
              setUserData(userDataToSet);
              return;
            }
          
          console.warn('⚠️ No profile data found');
        } catch (error) {
          console.error('Error loading profile data:', error);
        } finally {
          setIsLoadingUserData(false);
        }
      }
    }, [user, userPlan]);

  // Check authentication and redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  // Load level capabilities
  useEffect(() => {
    const loadCapabilities = async () => {
      try {
        const response = await fetch('/api/admin/level-capabilities');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.capabilities) {
            setPlanCapabilities(data.capabilities);
          }
        }
      } catch (error) {
        console.error('Error loading capabilities:', error);
      }
    };

    loadCapabilities();
  }, []);

  // Load templates on component mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoadingTemplates(true);
        setTemplatesError(null);
        
        // Get session token for authorization
        const { supabase } = await import('@/lib/supabase/client');
        const { data: { session } } = await supabase!.auth.getSession();
        
        const headers: HeadersInit = {};
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
        
        // Load templates
        const response = await fetch('/api/templates', { headers });
        if (response.ok) {
          const data = await response.json();
          console.log('Raw templates data:', data);
          
          // Convert database format to Template format
          const templates = (data.templates || []).map((dbTemplate: any) => ({
              id: dbTemplate.id,
              name: dbTemplate.name,
            paper: dbTemplate.paper_settings,
              elements: dbTemplate.elements || [],
              createdAt: new Date(dbTemplate.created_at),
              updatedAt: new Date(dbTemplate.updated_at || dbTemplate.created_at),
            previewImage: dbTemplate.preview_url || '',
            user_type: dbTemplate.user_type || 'user' // Add user_type for permission checking
          }));
          
          console.log('Converted templates:', templates);
          setTemplates(templates);
          
          // Count user's own templates (exclude admin/owner templates)
          const userOwnTemplates = templates.filter((t: any) => t.user_type === 'user');
          setUserTemplatesCount(userOwnTemplates.length);
        } else {
          console.error('Failed to fetch templates:', response.status, response.statusText);
          const errorData = await response.json();
          console.error('Error details:', errorData);
          setTemplatesError(`ไม่สามารถโหลด templates ได้: ${errorData.error || response.statusText}`);
        }
        
        // Load template usage statistics
        try {
          const usageResponse = await fetch('/api/templates/usage', { headers });
          if (usageResponse.ok) {
            const usageData = await usageResponse.json();
            console.log('Template usage data:', usageData);
            setTemplateUsage(usageData.usage || {});
          }
        } catch (error) {
          console.error('Error loading template usage:', error);
          // Not critical, so just log the error
        }
      } catch (error) {
        console.error('Error loading templates:', error);
        setTemplatesError('เกิดข้อผิดพลาดในการโหลด templates');
      } finally {
        setLoadingTemplates(false);
      }
    };

    loadTemplates();
  }, []);

  // Read highlight intent from sessionStorage (single-shot) and clear it
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('templateHighlight');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.id && (parsed.type === 'new' || parsed.type === 'update')) {
          setHighlightInfo(parsed);
        }
        sessionStorage.removeItem('templateHighlight');
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // When user switches back to Create tab, apply reset once if requested
  useEffect(() => {
    if (activeTab === 'create') {
      const resetFlag = sessionStorage.getItem('resetCreateTab');
      if (resetCreateOnOpen || resetFlag === '1') {
        resetCreateTabState();
        setResetCreateOnOpen(false);
        try { sessionStorage.removeItem('resetCreateTab'); } catch {}
      }
    }
  }, [activeTab, resetCreateOnOpen, resetCreateTabState]);

  // Ensure clearing on unmount (client-side navigation away)
  useEffect(() => {
    return () => {
      try { sessionStorage.removeItem('templateHighlight'); } catch {}
      setHighlightInfo(null);
    };
  }, []);

  // Clear badge when user navigates away (so coming back won't show it)
  useEffect(() => {
    const handleHide = () => {
      try { sessionStorage.removeItem('templateHighlight'); } catch {}
      setHighlightInfo(null);
    };
    window.addEventListener('pagehide', handleHide);
    window.addEventListener('beforeunload', handleHide);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) handleHide();
    });
    return () => {
      window.removeEventListener('pagehide', handleHide);
      window.removeEventListener('beforeunload', handleHide);
      // no need to remove anonymous visibilitychange listener
    };
  }, []);

  // Track changes when editing existing template
  useEffect(() => {
    if (editingTemplateId) {
      // Only set unsaved changes if we're not just loading the template initially
      // This prevents showing "unsaved changes" when first loading a template
      const isInitialLoad = !hasUnsavedChanges;
      if (!isInitialLoad) {
        setHasUnsavedChanges(true);
      }
    }
  }, [elements, paperSettings]);

  // Check for editTemplateId from URL parameters
  useEffect(() => {
    const editTemplateId = searchParams.get('editTemplateId');
    if (editTemplateId && templates.length > 0) {
      const template = templates.find(t => t.id === editTemplateId);
      if (template) {
        console.log('🎨 ThemeCustomization: Auto-loading template for editing:', template.name);
        // Load template for editing
        setElements(template.elements || []);
        setPaperSettings(template.paper || {
          size: 'Business Card (L)',
          width: 180,
          height: 110,
          orientation: 'portrait',
          background: {
            type: 'color',
            color: '#ffffff',
            gradient: {
              type: 'base',
              colors: ['#ffffff'],
              direction: 'horizontal'
            }
          }
        });
        setEditingTemplateId(template.id);
        setEditingTemplateName(template.name);
        setHasUnsavedChanges(false);
        setUseAddressPrefix(true); // Reset address prefix to default
        setActiveTab('create');
      }
    }
  }, [templates, searchParams]);

  // Load user data when user changes
  useEffect(() => {
    if (user) {
    loadUserData();
    }
  }, [user]); // Only depend on user, not loadUserData to prevent loops

  // Refresh user data when page becomes visible (e.g., returning from Settings)
  // Debounced to prevent rapid successive calls
  useEffect(() => {
    let visibilityTimeout: NodeJS.Timeout;
    let focusTimeout: NodeJS.Timeout;
    
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        // Clear any pending timeout
        clearTimeout(visibilityTimeout);
        // Debounce the call
        visibilityTimeout = setTimeout(() => {
        loadUserData();
        }, 1000); // Wait 1 second after visibility change
      }
    };

    const handleFocus = () => {
      if (user) {
        // Clear any pending timeout
        clearTimeout(focusTimeout);
        // Debounce the call
        focusTimeout = setTimeout(() => {
        loadUserData();
        }, 1000); // Wait 1 second after focus
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearTimeout(visibilityTimeout);
      clearTimeout(focusTimeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, loadUserData]);

  // Show loading state while checking authentication
  if (isLoading) {
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

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    console.log('Drag start event:', { active: active.id, data: active.data.current });
    setIsDragging(true);
    setSelectedElement(active.data.current as CanvasElement);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    console.log('Drag end event:', { active: active.id, over: over?.id });
    setIsDragging(false);

    if (over && over.id === 'canvas') {
      console.log('Adding element to canvas:', active.data.current);
      console.log('Current elements before adding:', elements.length);
      
      // Get mouse position relative to canvas
      const canvasRect = document.getElementById('canvas')?.getBoundingClientRect();
      const activatorEvent = event.activatorEvent as MouseEvent;
      
      // Fallback to center position if no mouse position available
      let x = 50;
      let y = 50;
      
      if (activatorEvent && canvasRect) {
        const mouseX = activatorEvent.clientX;
        const mouseY = activatorEvent.clientY;
        // Calculate position relative to canvas
        const relativeX = mouseX - canvasRect.left;
        const relativeY = mouseY - canvasRect.top;
        
        // Use mouse position relative to canvas directly (no offset needed for new elements)
        // Consider paper size - canvasRect.width/height is the actual canvas size in pixels
        x = Math.max(0, Math.min(relativeX, canvasRect.width - 100));
        y = Math.max(0, Math.min(relativeY, canvasRect.height - 30));
        
        // Debug: Check if position is reasonable
        console.log('Position check:', {
          relativeX,
          relativeY,
          canvasWidth: canvasRect.width,
          canvasHeight: canvasRect.height,
          finalX: x,
          finalY: y,
          isNearRight: x > canvasRect.width * 0.8,
          isNearBottom: y > canvasRect.height * 0.8
        });
        
        // If position is near right edge, try to center it
        if (x > canvasRect.width * 0.8) {
          x = Math.max(0, canvasRect.width / 2 - 50); // Center horizontally
          console.log('Adjusted position to center:', { x, y });
        }
        
        console.log('Mouse position calculation:', { 
          mouseX, 
          mouseY, 
          canvasRect: { 
            left: canvasRect.left, 
            top: canvasRect.top, 
            width: canvasRect.width, 
            height: canvasRect.height 
          },
          relativeX, 
          relativeY, 
          finalX: x, 
          finalY: y,
          paperSettings: paperSettings
        });
      } else {
        console.log('Using fallback position:', { x, y, hasActivatorEvent: !!activatorEvent, hasCanvasRect: !!canvasRect });
      }
      
      console.log('Creating element with position:', { x, y, elementType: active.data.current?.type });
      
      const newElement: CanvasElement = {
        id: `element-${Date.now()}`,
        type: active.data.current?.type || 'text',
        content: active.data.current?.content || '',
        field: active.data.current?.type === 'social' ? 'facebook' : '', // Set default field for social elements
        x: x,
        y: y,
        width: active.data.current?.type === 'qrcode' ? 80 : 100,
        height: active.data.current?.type === 'qrcode' ? 80 : 30,
        style: {
          fontSize: 14,
          color: '#000000',
          // fontFamily: 'Arial',
          fontWeight: 'normal',
          textAlign: 'left',
          backgroundColor: 'transparent',
          // borderColor: 'transparent',
          // borderWidth: 0,
          // borderRadius: 0,
          padding: 0,
          // margin: 0,
          // opacity: 1,
          // rotation: 0,
          // zIndex: elements.length
        },
        // QR code specific properties
        ...(active.data.current?.type === 'qrcode' && {
          qrUrl: '',
          qrStyle: 'standard' as const,
          qrColor: '#000000'
        })
      };
      
      setElements(prev => {
        const newElements = [...prev, newElement];
        console.log('Elements after adding:', newElements.length);
        return newElements;
      });
            
      // Auto-select the newly created element
      setSelectedElement(newElement);
    } else {
      console.log('Drop not on canvas, over:', over?.id);
      setSelectedElement(null);
    }
  };

  const handleElementSelect = (element: CanvasElement | null) => {
    if (element) {
      console.log('Element selected:', element.id);
    } else {
      console.log('Element deselected');
    }
    setSelectedElement(element);
  };

  const handleElementUpdate = (updatedElement: CanvasElement) => {
    setElements(prev => 
      prev.map(el => el.id === updatedElement.id ? updatedElement : el)
    );
    // Update selectedElement if it's the same element
    if (selectedElement && selectedElement.id === updatedElement.id) {
    setSelectedElement(updatedElement);
    }
  };

  const handleElementDelete = (elementId: string) => {
    console.log('Element deleted:', elementId);
    setElements(prev => prev.filter(el => el.id !== elementId));
      setSelectedElement(null);
  };

  const handlePaperSettingsChange = (newSettings: PaperSettings) => {
    setPaperSettings(newSettings);
  };

  // Helper function to convert mm to pixels
  const mmToPx = (mm: number) => mm * 3.7795275591; // 1mm = 3.7795275591px at 96 DPI

  const captureCanvasAsImage = async (): Promise<string> => {
    return new Promise((resolve) => {
      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        console.warn('Canvas capture timeout, using placeholder');
        resolve('data:image/png;base64,placeholder');
      }, 10000); // 10 second timeout
      
      try {
        // Get the canvas element
        const canvasElement = document.getElementById('canvas');
        if (!canvasElement) {
          console.warn('Canvas element not found, using placeholder');
          clearTimeout(timeout);
          resolve('data:image/png;base64,placeholder');
          return;
        }

        // Create a canvas to capture the content
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.warn('Canvas context not available, using placeholder');
          clearTimeout(timeout);
          resolve('data:image/png;base64,placeholder');
          return;
        }
        
        // Set canvas size to match paper settings
        const width = mmToPx(paperSettings.width);
        const height = mmToPx(paperSettings.height);
        canvas.width = width;
        canvas.height = height;

        // Fill background
        if (paperSettings.background.type === 'color') {
          ctx.fillStyle = paperSettings.background.color || '#ffffff';
          ctx.fillRect(0, 0, width, height);
        } else if (paperSettings.background.type === 'gradient' && paperSettings.background.gradient) {
          const gradient = paperSettings.background.gradient.direction === 'horizontal' 
            ? ctx.createLinearGradient(0, 0, width, 0)
            : ctx.createLinearGradient(0, 0, 0, height);
          
          paperSettings.background.gradient.colors.forEach((color, index) => {
            gradient.addColorStop(index / (paperSettings.background.gradient!.colors.length - 1), color);
          });
          
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);
        } else if (paperSettings.background.type === 'image' && paperSettings.background.image) {
            const img = new Image();
            img.onload = () => {
              ctx.drawImage(img, 0, 0, width, height);
              // Continue with element rendering after image loads
              renderElementsToCanvas(ctx, width, height);
              
              // Convert to data URL after everything is rendered
              const dataURL = canvas.toDataURL('image/png');
              console.log('Canvas captured successfully with background image:', dataURL.substring(0, 50) + '...');
              clearTimeout(timeout);
              resolve(dataURL);
            };
            img.onerror = () => {
              console.warn('Background image failed to load, using solid color');
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, width, height);
              renderElementsToCanvas(ctx, width, height);
              
              const dataURL = canvas.toDataURL('image/png');
              console.log('Canvas captured with fallback background:', dataURL.substring(0, 50) + '...');
              clearTimeout(timeout);
              resolve(dataURL);
            };
            img.src = paperSettings.background.image;
            return; // Will continue in img.onload or img.onerror
        }

        // Render elements
        renderElementsToCanvas(ctx, width, height);
              
              // Convert to data URL
        const dataURL = canvas.toDataURL('image/png');
        console.log('Canvas captured successfully:', dataURL.substring(0, 50) + '...');
        clearTimeout(timeout);
        resolve(dataURL);

      } catch (error) {
        console.error('Error capturing canvas:', error);
        clearTimeout(timeout);
        resolve('data:image/png;base64,placeholder');
      }
    });
  };

  // Helper function to render elements to canvas
  // Get data from userData based on field (same as PropertyPanel)
  const getFieldData = (field: string) => {
    if (!userData || !field) {
      return '';
    }
    
    // Map field names to userData properties
    const fieldMap: { [key: string]: string } = {
      'name': userData.name || userData.user_metadata?.full_name || '',
      'nameEn': userData.nameEn || userData.user_metadata?.full_name_english || '',
      'personalId': userData.personalId || userData.user_metadata?.personal_id || '',
      'personalPhone': userData.personalPhone || userData.user_metadata?.personal_phone || '',
      'personalEmail': userData.personalEmail || userData.user_metadata?.personal_email || userData.email || '',
      'workName': userData.workName || userData.user_metadata?.company || '',
      'workDepartment': userData.workDepartment || userData.user_metadata?.department || '',
      'workPosition': userData.workPosition || userData.user_metadata?.job_title || '',
      'workPhone': userData.workPhone || userData.user_metadata?.work_phone || '',
      'workEmail': userData.workEmail || userData.user_metadata?.work_email || '',
      'workWebsite': userData.workWebsite || userData.user_metadata?.website || '',
      'taxIdMain': userData.taxIdMain || userData.user_metadata?.tax_id_main || '',
      'taxIdBranch': userData.taxIdBranch || userData.user_metadata?.tax_id_branch || '',
      // New address fields
      'personalAddress1': (() => {
        console.log('🔍 personalAddress1 debug:', {
          hasMetadata: !!userData.user_metadata,
          personal_address_1_id: userData.user_metadata?.personal_address_1_id,
          hasAddresses: !!userData.addresses,
          addressesLength: userData.addresses?.length || 0,
          addresses: userData.addresses
        });
        
        if (userData.user_metadata?.personal_address_1_id && userData.addresses) {
          const address = userData.addresses.find((addr: any) => addr.id === userData.user_metadata.personal_address_1_id);
          console.log('🔍 Found address for personalAddress1:', address);
          
          if (address) {
            // สร้างที่อยู่ตามรูปแบบ: ที่อยู่ ตำบล/แขวง อำเภอ/เขต จังหวัด รหัสไปรษณีย์
            const addressParts = [];
            
            // เพิ่มที่อยู่
            if (address.address || address.street) {
              addressParts.push(address.address || address.street);
            }
            
            // เพิ่มตำบล/แขวง
            if (address.tambon || address.subdistrict) {
              addressParts.push(address.tambon || address.subdistrict);
            }
            
            // เพิ่มอำเภอ/เขต
            if (address.district) {
              addressParts.push(address.district);
            }
            
            // เพิ่มจังหวัด
            if (address.province) {
              addressParts.push(address.province);
            }
            
            // เพิ่มรหัสไปรษณีย์
            if (address.postal_code || address.postalCode) {
              addressParts.push(address.postal_code || address.postalCode);
            }
            
            const result = addressParts.join(' ');
            console.log('🔍 personalAddress1 result:', result);
            return result;
          }
        }
        return '';
      })(),
      'personalAddress2': (() => {
        if (userData.user_metadata?.personal_address_2_id && userData.addresses) {
          const address = userData.addresses.find((addr: any) => addr.id === userData.user_metadata.personal_address_2_id);
          if (address) {
            // สร้างที่อยู่ตามรูปแบบ: ที่อยู่ ตำบล/แขวง อำเภอ/เขต จังหวัด รหัสไปรษณีย์
            const addressParts = [];
            
            // เพิ่มที่อยู่
            if (address.address || address.street) {
              addressParts.push(address.address || address.street);
            }
            
            // เพิ่มตำบล/แขวง
            if (address.tambon || address.subdistrict) {
              addressParts.push(address.tambon || address.subdistrict);
            }
            
            // เพิ่มอำเภอ/เขต
            if (address.district) {
              addressParts.push(address.district);
            }
            
            // เพิ่มจังหวัด
            if (address.province) {
              addressParts.push(address.province);
            }
            
            // เพิ่มรหัสไปรษณีย์
            if (address.postal_code || address.postalCode) {
              addressParts.push(address.postal_code || address.postalCode);
            }
            
            return addressParts.join(' ');
          }
        }
        return '';
      })(),
      'workAddress1': (() => {
        if (userData.user_metadata?.work_address_1_id && userData.addresses) {
          const address = userData.addresses.find((addr: any) => addr.id === userData.user_metadata.work_address_1_id);
          if (address) {
            // สร้างที่อยู่ตามรูปแบบ: ที่อยู่ ตำบล/แขวง อำเภอ/เขต จังหวัด รหัสไปรษณีย์
            const addressParts = [];
            
            // เพิ่มที่อยู่
            if (address.address || address.street) {
              addressParts.push(address.address || address.street);
            }
            
            // เพิ่มตำบล/แขวง
            if (address.tambon || address.subdistrict) {
              addressParts.push(address.tambon || address.subdistrict);
            }
            
            // เพิ่มอำเภอ/เขต
            if (address.district) {
              addressParts.push(address.district);
            }
            
            // เพิ่มจังหวัด
            if (address.province) {
              addressParts.push(address.province);
            }
            
            // เพิ่มรหัสไปรษณีย์
            if (address.postal_code || address.postalCode) {
              addressParts.push(address.postal_code || address.postalCode);
            }
            
            return addressParts.join(' ');
          }
        }
        return '';
      })(),
      'workAddress2': (() => {
        if (userData.user_metadata?.work_address_2_id && userData.addresses) {
          const address = userData.addresses.find((addr: any) => addr.id === userData.user_metadata.work_address_2_id);
          if (address) {
            // สร้างที่อยู่ตามรูปแบบ: ที่อยู่ ตำบล/แขวง อำเภอ/เขต จังหวัด รหัสไปรษณีย์
            const addressParts = [];
            
            // เพิ่มที่อยู่
            if (address.address || address.street) {
              addressParts.push(address.address || address.street);
            }
            
            // เพิ่มตำบล/แขวง
            if (address.tambon || address.subdistrict) {
              addressParts.push(address.tambon || address.subdistrict);
            }
            
            // เพิ่มอำเภอ/เขต
            if (address.district) {
              addressParts.push(address.district);
            }
            
            // เพิ่มจังหวัด
            if (address.province) {
              addressParts.push(address.province);
            }
            
            // เพิ่มรหัสไปรษณีย์
            if (address.postal_code || address.postalCode) {
              addressParts.push(address.postal_code || address.postalCode);
            }
            
            return addressParts.join(' ');
          }
        }
        return '';
      })(),
      // Old address fields (for backward compatibility)
      'address': userData.address || userData.user_metadata?.addresses?.[0]?.address || '',
      'ที่อยู่': (() => {
        if (userData.user_metadata?.addresses && userData.user_metadata.addresses.length > 0) {
          const address = userData.user_metadata.addresses[0];
          const addressParts = [
            address.place || '',
            address.address || address.street || '',
            address.district || '',
            address.province || '',
            address.postal_code || ''
          ].filter(Boolean);
          return addressParts.join(' ');
        }
        return '';
      })(),
      'facebook': userData.facebook || userData.user_metadata?.facebook || '',
      'line': userData.lineId || userData.user_metadata?.line_id || '',
      'linkedin': userData.linkedin || userData.user_metadata?.linkedin || '',
      'twitter': userData.twitter || userData.user_metadata?.twitter || '',
      'instagram': userData.instagram || userData.user_metadata?.instagram || '',
      'tiktok': userData.tiktok || userData.user_metadata?.tiktok || ''
    };
    
    const result = fieldMap[field] || '';
    return result;
  };

  const renderElementsToCanvas = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    elements.forEach(element => {
      // Set element styles
      ctx.fillStyle = element.style.color || '#000000';
      ctx.font = `${element.style.fontSize || 16}px Arial`;
      ctx.textAlign = element.style.textAlign || 'left';
      
      // Render based on element type
      if (element.type === 'text' || element.type === 'textarea') {
        // Use field data if field is set, otherwise use content
        const text = element.field ? getFieldData(element.field) : (element.content || 'Sample Text');
        const lines = text.split('\n');
        lines.forEach((line, index) => {
          ctx.fillText(line, element.x, element.y + (index * (element.style.fontSize || 16)));
        });
      } else if (element.type === 'social') {
        // Use field data if field is set, otherwise use content
        const text = element.field ? getFieldData(element.field) : (element.content || 'Social Media');
        ctx.fillText(text, element.x, element.y);
      } else if (element.type === 'icon') {
        // For icons, we'll render a placeholder text since we can't render React icons to canvas
        const iconText = element.iconName || 'Icon';
        ctx.fillText(iconText, element.x, element.y);
      }
    });
  };

  const handleSaveTemplate = async () => {
    try {
      setIsSaving(true);
      
      // Check if creating new template (not editing)
      if (!editingTemplateId) {
        // Check if user has reached template limit
        if (planCapabilities && planCapabilities[userPlan]) {
          const maxTemplates = planCapabilities[userPlan].max_templates;
          
          // Admin and Owner have unlimited templates (Pro plan)
          const isAdminOrOwner = currentUserRole === 'admin' || currentUserRole === 'owner';
          
          if (!isAdminOrOwner && userTemplatesCount >= maxTemplates) {
            toast.error(`คุณสร้างแบบนามบัตรครบตามแผน ${userPlan} แล้ว (${maxTemplates} แบบ)\nกรุณาอัพเกรดแผนเพื่อสร้างแบบนามบัตรเพิ่มเติม`);
            setIsSaving(false);
            return;
          }
        }
      }
      
      let templateName;
      if (editingTemplateId) {
        templateName = editingTemplateName; // Use original name, no prompt
      } else {
        templateName = prompt('กรุณาใส่ชื่อ Template:');
        if (!templateName) {
          setIsSaving(false);
          return;
        }
      }
      
      console.log('Starting canvas capture...');
      const previewImage = await captureCanvasAsImage();
      console.log('Canvas capture completed, preview image length:', previewImage.length);
      
      const isEditing = !!editingTemplateId;
      const url = isEditing ? `/api/templates/${editingTemplateId}` : '/api/templates';
      const method = isEditing ? 'PUT' : 'POST';
      
      console.log('Sending request to:', url, 'Method:', method);

      const requestBody = {
        name: templateName,
        paper: paperSettings,
        elements: elements,
        user_id: user?.id,
        preview_image: previewImage
      };
      
      console.log('Request body size:', JSON.stringify(requestBody).length, 'bytes');
      console.log('Elements count:', elements.length);
      console.log('User ID:', user?.id);
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log('Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error saving template:', errorData);
        toast.error('เกิดข้อผิดพลาดในการบันทึก แบบนามบัตร: ' + errorData.error);
        setIsSaving(false);
        return;
      }

      const result = await response.json();
      console.log('Template saved successfully:', result);

      if (isEditing) {
        // Update existing template in local state
        setTemplates(prev => prev.map(template => 
          template.id === editingTemplateId 
            ? { ...template, name: templateName, paper: paperSettings, elements: elements, updatedAt: new Date(), previewImage: previewImage }
            : template
        ));
        
        // Clear unsaved changes flag but keep editing state
        setHasUnsavedChanges(false);
        setIsSaving(false);
        
        toast.success('Template อัปเดตสำเร็จ!');
        // Store highlight for one-time badge and show immediately
        try {
          sessionStorage.setItem('templateHighlight', JSON.stringify({ id: editingTemplateId, type: 'update' }));
        } catch (e) { /* noop */ }
        if (editingTemplateId) {
          setHighlightInfo({ id: editingTemplateId, type: 'update' });
        }
        // Request resetting the create tab on next open
        setResetCreateOnOpen(true);
        try { sessionStorage.setItem('resetCreateTab', '1'); } catch {}
        // Switch to templates tab and focus on the updated template
        setActiveTab('templates');
        setTimeout(() => {
          const cardEl = document.querySelector(`[data-template-id="${editingTemplateId}"]`);
          if (cardEl && 'scrollIntoView' in cardEl) {
            (cardEl as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 50);
        return; // Don't reset editing state or clear canvas when editing
      } else {
        // Add new template to local state
      const newTemplate: Template = {
        id: result.data.id,
        name: templateName,
        paper: paperSettings,
        elements: elements,
        createdAt: new Date(),
        updatedAt: new Date(),
        previewImage: previewImage,
        // Ensure immediate correct styling for admin/owner templates without reload
        ...(result.data?.user_type ? { user_type: result.data.user_type } : (currentUserRole === 'admin' || currentUserRole === 'owner' ? { user_type: currentUserRole } : { user_type: 'user' }))
      };
      setTemplates(prev => [...prev, newTemplate]);
        
        // Update user templates count
        setUserTemplatesCount(prev => prev + 1);
        
        toast.success('Template บันทึกสำเร็จ!');
        setIsSaving(false);
        
        // Dispatch event to refresh templates in card-editor
        console.log('🔄 Dispatching templateUpdated event');
        window.dispatchEvent(new CustomEvent('templateUpdated'));
        
        // Store highlight for one-time badge and show immediately
        try {
          sessionStorage.setItem('templateHighlight', JSON.stringify({ id: result.data.id, type: 'new' }));
        } catch (e) { /* noop */ }
        setHighlightInfo({ id: result.data.id, type: 'new' });
        // Request resetting the create tab on next open
        setResetCreateOnOpen(true);
        try { sessionStorage.setItem('resetCreateTab', '1'); } catch {}
        // Switch to templates tab and focus on the newly created template
        setActiveTab('templates');
        setTimeout(() => {
          const cardEl = document.querySelector(`[data-template-id="${result.data.id}"]`);
          if (cardEl && 'scrollIntoView' in cardEl) {
            (cardEl as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 50);
        return;
      }

      // Dispatch event to refresh templates in card-editor
      console.log('🔄 Dispatching templateUpdated event for template update');
      window.dispatchEvent(new CustomEvent('templateUpdated'));
      
      // Reset editing state (only for new templates)
      setEditingTemplateId(null);
      setEditingTemplateName('');
      setHasUnsavedChanges(false);
      setIsSaving(false);
      
      // Clear canvas
      setElements([]);
      setPaperSettings({
        size: 'Business Card (L)',
        width: 180,
        height: 110,
        orientation: 'portrait',
        background: {
          type: 'color',
          color: '#ffffff',
          gradient: {
            type: 'base',
            colors: ['#ffffff'],
            direction: 'horizontal'
          }
        }
      });
      setUseAddressPrefix(true); // Reset address prefix to default
      
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึก แบบนามบัตร: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setIsSaving(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      // Check if template is in use before confirming deletion
      const usageCount = templateUsage[templateId] || 0;
      
      if (usageCount > 0) {
        // Show modal with detailed information
        const template = templates.find(t => t.id === templateId);
        setTemplateToDelete({
          id: templateId,
          name: template?.name || 'Unknown',
          cards: [] // Will be populated by API call
        });
        setShowDeleteModal(true);
        return;
      }
      
      // If no usage, proceed with simple confirmation
      const confirmed = window.confirm('คุณแน่ใจหรือไม่ที่จะลบ template นี้?');
      if (!confirmed) return;

      await performDeleteTemplate(templateId);
      
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('เกิดข้อผิดพลาดในการลบ Template');
    }
  };

  const performDeleteTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error deleting template:', errorData);
        
        // Check if it's a conflict error (template in use)
        if (response.status === 409 && errorData.details) {
          const cardsCount = errorData.details.cardsCount || 0;
          const cards = errorData.details.cards || [];
          
          // Show detailed error message with cards using this template
          let message = `${errorData.error}\n\nมีนามบัตร ${cardsCount} ใบที่กำลังใช้แม่แบบนี้อยู่:\n\n`;
          cards.slice(0, 5).forEach((card: any, index: number) => {
            message += `${index + 1}. ${card.name}\n`;
          });
          if (cardsCount > 5) {
            message += `... และอีก ${cardsCount - 5} ใบ\n`;
          }
          message += '\n💡 วิธีลบแม่แบบนี้:\n';
          message += '1. ไปที่หน้า Dashboard\n';
          message += '2. เลือกนามบัตรที่ต้องการ\n';
          message += '3. แก้ไขและเปลี่ยนไปใช้แม่แบบอื่น หรือลบนามบัตร\n';
          message += '4. กลับมาลบแม่แบบนี้อีกครั้ง';
          
          // Use confirm instead of alert for better formatting
          const showDetails = window.confirm(message + '\n\nต้องการไปที่หน้า Dashboard เพื่อจัดการนามบัตรเหล่านี้หรือไม่?');
          
          if (showDetails) {
            window.location.href = '/dashboard';
          }
        } else {
          toast.error('เกิดข้อผิดพลาดในการลบ Template: ' + errorData.error);
        }
        return;
      }

      // Remove from local state
      setTemplates(prev => {
        const deletedTemplate = prev.find(t => t.id === templateId);
        // Update count if it was a user template
        if (deletedTemplate && (deletedTemplate as any).user_type === 'user') {
          setUserTemplatesCount(count => Math.max(0, count - 1));
        }
        return prev.filter(template => template.id !== templateId);
      });
      
      // Update usage count
      setTemplateUsage(prev => {
        const newUsage = { ...prev };
        delete newUsage[templateId];
        return newUsage;
      });
      
      toast.success('Template ถูกลบเรียบร้อยแล้ว!');
      
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('เกิดข้อผิดพลาดในการลบ Template');
    }
  };

  const handlePreviewTemplate = (template: Template) => {
    setPreviewTemplate(template);
  };

  const handleCopyTemplate = (template: Template) => {
    setCopyTemplate(template);
    setNewTemplateName(`${template.name} (Copy)`);
    setShowCopyDialog(true);
  };

  const handleConfirmCopy = async () => {
    if (!copyTemplate || !newTemplateName.trim()) return;

    try {
      console.log('Copying template:', copyTemplate.name, 'as:', newTemplateName);

      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTemplateName,
          paper: copyTemplate.paper,
          elements: copyTemplate.elements,
          user_id: user?.id,
          preview_image: copyTemplate.previewImage
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error copying template:', errorData);
        toast.error('เกิดข้อผิดพลาดในการคัดลอก Template: ' + errorData.error);
        return;
      }

      const result = await response.json();
      console.log('Template copied successfully:', result);

      // Add to local templates for immediate UI update
      const newTemplate: Template = {
        id: result.data.id,
        name: newTemplateName,
        paper: copyTemplate.paper,
        elements: copyTemplate.elements,
        createdAt: new Date(),
        updatedAt: new Date(),
        previewImage: copyTemplate.previewImage
      };
      
      setTemplates(prev => [...prev, newTemplate]);
      toast.success('Template คัดลอกสำเร็จ!');
      
      // Reset copy dialog
      setShowCopyDialog(false);
      setCopyTemplate(null);
      setNewTemplateName('');
      
    } catch (error) {
      console.error('Error copying template:', error);
      toast.error('เกิดข้อผิดพลาดในการคัดลอก Template');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">สร้าง/แก้ไข แบบนามบัตร</h1>
              <p className="mt-1 text-sm sm:text-base text-gray-500">
                สร้างและแก้ไขนามบัตรดิจิทัลของคุณ
              </p>
              </div>

            <div className="flex flex-col items-end space-y-2">
              <div className="flex space-x-3">
              {activeTab === 'create' && editingTemplateId && (
                <button
                  onClick={() => {
                    if (hasUnsavedChanges) {
                      const confirmed = window.confirm('คุณแน่ใจหรือไม่ที่จะยกเลิกการแก้ไข? การเปลี่ยนแปลงที่ยังไม่ได้บันทึกจะหายไป');
                      if (!confirmed) return;
                    }
                    
                    // Reset page to initial state like creating new template
                    window.location.href = '/theme-customization';
                  }}
                  disabled={isSaving}
                  className={`px-3 sm:px-4 py-2 rounded-md focus:outline-none focus:ring-2 text-sm font-medium ${
                    isSaving 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-gray-500 text-white hover:bg-gray-600 focus:ring-gray-500'
                  }`}
                  title="ยกเลิกการแก้ไข"
                >
                  <span className="hidden sm:inline">ยกเลิกการแก้ไข</span>
                  <span className="sm:hidden">✕</span>
                </button>
              )}
              
              {activeTab === 'create' && (
                <>
                  {/* Upgrade Button - Show when plan is full */}
                  {planCapabilities && planCapabilities[userPlan] && userTemplatesCount >= planCapabilities[userPlan].max_templates && (
                    <button
                      onClick={() => {
                        // Redirect to pricing or upgrade page
                        window.location.href = '/#pricing';
                      }}
                      className="px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-md hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium transition-all duration-200 shadow-lg"
                      title="อัพเกรดแผนเพื่อสร้างแบบนามบัตรเพิ่มเติม"
                    >
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <span className="hidden sm:inline">อัพเกรด</span>
                      </div>
                    </button>
                  )}
                  
                  <button
                    onClick={handleSaveTemplate}
                    disabled={isSaving}
                    className={`px-3 sm:px-4 py-2 rounded-md focus:outline-none focus:ring-2 text-sm font-medium ${
                      isSaving 
                        ? 'bg-blue-400 text-white cursor-not-allowed' 
                        : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                    }`}
                    title={isSaving ? (editingTemplateId ? 'กำลังอัพเดต...' : 'กำลังบันทึก...') : (editingTemplateId ? 'อัพเดต แบบนามบัตร' : 'บันทึก แบบนามบัตร')}
                  >
                    {isSaving ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span className="hidden sm:inline">{editingTemplateId ? 'กำลังอัพเดต...' : 'กำลังบันทึก...'}</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Save className="w-4 h-4" />
                        <span className="hidden sm:inline">{editingTemplateId ? 'อัพเดต แบบนามบัตร' : 'บันทึก แบบนามบัตร'}</span>
                      </div>
                    )}
                  </button>
                </>
              )}
              </div>
              
              {/* Template Name and Unsaved Badge - moved below buttons */}
              {editingTemplateId && (
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm text-orange-600">
                    แก้ไข: <span className="font-medium text-orange-600">{editingTemplateName}</span>
                  </span>
                  {hasUnsavedChanges && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full border border-orange-200" title="ยังไม่ได้บันทึก">
                      <span className="hidden sm:inline">ยังไม่ได้บันทึก</span>
                      <span className="sm:hidden">⚠️</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* Left Panel - Canvas */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
              <div className="mb-4">
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('create')}
                    className={`px-3 sm:px-4 py-2 text-sm sm:text-base font-medium rounded-md transition-colors ${
                activeTab === 'create'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="hidden sm:inline">สร้าง/แก้ไข แบบนามบัตร</span>
              <span className="sm:hidden">สร้าง/แก้ไข</span>
            </button>
            <button 
              onClick={() => setActiveTab('templates')}
                    className={`px-3 sm:px-4 py-2 text-sm sm:text-base font-medium rounded-md transition-colors ${
                activeTab === 'templates'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="hidden sm:inline">แบบนามบัตร</span>
              <span className="sm:hidden">แบบ</span>
            </button>
              </div>
            </div>

              {activeTab === 'create' ? (
                <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                  <div className="flex flex-col lg:flex-row">
                {/* Canvas Area */}
                    <div className="flex-1">
                  <Canvas
                    paperSettings={paperSettings}
                    elements={elements}
                    onElementSelect={handleElementSelect}
                        onElementUpdate={handleElementUpdate}
                        onElementDelete={handleElementDelete}
                    selectedElement={selectedElement}
                        userData={userData}
                        mockData={MOCK_DATA}
                    isDragging={isDragging}
                    useAddressPrefix={useAddressPrefix}
                  />
          </div>

                    {/* Right Panel */}
                    <div className="w-full lg:w-80 mt-4 lg:mt-0 lg:ml-6">
                  <RightPanel
                    paperSettings={paperSettings}
                        onPaperSettingsChange={handlePaperSettingsChange}
                        userData={userData}
                    onSaveTemplate={handleSaveTemplate}
                    selectedElement={selectedElement}
                    onElementUpdate={handleElementUpdate}
                    onElementDelete={handleElementDelete}
                    onElementClose={() => setSelectedElement(null)}
                    savedGradientColors={savedGradientColors}
                    savedGradientDirection={savedGradientDirection}
                    useAddressPrefix={useAddressPrefix}
                    setUseAddressPrefix={setUseAddressPrefix}
                        onGradientColorsChange={(colors) => {
                          setSavedGradientColors(colors);
                          setPaperSettings(prev => ({
                            ...prev,
                            background: {
                              ...prev.background,
                              gradient: {
                                type: 'gradient',
                                direction: 'horizontal',
                                ...(prev.background.gradient || {}),
                                colors: colors
                              }
                            }
                          }));
                        }}
                        onGradientDirectionChange={(direction) => {
                          setSavedGradientDirection(direction);
                          setPaperSettings(prev => ({
                            ...prev,
                            background: {
                              ...prev.background,
                              gradient: {
                                type: 'gradient',
                                colors: ['#ffffff'],
                                ...(prev.background.gradient || {}),
                                direction: direction
                              }
                            }
                          }));
                        }}
                    isDragging={isDragging}
                            />
                        </div>
                      </div>
          </DndContext>
        ) : (
                <div className="space-y-6">
            {/* Plan Usage Info */}
            {planCapabilities && planCapabilities[userPlan] ? (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        แผนของคุณ: <span className="text-blue-600">{userPlan}</span>
                      </h3>
                      {/* Upgrade Button - Show when plan is full */}
                      {userTemplatesCount >= planCapabilities[userPlan].max_templates && (
                        <button
                          onClick={() => {
                            // Redirect to pricing or upgrade page
                            window.location.href = '/#pricing';
                          }}
                          className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm rounded-md hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 shadow-md"
                          title="อัพเกรดแผนเพื่อสร้างแบบนามบัตรเพิ่มเติม"
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
                      คุณสร้างแบบนามบัตรไปแล้ว{' '}
                      <span className="font-bold text-blue-600">{userTemplatesCount}</span>
                      {' '}จาก{' '}
                      <span className="font-bold text-gray-900">
                        {planCapabilities[userPlan].max_templates}
                      </span>
                      {' '}แบบที่สามารถสร้างได้
                    </p>
                  </div>
                  <div className="flex flex-col items-end ml-4">
                    <div className="text-3xl font-bold text-blue-600">
                      {planCapabilities[userPlan].max_templates - userTemplatesCount}
                    </div>
                    <div className="text-sm text-gray-500">แบบที่เหลือ</div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${
                        userTemplatesCount >= planCapabilities[userPlan].max_templates
                          ? 'bg-red-500'
                          : userTemplatesCount >= planCapabilities[userPlan].max_templates * 0.8
                          ? 'bg-yellow-500'
                          : 'bg-blue-500'
                      }`}
                      style={{
                        width: `${Math.min(
                          (userTemplatesCount / planCapabilities[userPlan].max_templates) * 100,
                          100
                        )}%`
                      }}
                    />
                  </div>
                  {userTemplatesCount >= planCapabilities[userPlan].max_templates && (
                    <p className="mt-2 text-sm text-red-600 font-medium">
                      ⚠️ คุณใช้งานครบตามแผนแล้ว กรุณาอัพเกรดแผนเพื่อสร้างแบบนามบัตรเพิ่มเติม
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
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
            
            {/* Search Box */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
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
                  placeholder="ค้นหาแบบนามบัตร..."
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
            
            {loadingTemplates ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-500">กำลังโหลด templates...</p>
                    </div>
            ) : templatesError ? (
              <div className="text-center py-12">
                <div className="text-red-500 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                      </div>
                <p className="text-red-600 font-medium">{templatesError}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  ลองใหม่
                </button>
                    </div>
            ) : templates.length > 0 ? (
              <>
                {/* Show filtered count */}
                {searchQuery && (
                  <div className="text-sm text-gray-600">
                    พบ{' '}
                    <span className="font-semibold text-blue-600">
                      {templates.filter((t) =>
                        t.name.toLowerCase().includes(searchQuery.toLowerCase())
                      ).length}
                    </span>
                    {' '}รายการจากทั้งหมด {templates.length} รายการ
                  </div>
                )}
                
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {templates
                  .filter((template) => {
                    // Filter by search query
                    if (!searchQuery) return true;
                    return template.name.toLowerCase().includes(searchQuery.toLowerCase());
                  })
                  .sort((a, b) => {
                    // Sort: Admin/Owner templates first, then user templates
                    const aIsSystem = (a as any).user_type === 'admin' || (a as any).user_type === 'owner';
                    const bIsSystem = (b as any).user_type === 'admin' || (b as any).user_type === 'owner';
                    
                    if (aIsSystem && !bIsSystem) return -1;
                    if (!aIsSystem && bIsSystem) return 1;
                    return 0;
                  })
                  .map((template) => (
                        <div key={template.id} data-template-id={template.id} className={`rounded-lg shadow-md p-3 sm:p-4 hover:shadow-lg transition-shadow h-80 sm:h-96 flex flex-col relative ${
                          ((template as any).user_type === 'admin' || (template as any).user_type === 'owner') 
                            ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200' 
                            : 'bg-white'
                        }`}>
                    {/* One-time Highlight Badge */}
                    {highlightInfo && highlightInfo.id === template.id && (
                      <div className="absolute top-2 right-2 z-10">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold shadow ${
                          highlightInfo.type === 'new' 
                            ? 'bg-green-100 text-green-700 border border-green-200' 
                            : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                        }`}>
                          {highlightInfo.type === 'new' ? 'New' : 'Update'}
                        </span>
                      </div>
                    )}
                    {/* System Template Badge */}
                    {((template as any).user_type === 'admin' || (template as any).user_type === 'owner') && (
                      <div className="absolute top-2 left-2 z-10">
                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs px-2 py-1 rounded-full shadow-lg flex items-center space-x-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium">ระบบ</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Template Preview */}
                          <div className="mb-3 sm:mb-4 flex justify-center h-36 sm:h-48 overflow-hidden">
                      <TemplatePreview 
                        template={template} 
                        userData={userData}
                        scale={0.6} // Adjusted scale
                        previewImage={template.previewImage}
                      />
                  </div>
                    
                    {/* Template Info */}
                          <div className="mb-4 flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{template.name}</h4>
                      <p className="text-sm text-gray-500">
                        {template.elements.length} elements • {template.paper.size} {template.paper.orientation}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        สร้างเมื่อ: {template.createdAt.toLocaleDateString('th-TH')}
                      </p>
                      {/* Template Usage Count */}
                      {templateUsage[template.id] !== undefined && (
                        <div className="mt-2 flex items-center space-x-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-xs text-blue-600 font-medium">
                            ใช้งาน {templateUsage[template.id]} นามบัตร
                          </span>
                        </div>
                      )}
                      {/* Creator Info */}
                      {((template as any).user_type === 'admin' || (template as any).user_type === 'owner') && (
                        <div className="mt-2 flex items-center space-x-1">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className="text-xs text-purple-600 font-medium">แบบนามบัตรของระบบ</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                          <div className="flex space-x-1 mt-auto">
                            {/* Edit Button */}
                      <button
                        onClick={() => {
                          // Debug template elements before loading
                          console.log('Loading template elements:', {
                            templateId: template.id,
                            templateName: template.name,
                            elementsCount: template.elements.length,
                            elements: template.elements.map(el => ({
                              id: el.id,
                              type: el.type,
                              iconName: el.iconName,
                              hasIconName: !!el.iconName,
                              iconNameType: typeof el.iconName
                            }))
                          });
                          
                          setElements(template.elements);
                                
                                // Handle background image properly
                                const paperSettings = { ...template.paper };
                                
                                // If template has background image, ensure it's properly set
                                if (paperSettings.background?.type === 'image' && paperSettings.background?.image) {
                                  // Image is already set, keep it
                                  console.log('Template has background image:', paperSettings.background.image.substring(0, 50) + '...');
                                }
                                
                                setPaperSettings(paperSettings);
                                setEditingTemplateId(template.id);
                                setEditingTemplateName(template.name);
                                setHasUnsavedChanges(false); // Reset unsaved changes when starting to edit
                                setUseAddressPrefix(true); // Reset address prefix to default
                          setActiveTab('create');
                        }}
                        disabled={currentUserRole === 'user' && ((template as any).user_type === 'admin' || (template as any).user_type === 'owner')}
                              className={`w-8 h-8 sm:w-10 sm:h-10 text-xs sm:text-sm rounded-lg transition-colors flex items-center justify-center ${
                                currentUserRole === 'user' && ((template as any).user_type === 'admin' || (template as any).user_type === 'owner')
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                              }`}
                              title={currentUserRole === 'user' && ((template as any).user_type === 'admin' || (template as any).user_type === 'owner') 
                                ? "ไม่สามารถแก้ไขแบบนามบัตรที่สร้างโดย Admin/Owner ได้" 
                                : "แก้ไข Template"}
                      >
                              <Edit className="w-4 h-4" />
                      </button>
                            
                            {/* Preview Button */}
                      <button
                        onClick={() => {
                                setPreviewTemplate(template);
                                setShowPreviewModal(true);
                                setPreviewZoom(100);
                              }}
                              className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 text-purple-600 text-xs sm:text-sm rounded-lg hover:bg-purple-200 transition-colors flex items-center justify-center"
                              title="ดูตัวอย่าง Template"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            
                            {/* Copy Button */}
                            <button
                              onClick={() => handleCopyTemplate(template)}
                              className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 text-green-600 text-xs sm:text-sm rounded-lg hover:bg-green-200 transition-colors flex items-center justify-center"
                              title="คัดลอก Template"
                            >
                              <Copy className="w-4 h-4" />
                      </button>
                            
                            {/* Delete Button */}
                      <button
                        onClick={() => {
                                handleDeleteTemplate(template.id);
                        }}
                        disabled={currentUserRole === 'user' && ((template as any).user_type === 'admin' || (template as any).user_type === 'owner')}
                              className={`w-8 h-8 sm:w-10 sm:h-10 text-xs sm:text-sm rounded-lg transition-colors flex items-center justify-center ${
                                currentUserRole === 'user' && ((template as any).user_type === 'admin' || (template as any).user_type === 'owner')
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-pink-100 text-pink-600 hover:bg-pink-200'
                              }`}
                              title={currentUserRole === 'user' && ((template as any).user_type === 'admin' || (template as any).user_type === 'owner') 
                                ? "ไม่สามารถลบแบบนามบัตรที่สร้างโดย Admin/Owner ได้" 
                                : "ลบ Template"}
                      >
                              <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Create Business Card Button - Bottom Right */}
                    <div className="absolute bottom-4 right-4">
                      <button
                        onClick={() => {
                          // Redirect to card-editor with the template ID
                          window.location.href = `/card-editor?templateId=${template.id}`;
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-colors"
                        title="สร้างนามบัตร"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* No search results */}
              {searchQuery && templates.filter((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="mt-2 text-gray-500">ไม่พบแบบนามบัตรที่ค้นหา</p>
                  <p className="text-sm text-gray-400">ลองค้นหาด้วยคำอื่น</p>
                </div>
              )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">ยังไม่มี template ที่บันทึกไว้</p>
              </div>
              )}
              </div>
            )}
          </div>
          </div>

        </div>

      </div>

      {/* Preview Popup */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                ตัวอย่าง Template: {previewTemplate.name}
              </h3>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="flex justify-center">
              <TemplatePreview 
                template={previewTemplate} 
                userData={userData}
                scale={1.0}
                previewImage={previewTemplate.previewImage}
              />
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              <p><strong>ขนาด:</strong> {previewTemplate.paper.size} {previewTemplate.paper.orientation}</p>
              <p><strong>Elements:</strong> {previewTemplate.elements.length} รายการ</p>
              <p><strong>สร้างเมื่อ:</strong> {previewTemplate.createdAt.toLocaleDateString('th-TH')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Copy Dialog */}
      {showCopyDialog && copyTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              คัดลอก Template: {copyTemplate.name}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อ Template ใหม่
              </label>
              <input
                type="text"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="กรุณาใส่ชื่อ Template ใหม่"
                autoFocus
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCopyDialog(false);
                  setCopyTemplate(null);
                  setNewTemplateName('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmCopy}
                disabled={!newTemplateName.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                คัดลอก
              </button>
            </div>
          </div>
        </div>
        )}

        {/* Preview Modal */}
        {showPreviewModal && previewTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-[1000px] h-[700px] overflow-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Template Preview: {previewTemplate.name}</h3>
                <button
                  onClick={() => {
                    setShowPreviewModal(false);
                    setPreviewTemplate(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Preview Controls */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <label className="text-sm font-medium text-gray-700">Zoom:</label>
                  <select 
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={previewZoom}
                    onChange={(e) => {
                      const zoom = parseInt(e.target.value);
                      setPreviewZoom(zoom);
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
                      if (previewTemplate) {
                        // Calculate fit to paper scale
                        const containerWidth = 800; // Available width in modal
                        const containerHeight = 500; // Available height in modal
                        
                        // Get paper dimensions in pixels
                        const mmToPx = (mm: number) => mm * 3.7795275591; // Convert mm to px
                        const canvasWidth = mmToPx(previewTemplate.paper.width);
                        const canvasHeight = mmToPx(previewTemplate.paper.height);
                        
                        // Calculate scale to fit both width and height
                        const scaleX = containerWidth / canvasWidth;
                        const scaleY = containerHeight / canvasHeight;
                        const scale = Math.min(scaleX, scaleY);
                        
                        // Ensure scale is not too small (minimum 5%)
                        const finalScale = Math.max(scale, 0.05);
                        
                        setPreviewZoom(Math.round(finalScale * 100));
                      }
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center gap-2"
                    title="Fit to Paper"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Fit to Paper
                  </button>
                  
                  <button
                    onClick={() => {
                      setPreviewZoom(100);
                    }}
                    className="px-4 py-2 bg-orange-500 text-white rounded-md text-sm hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 flex items-center gap-2"
                    title="Reset Zoom"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reset
                  </button>
                </div>
              </div>
              
              {/* Preview Content */}
              <div className="p-4 flex justify-center items-center min-h-[500px] bg-gray-50">
                <div 
                  className="border border-gray-300 rounded-lg overflow-hidden shadow-sm bg-white"
                  style={{
                    transform: `scale(${previewZoom / 100})`,
                    transformOrigin: 'top left'
                  }}
                >
                  <TemplatePreview 
                    template={previewTemplate} 
                    userData={userData}
                    scale={1.0}
                    previewImage={previewTemplate.previewImage}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Delete Template Confirmation Modal */}
      {showDeleteModal && templateToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">ไม่สามารถลบแม่แบบได้</h3>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setTemplateToDelete(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-red-800 font-medium">แม่แบบ "{templateToDelete.name}" กำลังถูกใช้งาน</p>
                      <p className="text-red-600 text-sm mt-1">
                        มีนามบัตร {templateUsage[templateToDelete.id] || 0} ใบที่กำลังใช้แม่แบบนี้อยู่
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-blue-800 font-medium mb-2">💡 วิธีลบแม่แบบนี้:</p>
                      <ol className="text-blue-700 text-sm space-y-1 list-decimal list-inside">
                        <li>ไปที่หน้า Dashboard</li>
                        <li>เลือกนามบัตรที่ต้องการ</li>
                        <li>แก้ไขและเปลี่ยนไปใช้แม่แบบอื่น หรือลบนามบัตร</li>
                        <li>กลับมาลบแม่แบบนี้อีกครั้ง</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setTemplateToDelete(null);
                  }}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  ปิด
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setTemplateToDelete(null);
                    window.location.href = '/dashboard';
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  ไปที่ Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}