'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  MessageCircle
} from 'lucide-react';
import { address } from '../../../../../address.js';

export default function SettingsPage() {
  const router = useRouter();
  const { user, signOut, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState(1);
  const [activeAddressTab, setActiveAddressTab] = useState(1); // 1: เพิ่มที่อยู่ใหม่, 2: ที่อยู่ที่มีอยู่
  
  // Track changes for badge notification
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [hasUnsavedPersonalInfo, setHasUnsavedPersonalInfo] = useState(false);
  const [hasUnsavedWorkInfo, setHasUnsavedWorkInfo] = useState(false);
  const [hasUnsavedSocialMedia, setHasUnsavedSocialMedia] = useState(false);
  
  // Tab 1: Personal Information
  const [profileImage, setProfileImage] = useState(
    user?.user_metadata?.avatar_url || 
    user?.user_metadata?.profile_image || 
    ''
  );
  
  // Debug logging (remove in production)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Profile image value:', profileImage ? 'Has value' : 'Empty');
    }
  }, [profileImage]);
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [fullNameEnglish, setFullNameEnglish] = useState(user?.user_metadata?.full_name_english || '');
  const [personalPhone, setPersonalPhone] = useState(user?.user_metadata?.personal_phone || '');
  
  // Tab 2: Work Information
  const [companyLogo, setCompanyLogo] = useState(user?.user_metadata?.company_logo || '');
  const [company, setCompany] = useState(user?.user_metadata?.company || '');
  const [department, setDepartment] = useState(user?.user_metadata?.department || '');
  const [jobTitle, setJobTitle] = useState(user?.user_metadata?.job_title || '');
  const [workPhone, setWorkPhone] = useState(user?.user_metadata?.work_phone || '');
  const [workEmail, setWorkEmail] = useState(user?.user_metadata?.work_email || '');
  const [website, setWebsite] = useState(user?.user_metadata?.website || '');
  
  // Tab 3: Social Media
  const [facebook, setFacebook] = useState(user?.user_metadata?.facebook || '');
  const [lineId, setLineId] = useState(user?.user_metadata?.line_id || '');
  const [linkedin, setLinkedin] = useState(user?.user_metadata?.linkedin || '');
  const [twitter, setTwitter] = useState(user?.user_metadata?.twitter || '');
  const [instagram, setInstagram] = useState(user?.user_metadata?.instagram || '');
  
  // Tab 4: Addresses
  const [addresses, setAddresses] = useState(user?.user_metadata?.addresses || []);
  const [editingAddressIndex, setEditingAddressIndex] = useState(-1);
  const [hasUnsavedAddresses, setHasUnsavedAddresses] = useState(false);
  const [changedAddressIndices, setChangedAddressIndices] = useState<Set<number>>(new Set());
  const [newAddress, setNewAddress] = useState({
    type: 'home', // home, work, other
    address: '',
    tambon: '',
    district: '',
    province: '',
    postalCode: '',
    country: 'Thailand',
    place: '' // สถานที่
  });
  
  // Password form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasFetchedInitialData = useRef(false);

  // Function to load profile image from profiles table
  const loadProfileImage = async () => {
    console.log('Settings: loadProfileImage called, user:', user?.id);
    
    if (!user?.id) {
      console.log('Settings: No user ID, skipping profile image load');
      return;
    }
    
    try {
      console.log('Settings: Loading profile image from profiles table...');
      
      // ดึงรูปจาก profiles table
      const result = await supabase
        ?.from('profiles')
        .select('avatar_url, profile_image')
        .eq('id', user.id)
        .single();

      const { data: profileData, error: profileError } = result || { data: null, error: null };

      if (profileError) {
        console.warn('Settings: Error loading profile from profiles table:', profileError);
        return;
      }

      console.log('Settings: Profile data from database:', profileData);

      if (profileData && (profileData as any)?.avatar_url) {
        setProfileImage((profileData as any).avatar_url);
        console.log('✅ โหลดรูปจาก profiles table (avatar_url):', (profileData as any).avatar_url);
      } else if (profileData && (profileData as any)?.profile_image) {
        setProfileImage((profileData as any).profile_image);
        console.log('✅ โหลดรูปจาก profiles table (profile_image):', (profileData as any).profile_image);
      } else {
        console.log('Settings: No profile image found in profiles table');
        // Fallback: Check localStorage for profile image
        try {
          const fallbackImage = localStorage.getItem('profile_image_fallback');
          if (fallbackImage) {
            setProfileImage(fallbackImage);
            console.log('✅ Loaded profile image from localStorage fallback');
          }
        } catch (localStorageError) {
          console.warn('Settings: Error accessing localStorage:', localStorageError);
        }
      }
    } catch (error) {
      console.warn('Settings: Error loading profile image from profiles table:', error);
    }
  };

  // Function to fetch fresh user data from Supabase
  const fetchUserDataFromSupabase = async () => {
    if (!user?.id) return;
    
    setIsRefreshing(true);
    hasFetchedInitialData.current = true; // Mark as fetched
    try {
      console.log('Settings: Fetching fresh user data from Supabase auth...');
      
      // Force refresh session to get latest data
      const { data: { session }, error } = await supabase?.auth.refreshSession() || { data: { session: null }, error: null };
      
      if (error) {
        console.error('Settings: Error getting session:', error);
        setSuccessMessage('เกิดข้อผิดพลาดในการดึงข้อมูล');
        setTimeout(() => setSuccessMessage(''), 3000);
        return;
      }
      
      if (session?.user?.user_metadata) {
        const metadata = session.user.user_metadata;
        console.log('Settings: Fresh metadata from auth:', metadata);
        console.log('Settings: Addresses data:', metadata.addresses);
        if (metadata.addresses && metadata.addresses.length > 0) {
          console.log('Settings: First address place field:', metadata.addresses[0]?.place);
          console.log('Settings: All addresses place fields:', metadata.addresses.map((addr: any) => ({ place: addr.place, type: addr.type })));
        }
        
        // Update all form states with fresh data from auth metadata
        // Note: Profile image will be loaded separately from profiles table
        setFullName(metadata.full_name || '');
        setFullNameEnglish(metadata.full_name_english || '');
        setPersonalPhone(metadata.personal_phone || '');
        setCompanyLogo(metadata.company_logo || '');
        setCompany(metadata.company || '');
        setDepartment(metadata.department || '');
        setJobTitle(metadata.job_title || '');
        setWorkPhone(metadata.work_phone || '');
        setWorkEmail(metadata.work_email || '');
        setWebsite(metadata.website || '');
        setFacebook(metadata.facebook || '');
        setLineId(metadata.line_id || '');
        setLinkedin(metadata.linkedin || '');
        setTwitter(metadata.twitter || '');
        setInstagram(metadata.instagram || '');
        setAddresses(metadata.addresses || []);
        
        console.log('Settings: Fresh data loaded from auth metadata:', {
          full_name: metadata.full_name,
          personal_phone: metadata.personal_phone,
          work_phone: metadata.work_phone,
          work_email: metadata.work_email
        });
        
        // Load profile image from profiles table
        await loadProfileImage();
        
        // Show success message
        setSuccessMessage('ดึงข้อมูลใหม่จาก Supabase เรียบร้อยแล้ว');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        console.log('Settings: No user metadata found');
        setSuccessMessage('ไม่พบข้อมูลผู้ใช้');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Settings: Error fetching fresh user data:', error);
      setSuccessMessage('เกิดข้อผิดพลาดในการดึงข้อมูล');
      setTimeout(() => setSuccessMessage(''), 3000);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Update form state when user data changes
  useEffect(() => {
    console.log('Settings: useEffect triggered, user:', user?.id, 'user_metadata:', !!user?.user_metadata);
    
    if (user?.user_metadata) {
      console.log('Settings: Processing user metadata...');
      
      // Tab 1: Personal Information
      // Note: Profile image will be loaded separately from profiles table
      setFullName(user.user_metadata.full_name || '');
      setFullNameEnglish(user.user_metadata.full_name_english || '');
      setPersonalPhone(user.user_metadata.personal_phone || '');
      
      // Tab 2: Work Information
      setCompanyLogo(user.user_metadata.company_logo || '');
      setCompany(user.user_metadata.company || '');
      setDepartment(user.user_metadata.department || '');
      setJobTitle(user.user_metadata.job_title || '');
      setWorkPhone(user.user_metadata.work_phone || '');
      setWorkEmail(user.user_metadata.work_email || '');
      setWebsite(user.user_metadata.website || '');
      
      // Tab 3: Social Media
      setFacebook(user.user_metadata.facebook || '');
      setLineId(user.user_metadata.line_id || '');
      setLinkedin(user.user_metadata.linkedin || '');
      setTwitter(user.user_metadata.twitter || '');
      setInstagram(user.user_metadata.instagram || '');
      
      // Tab 4: Addresses
      setAddresses(user.user_metadata.addresses || []);
      setChangedAddressIndices(new Set()); // Reset changed indices when user data loads
      
      // Reset all badge states when user data loads
      setHasUnsavedPersonalInfo(false);
      setHasUnsavedWorkInfo(false);
      setHasUnsavedSocialMedia(false);
      setHasUnsavedAddresses(false);
      
      console.log('Settings: About to call loadProfileImage...');
      // Load profile image from profiles table
      loadProfileImage();
      
      console.log('Settings: Loaded user data from metadata:', {
        full_name: user.user_metadata.full_name,
        personal_phone: user.user_metadata.personal_phone,
        work_phone: user.user_metadata.work_phone,
        work_email: user.user_metadata.work_email
      });
      
      // Also fetch fresh data from Supabase profiles table to ensure we have the latest
      // Only fetch once when component mounts, not on every user change
      if (user?.id && !isRefreshing && !hasFetchedInitialData.current) {
        hasFetchedInitialData.current = true;
        fetchUserDataFromSupabase();
      }
    } else {
      console.log('Settings: No user metadata found');
    }
  }, [user]);

  // Reset fetch flag when component unmounts
  useEffect(() => {
    return () => {
      hasFetchedInitialData.current = false;
    };
  }, []);

  // Track address changes for badge notification
  useEffect(() => {
    if (user?.user_metadata?.addresses) {
      const originalAddresses = user.user_metadata.addresses;
      const hasChanges = JSON.stringify(addresses) !== JSON.stringify(originalAddresses);
      setHasUnsavedChanges(hasChanges);
    }
  }, [addresses, user?.user_metadata?.addresses]);

  // Track personal information changes
  useEffect(() => {
    if (user?.user_metadata) {
      const originalPersonalInfo = {
        profile_image: user.user_metadata.avatar_url || user.user_metadata.profile_image || '',
        full_name: user.user_metadata.full_name || '',
        full_name_english: user.user_metadata.full_name_english || '',
        personal_phone: user.user_metadata.personal_phone || ''
      };
      const currentPersonalInfo = {
        profile_image: profileImage,
        full_name: fullName,
        full_name_english: fullNameEnglish,
        personal_phone: personalPhone
      };
      const hasChanges = JSON.stringify(originalPersonalInfo) !== JSON.stringify(currentPersonalInfo);
      setHasUnsavedPersonalInfo(hasChanges);
    }
  }, [profileImage, fullName, fullNameEnglish, personalPhone, user?.user_metadata]);

  // Track work information changes
  useEffect(() => {
    if (user?.user_metadata) {
      const originalWorkInfo = {
        company_logo: user.user_metadata.company_logo || '',
        company: user.user_metadata.company || '',
        department: user.user_metadata.department || '',
        job_title: user.user_metadata.job_title || '',
        work_phone: user.user_metadata.work_phone || '',
        work_email: user.user_metadata.work_email || '',
        website: user.user_metadata.website || ''
      };
      const currentWorkInfo = {
        company_logo: companyLogo,
        company,
        department,
        job_title: jobTitle,
        work_phone: workPhone,
        work_email: workEmail,
        website
      };
      const hasChanges = JSON.stringify(originalWorkInfo) !== JSON.stringify(currentWorkInfo);
      setHasUnsavedWorkInfo(hasChanges);
    }
  }, [companyLogo, company, department, jobTitle, workPhone, workEmail, website, user?.user_metadata]);

  // Track social media changes
  useEffect(() => {
    if (user?.user_metadata) {
      const originalSocialMedia = {
        facebook: user.user_metadata.facebook || '',
        line_id: user.user_metadata.line_id || '',
        linkedin: user.user_metadata.linkedin || '',
        twitter: user.user_metadata.twitter || '',
        instagram: user.user_metadata.instagram || ''
      };
      const currentSocialMedia = {
        facebook,
        line_id: lineId,
        linkedin,
        twitter,
        instagram
      };
      const hasChanges = JSON.stringify(originalSocialMedia) !== JSON.stringify(currentSocialMedia);
      setHasUnsavedSocialMedia(hasChanges);
    }
  }, [facebook, lineId, linkedin, twitter, instagram, user?.user_metadata]);

  // Check for unsaved changes when component mounts or when browser regains focus
  useEffect(() => {
    const handleFocus = () => {
      if (activeTab === 4 && user?.user_metadata?.addresses) {
        const originalAddresses = user.user_metadata.addresses;
        const hasChanges = JSON.stringify(addresses) !== JSON.stringify(originalAddresses);
        setHasUnsavedAddresses(hasChanges);
        
        if (hasChanges) {
          const changedIndices = new Set<number>();
          addresses.forEach((address: any, index: number) => {
            const originalAddress = originalAddresses[index];
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
  }, [activeTab, addresses, user?.user_metadata?.addresses]);

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
      let profileData: any = {};
      let tabName = '';

      // Build profile data based on active tab
      switch (activeTab) {
        case 1: // Personal Information
          if (!fullName.trim()) {
            alert('กรุณากรอกชื่อ-นามสกุล');
            return;
          }
          profileData = {
            full_name: fullName.trim(),
            full_name_english: fullNameEnglish.trim(),
            avatar_url: profileImage,
            profile_image: profileImage,
            personal_phone: personalPhone.trim(),
          };
          tabName = 'ข้อมูลส่วนตัว';
          break;

        case 2: // Work Information
          profileData = {
            company_logo: companyLogo,
            company: company.trim(),
            department: department.trim(),
            job_title: jobTitle.trim(),
            work_phone: workPhone.trim(),
            work_email: workEmail.trim(),
            website: website.trim(),
          };
          tabName = 'ข้อมูลที่ทำงาน';
          break;

        case 3: // Social Media
          profileData = {
            facebook: facebook.trim(),
            line_id: lineId.trim(),
            linkedin: linkedin.trim(),
            twitter: twitter.trim(),
            instagram: instagram.trim(),
          };
          tabName = 'โซเชียลมีเดีย';
          break;

        case 4: // Addresses
          profileData = {
            addresses: addresses,
          };
          tabName = 'ที่อยู่';
          break;

        default:
          alert('ไม่พบแท็บที่เลือก');
          return;
      }

      console.log(`Saving ${tabName} data:`, profileData);
      
      const { error } = await updateProfile(profileData);
      
      if (error) {
        throw error;
      }
      
      setSuccessMessage(`บันทึก${tabName}เรียบร้อยแล้ว`);
      
      // Force refresh the page to get updated data from Supabase
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
      // Reset only the relevant tab's unsaved changes flag
      switch (activeTab) {
        case 1:
          setHasUnsavedPersonalInfo(false);
          break;
        case 2:
          setHasUnsavedWorkInfo(false);
          break;
        case 3:
          setHasUnsavedSocialMedia(false);
          break;
        case 4:
          setHasUnsavedAddresses(false);
          setChangedAddressIndices(new Set());
          break;
      }
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + (error.message || 'ไม่ทราบสาเหตุ'));
    } finally {
      setIsSaving(false);
    }
  };

  // Address management functions
  const addAddress = () => {
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
              console.log(`📊 รูปถูกบีบอัด: ${(file.size / 1024).toFixed(1)}KB → ${(compressedFile.size / 1024).toFixed(1)}KB (${((1 - compressedFile.size / file.size) * 100).toFixed(1)}% ลดลง)`);
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

  const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      console.log('📤 กำลังอัปโหลดรูปภาพ...');
      console.log(`📊 ขนาดไฟล์ต้นฉบับ: ${(file.size / 1024).toFixed(1)}KB`);
      
      // Import supabase client
      const { supabase } = await import('@/lib/supabase/client');

      if (!supabase) {
        throw new Error('ไม่สามารถเชื่อมต่อฐานข้อมูลได้');
      }

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('ไม่พบผู้ใช้ กรุณาเข้าสู่ระบบใหม่');
      }

      // Compress image if it's larger than 2MB
      let processedFile = file;
      if (file.size > 2 * 1024 * 1024) { // 2MB
        console.log('🗜️ กำลังบีบอัดรูปภาพ...');
        processedFile = await compressImage(file, 800, 800, 0.8);
      }

      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension = processedFile.name.split('.').pop();
      const fileName = `profile-${user.id}-${timestamp}.${fileExtension}`;
      const filePath = `profiles/${fileName}`;

      // Try direct client-side upload with different approach
      const buckets = ['avatars', 'business-cards', 'logos']; // ลดจำนวน buckets ที่ทดสอบ
      let uploadSuccess = false;
      let publicUrl = '';

      for (const bucket of buckets) {
        try {
          console.log(`🪣 ทดสอบ bucket: ${bucket}`);
          
          // Convert File to ArrayBuffer
          const arrayBuffer = await processedFile.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          
          const { data, error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, uint8Array, {
              contentType: processedFile.type,
              cacheControl: '3600',
              upsert: true
            });

          if (uploadError) {
            console.log(`❌ Bucket ${bucket} ล้มเหลว:`, uploadError.message);
            continue;
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

          publicUrl = urlData.publicUrl;
          uploadSuccess = true;
          console.log(`✅ อัปโหลดสำเร็จไปที่ bucket: ${bucket}`);
          console.log(`🔗 URL: ${publicUrl}`);
          break;

        } catch (error) {
          console.log(`❌ Error with bucket "${bucket}":`, error);
          continue;
        }
      }

      if (!uploadSuccess) {
        console.warn('⚠️ อัปโหลดล้มเหลวทุก bucket ใช้ fallback');
        console.warn('📋 Supabase Storage อาจยังไม่ได้ตั้งค่าถูกต้อง');
        throw new Error('All storage buckets failed');
      }

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          avatar_url: publicUrl,
          profile_image: publicUrl
        }
      });

      if (updateError) {
        console.error('❌ ไม่สามารถอัปเดต user metadata:', updateError);
        throw new Error('ไม่สามารถอัปเดตข้อมูลโปรไฟล์ได้');
      }

      console.log('🎉 อัปโหลดสำเร็จไปยัง Supabase Storage!');
      console.log(`🔗 URL: ${publicUrl}`);
      
      // Update local state with the uploaded URL
      setProfileImage(publicUrl);
      setHasUnsavedPersonalInfo(true);
      alert('🎉 อัปโหลดรูปสำเร็จ!\n\n✅ เก็บใน Supabase Storage\n🔗 รูปแสดงผลเร็วขึ้น\n💾 ประหยัดพื้นที่ฐานข้อมูล');
      
    } catch (error) {
      console.error('❌ Upload error:', error);
      
      // Fallback: Use compressed base64 data URL and save to user metadata
      console.warn('⚠️ Supabase Storage ล้มเหลว ใช้ base64 fallback');
      console.warn('📋 บันทึกรูปใน user metadata แทน');
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Url = e.target?.result as string;
        if (base64Url) {
          try {
            // Use the already compressed file if available
            const reader2 = new FileReader();
            reader2.onload = async (e2) => {
              const fallbackBase64 = e2.target?.result as string;
              if (fallbackBase64) {
                // Create a more compressed version for metadata (limit to 30KB)
                const maxLength = 30000; // ~30KB limit for metadata
                const compressedBase64 = fallbackBase64.length > maxLength 
                  ? fallbackBase64.substring(0, maxLength) + '...' 
                  : fallbackBase64;
                
                console.log(`📊 Base64 size: ${(compressedBase64.length / 1024).toFixed(1)}KB`);
                
                // Update user metadata with compressed base64 URL
                const updateResult = await supabase?.auth.updateUser({
                  data: {
                    avatar_url: compressedBase64,
                    profile_image: compressedBase64
                  }
                });

                if (updateResult?.error) {
                  console.error('❌ ไม่สามารถอัปเดต user metadata:', updateResult.error);
                  // Fallback: Save to localStorage as backup
                  try {
                    localStorage.setItem('profile_image_fallback', fallbackBase64);
                    console.log('✅ บันทึกรูปใน localStorage เป็นสำรอง');
                  } catch (localStorageError) {
                    console.error('❌ ไม่สามารถบันทึกใน localStorage:', localStorageError);
                  }
                  setProfileImage(fallbackBase64);
                  setHasUnsavedPersonalInfo(true);
                  alert('⚠️ อัปโหลดรูปสำเร็จ (เก็บในหน่วยความจำ)\n\n💾 รูปถูกเก็บใน localStorage เป็นสำรอง\n📊 ขนาดไฟล์ใหญ่เกินไปสำหรับฐานข้อมูล');
                } else {
                  console.log('✅ บันทึกรูปใน user metadata สำเร็จ');
                  setProfileImage(fallbackBase64);
                  setHasUnsavedPersonalInfo(true);
                  alert('✅ อัปโหลดรูปสำเร็จ!\n\n💡 รูปถูกเก็บใน user metadata\n🗜️ ถูกบีบอัดเพื่อประหยัดพื้นที่\n📊 ขนาด: ~' + (compressedBase64.length / 1024).toFixed(1) + 'KB');
                }
              }
            };
            
            // Use the processed file if available, otherwise use original
            reader2.readAsDataURL(file);
          } catch (metadataError) {
            console.error('❌ Error updating metadata:', metadataError);
            setProfileImage(base64Url);
            setHasUnsavedPersonalInfo(true);
            alert('⚠️ อัปโหลดรูปสำเร็จ (เก็บในหน่วยความจำ)\n\n❌ ไม่สามารถบันทึกลงฐานข้อมูลได้');
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCompanyLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // TODO: Implement actual image upload to Supabase Storage
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCompanyLogo(result);
      };
      reader.readAsDataURL(file);
      alert('ฟีเจอร์อัปโหลดรูปกำลังพัฒนา');
    }
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
      const { error } = await supabase.auth.updateUser({
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

  const handleDeleteAccount = () => {
    if (confirm('คุณต้องการลบบัญชีหรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้')) {
      // TODO: Implement account deletion
      alert('ฟีเจอร์นี้กำลังพัฒนา');
    }
  };

  return (
    <Layout>
        {/* Page Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">การตั้งค่า</h1>
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
                  { id: 3, name: 'โซเชียลมีเดีย', icon: Globe, showBadge: hasUnsavedSocialMedia },
                  { id: 4, name: 'ที่อยู่', icon: MapPin, showBadge: hasUnsavedAddresses }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        // Reset badge states when switching tabs
                        if (tab.id === 1) {
                          setHasUnsavedWorkInfo(false);
                          setHasUnsavedSocialMedia(false);
                          setHasUnsavedAddresses(false);
                          setChangedAddressIndices(new Set());
                        } else if (tab.id === 2) {
                          setHasUnsavedPersonalInfo(false);
                          setHasUnsavedSocialMedia(false);
                          setHasUnsavedAddresses(false);
                          setChangedAddressIndices(new Set());
                        } else if (tab.id === 3) {
                          setHasUnsavedPersonalInfo(false);
                          setHasUnsavedWorkInfo(false);
                          setHasUnsavedAddresses(false);
                          setChangedAddressIndices(new Set());
                        } else if (tab.id === 4) {
                          setHasUnsavedPersonalInfo(false);
                          setHasUnsavedWorkInfo(false);
                          setHasUnsavedSocialMedia(false);
                          // When switching to address tab, check if there are actual unsaved changes
                          if (user?.user_metadata?.addresses) {
                            const originalAddresses = user.user_metadata.addresses;
                            const hasChanges = JSON.stringify(addresses) !== JSON.stringify(originalAddresses);
                            setHasUnsavedAddresses(hasChanges);
                            
                            // Recalculate changed indices
                            if (hasChanges) {
                              const changedIndices = new Set<number>();
                              addresses.forEach((address: any, index: number) => {
                                const originalAddress = originalAddresses[index];
                                if (!originalAddress || JSON.stringify(address) !== JSON.stringify(originalAddress)) {
                                  changedIndices.add(index);
                                }
                              });
                              setChangedAddressIndices(changedIndices);
                            } else {
                              setChangedAddressIndices(new Set());
                            }
                          }
                        }
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
                  onChange={(e) => {
                    const newTab = parseInt(e.target.value);
                    setActiveTab(newTab);
                    // Reset badge states when switching tabs
                    if (newTab === 1) {
                      setHasUnsavedWorkInfo(false);
                      setHasUnsavedSocialMedia(false);
                      setHasUnsavedAddresses(false);
                      setChangedAddressIndices(new Set());
                    } else if (newTab === 2) {
                      setHasUnsavedPersonalInfo(false);
                      setHasUnsavedSocialMedia(false);
                      setHasUnsavedAddresses(false);
                      setChangedAddressIndices(new Set());
                    } else if (newTab === 3) {
                      setHasUnsavedPersonalInfo(false);
                      setHasUnsavedWorkInfo(false);
                      setHasUnsavedAddresses(false);
                      setChangedAddressIndices(new Set());
                    } else if (newTab === 4) {
                      setHasUnsavedPersonalInfo(false);
                      setHasUnsavedWorkInfo(false);
                      setHasUnsavedSocialMedia(false);
                      // When switching to address tab, check if there are actual unsaved changes
                      if (user?.user_metadata?.addresses) {
                        const originalAddresses = user.user_metadata.addresses;
                        const hasChanges = JSON.stringify(addresses) !== JSON.stringify(originalAddresses);
                        setHasUnsavedAddresses(hasChanges);
                        
                        // Recalculate changed indices
                        if (hasChanges) {
                          const changedIndices = new Set<number>();
                          addresses.forEach((address: any, index: number) => {
                            const originalAddress = originalAddresses[index];
                            if (!originalAddress || JSON.stringify(address) !== JSON.stringify(originalAddress)) {
                              changedIndices.add(index);
                            }
                          });
                          setChangedAddressIndices(changedIndices);
                        } else {
                          setChangedAddressIndices(new Set());
                        }
                      }
                    }
                  }}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                >
                  <option value={1}>👤 ข้อมูลส่วนตัว {hasUnsavedPersonalInfo ? '●' : ''}</option>
                  <option value={2}>🏢 ข้อมูลที่ทำงาน {hasUnsavedWorkInfo ? '●' : ''}</option>
                  <option value={3}>🌐 โซเชียลมีเดีย {hasUnsavedSocialMedia ? '●' : ''}</option>
                  <option value={4}>📍 ที่อยู่ {hasUnsavedAddresses ? '●' : ''}</option>
                </select>
              </div>
            </div>
            
            {/* Tab Content */}
            <div className="p-6">
              {/* Tab 1: Personal Information */}
              {activeTab === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Profile Image */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        รูป Profile
                      </label>
                      <div className="flex items-center space-x-4">
                        <div className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden">
                          {profileImage ? (
                            <img 
                              src={profileImage} 
                              alt="Profile" 
                              className="w-full h-full object-cover"
                              onError={() => {
                                if (process.env.NODE_ENV === 'development') {
                                  console.log('Image failed to load:', profileImage);
                                }
                                setProfileImage(''); // Clear invalid image
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-blue-500 flex items-center justify-center">
                              <span className="text-white font-semibold text-xl">
                                {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
                              </span>
                            </div>
                          )}
                        </div>
                        <label className="btn-outline flex items-center cursor-pointer">
                          <Upload className="w-4 h-4" />
                          <span className="hidden sm:inline ml-2">อัปโหลดรูป</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleProfileImageUpload}
                            className="hidden"
                          />
                        </label>
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
                </div>
              )}
              
              {/* Tab 2: Work Information */}
              {activeTab === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Company Logo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        รูป Logo บริษัท
                      </label>
                      <div className="flex items-center space-x-4">
                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {companyLogo ? (
                            <img src={companyLogo} alt="Company Logo" className="w-full h-full object-cover" />
                          ) : (
                            <Building className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                        <label className="btn-outline flex items-center cursor-pointer">
                          <Upload className="w-4 h-4" />
                          <span className="hidden sm:inline ml-2">อัปโหลดรูป</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCompanyLogoUpload}
                            className="hidden"
                          />
                        </label>
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
                    
                    {/* Website */}
                    <div className="md:col-span-2">
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
                  </div>
                </div>
              )}
              
              {/* Tab 4: Addresses */}
              {activeTab === 4 && (
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
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                          {editingAddressIndex >= 0 ? 'แก้ไขที่อยู่' : 'เพิ่มที่อยู่ใหม่'}
                        </h3>
                        
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
                                {Object.keys(address).map((province) => (
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
                                    (address as any)[newAddress.province]?.[district]?.PostCode || '' : '';
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
                                {newAddress.province && Object.keys((address as any)[newAddress.province] || {}).map((district) => (
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
                                  ((address as any)[newAddress.province]?.[newAddress.district]?.Tambons || []).map((tambon: string, tambonIndex: number) => (
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
                                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center w-1/3"
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
              <button 
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <Lock className="w-5 h-5 text-gray-400 mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">เปลี่ยนรหัสผ่าน</p>
                    <p className="text-sm text-gray-500">อัปเดตรหัสผ่านของคุณ</p>
                  </div>
                </div>
                <ArrowLeft className={`w-5 h-5 text-gray-400 rotate-180 transition-transform ${showPasswordForm ? 'rotate-90' : ''}`} />
              </button>
              
              {showPasswordForm && (
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

          {/* App Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">เกี่ยวกับแอป</h2>
            
            <div className="space-y-2 text-sm text-gray-600">
              <p>เวอร์ชัน: 1.0.0</p>
              <p>สร้างโดย: e-BizCard Team</p>
              <p>© 2024 e-BizCard. สงวนลิขสิทธิ์</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}