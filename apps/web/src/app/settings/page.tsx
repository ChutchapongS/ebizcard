'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Lock, 
  Bell, 
  Shield, 
  Trash2,
  Save,
  LogOut,
  Eye,
  EyeOff,
  CheckCircle,
  Globe,
  Linkedin,
  Twitter,
  Facebook,
  Briefcase,
  Building,
  Phone,
  MapPin,
  Upload,
  Camera,
  Plus,
  Edit3,
  X,
  Instagram,
  MessageCircle,
  Video,
  Youtube,
  Send,
  Smartphone,
  MessageSquare,
  CameraIcon,
  Pin,
  Users,
  Hash,
  PhoneCall,
  Mic,
  Code,
  Gamepad2
} from 'lucide-react';
import { getProvinces, getDistricts, getTambons, getPostalCode } from '@/utils/address';

export default function SettingsPage() {
  const router = useRouter();
  const { user, signOut, updateProfile, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [usesEmailPassword, setUsesEmailPassword] = useState(true);
  const [oauthProviderNames, setOauthProviderNames] = useState<string[]>([]);
  const [isSendingPasswordLink, setIsSendingPasswordLink] = useState(false);
  const [passwordLinkMessage, setPasswordLinkMessage] = useState('');
  const [passwordLinkError, setPasswordLinkError] = useState('');
  const providerNameMap: Record<string, string> = {
    google: 'Google',
    linkedin: 'LinkedIn',
    facebook: 'Facebook',
    github: 'GitHub',
    apple: 'Apple',
    twitter: 'Twitter',
    line: 'LINE',
  };
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState(1);
  const [activeAddressTab, setActiveAddressTab] = useState(1); // 1: เพิ่มที่อยู่ใหม่, 2: ที่อยู่ที่มีอยู่
  
  // Check authentication and redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // Check auth providers
  useEffect(() => {
    if (!user) {
      setUsesEmailPassword(true);
      setOauthProviderNames([]);
      return;
    }

    try {
      const providersSet = new Set<string>();
      const primaryProvider = user.app_metadata?.provider;
      if (primaryProvider) {
        providersSet.add(primaryProvider);
      }

      const providersMeta = user.app_metadata?.providers as string[] | string | undefined;
      if (Array.isArray(providersMeta)) {
        providersMeta.forEach((provider) => providersSet.add(provider));
      } else if (typeof providersMeta === 'string') {
        providersSet.add(providersMeta);
      }

      let hasEmailProvider =
        providersSet.has('email') || user.app_metadata?.provider === 'email';

      const oauthProvidersList = Array.from(providersSet).filter(
        (provider) => provider !== 'email'
      );

      if (!providersSet.size && user.email) {
        hasEmailProvider = true;
      }

      setUsesEmailPassword(hasEmailProvider);
      setOauthProviderNames(oauthProvidersList);

      if (!hasEmailProvider) {
        setShowPasswordForm(false);
      }
    } catch (error) {
      console.warn('Settings: Unable to determine auth providers', error);
      setUsesEmailPassword(true);
      setOauthProviderNames([]);
    }
  }, [user?.id]);
  
  // Track changes for badge notification
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [hasUnsavedPersonalInfo, setHasUnsavedPersonalInfo] = useState(false);
  const [hasUnsavedWorkInfo, setHasUnsavedWorkInfo] = useState(false);
  const [hasUnsavedSocialMedia, setHasUnsavedSocialMedia] = useState(false);
  
  // Store original data from API for comparison
  const [originalData, setOriginalData] = useState<any>({});
  
  // Tab 1: Personal Information
  const [profileImage, setProfileImage] = useState(
    user?.user_metadata?.avatar_url || 
    user?.user_metadata?.profile_image || 
    ''
  );
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [pendingCompanyLogoFile, setPendingCompanyLogoFile] = useState<File | null>(null);
  const [isUploadingCompanyLogo, setIsUploadingCompanyLogo] = useState(false);
  
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [fullNameEnglish, setFullNameEnglish] = useState(user?.user_metadata?.full_name_english || '');
  const [personalId, setPersonalId] = useState(user?.user_metadata?.personal_id || '');
  const [personalPhone, setPersonalPhone] = useState(user?.user_metadata?.personal_phone || '');
  
  // Personal Addresses
  const [personalAddress1, setPersonalAddress1] = useState({
    place: '',
    address: '',
    province: '',
    district: '',
    tambon: '',
    postalCode: '',
    country: 'Thailand'
  });
  const [personalAddress2, setPersonalAddress2] = useState({
    place: '',
    address: '',
    province: '',
    district: '',
    tambon: '',
    postalCode: '',
    country: 'Thailand'
  });
  
  // Tab 2: Work Information
  const [companyLogo, setCompanyLogo] = useState(user?.user_metadata?.company_logo || '');
  const [company, setCompany] = useState(user?.user_metadata?.company || '');
  const [department, setDepartment] = useState(user?.user_metadata?.department || '');
  const [jobTitle, setJobTitle] = useState(user?.user_metadata?.job_title || '');
  const [workPhone, setWorkPhone] = useState(user?.user_metadata?.work_phone || '');
  const [workEmail, setWorkEmail] = useState(user?.user_metadata?.work_email || '');
  const [website, setWebsite] = useState(user?.user_metadata?.website || '');
  
  // Tax ID fields
  const [taxIdMain, setTaxIdMain] = useState(user?.user_metadata?.tax_id_main || '');
  const [taxIdBranch, setTaxIdBranch] = useState(user?.user_metadata?.tax_id_branch || '');
  
  // Work Addresses
  const [workAddress1, setWorkAddress1] = useState({
    place: '',
    address: '',
    province: '',
    district: '',
    tambon: '',
    postalCode: '',
    country: 'Thailand'
  });
  const [workAddress2, setWorkAddress2] = useState({
    place: '',
    address: '',
    province: '',
    district: '',
    tambon: '',
    postalCode: '',
    country: 'Thailand'
  });
  
  // Tab 3: Social Media
  const [facebook, setFacebook] = useState(user?.user_metadata?.facebook || '');
  const [lineId, setLineId] = useState(user?.user_metadata?.line_id || '');
  const [linkedin, setLinkedin] = useState(user?.user_metadata?.linkedin || '');
  const [twitter, setTwitter] = useState(user?.user_metadata?.twitter || '');
  const [instagram, setInstagram] = useState(user?.user_metadata?.instagram || '');
  const [tiktok, setTiktok] = useState(user?.user_metadata?.tiktok || '');
  const [youtube, setYoutube] = useState(user?.user_metadata?.youtube || '');
  const [telegram, setTelegram] = useState(user?.user_metadata?.telegram || '');
  const [whatsapp, setWhatsapp] = useState(user?.user_metadata?.whatsapp || '');
  const [wechat, setWechat] = useState(user?.user_metadata?.wechat || '');
  const [snapchat, setSnapchat] = useState(user?.user_metadata?.snapchat || '');
  const [pinterest, setPinterest] = useState(user?.user_metadata?.pinterest || '');
  const [reddit, setReddit] = useState(user?.user_metadata?.reddit || '');
  const [discord, setDiscord] = useState(user?.user_metadata?.discord || '');
  const [slack, setSlack] = useState(user?.user_metadata?.slack || '');
  const [viber, setViber] = useState(user?.user_metadata?.viber || '');
  const [skype, setSkype] = useState(user?.user_metadata?.skype || '');
  const [zoom, setZoom] = useState(user?.user_metadata?.zoom || '');
  const [github, setGithub] = useState(user?.user_metadata?.github || '');
  const [twitch, setTwitch] = useState(user?.user_metadata?.twitch || '');
  
  // Tab 4: Addresses
  const [addresses, setAddresses] = useState(user?.user_metadata?.addresses || []);
  const [editingAddressIndex, setEditingAddressIndex] = useState(-1);
  const [hasUnsavedAddresses, setHasUnsavedAddresses] = useState(false);
  const [changedAddressIndices, setChangedAddressIndices] = useState<Set<number>>(new Set());
  const [newAddress, setNewAddress] = useState({
    type: 'home',
    address: '',
    tambon: '',
    district: '',
    province: '',
    postalCode: '',
    country: 'Thailand',
    place: ''
  });
  
  // Password form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasFetchedInitialData = useRef(false);

  // Helper function to load data from user metadata (fallback)
  const loadDataFromUserMetadata = useCallback(() => {
    if (user?.user_metadata) {
      setProfileImage(user.user_metadata.avatar_url || user.user_metadata.profile_image || '');
      setFullName(user.user_metadata.full_name || '');
      setFullNameEnglish(user.user_metadata.full_name_english || '');
      setPersonalPhone(user.user_metadata.personal_phone || '');
      setPersonalId(user.user_metadata.personal_id || '');
      setCompanyLogo(user.user_metadata.company_logo || '');
      setCompany(user.user_metadata.company || '');
      setDepartment(user.user_metadata.department || '');
      setJobTitle(user.user_metadata.job_title || '');
      setWorkPhone(user.user_metadata.work_phone || '');
      setWorkEmail(user.user_metadata.work_email || '');
      setWebsite(user.user_metadata.website || '');
      setTaxIdMain(user.user_metadata.tax_id_main || '');
      setTaxIdBranch(user.user_metadata.tax_id_branch || '');
      setFacebook(user.user_metadata.facebook || '');
      setLineId(user.user_metadata.line_id || '');
      setLinkedin(user.user_metadata.linkedin || '');
      setTwitter(user.user_metadata.twitter || '');
      setInstagram(user.user_metadata.instagram || '');
      setTiktok(user.user_metadata.tiktok || '');
      setYoutube(user.user_metadata.youtube || '');
      setTelegram(user.user_metadata.telegram || '');
      setWhatsapp(user.user_metadata.whatsapp || '');
      setWechat(user.user_metadata.wechat || '');
      setSnapchat(user.user_metadata.snapchat || '');
      setPinterest(user.user_metadata.pinterest || '');
      setReddit(user.user_metadata.reddit || '');
      setDiscord(user.user_metadata.discord || '');
      setSlack(user.user_metadata.slack || '');
      setViber(user.user_metadata.viber || '');
      setSkype(user.user_metadata.skype || '');
      setZoom(user.user_metadata.zoom || '');
      setGithub(user.user_metadata.github || '');
      setTwitch(user.user_metadata.twitch || '');
      setAddresses(user.user_metadata.addresses || []);
    }
  }, [user]);

  // Function to load ALL profile data from profiles table via API route
  const loadProfileData = useCallback(async () => {
    if (!user?.id) {
      console.log('Settings: loadProfileData - No user ID');
      return;
    }
    
    console.log('Settings: loadProfileData - Starting to load profile data');
    try {
      // Get session token
      const { data: { session } } = await supabase!.auth.getSession();
      
      if (!session?.access_token) {
        console.warn('Settings: No session token, using user metadata fallback');
        // Fallback to user metadata
        loadDataFromUserMetadata();
        return;
      }

      // Call API route to get profile (bypass RLS with service role)
      // Use POST to send token in body (avoid 431 error with large tokens in header)
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
      
      if (result.success && result.profile) {
        const profile = result.profile;
        console.log('Settings: loadProfileData - Profile loaded:', {
          hasAvatar: !!profile.avatar_url,
          hasFullName: !!profile.full_name,
          hasPersonalId: !!profile.personal_id,
          hasAddresses: !!profile.addresses
        });
        
        // Parse addresses if it's a string (JSON), otherwise use as is
        let parsedAddresses = [];
        if (profile.addresses) {
          parsedAddresses = typeof profile.addresses === 'string' 
            ? JSON.parse(profile.addresses) 
            : profile.addresses;
        }

        // Load specific addresses from addresses table
        let personalAddress1Data = { place: '', address: '', province: '', district: '', tambon: '', postalCode: '', country: 'Thailand' };
        let personalAddress2Data = { place: '', address: '', province: '', district: '', tambon: '', postalCode: '', country: 'Thailand' };
        let workAddress1Data = { place: '', address: '', province: '', district: '', tambon: '', postalCode: '', country: 'Thailand' };
        let workAddress2Data = { place: '', address: '', province: '', district: '', tambon: '', postalCode: '', country: 'Thailand' };

        if (parsedAddresses && parsedAddresses.length > 0) {
          // Find personal addresses
          const personalAddr1 = parsedAddresses.find((addr: any) => addr.type === 'personal_1');
          const personalAddr2 = parsedAddresses.find((addr: any) => addr.type === 'personal_2');
          const workAddr1 = parsedAddresses.find((addr: any) => addr.type === 'work_1');
          const workAddr2 = parsedAddresses.find((addr: any) => addr.type === 'work_2');

          if (personalAddr1) {
            personalAddress1Data = {
              place: personalAddr1.place || '',
              address: personalAddr1.address || '',
              province: personalAddr1.province || '',
              district: personalAddr1.district || '',
              tambon: personalAddr1.tambon || '',
              postalCode: personalAddr1.postalCode || personalAddr1.postal_code || '',
              country: personalAddr1.country || 'Thailand'
            };
          }

          if (personalAddr2) {
            personalAddress2Data = {
              place: personalAddr2.place || '',
              address: personalAddr2.address || '',
              province: personalAddr2.province || '',
              district: personalAddr2.district || '',
              tambon: personalAddr2.tambon || '',
              postalCode: personalAddr2.postalCode || personalAddr2.postal_code || '',
              country: personalAddr2.country || 'Thailand'
            };
          }

          if (workAddr1) {
            workAddress1Data = {
              place: workAddr1.place || '',
              address: workAddr1.address || '',
              province: workAddr1.province || '',
              district: workAddr1.district || '',
              tambon: workAddr1.tambon || '',
              postalCode: workAddr1.postalCode || workAddr1.postal_code || '',
              country: workAddr1.country || 'Thailand'
            };
          }

          if (workAddr2) {
            workAddress2Data = {
              place: workAddr2.place || '',
              address: workAddr2.address || '',
              province: workAddr2.province || '',
              district: workAddr2.district || '',
              tambon: workAddr2.tambon || '',
              postalCode: workAddr2.postalCode || workAddr2.postal_code || '',
              country: workAddr2.country || 'Thailand'
            };
          }
        }
        
        // Store original data for comparison
        setOriginalData({
          profileImage: profile.avatar_url || profile.profile_image || '',
          fullName: profile.full_name || '',
          fullNameEnglish: profile.full_name_english || '',
          personalPhone: profile.personal_phone || '',
          personalId: profile.personal_id || '',
          personalAddress1: personalAddress1Data,
          personalAddress2: personalAddress2Data,
          companyLogo: profile.company_logo || '',
          company: profile.company || '',
          department: profile.department || '',
          jobTitle: profile.job_title || '',
          workPhone: profile.work_phone || '',
          workEmail: profile.work_email || '',
          website: profile.website || '',
          taxIdMain: profile.tax_id_main || '',
          taxIdBranch: profile.tax_id_branch || '',
          workAddress1: workAddress1Data,
          workAddress2: workAddress2Data,
        facebook: profile.facebook || '',
        lineId: profile.line_id || '',
        linkedin: profile.linkedin || '',
        twitter: profile.twitter || '',
        instagram: profile.instagram || '',
        tiktok: profile.tiktok || '',
        youtube: profile.youtube || '',
        telegram: profile.telegram || '',
        whatsapp: profile.whatsapp || '',
        wechat: profile.wechat || '',
        snapchat: profile.snapchat || '',
        pinterest: profile.pinterest || '',
        reddit: profile.reddit || '',
        discord: profile.discord || '',
        slack: profile.slack || '',
        viber: profile.viber || '',
        skype: profile.skype || '',
        zoom: profile.zoom || '',
        github: profile.github || '',
        twitch: profile.twitch || '',
          addresses: parsedAddresses || [],
        });
        
        // Update ALL form fields with data from profiles table
        const imageUrl = profile.avatar_url || profile.profile_image || '';
        
        setProfileImage(imageUrl);
        setFullName(profile.full_name || '');
        setFullNameEnglish(profile.full_name_english || '');
        setPersonalPhone(profile.personal_phone || '');
        setPersonalId(profile.personal_id || '');
        setPersonalAddress1(personalAddress1Data);
        setPersonalAddress2(personalAddress2Data);
        setCompanyLogo(profile.company_logo || '');
        setCompany(profile.company || '');
        setDepartment(profile.department || '');
        setJobTitle(profile.job_title || '');
        setWorkPhone(profile.work_phone || '');
        setWorkEmail(profile.work_email || '');
        setWebsite(profile.website || '');
        setTaxIdMain(profile.tax_id_main || '');
        setTaxIdBranch(profile.tax_id_branch || '');
        setWorkAddress1(workAddress1Data);
        setWorkAddress2(workAddress2Data);
        setFacebook(profile.facebook || '');
        setLineId(profile.line_id || '');
        setLinkedin(profile.linkedin || '');
        setTwitter(profile.twitter || '');
        setInstagram(profile.instagram || '');
        setTiktok(profile.tiktok || '');
        setYoutube(profile.youtube || '');
        setTelegram(profile.telegram || '');
        setWhatsapp(profile.whatsapp || '');
        setWechat(profile.wechat || '');
        setSnapchat(profile.snapchat || '');
        setPinterest(profile.pinterest || '');
        setReddit(profile.reddit || '');
        setDiscord(profile.discord || '');
        setSlack(profile.slack || '');
        setViber(profile.viber || '');
        setSkype(profile.skype || '');
        setZoom(profile.zoom || '');
        setGithub(profile.github || '');
        setTwitch(profile.twitch || '');
        setAddresses(parsedAddresses || []);
        
        // Reset unsaved changes flags
        setHasUnsavedPersonalInfo(false);
        setHasUnsavedWorkInfo(false);
        setHasUnsavedSocialMedia(false);
        setHasUnsavedAddresses(false);
        setChangedAddressIndices(new Set());
        
        // Clear pending image file
        setPendingImageFile(null);
      } else {
        console.warn('Settings: API call failed, using fallback');
        loadDataFromUserMetadata();
      }
    } catch (error) {
      console.warn('Settings: Error loading profile data:', error);
      loadDataFromUserMetadata();
    }
  }, [user, loadDataFromUserMetadata]);

  // Update form state when user data changes (กรณี 1: login เข้ามา)
  useEffect(() => {
    if (user?.id && !hasFetchedInitialData.current) {
      console.log('Settings: useEffect - Loading profile data for user:', user.id);
      // Mark as fetched to prevent multiple calls
        hasFetchedInitialData.current = true;
      
      // Load ALL data from profiles table via API (ensures we get latest data)
      loadProfileData().catch((error) => {
        console.error('Settings: Error loading profile data:', error);
        hasFetchedInitialData.current = false; // Reset flag on error
      });
    } else {
      console.log('Settings: useEffect - Skipping load:', {
        hasUserId: !!user?.id,
        hasFetched: hasFetchedInitialData.current
      });
    }
  }, [user?.id, loadProfileData]);

  // Reset fetch flag when component unmounts
  useEffect(() => {
    return () => {
      hasFetchedInitialData.current = false;
    };
  }, []);

  // Track address changes for badge notification
  useEffect(() => {
    if (Object.keys(originalData).length > 0 && originalData.addresses) {
      const hasChanges = JSON.stringify(addresses) !== JSON.stringify(originalData.addresses);
      setHasUnsavedChanges(hasChanges);
      setHasUnsavedAddresses(hasChanges);
    }
  }, [addresses, originalData]);

  // Track personal information changes
  useEffect(() => {
    if (Object.keys(originalData).length > 0) {
      const currentPersonalInfo = {
        profile_image: profileImage,
        full_name: fullName,
        full_name_english: fullNameEnglish,
        personal_phone: personalPhone,
        personal_id: personalId,
        personal_address_1: personalAddress1,
        personal_address_2: personalAddress2
      };
      const originalPersonalInfo = {
        profile_image: originalData.profileImage,
        full_name: originalData.fullName,
        full_name_english: originalData.fullNameEnglish,
        personal_phone: originalData.personalPhone,
        personal_id: originalData.personalId,
        personal_address_1: originalData.personalAddress1,
        personal_address_2: originalData.personalAddress2
      };
      const hasChanges = JSON.stringify(originalPersonalInfo) !== JSON.stringify(currentPersonalInfo);
      setHasUnsavedPersonalInfo(hasChanges);
    }
  }, [profileImage, fullName, fullNameEnglish, personalPhone, personalId, personalAddress1, personalAddress2, originalData]);

  // Track work information changes
  useEffect(() => {
    if (Object.keys(originalData).length > 0) {
      const currentWorkInfo = {
        company_logo: companyLogo,
        company,
        department,
        job_title: jobTitle,
        work_phone: workPhone,
        work_email: workEmail,
        website,
        tax_id_main: taxIdMain,
        tax_id_branch: taxIdBranch,
        work_address_1: workAddress1,
        work_address_2: workAddress2
      };
      const originalWorkInfo = {
        company_logo: originalData.companyLogo,
        company: originalData.company,
        department: originalData.department,
        job_title: originalData.jobTitle,
        work_phone: originalData.workPhone,
        work_email: originalData.workEmail,
        website: originalData.website,
        tax_id_main: originalData.taxIdMain,
        tax_id_branch: originalData.taxIdBranch,
        work_address_1: originalData.workAddress1,
        work_address_2: originalData.workAddress2
      };
      const hasChanges = JSON.stringify(originalWorkInfo) !== JSON.stringify(currentWorkInfo);
      setHasUnsavedWorkInfo(hasChanges);
    }
  }, [companyLogo, company, department, jobTitle, workPhone, workEmail, website, taxIdMain, taxIdBranch, workAddress1, workAddress2, originalData]);

  // Track social media changes
  useEffect(() => {
    if (Object.keys(originalData).length > 0) {
      const currentSocialMedia = {
        facebook,
        line_id: lineId,
        linkedin,
        twitter,
        instagram,
        tiktok,
        youtube,
        telegram,
        whatsapp,
        wechat,
        snapchat,
        pinterest,
        reddit,
        discord,
        slack,
        viber,
        skype,
        zoom,
        github,
        twitch
      };
      const originalSocialMedia = {
        facebook: originalData.facebook,
        line_id: originalData.lineId,
        linkedin: originalData.linkedin,
        twitter: originalData.twitter,
        instagram: originalData.instagram,
        tiktok: originalData.tiktok,
        youtube: originalData.youtube,
        telegram: originalData.telegram,
        whatsapp: originalData.whatsapp,
        wechat: originalData.wechat,
        snapchat: originalData.snapchat,
        pinterest: originalData.pinterest,
        reddit: originalData.reddit,
        discord: originalData.discord,
        slack: originalData.slack,
        viber: originalData.viber,
        skype: originalData.skype,
        zoom: originalData.zoom,
        github: originalData.github,
        twitch: originalData.twitch
      };
      const hasChanges = JSON.stringify(originalSocialMedia) !== JSON.stringify(currentSocialMedia);
      setHasUnsavedSocialMedia(hasChanges);
    }
  }, [facebook, lineId, linkedin, twitter, instagram, tiktok, youtube, telegram, whatsapp, wechat, snapchat, pinterest, reddit, discord, slack, viber, skype, zoom, github, twitch, originalData]);

  // Check for unsaved changes when component mounts or when browser regains focus
  useEffect(() => {
    const handleFocus = () => {
      if (activeTab === 4 && originalData.addresses) {
        const hasChanges = JSON.stringify(addresses) !== JSON.stringify(originalData.addresses);
        setHasUnsavedAddresses(hasChanges);
        
        if (hasChanges) {
          const changedIndices = new Set<number>();
          addresses.forEach((address: any, index: number) => {
            const originalAddress = originalData.addresses[index];
            if (!originalAddress || JSON.stringify(address) !== JSON.stringify(originalAddress)) {
              changedIndices.add(index);
            }
          });
          setChangedAddressIndices(changedIndices);
        } else {
          setChangedAddressIndices(new Set());
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [activeTab, addresses, originalData]);

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

  // Function to fetch fresh user data from Supabase (กรณี 2: กดปุ่มรีเฟรช)
  const fetchUserDataFromSupabase = async () => {
    if (!user?.id) return;
    
    // ถ้ามีการเปลี่ยนแปลง ให้ยืนยันก่อน
    const hasAnyUnsavedChanges = hasUnsavedPersonalInfo || hasUnsavedWorkInfo || hasUnsavedSocialMedia || hasUnsavedAddresses;
    
    if (hasAnyUnsavedChanges) {
      if (!confirm('คุณมีข้อมูลที่ยังไม่ได้บันทึก การรีเฟรชจะยกเลิกการเปลี่ยนแปลง ต้องการดำเนินการต่อหรือไม่?')) {
        return; // ยกเลิก
      }
    }
    
    setIsRefreshing(true);
    hasFetchedInitialData.current = true; // Mark as fetched
    try {
      // Load ALL data from profiles table via API
      await loadProfileData();
      
      // Show success message
      setSuccessMessage('ดึงข้อมูลอัพเดตเรียบร้อยแล้ว');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Settings: Error fetching fresh user data:', error);
      setSuccessMessage('เกิดข้อผิดพลาดในการดึงข้อมูล');
      setTimeout(() => setSuccessMessage(''), 3000);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSuccessMessage('');
    
    try {
      let metadataUpdates: any = {}; // สำหรับ user_metadata
      let profileTableUpdates: any = {}; // สำหรับ profiles table
      let tabName = '';
      let uploadedImageUrl = profileImage; // Default เป็นรูปเดิม

      // Build profile data based on active tab (บันทึกเฉพาะฟิลด์ในแท็บที่เลือก)
      switch (activeTab) {
        case 1: // Personal Information
          if (!fullName.trim()) {
            alert('กรุณากรอกชื่อ-นามสกุล');
            setIsSaving(false);
            return;
          }
          
          // ถ้ามีรูปรอ upload ให้ upload ก่อน
          if (pendingImageFile) {
            uploadedImageUrl = await uploadProfileImage(pendingImageFile);
            setPendingImageFile(null); // Clear pending file
          } else if (!profileImage && originalData.profileImage) {
            // ถ้าไม่มีรูปและเดิมมีรูป แสดงว่าถูกลบ
            uploadedImageUrl = '';
          }
          
          // Save addresses first and get IDs
          let personalAddress1Id = null;
          let personalAddress2Id = null;
          
          if (personalAddress1.address || personalAddress1.province) {
            personalAddress1Id = await saveAddressToDatabase(personalAddress1, 'personal_1');
          }
          
          if (personalAddress2.address || personalAddress2.province) {
            personalAddress2Id = await saveAddressToDatabase(personalAddress2, 'personal_2');
          }

          // Metadata: เฉพาะข้อมูลไม่รวมรูป
          metadataUpdates = {
            full_name: fullName.trim(),
            full_name_english: fullNameEnglish.trim(),
            personal_phone: personalPhone.trim(),
            personal_id: personalId.trim(),
            personal_address_1: personalAddress1,
            personal_address_2: personalAddress2,
          };
          // Profiles table: รวมรูป
          profileTableUpdates = {
            avatar_url: uploadedImageUrl,
            profile_image: uploadedImageUrl,
            full_name: fullName.trim(),
            full_name_english: fullNameEnglish.trim(),
            personal_phone: personalPhone.trim(),
            personal_id: personalId.trim(),
            personal_address_1_id: personalAddress1Id,
            personal_address_2_id: personalAddress2Id,
          };
          tabName = 'ข้อมูลส่วนตัว';
          break;

        case 2: // Work Information
          // ถ้ามีรูปรอ upload ให้ upload ก่อน
          let uploadedCompanyLogoUrl = companyLogo; // Default เป็นรูปเดิม
          if (pendingCompanyLogoFile) {
            uploadedCompanyLogoUrl = await uploadCompanyLogo(pendingCompanyLogoFile);
            setPendingCompanyLogoFile(null); // Clear pending file
          } else if (!companyLogo && originalData.companyLogo) {
            // ถ้าไม่มีรูปและเดิมมีรูป แสดงว่าถูกลบ
            uploadedCompanyLogoUrl = '';
          }
          
          // Save addresses first and get IDs
          let workAddress1Id = null;
          let workAddress2Id = null;
          
          if (workAddress1.address || workAddress1.province) {
            workAddress1Id = await saveAddressToDatabase(workAddress1, 'work_1');
          }
          
          if (workAddress2.address || workAddress2.province) {
            workAddress2Id = await saveAddressToDatabase(workAddress2, 'work_2');
          }

          metadataUpdates = {
            company: company.trim(),
            department: department.trim(),
            job_title: jobTitle.trim(),
            work_phone: workPhone.trim(),
            work_email: workEmail.trim(),
            website: website.trim(),
            tax_id_main: taxIdMain.trim(),
            tax_id_branch: taxIdBranch.trim(),
            work_address_1: workAddress1,
            work_address_2: workAddress2,
          };
          profileTableUpdates = {
            company_logo: uploadedCompanyLogoUrl,
            company: company.trim(),
            department: department.trim(),
            job_title: jobTitle.trim(),
            work_phone: workPhone.trim(),
            work_email: workEmail.trim(),
            website: website.trim(),
            tax_id_main: taxIdMain.trim(),
            tax_id_branch: taxIdBranch.trim(),
            work_address_1_id: workAddress1Id,
            work_address_2_id: workAddress2Id,
          };
          tabName = 'ข้อมูลที่ทำงาน';
          break;

        case 3: // Social Media
          metadataUpdates = {
            facebook: facebook.trim(),
            line_id: lineId.trim(),
            linkedin: linkedin.trim(),
            twitter: twitter.trim(),
            instagram: instagram.trim(),
            tiktok: tiktok.trim(),
            youtube: youtube.trim(),
            telegram: telegram.trim(),
            whatsapp: whatsapp.trim(),
            wechat: wechat.trim(),
            snapchat: snapchat.trim(),
            pinterest: pinterest.trim(),
            reddit: reddit.trim(),
            discord: discord.trim(),
            slack: slack.trim(),
            viber: viber.trim(),
            skype: skype.trim(),
            zoom: zoom.trim(),
            github: github.trim(),
            twitch: twitch.trim(),
          };
          profileTableUpdates = metadataUpdates;
          tabName = 'โซเชียลมีเดีย';
          break;

        case 4: // Addresses
          // Addresses จะบันทึกแยกต่างหาก ไม่ผ่าน metadata หรือ profiles table
          metadataUpdates = {};
          profileTableUpdates = {};
          tabName = 'ที่อยู่';
          break;

        default:
          alert('ไม่พบแท็บที่เลือก');
          return;
      }

      // Special handling for Addresses tab
      if (activeTab === 4) {
        // Update addresses table
        await updateAddressesTable(addresses);
      } else {
        // Update user_metadata for other tabs
        const { error } = await updateProfile(metadataUpdates);
      
      if (error) {
        throw error;
        }
        
        // Update profiles table directly if there are updates
        if (Object.keys(profileTableUpdates).length > 0) {
          await updateProfilesTable(profileTableUpdates);
        }
      }
      
      setSuccessMessage(`บันทึก${tabName}เรียบร้อยแล้ว`);
      
      // Load fresh data from profiles table via API (กรณี 3: หลังบันทึกสำเร็จ)
      await loadProfileData();
      
      // Dispatch event to clear image cache in TemplatePreview
      if (activeTab === 1 || activeTab === 2) {
        // Only dispatch if profile image or company logo might have changed
        window.dispatchEvent(new CustomEvent('profileUpdated'));
      }
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      
      // Show detailed error message
      let errorMessage = 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
      
      if (error.message) {
        errorMessage += '\n\nรายละเอียด: ' + error.message;
      }
      
      if (error.details) {
        errorMessage += '\n\n' + JSON.stringify(error.details, null, 2);
      }
      
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Function to update profiles table directly
  const updateProfilesTable = async (updates: any) => {
    try {
      const { data: { session } } = await supabase!.auth.getSession();
      
      if (!session?.access_token) {
        console.warn('No session token for profiles table update');
        return;
      }
      
      const response = await fetch('/api/update-profiles-table', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: session.access_token,
          updates: updates,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profiles table');
      }
    } catch (error) {
      console.error('❌ Error updating profiles table:', error);
      throw error;
    }
  };
  
  // Function to save single address to database
  const saveAddressToDatabase = async (addressData: any, type: string) => {
    try {
      const { data: { session } } = await supabase!.auth.getSession();
      
      if (!session?.access_token) {
        console.warn('No session token for address save');
        return null;
      }

      const addressPayload = {
        user_id: session.user.id,
        type: type,
        place: addressData.place || '',
        address: addressData.address || '',
        province: addressData.province || '',
        district: addressData.district || '',
        tambon: addressData.tambon || '',
        postal_code: addressData.postalCode || '',
        country: addressData.country || 'Thailand'
      };

      const response = await fetch('/api/save-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: session.access_token,
          address: addressPayload
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save address');
      }

      const result = await response.json();
      return result.id;
      
    } catch (error) {
      console.error('❌ Error saving address:', error);
      return null;
    }
  };

  // Function to update addresses table
  const updateAddressesTable = async (addressesList: any[]) => {
    try {
      const { data: { session } } = await supabase!.auth.getSession();
      
      if (!session?.access_token) {
        console.warn('No session token for addresses table update');
        return;
      }
      
      const response = await fetch('/api/update-addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: session.access_token,
          addresses: addressesList,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update addresses');
      }
    } catch (error) {
      console.error('❌ Error updating addresses table:', error);
      throw error;
    }
  };

  // Address management functions
  const addAddress = () => {
    // ตรวจสอบจำนวนที่อยู่ (จำกัดไม่เกิน 3 ที่อยู่)
    if (addresses.length >= 3) {
      alert('คุณสามารถเพิ่มที่อยู่ได้สูงสุด 3 ที่อยู่เท่านั้น\n\nกรุณาลบที่อยู่เก่าก่อนเพิ่มที่อยู่ใหม่');
      return;
    }
    
    if (!newAddress.address.trim()) {
      alert('กรุณากรอกที่อยู่');
      return;
    }
    if (!newAddress.province.trim()) {
      alert('กรุณาเลือกจังหวัด');
      return;
    }
    if (!newAddress.district.trim()) {
      alert('กรุณาเลือกอำเภอ/เขต');
      return;
    }
    if (!newAddress.tambon.trim()) {
      alert('กรุณาเลือกตำบล/แขวง');
      return;
    }

    const newAddresses = [...addresses, { ...newAddress }];
    setAddresses(newAddresses);
    setHasUnsavedAddresses(true); // Mark as having unsaved changes
    setChangedAddressIndices(prev => new Set([...Array.from(prev), newAddresses.length - 1])); // Mark new address as changed
    setNewAddress({
      type: 'home',
      address: '',
      tambon: '',
      district: '',
      province: '',
      postalCode: '',
      country: 'Thailand',
      place: ''
    });
    
    // Switch to existing addresses tab to show the added address
    setActiveAddressTab(2);
  };

  const editAddress = (index: number) => {
    setEditingAddressIndex(index);
    setNewAddress({ ...addresses[index] });
  };

  const saveAddress = () => {
    if (!newAddress.address.trim()) {
      alert('กรุณากรอกที่อยู่');
      return;
    }
    if (!newAddress.province.trim()) {
      alert('กรุณาเลือกจังหวัด');
      return;
    }
    if (!newAddress.district.trim()) {
      alert('กรุณาเลือกอำเภอ/เขต');
      return;
    }
    if (!newAddress.tambon.trim()) {
      alert('กรุณาเลือกตำบล/แขวง');
      return;
    }

    const updatedAddresses = [...addresses];
    updatedAddresses[editingAddressIndex] = { ...newAddress };
    setAddresses(updatedAddresses);
    setHasUnsavedAddresses(true); // Mark as having unsaved changes
    setChangedAddressIndices(prev => new Set([...Array.from(prev), editingAddressIndex])); // Mark edited address as changed
    setEditingAddressIndex(-1);
    setNewAddress({
      type: 'home',
      address: '',
      tambon: '',
      district: '',
      province: '',
      postalCode: '',
      country: 'Thailand',
      place: ''
    });
    
    // Switch to existing addresses tab to show the updated address
    setActiveAddressTab(2);
  };

  const deleteAddress = (index: number) => {
    if (confirm('คุณต้องการลบที่อยู่นี้หรือไม่?')) {
      const updatedAddresses = addresses.filter((_: any, i: number) => i !== index);
      setAddresses(updatedAddresses);
      setHasUnsavedAddresses(true); // Mark as having unsaved changes
      // Update changed indices after deletion
      setChangedAddressIndices(prev => {
        const newSet = new Set<number>();
        Array.from(prev).forEach(changedIndex => {
          if (changedIndex < index) {
            // Index before deleted item stays the same
            newSet.add(changedIndex);
          } else if (changedIndex > index) {
            // Index after deleted item shifts down by 1
            newSet.add(changedIndex - 1);
          }
          // Index of deleted item is removed
        });
        return newSet;
      });
    }
  };

  const cancelEdit = () => {
    setEditingAddressIndex(-1);
    setNewAddress({
      type: 'home',
      address: '',
      tambon: '',
      district: '',
      province: '',
      postalCode: '',
      country: 'Thailand',
      place: ''
    });
  };

  // Image upload functions
  // Helper function to compress image
  const compressImage = (file: File, maxWidth: number = 800, maxHeight: number = 800, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Function to upload profile image and return URL
  const uploadProfileImage = async (file: File): Promise<string> => {
    try {
      const { supabase } = await import('@/lib/supabase/client');

      if (!supabase) {
        throw new Error('ไม่สามารถเชื่อมต่อฐานข้อมูลได้');
      }

      // Get current user
      const { data: { user }, error: authError } = await supabase!.auth.getUser();
      
      if (authError || !user) {
        throw new Error('ไม่พบผู้ใช้');
      }
      
      // Get session token
      const { data: { session } } = await supabase!.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('ไม่พบ session');
      }
      
      const formData = new FormData();
      formData.append('profile', file);
      formData.append('access_token', session.access_token);
      
      const response = await fetch('/api/upload-profile', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        return result.imageUrl;
      } else {
        throw new Error(result.error || 'Upload ล้มเหลว');
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      throw error;
    }
  };

  const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true); // เริ่ม loading
    
    try {
      // Compress image if needed
      let processedFile = file;
      if (file.size > 2 * 1024 * 1024) { // 2MB
        processedFile = await compressImage(file, 800, 800, 0.8);
      }
      
      // เก็บไฟล์ไว้ รอจนกดปุ่ม "บันทึก" จึงจะ upload จริง
      setPendingImageFile(processedFile);
      
      // สร้าง preview URL สำหรับแสดงรูป
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewUrl = e.target?.result as string;
        if (previewUrl) {
          setProfileImage(previewUrl);
            setHasUnsavedPersonalInfo(true);
          setIsUploadingImage(false); // เสร็จแล้ว
        }
      };
      reader.onerror = () => {
        setIsUploadingImage(false);
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์');
      };
      reader.readAsDataURL(processedFile);
    } catch (error) {
      console.error('❌ Error processing image:', error);
      setIsUploadingImage(false);
      alert('เกิดข้อผิดพลาดในการประมวลผลรูปภาพ');
    }
  };

  const handleRemoveProfileImage = () => {
    // Clear pending file
    setPendingImageFile(null);
    
    // Clear profile image
    setProfileImage('');
    
    // Mark as having unsaved changes
    setHasUnsavedPersonalInfo(true);
  };

  // Function to upload company logo and return URL
  const uploadCompanyLogo = async (file: File): Promise<string> => {
    try {
      const { supabase } = await import('@/lib/supabase/client');

      if (!supabase) {
        throw new Error('ไม่สามารถเชื่อมต่อฐานข้อมูลได้');
      }

      // Get current user
      const { data: { user }, error: authError } = await supabase!.auth.getUser();
      
      if (authError || !user) {
        throw new Error('ไม่พบผู้ใช้');
      }
      
      // Get session token
      const { data: { session } } = await supabase!.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('ไม่พบ session');
      }
      
      const formData = new FormData();
      formData.append('company_logo', file);
      formData.append('access_token', session.access_token);
      
      const response = await fetch('/api/upload-company-logo', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        return result.imageUrl;
      } else {
        throw new Error(result.error || 'Upload ล้มเหลว');
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      throw error;
    }
  };

  const handleCompanyLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingCompanyLogo(true);
    
    try {
      // Compress image if needed
      let processedFile = file;
      if (file.size > 2 * 1024 * 1024) { // 2MB
        processedFile = await compressImage(file, 800, 800, 0.8);
      }
      
      // เก็บไฟล์ไว้ รอจนกดปุ่ม "บันทึก" จึงจะ upload จริง
      setPendingCompanyLogoFile(processedFile);
      
      // สร้าง preview URL สำหรับแสดงรูป
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewUrl = e.target?.result as string;
        if (previewUrl) {
          setCompanyLogo(previewUrl);
          setHasUnsavedWorkInfo(true);
          setIsUploadingCompanyLogo(false);
        }
      };
      reader.onerror = () => {
        setIsUploadingCompanyLogo(false);
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์');
      };
      reader.readAsDataURL(processedFile);
    } catch (error) {
      console.error('❌ Error processing image:', error);
      setIsUploadingCompanyLogo(false);
      alert('เกิดข้อผิดพลาดในการประมวลผลรูปภาพ');
    }
  };

  const handleRemoveCompanyLogo = () => {
    // Clear pending file
    setPendingCompanyLogoFile(null);
    
    // Clear company logo
    setCompanyLogo('');
    
    // Mark as having unsaved changes
    setHasUnsavedWorkInfo(true);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }

    if (newPassword.length < 6) {
      alert('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setIsLoading(true);
    
    try {
      // Import supabase client for password update
      const { supabase } = await import('@/lib/supabase/client');
      
      if (!supabase) {
        throw new Error('Supabase client not available');
      }
      
      // Update password using Supabase
      const { error } = await supabase!.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        throw error;
      }
      
      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
      
      alert('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว');
    } catch (error: any) {
      console.error('Error changing password:', error);
      alert('เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน: ' + (error.message || 'ไม่ทราบสาเหตุ'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendPasswordSetupLink = async () => {
    if (!user?.email) {
      setPasswordLinkError('ไม่พบอีเมลสำหรับบัญชีนี้');
      setPasswordLinkMessage('');
      return;
    }

    setIsSendingPasswordLink(true);
    setPasswordLinkError('');
    setPasswordLinkMessage('');

    try {
      const { supabase } = await import('@/lib/supabase/client');

      if (!supabase) {
        throw new Error('ไม่สามารถเชื่อมต่อฐานข้อมูลได้');
      }

      const { error } = await supabase!.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        let message = error.message || 'ไม่สามารถส่งลิงก์ตั้งรหัสผ่านได้';
        if (message === 'Password reset requires a secure connection. Please use HTTPS.')
          message = 'ไม่สามารถส่งลิงก์ตั้งรหัสผ่านผ่านการเชื่อมต่อที่ไม่ปลอดภัยได้ กรุณาใช้งานผ่าน HTTPS';
        setPasswordLinkError(message);
        return;
      }

      setPasswordLinkMessage('ส่งลิงก์สำหรับตั้งรหัสผ่านไปยังอีเมลของคุณแล้ว');
    } catch (error: any) {
      setPasswordLinkError(error?.message || 'ไม่สามารถส่งลิงก์ตั้งรหัสผ่านได้');
    } finally {
      setIsSendingPasswordLink(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('คุณต้องการลบบัญชีหรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้')) {
      return;
    }

    // Double confirmation
    const confirmed = confirm('คุณแน่ใจหรือไม่? ข้อมูลทั้งหมดจะถูกลบถาวรและไม่สามารถกู้คืนได้');
    if (!confirmed) {
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการลบบัญชี');
      }

      alert('ลบบัญชีเรียบร้อยแล้ว');
      // Sign out and redirect to home
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      alert(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบบัญชี');
    } finally {
      setIsLoading(false);
    }
  };

  const providerDisplayText = oauthProviderNames.length
    ? oauthProviderNames
        .map(
          (provider) =>
            providerNameMap[provider] ||
            provider.charAt(0).toUpperCase() + provider.slice(1)
        )
        .join(' และ ')
    : '';

  return (
    <Layout>
        {/* Page Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">การตั้งค่า</h1>
              <p className="text-gray-600">จัดการบัญชีและการตั้งค่าของคุณ</p>
            </div>
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            </div>
          </div>
        </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Profile Settings with Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center p-6 border-b border-gray-200">
              <User className="w-6 h-6 text-primary-500 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">ข้อมูลโปรไฟล์</h2>
            </div>
            
            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              {/* Desktop: Tab Buttons */}
              <nav className="hidden sm:flex space-x-8 px-6" aria-label="Tabs">
                {[
                  { id: 1, name: 'ข้อมูลส่วนตัว', icon: User, showBadge: hasUnsavedPersonalInfo },
                  { id: 2, name: 'ข้อมูลที่ทำงาน', icon: Building, showBadge: hasUnsavedWorkInfo },
                  { id: 3, name: 'โซเชียลมีเดีย', icon: Globe, showBadge: hasUnsavedSocialMedia }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={async () => {
                        // ถ้า switch แท็บ และมีการแก้ไขข้อมูล = reload ข้อมูลใหม่ (discard changes)
                        const hasAnyUnsavedChanges = hasUnsavedPersonalInfo || hasUnsavedWorkInfo || hasUnsavedSocialMedia || hasUnsavedAddresses;
                        
                        if (hasAnyUnsavedChanges && tab.id !== activeTab) {
                          // ยืนยันว่าต้องการยกเลิกการเปลี่ยนแปลง
                          if (confirm('คุณมีข้อมูลที่ยังไม่ได้บันทึก คุณต้องการยกเลิกการเปลี่ยนแปลงหรือไม่?')) {
                            // Reload ข้อมูลใหม่จาก API
                            await loadProfileData();
                          } else {
                            // ไม่เปลี่ยนแท็บ
                            return;
                          }
                        }
                        
                        setActiveTab(tab.id);
                        
                        // Reset badge states when switching tabs
                        setHasUnsavedPersonalInfo(false);
                          setHasUnsavedWorkInfo(false);
                          setHasUnsavedSocialMedia(false);
                          setHasUnsavedAddresses(false);
                          setChangedAddressIndices(new Set());
                      }}
                      className={`${
                        activeTab === tab.id
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center relative`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {tab.name}
                      {tab.showBadge && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Mobile: Dropdown */}
              <div className="sm:hidden px-4 py-3">
                <select
                  value={activeTab}
                  onChange={async (e) => {
                    const newTab = parseInt(e.target.value);
                    
                    // ถ้า switch แท็บ และมีการแก้ไขข้อมูล = reload ข้อมูลใหม่
                    const hasAnyUnsavedChanges = hasUnsavedPersonalInfo || hasUnsavedWorkInfo || hasUnsavedSocialMedia || hasUnsavedAddresses;
                    
                    if (hasAnyUnsavedChanges && newTab !== activeTab) {
                      if (confirm('คุณมีข้อมูลที่ยังไม่ได้บันทึก คุณต้องการยกเลิกการเปลี่ยนแปลงหรือไม่?')) {
                        await loadProfileData();
                      } else {
                        return;
                      }
                    }
                    
                    setActiveTab(newTab);
                    
                    // Reset all badge states
                    setHasUnsavedPersonalInfo(false);
                      setHasUnsavedWorkInfo(false);
                      setHasUnsavedSocialMedia(false);
                      setHasUnsavedAddresses(false);
                      setChangedAddressIndices(new Set());
                  }}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                >
                  <option value={1}>👤 ข้อมูลส่วนตัว {hasUnsavedPersonalInfo ? '●' : ''}</option>
                  <option value={2}>🏢 ข้อมูลที่ทำงาน {hasUnsavedWorkInfo ? '●' : ''}</option>
                  <option value={3}>🌐 โซเชียลมีเดีย {hasUnsavedSocialMedia ? '●' : ''}</option>
                </select>
              </div>
            </div>
            
            {/* Tab Content */}
            <div className="p-6">
              {/* Tab 1: Personal Information */}
              {activeTab === 1 && (
                <div className="space-y-6">
                  {/* Row 1: Profile Picture, Full Name, Full Name English */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Profile Picture */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        รูป Profile
                      </label>
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                            {profileImage ? (
                              <img
                                src={profileImage}
                                alt="Profile"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-8 h-8 text-gray-400" />
                            )}
                          </div>
                          {isUploadingImage && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs mt-2">กำลังโหลด...</span>
                          </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <label className={`cursor-pointer flex-1 ${isUploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <div className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                              <Upload className="w-4 h-4 mr-2" />
                              {isUploadingImage ? 'กำลังโหลด...' : profileImage ? 'เปลี่ยนรูป' : 'อัปโหลดรูป'}
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleProfileImageUpload}
                              className="hidden"
                              disabled={isUploadingImage}
                            />
                          </label>
                          {profileImage && (
                            <button
                              type="button"
                              onClick={handleRemoveProfileImage}
                              className="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-red-50 transition-colors flex items-center"
                              title="ยกเลิกรูป Profile"
                              disabled={isUploadingImage}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Full Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ชื่อ-นามสกุล *
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                        placeholder="กรอกชื่อ-นามสกุล"
                      />
                    </div>
                    
                    {/* Full Name English */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ชื่อ-นามสกุล (ภาษาอังกฤษ)
                      </label>
                      <input
                        type="text"
                        value={fullNameEnglish}
                        onChange={(e) => setFullNameEnglish(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                        placeholder="Enter Full Name in English"
                      />
                    </div>
                  </div>
                  
                  {/* Row 2: Personal ID, Personal Phone, Personal Email */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Personal ID */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        เลขประจำตัวประชาชน
                      </label>
                      <input
                        type="text"
                        value={personalId}
                        onChange={(e) => setPersonalId(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                        placeholder="กรอกเลขประจำตัวประชาชน"
                      />
                    </div>
                    
                    {/* Personal Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Phone className="w-4 h-4 inline mr-2" />
                        เบอร์โทรศัพท์ส่วนตัว
                      </label>
                      <input
                        type="tel"
                        value={personalPhone}
                        onChange={(e) => setPersonalPhone(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                        placeholder="กรอกเบอร์โทรศัพท์ส่วนตัว"
                      />
                    </div>
                    
                    {/* Personal Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="w-4 h-4 inline mr-2" />
                        อีเมลส่วนตัว
                      </label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                        placeholder="อีเมลจากบัญชีที่เข้าสู่ระบบ"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        อีเมลจากบัญชีที่เข้าสู่ระบบ ไม่สามารถแก้ไขได้
                      </p>
                    </div>
                  </div>

                  {/* Personal Addresses */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900">ที่อยู่ส่วนตัว</h3>
                    
                    {/* Personal Address 1 */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="text-md font-medium text-gray-700 mb-4">ที่อยู่ส่วนตัว (1)</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            สถานที่
                          </label>
                          <input
                            type="text"
                            value={personalAddress1.place || ''}
                            onChange={(e) => setPersonalAddress1({ ...personalAddress1, place: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                            placeholder="กรอกสถานที่ (เช่น ชื่ออาคาร, ชื่อหมู่บ้าน, ชื่อคอนโด)"
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              ที่อยู่
                            </label>
                            <textarea
                              value={personalAddress1.address || ''}
                              onChange={(e) => setPersonalAddress1({ ...personalAddress1, address: e.target.value })}
                              className="w-full px-4 py-3 min-h-[80px] resize-none bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                              placeholder="กรอกที่อยู่"
                              rows={3}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              ตัวอย่างที่อยู่
                            </label>
                            <textarea
                              value={`${personalAddress1.address || ''}${personalAddress1.tambon ? `, ${personalAddress1.tambon}` : ''}${personalAddress1.district ? `, ${personalAddress1.district}` : ''}${personalAddress1.province ? `, ${personalAddress1.province}` : ''}${personalAddress1.postalCode ? ` ${personalAddress1.postalCode}` : ''}`}
                              disabled
                              className="w-full px-4 py-3 min-h-[80px] resize-none bg-gray-50 border border-gray-300 rounded-lg text-xs text-gray-600"
                              rows={3}
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              จังหวัด *
                            </label>
                            <select
                              value={personalAddress1.province || ''}
                              onChange={(e) => {
                                const province = e.target.value;
                                setPersonalAddress1({
                                  ...personalAddress1,
                                  province,
                                  district: '',
                                  tambon: '',
                                  postalCode: ''
                                });
                              }}
                              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                            >
                              <option value="">เลือกจังหวัด</option>
                              {getProvinces().map((province) => (
                                <option key={province} value={province}>
                                  {province}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              อำเภอ/เขต *
                            </label>
                            <select
                              value={personalAddress1.district || ''}
                              onChange={(e) => {
                                const district = e.target.value;
                                const postalCode = personalAddress1.province && district ? 
                                  (getPostalCode(personalAddress1.province, district) || '') : '';
                                setPersonalAddress1({
                                  ...personalAddress1,
                                  district,
                                  tambon: '',
                                  postalCode: postalCode.toString()
                                });
                              }}
                              disabled={!personalAddress1.province}
                              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                            >
                              <option value="">เลือกอำเภอ/เขต</option>
                              {personalAddress1.province && getDistricts(personalAddress1.province).map((district) => (
                                <option key={district} value={district}>
                                  {district}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              ตำบล/แขวง *
                            </label>
                            <select
                              value={personalAddress1.tambon || ''}
                              onChange={(e) => {
                                const tambon = e.target.value;
                                let postalCode = personalAddress1.province && personalAddress1.district && tambon ? 
                                  (getPostalCode(personalAddress1.province, personalAddress1.district) || '') : '';
                                
                                // Special case for ตำบลแสนสุข in เมืองชลบุรี
                                if (personalAddress1.province === 'ชลบุรี' && personalAddress1.district === 'เมืองชลบุรี' && tambon === 'แสนสุข') {
                                  postalCode = 20130;
                                }
                                
                                setPersonalAddress1({
                                  ...personalAddress1,
                                  tambon,
                                  postalCode: postalCode.toString()
                                });
                              }}
                              disabled={!personalAddress1.district}
                              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                            >
                              <option value="">เลือกตำบล/แขวง</option>
                              {personalAddress1.province && personalAddress1.district && 
                                getTambons(personalAddress1.province, personalAddress1.district).map((tambon: string, tambonIndex: number) => (
                                  <option key={`${personalAddress1.province}-${personalAddress1.district}-${tambon}-${tambonIndex}`} value={tambon}>
                                    {tambon}
                                  </option>
                                ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              รหัสไปรษณีย์
                            </label>
                            <input
                              type="text"
                              value={personalAddress1.postalCode || ''}
                              onChange={(e) => setPersonalAddress1({ ...personalAddress1, postalCode: e.target.value })}
                              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                              placeholder="กรอกรหัสไปรษณีย์"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Personal Address 2 */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="text-md font-medium text-gray-700 mb-4">ที่อยู่ส่วนตัว (2)</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            สถานที่
                          </label>
                          <input
                            type="text"
                            value={personalAddress2.place || ''}
                            onChange={(e) => setPersonalAddress2({ ...personalAddress2, place: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                            placeholder="กรอกสถานที่ (เช่น ชื่ออาคาร, ชื่อหมู่บ้าน, ชื่อคอนโด)"
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              ที่อยู่
                            </label>
                            <textarea
                              value={personalAddress2.address || ''}
                              onChange={(e) => setPersonalAddress2({ ...personalAddress2, address: e.target.value })}
                              className="w-full px-4 py-3 min-h-[80px] resize-none bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                              placeholder="กรอกที่อยู่"
                              rows={3}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              ตัวอย่างที่อยู่
                            </label>
                            <textarea
                              value={`${personalAddress2.address || ''}${personalAddress2.tambon ? `, ${personalAddress2.tambon}` : ''}${personalAddress2.district ? `, ${personalAddress2.district}` : ''}${personalAddress2.province ? `, ${personalAddress2.province}` : ''}${personalAddress2.postalCode ? ` ${personalAddress2.postalCode}` : ''}`}
                              disabled
                              className="w-full px-4 py-3 min-h-[80px] resize-none bg-gray-50 border border-gray-300 rounded-lg text-xs text-gray-600"
                              rows={3}
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              จังหวัด *
                            </label>
                            <select
                              value={personalAddress2.province || ''}
                              onChange={(e) => {
                                const province = e.target.value;
                                setPersonalAddress2({
                                  ...personalAddress2,
                                  province,
                                  district: '',
                                  tambon: '',
                                  postalCode: ''
                                });
                              }}
                              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                            >
                              <option value="">เลือกจังหวัด</option>
                              {getProvinces().map((province) => (
                                <option key={province} value={province}>
                                  {province}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              อำเภอ/เขต *
                            </label>
                            <select
                              value={personalAddress2.district || ''}
                              onChange={(e) => {
                                const district = e.target.value;
                                const postalCode = personalAddress2.province && district ? 
                                  (getPostalCode(personalAddress2.province, district) || '') : '';
                                setPersonalAddress2({
                                  ...personalAddress2,
                                  district,
                                  tambon: '',
                                  postalCode: postalCode.toString()
                                });
                              }}
                              disabled={!personalAddress2.province}
                              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                            >
                              <option value="">เลือกอำเภอ/เขต</option>
                              {personalAddress2.province && getDistricts(personalAddress2.province).map((district) => (
                                <option key={district} value={district}>
                                  {district}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              ตำบล/แขวง *
                            </label>
                            <select
                              value={personalAddress2.tambon || ''}
                              onChange={(e) => {
                                const tambon = e.target.value;
                                const postalCode = personalAddress2.province && personalAddress2.district && tambon ? 
                                  (getPostalCode(personalAddress2.province, personalAddress2.district) || '') : '';
                                setPersonalAddress2({
                                  ...personalAddress2,
                                  tambon,
                                  postalCode: postalCode.toString()
                                });
                              }}
                              disabled={!personalAddress2.district}
                              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                            >
                              <option value="">เลือกตำบล/แขวง</option>
                              {personalAddress2.province && personalAddress2.district && 
                                getTambons(personalAddress2.province, personalAddress2.district).map((tambon: string, tambonIndex: number) => (
                                  <option key={`${personalAddress2.province}-${personalAddress2.district}-${tambon}-${tambonIndex}`} value={tambon}>
                                    {tambon}
                                  </option>
                                ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              รหัสไปรษณีย์
                            </label>
                            <input
                              type="text"
                              value={personalAddress2.postalCode || ''}
                              onChange={(e) => setPersonalAddress2({ ...personalAddress2, postalCode: e.target.value })}
                              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                              placeholder="กรอกรหัสไปรษณีย์"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Tab 2: Work Information */}
              {activeTab === 2 && (
                <div className="space-y-6">
                  {/* Row 1: Company Logo, Company Name, Department */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Company Logo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        รูป Logo บริษัท
                      </label>
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                            {companyLogo ? (
                              <img src={companyLogo} alt="Company Logo" className="w-full h-full object-cover" />
                            ) : (
                              <Building className="w-8 h-8 text-gray-400" />
                            )}
                          </div>
                          {isUploadingCompanyLogo && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                              <span className="text-white text-xs mt-2">กำลังโหลด...</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <label className={`cursor-pointer flex-1 ${isUploadingCompanyLogo ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <div className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                              <Upload className="w-4 h-4 mr-2" />
                              {isUploadingCompanyLogo ? 'กำลังโหลด...' : companyLogo ? 'เปลี่ยนรูป' : 'อัปโหลดรูป'}
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleCompanyLogoUpload}
                              className="hidden"
                              disabled={isUploadingCompanyLogo}
                            />
                          </label>
                          {companyLogo && (
                            <button
                              type="button"
                              onClick={handleRemoveCompanyLogo}
                              className="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-red-50 transition-colors flex items-center"
                              title="ยกเลิกรูป Company Logo"
                              disabled={isUploadingCompanyLogo}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Company Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Building className="w-4 h-4 inline mr-2" />
                        ชื่อบริษัท
                      </label>
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                        placeholder="กรอกชื่อบริษัท"
                      />
                    </div>
                    
                    {/* Department */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        แผนก/ส่วนงาน
                      </label>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                        placeholder="กรอกแผนก/ส่วนงาน"
                      />
                    </div>
                  </div>
                  
                  {/* Row 2: Job Title, Work Phone, Work Email */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Job Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Briefcase className="w-4 h-4 inline mr-2" />
                        ตำแหน่งงาน
                      </label>
                      <input
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                        placeholder="กรอกตำแหน่งงาน"
                      />
                    </div>
                    
                    {/* Work Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Phone className="w-4 h-4 inline mr-2" />
                        เบอร์โทรศัพท์ที่ทำงาน
                      </label>
                      <input
                        type="tel"
                        value={workPhone}
                        onChange={(e) => setWorkPhone(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                        placeholder="กรอกเบอร์โทรศัพท์ที่ทำงาน"
                      />
                    </div>
                    
                    {/* Work Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="w-4 h-4 inline mr-2" />
                        อีเมลที่ทำงาน
                      </label>
                      <input
                        type="email"
                        value={workEmail}
                        onChange={(e) => setWorkEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                        placeholder="กรอกอีเมลที่ทำงาน"
                      />
                    </div>
                  </div>
                  
                  {/* Row 3: Website, Tax ID Main, Tax ID Branch */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Website */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Globe className="w-4 h-4 inline mr-2" />
                        เว็บไซต์
                      </label>
                      <input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                        placeholder="https://www.example.com"
                      />
                    </div>
                    
                    {/* Tax ID Main */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        เลขประจำตัวผู้เสียภาษี (สำนักงานใหญ่)
                      </label>
                      <input
                        type="text"
                        value={taxIdMain}
                        onChange={(e) => setTaxIdMain(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                        placeholder="กรอกเลขประจำตัวผู้เสียภาษี (สำนักงานใหญ่)"
                      />
                    </div>
                    
                    {/* Tax ID Branch */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        เลขประจำตัวผู้เสียภาษี (สาขาย่อย) (ถ้ามี)
                      </label>
                      <input
                        type="text"
                        value={taxIdBranch}
                        onChange={(e) => setTaxIdBranch(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                        placeholder="กรอกเลขประจำตัวผู้เสียภาษี (สาขาย่อย)"
                      />
                    </div>
                  </div>

                  {/* Work Addresses */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900">ที่อยู่ที่ทำงาน</h3>
                    
                    {/* Work Address 1 */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="text-md font-medium text-gray-700 mb-4">ที่อยู่ที่ทำงาน (1)</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            สถานที่
                          </label>
                          <input
                            type="text"
                            value={workAddress1.place || ''}
                            onChange={(e) => setWorkAddress1({ ...workAddress1, place: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                            placeholder="กรอกสถานที่ (เช่น ชื่ออาคาร, ชื่อหมู่บ้าน, ชื่อคอนโด)"
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              ที่อยู่
                            </label>
                            <textarea
                              value={workAddress1.address || ''}
                              onChange={(e) => setWorkAddress1({ ...workAddress1, address: e.target.value })}
                              className="w-full px-4 py-3 min-h-[80px] resize-none bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                              placeholder="กรอกที่อยู่"
                              rows={3}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              ตัวอย่างที่อยู่
                            </label>
                            <textarea
                              value={`${workAddress1.address || ''}${workAddress1.tambon ? `, ${workAddress1.tambon}` : ''}${workAddress1.district ? `, ${workAddress1.district}` : ''}${workAddress1.province ? `, ${workAddress1.province}` : ''}${workAddress1.postalCode ? ` ${workAddress1.postalCode}` : ''}`}
                              disabled
                              className="w-full px-4 py-3 min-h-[80px] resize-none bg-gray-50 border border-gray-300 rounded-lg text-xs text-gray-600"
                              rows={3}
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              จังหวัด *
                            </label>
                            <select
                              value={workAddress1.province || ''}
                              onChange={(e) => {
                                const province = e.target.value;
                                setWorkAddress1({
                                  ...workAddress1,
                                  province,
                                  district: '',
                                  tambon: '',
                                  postalCode: ''
                                });
                              }}
                              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                            >
                              <option value="">เลือกจังหวัด</option>
                              {getProvinces().map((province) => (
                                <option key={province} value={province}>
                                  {province}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              อำเภอ/เขต *
                            </label>
                            <select
                              value={workAddress1.district || ''}
                              onChange={(e) => {
                                const district = e.target.value;
                                const postalCode = workAddress1.province && district ? 
                                  (getPostalCode(workAddress1.province, district) || '') : '';
                                setWorkAddress1({
                                  ...workAddress1,
                                  district,
                                  tambon: '',
                                  postalCode: postalCode.toString()
                                });
                              }}
                              disabled={!workAddress1.province}
                              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                            >
                              <option value="">เลือกอำเภอ/เขต</option>
                              {workAddress1.province && getDistricts(workAddress1.province).map((district) => (
                                <option key={district} value={district}>
                                  {district}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              ตำบล/แขวง *
                            </label>
                            <select
                              value={workAddress1.tambon || ''}
                              onChange={(e) => {
                                const tambon = e.target.value;
                                const postalCode = workAddress1.province && workAddress1.district && tambon ? 
                                  (getPostalCode(workAddress1.province, workAddress1.district) || '') : '';
                                setWorkAddress1({
                                  ...workAddress1,
                                  tambon,
                                  postalCode: postalCode.toString()
                                });
                              }}
                              disabled={!workAddress1.district}
                              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                            >
                              <option value="">เลือกตำบล/แขวง</option>
                              {workAddress1.province && workAddress1.district && 
                                getTambons(workAddress1.province, workAddress1.district).map((tambon: string, tambonIndex: number) => (
                                  <option key={`${workAddress1.province}-${workAddress1.district}-${tambon}-${tambonIndex}`} value={tambon}>
                                    {tambon}
                                  </option>
                                ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              รหัสไปรษณีย์
                            </label>
                            <input
                              type="text"
                              value={workAddress1.postalCode || ''}
                              onChange={(e) => setWorkAddress1({ ...workAddress1, postalCode: e.target.value })}
                              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                              placeholder="กรอกรหัสไปรษณีย์"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Work Address 2 */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="text-md font-medium text-gray-700 mb-4">ที่อยู่ที่ทำงาน (2)</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            สถานที่
                          </label>
                          <input
                            type="text"
                            value={workAddress2.place || ''}
                            onChange={(e) => setWorkAddress2({ ...workAddress2, place: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                            placeholder="กรอกสถานที่ (เช่น ชื่ออาคาร, ชื่อหมู่บ้าน, ชื่อคอนโด)"
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              ที่อยู่
                            </label>
                            <textarea
                              value={workAddress2.address || ''}
                              onChange={(e) => setWorkAddress2({ ...workAddress2, address: e.target.value })}
                              className="w-full px-4 py-3 min-h-[80px] resize-none bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                              placeholder="กรอกที่อยู่"
                              rows={3}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              ตัวอย่างที่อยู่
                            </label>
                            <textarea
                              value={`${workAddress2.address || ''}${workAddress2.tambon ? `, ${workAddress2.tambon}` : ''}${workAddress2.district ? `, ${workAddress2.district}` : ''}${workAddress2.province ? `, ${workAddress2.province}` : ''}${workAddress2.postalCode ? ` ${workAddress2.postalCode}` : ''}`}
                              disabled
                              className="w-full px-4 py-3 min-h-[80px] resize-none bg-gray-50 border border-gray-300 rounded-lg text-xs text-gray-600"
                              rows={3}
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              จังหวัด *
                            </label>
                            <select
                              value={workAddress2.province || ''}
                              onChange={(e) => {
                                const province = e.target.value;
                                setWorkAddress2({
                                  ...workAddress2,
                                  province,
                                  district: '',
                                  tambon: '',
                                  postalCode: ''
                                });
                              }}
                              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                            >
                              <option value="">เลือกจังหวัด</option>
                              {getProvinces().map((province) => (
                                <option key={province} value={province}>
                                  {province}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              อำเภอ/เขต *
                            </label>
                            <select
                              value={workAddress2.district || ''}
                              onChange={(e) => {
                                const district = e.target.value;
                                const postalCode = workAddress2.province && district ? 
                                  (getPostalCode(workAddress2.province, district) || '') : '';
                                setWorkAddress2({
                                  ...workAddress2,
                                  district,
                                  tambon: '',
                                  postalCode: postalCode.toString()
                                });
                              }}
                              disabled={!workAddress2.province}
                              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                            >
                              <option value="">เลือกอำเภอ/เขต</option>
                              {workAddress2.province && getDistricts(workAddress2.province).map((district) => (
                                <option key={district} value={district}>
                                  {district}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              ตำบล/แขวง *
                            </label>
                            <select
                              value={workAddress2.tambon || ''}
                              onChange={(e) => {
                                const tambon = e.target.value;
                                const postalCode = workAddress2.province && workAddress2.district && tambon ? 
                                  (getPostalCode(workAddress2.province, workAddress2.district) || '') : '';
                                setWorkAddress2({
                                  ...workAddress2,
                                  tambon,
                                  postalCode: postalCode.toString()
                                });
                              }}
                              disabled={!workAddress2.district}
                              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                            >
                              <option value="">เลือกตำบล/แขวง</option>
                              {workAddress2.province && workAddress2.district && 
                                getTambons(workAddress2.province, workAddress2.district).map((tambon: string, tambonIndex: number) => (
                                  <option key={`${workAddress2.province}-${workAddress2.district}-${tambon}-${tambonIndex}`} value={tambon}>
                                    {tambon}
                                  </option>
                                ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              รหัสไปรษณีย์
                            </label>
                            <input
                              type="text"
                              value={workAddress2.postalCode || ''}
                              onChange={(e) => setWorkAddress2({ ...workAddress2, postalCode: e.target.value })}
                              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                              placeholder="กรอกรหัสไปรษณีย์"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Tab 3: Social Media */}
              {activeTab === 3 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Facebook */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Facebook className="w-4 h-4 inline mr-2 text-blue-700" />
                        Facebook
                      </label>
                      <input
                        type="url"
                        value={facebook}
                        onChange={(e) => setFacebook(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                        placeholder="https://facebook.com/username"
                      />
                    </div>
                    
                    {/* Line ID */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MessageCircle className="w-4 h-4 inline mr-2 text-green-500" />
                        Line ID
                      </label>
                      <input
                        type="text"
                        value={lineId}
                        onChange={(e) => setLineId(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                        placeholder="กรอก Line ID"
                      />
                    </div>
                    
                    {/* LinkedIn */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Linkedin className="w-4 h-4 inline mr-2 text-blue-600" />
                        LinkedIn
                      </label>
                      <input
                        type="url"
                        value={linkedin}
                        onChange={(e) => setLinkedin(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>
                    
                    {/* Twitter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Twitter className="w-4 h-4 inline mr-2 text-blue-400" />
                        Twitter
                      </label>
                      <input
                        type="url"
                        value={twitter}
                        onChange={(e) => setTwitter(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                        placeholder="https://twitter.com/username"
                      />
                    </div>
                    
                    {/* Instagram */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Instagram className="w-4 h-4 inline mr-2 text-pink-500" />
                        Instagram
                      </label>
                      <input
                        type="url"
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                        placeholder="https://instagram.com/username"
                      />
                    </div>
                    
                    {/* TikTok */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Video className="w-4 h-4 inline mr-2 text-black" />
                        TikTok
                      </label>
                      <input
                        type="url"
                        value={tiktok}
                        onChange={(e) => setTiktok(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                        placeholder="https://tiktok.com/@username"
                      />
                    </div>

                    {/* YouTube */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Youtube className="w-4 h-4 inline mr-2 text-red-600" />
                        YouTube
                      </label>
                      <input
                        type="url"
                        value={youtube}
                        onChange={(e) => setYoutube(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                        placeholder="https://youtube.com/@username"
                      />
                    </div>

                    {/* Telegram */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Send className="w-4 h-4 inline mr-2 text-blue-500" />
                        Telegram
                      </label>
                      <input
                        type="text"
                        value={telegram}
                        onChange={(e) => setTelegram(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                        placeholder="@username"
                      />
                    </div>

                    {/* WhatsApp */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Smartphone className="w-4 h-4 inline mr-2 text-green-600" />
                        WhatsApp
                      </label>
                      <input
                        type="text"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                        placeholder="+66 123 456 789"
                      />
                    </div>

                    {/* WeChat */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MessageSquare className="w-4 h-4 inline mr-2 text-green-500" />
                        WeChat
                      </label>
                      <input
                        type="text"
                        value={wechat}
                        onChange={(e) => setWechat(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                        placeholder="WeChat ID"
                      />
                    </div>

                    {/* Snapchat */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <CameraIcon className="w-4 h-4 inline mr-2 text-yellow-500" />
                        Snapchat
                      </label>
                      <input
                        type="text"
                        value={snapchat}
                        onChange={(e) => setSnapchat(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                        placeholder="username"
                      />
                    </div>

                    {/* Pinterest */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Pin className="w-4 h-4 inline mr-2 text-red-500" />
                        Pinterest
                      </label>
                      <input
                        type="url"
                        value={pinterest}
                        onChange={(e) => setPinterest(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                        placeholder="https://pinterest.com/username"
                      />
                    </div>

                    {/* Reddit */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MessageSquare className="w-4 h-4 inline mr-2 text-orange-500" />
                        Reddit
                      </label>
                      <input
                        type="text"
                        value={reddit}
                        onChange={(e) => setReddit(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                        placeholder="u/username"
                      />
                    </div>

                    {/* Discord */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Users className="w-4 h-4 inline mr-2 text-indigo-500" />
                        Discord
                      </label>
                      <input
                        type="text"
                        value={discord}
                        onChange={(e) => setDiscord(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                        placeholder="username#1234"
                      />
                    </div>

                    {/* Slack */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Hash className="w-4 h-4 inline mr-2 text-purple-500" />
                        Slack
                      </label>
                      <input
                        type="text"
                        value={slack}
                        onChange={(e) => setSlack(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                        placeholder="workspace.slack.com"
                      />
                    </div>

                    {/* Viber */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <PhoneCall className="w-4 h-4 inline mr-2 text-purple-600" />
                        Viber
                      </label>
                      <input
                        type="text"
                        value={viber}
                        onChange={(e) => setViber(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                        placeholder="+66 123 456 789"
                      />
                    </div>

                    {/* Skype */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mic className="w-4 h-4 inline mr-2 text-blue-600" />
                        Skype
                      </label>
                      <input
                        type="text"
                        value={skype}
                        onChange={(e) => setSkype(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                        placeholder="username"
                      />
                    </div>

                    {/* Zoom */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Video className="w-4 h-4 inline mr-2 text-blue-500" />
                        Zoom
                      </label>
                      <input
                        type="text"
                        value={zoom}
                        onChange={(e) => setZoom(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                        placeholder="zoom.us/j/123456789"
                      />
                    </div>

                    {/* GitHub */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Code className="w-4 h-4 inline mr-2 text-gray-800" />
                        GitHub
                      </label>
                      <input
                        type="url"
                        value={github}
                        onChange={(e) => setGithub(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                        placeholder="https://github.com/username"
                      />
                    </div>

                    {/* Twitch */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Gamepad2 className="w-4 h-4 inline mr-2 text-purple-600" />
                        Twitch
                      </label>
                      <input
                        type="url"
                        value={twitch}
                        onChange={(e) => setTwitch(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                        placeholder="https://twitch.tv/username"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Tab 4: Addresses - REMOVED */}
              {false && (
                <div className="space-y-6">
                  {/* Address Sub-tabs */}
                  <div className="border-b border-gray-200">
                    <nav className="flex space-x-8" aria-label="Address Tabs">
                      <button
                        onClick={() => setActiveAddressTab(1)}
                        className={`${
                          activeAddressTab === 1
                            ? 'border-primary-500 text-primary-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
                      >
                        เพิ่มที่อยู่ใหม่
                      </button>
                      <button
                        onClick={() => setActiveAddressTab(2)}
                        className={`${
                          activeAddressTab === 2
                            ? 'border-primary-500 text-primary-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
                      >
                        ที่อยู่ที่มีอยู่
                      </button>
                    </nav>
                  </div>

                  {/* Sub-tab 1: Add New Address */}
                  {activeAddressTab === 1 && (
                    <div className="space-y-6">
                      {/* Add/Edit Address Form */}
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium text-gray-900">
                          {editingAddressIndex >= 0 ? 'แก้ไขที่อยู่' : 'เพิ่มที่อยู่ใหม่'}
                        </h3>
                          <div className="text-sm">
                            <span className={`font-medium ${addresses.length >= 3 ? 'text-red-600' : 'text-green-600'}`}>
                              จำนวน {addresses.length}/3 ที่อยู่
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              ประเภทที่อยู่
                            </label>
                            <select
                              value={newAddress.type}
                              onChange={(e) => setNewAddress({ ...newAddress, type: e.target.value })}
                              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                            >
                              <option value="home">บ้าน</option>
                              <option value="work">ที่ทำงาน</option>
                              <option value="other">อื่นๆ</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              สถานที่
                            </label>
                            <input
                              type="text"
                              value={newAddress.place}
                              onChange={(e) => setNewAddress({ ...newAddress, place: e.target.value })}
                              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                              placeholder="กรอกสถานที่ (เช่น ชื่ออาคาร, ชื่อหมู่บ้าน, ชื่อคอนโด)"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              ที่อยู่
                            </label>
                            <textarea
                              value={newAddress.address}
                              onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                              className="w-full px-4 py-3 min-h-[80px] resize-none bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                              placeholder="กรอกที่อยู่"
                              rows={3}
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                จังหวัด *
                              </label>
                              <select
                                value={newAddress.province}
                                onChange={(e) => {
                                  const province = e.target.value;
                                  setNewAddress({
                                    ...newAddress,
                                    province,
                                    district: '',
                                    tambon: '',
                                    postalCode: ''
                                  });
                                }}
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                              >
                                <option value="">เลือกจังหวัด</option>
                                {getProvinces().map((province) => (
                                  <option key={province} value={province}>
                                    {province}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                อำเภอ/เขต *
                              </label>
                              <select
                                value={newAddress.district}
                                onChange={(e) => {
                                  const district = e.target.value;
                                  const postalCode = newAddress.province && district ? 
                                    (getPostalCode(newAddress.province, district) || '') : '';
                                  setNewAddress({
                                    ...newAddress,
                                    district,
                                    tambon: '',
                                    postalCode: postalCode.toString()
                                  });
                                }}
                                disabled={!newAddress.province}
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                              >
                                <option value="">เลือกอำเภอ/เขต</option>
                                {newAddress.province && getDistricts(newAddress.province).map((district) => (
                                  <option key={district} value={district}>
                                    {district}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                ตำบล/แขวง *
                              </label>
                              <select
                                value={newAddress.tambon}
                                onChange={(e) => setNewAddress({ ...newAddress, tambon: e.target.value })}
                                disabled={!newAddress.district}
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                              >
                                <option value="">เลือกตำบล/แขวง</option>
                                {newAddress.province && newAddress.district && 
                                  getTambons(newAddress.province, newAddress.district).map((tambon: string, tambonIndex: number) => (
                                    <option key={`${newAddress.province}-${newAddress.district}-${tambon}-${tambonIndex}`} value={tambon}>
                                      {tambon}
                                    </option>
                                  ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                ประเทศ
                              </label>
                              <input
                                type="text"
                                value={newAddress.country}
                                onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                                placeholder="กรอกประเทศ"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                รหัสไปรษณีย์
                              </label>
                              <input
                                type="text"
                                value={newAddress.postalCode}
                                disabled
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                                placeholder="รหัสไปรษณีย์จะแสดงอัตโนมัติเมื่อเลือกอำเภอ/เขต"
                              />
                            </div>

                            <div className="flex items-end">
                              <div className="flex space-x-3 w-full">
                                <button
                                  onClick={editingAddressIndex >= 0 ? saveAddress : addAddress}
                                  disabled={editingAddressIndex < 0 && addresses.length >= 3}
                                  className={`${
                                    editingAddressIndex < 0 && addresses.length >= 3
                                      ? 'bg-gray-400 cursor-not-allowed'
                                      : 'bg-green-600 hover:bg-green-700'
                                  } text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center w-1/3 disabled:opacity-50`}
                                  title={editingAddressIndex < 0 && addresses.length >= 3 ? 'คุณสามารถเพิ่มได้สูงสุด 3 ที่อยู่' : ''}
                                >
                                  <Plus className="w-4 h-4" />
                                  <span className="hidden sm:inline ml-2">
                                  {editingAddressIndex >= 0 ? 'บันทึกการแก้ไข' : 'เพิ่มที่อยู่'}
                                  </span>
                                </button>
                                
                                {editingAddressIndex >= 0 && (
                                  <button
                                    onClick={cancelEdit}
                                    className="btn-secondary"
                                  >
                                    ยกเลิก
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sub-tab 2: Existing Addresses */}
                  {activeAddressTab === 2 && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-medium text-gray-900">ที่อยู่ที่มีอยู่</h3>
                      <div className="space-y-4">
                        {addresses.map((address: any, index: number) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                            {/* Badge for unsaved changes */}
                            {changedAddressIndices.has(index) && (
                              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-medium px-3 py-1 rounded-full shadow-lg animate-pulse border-2 border-white">
                                <span className="flex items-center">
                                  <span className="w-2 h-2 bg-white rounded-full mr-1 animate-ping"></span>
                                  ไม่ได้บันทึก
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center mb-2">
                                  <span className="inline-block bg-primary-100 text-primary-800 text-xs font-medium px-2 py-1 rounded">
                                    {address.type === 'home' ? 'บ้าน' : address.type === 'work' ? 'ที่ทำงาน' : 'อื่นๆ'}
                                  </span>
                                </div>
                                {address.place && (
                                  <p className="text-gray-700 font-medium text-sm">{address.place}</p>
                                )}
                                <p className="text-gray-900 text-sm">{address.address}</p>
                                <p className="text-gray-600 text-sm">
                                  {address.tambon && `${address.tambon}, `}
                                  {address.district}, {address.province} {address.postalCode}
                                </p>
                                <p className="text-gray-600 text-sm">{address.country}</p>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    setActiveAddressTab(1);
                                    editAddress(index);
                                  }}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteAddress(index)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {addresses.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>ยังไม่มีที่อยู่</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Success Message and Save Button */}
              {successMessage && (
                <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg mt-6">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  <span className="text-green-700">{successMessage}</span>
                </div>
              )}
              
              <div className="flex justify-between mt-6">
                <button
                  onClick={fetchUserDataFromSupabase}
                  disabled={isRefreshing}
                  className="btn-secondary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  title="ดึงข้อมูลใหม่จาก Supabase"
                >
                  <svg className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="hidden sm:inline ml-2">{isRefreshing ? 'กำลังดึงข้อมูล...' : 'รีเฟรชข้อมูล'}</span>
                </button>
                
                <button 
                  onClick={handleSaveProfile}
                  disabled={isSaving || (activeTab === 1 && !hasUnsavedPersonalInfo) || (activeTab === 2 && !hasUnsavedWorkInfo) || (activeTab === 3 && !hasUnsavedSocialMedia) || (activeTab === 4 && !hasUnsavedAddresses)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <Save className="w-5 h-5" />
                  <span className="hidden sm:inline ml-2">{isSaving ? 'กำลังบันทึก...' : `บันทึก${activeTab === 1 ? 'ข้อมูลส่วนตัว' : activeTab === 2 ? 'ข้อมูลที่ทำงาน' : activeTab === 3 ? 'โซเชียลมีเดีย' : 'ที่อยู่'}`}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <Shield className="w-6 h-6 text-primary-500 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">ความปลอดภัย</h2>
            </div>
            
            <div className="space-y-4">
              <div
                className={`w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg ${
                  usesEmailPassword
                    ? 'hover:bg-gray-50 transition-colors cursor-pointer'
                    : 'bg-gray-50'
                }`}
                onClick={() => {
                  if (usesEmailPassword) {
                    setShowPasswordForm(!showPasswordForm);
                  }
                }}
              >
                <div className="flex items-center">
                  <Lock className="w-5 h-5 text-gray-400 mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">เปลี่ยนรหัสผ่าน</p>
                    <p className="text-sm text-gray-500">
                      {usesEmailPassword
                        ? 'อัปเดตรหัสผ่านของคุณ'
                        : `บัญชีนี้เข้าสู่ระบบด้วย${
                            providerDisplayText ? ` ${providerDisplayText}` : ' ผู้ให้บริการภายนอก'
                          } จึงไม่มีรหัสผ่านสำหรับใช้งาน`}
                    </p>
                  </div>
                </div>
                {usesEmailPassword && (
                  <ArrowLeft
                    className={`w-5 h-5 text-gray-400 rotate-180 transition-transform ${
                      showPasswordForm ? 'rotate-90' : ''
                    }`}
                  />
                )}
              </div>
              
              {usesEmailPassword ? (
                showPasswordForm && (
                <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      รหัสผ่านปัจจุบัน
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-3 pr-10 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="กรอกรหัสผ่านปัจจุบัน"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      รหัสผ่านใหม่
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 pr-10 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="กรอกรหัสผ่านใหม่"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ยืนยันรหัสผ่านใหม่
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 pr-10 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="ยืนยันรหัสผ่านใหม่"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handleChangePassword}
                      disabled={isLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'กำลังเปลี่ยนรหัสผ่าน...' : 'เปลี่ยนรหัสผ่าน'}
                    </button>
                    <button
                      onClick={() => {
                        setShowPasswordForm(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      className="px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              )) : (
                <div className="p-4 bg-white border border-gray-200 rounded-lg space-y-4">
                  <p className="text-sm text-gray-600">
                    บัญชีของคุณเข้าสู่ระบบด้วย
                    {providerDisplayText ? ` ${providerDisplayText}` : ' ผู้ให้บริการภายนอก'}
                    {user?.email
                      ? ` จึงไม่มีรหัสผ่านสำหรับใช้งาน หากต้องการตั้งรหัสผ่านสำหรับการเข้าสู่ระบบด้วยอีเมล กรุณากดปุ่มด้านล่าง ระบบจะส่งลิงก์ไปยัง ${user.email}`
                      : ' จึงไม่มีรหัสผ่านสำหรับใช้งาน'}
                  </p>
                  {passwordLinkMessage && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                      {passwordLinkMessage}
                    </div>
                  )}
                  {passwordLinkError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                      {passwordLinkError}
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <button
                      onClick={handleSendPasswordSetupLink}
                      disabled={isSendingPasswordLink}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSendingPasswordLink ? 'กำลังส่งลิงก์...' : 'ส่งลิงก์ตั้งรหัสผ่าน'}
                    </button>
                  </div>
                </div>
              )}
              
              <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <Bell className="w-5 h-5 text-gray-400 mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">การแจ้งเตือน</p>
                    <p className="text-sm text-gray-500">จัดการการแจ้งเตือน</p>
                  </div>
                </div>
                <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
              </button>
            </div>
          </div>

          {/* Account Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <Mail className="w-6 h-6 text-primary-500 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">การจัดการบัญชี</h2>
            </div>
            
            <div className="space-y-4">
              <button 
                onClick={handleSignOut}
                disabled={isLoading}
                className="w-full flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <LogOut className="w-5 h-5 text-gray-400 mr-3" />
                <span className="font-medium text-gray-900">
                  {isLoading ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ'}
                </span>
              </button>
              
              <button 
                onClick={handleDeleteAccount}
                className="w-full flex items-center justify-center p-4 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-red-600"
              >
                <Trash2 className="w-5 h-5 mr-3" />
                <span className="font-medium">ลบบัญชี</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}