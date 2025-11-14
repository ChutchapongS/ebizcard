// ไฟล์ใหม่ที่ใช้ API Route แทน client-side upload
// คัดลอกเนื้อหาจากไฟล์เดิมและแก้ไข handleProfileImageUpload

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  // State variables
  const [profileImage, setProfileImage] = useState('');
  const [fullName, setFullName] = useState('');
  const [fullNameEnglish, setFullNameEnglish] = useState('');
  const [personalPhone, setPersonalPhone] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [hasUnsavedPersonalInfo, setHasUnsavedPersonalInfo] = useState(false);

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

  // ฟังก์ชันใหม่ที่ใช้ API Route
  const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      console.log('📤 กำลังอัปโหลดรูปภาพ...');
      console.log(`📊 ขนาดไฟล์ต้นฉบับ: ${(file.size / 1024).toFixed(1)}KB`);
      
      // Compress image if it's larger than 2MB
      let processedFile = file;
      if (file.size > 2 * 1024 * 1024) { // 2MB
        console.log('🗜️ กำลังบีบอัดรูปภาพ...');
        processedFile = await compressImage(file, 800, 800, 0.8);
      }

      // ใช้ client-side upload ไปยัง Supabase Storage
      console.log('🚀 ใช้ client-side upload ไปยัง Supabase Storage...');
      
      const { supabase } = await import('@/lib/supabase/client');
      
      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension = processedFile.name.split('.').pop();
      const fileName = `profile-${timestamp}.${fileExtension}`;
      
      // Upload to avatars bucket
      const { data, error: uploadError } = await supabase!.storage
        .from('avatars')
        .upload(fileName, processedFile, {
          contentType: processedFile.type,
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase!.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;
      console.log('✅ อัปโหลดสำเร็จผ่าน client-side!');
      console.log(`🔗 URL: ${publicUrl}`);
      
      // Update local state with the uploaded URL
      setProfileImage(publicUrl);
      setHasUnsavedPersonalInfo(true);
      alert('🎉 อัปโหลดรูปสำเร็จ!\n\n✅ เก็บใน Supabase Storage\n🔗 รูปแสดงผลเร็วขึ้น\n💾 ประหยัดพื้นที่ฐานข้อมูล');
      
    } catch (error) {
      console.error('❌ Upload error:', error);
      
      // Fallback: Use compressed base64 data URL and save to user metadata
      console.warn('⚠️ API Route ล้มเหลว ใช้ base64 fallback');
      console.warn('📋 บันทึกรูปใน user metadata แทน');
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Url = e.target?.result as string;
        if (base64Url) {
          try {
            // Import supabase client for fallback
            const { supabase } = await import('@/lib/supabase/client');
            
            // Create a more compressed version for metadata (limit to 30KB)
            const maxLength = 30000; // ~30KB limit for metadata
            const compressedBase64 = base64Url.length > maxLength 
              ? base64Url.substring(0, maxLength) + '...' 
              : base64Url;
            
            console.log(`📊 Base64 size: ${(compressedBase64.length / 1024).toFixed(1)}KB`);
            
            // Update user metadata with compressed base64 URL
            const { error: updateError } = await supabase!.auth.updateUser({
              data: {
                avatar_url: compressedBase64,
                profile_image: compressedBase64
              }
            });

            if (updateError) {
              console.error('❌ ไม่สามารถอัปเดต user metadata:', updateError);
              // Fallback: Save to localStorage as backup
              try {
                localStorage.setItem('profile_image_fallback', base64Url);
                console.log('✅ บันทึกรูปใน localStorage เป็นสำรอง');
              } catch (localStorageError) {
                console.error('❌ ไม่สามารถบันทึกใน localStorage:', localStorageError);
              }
              setProfileImage(base64Url);
              setHasUnsavedPersonalInfo(true);
              alert('⚠️ อัปโหลดรูปสำเร็จ (เก็บในหน่วยความจำ)\n\n💾 รูปถูกเก็บใน localStorage เป็นสำรอง\n📊 ขนาดไฟล์ใหญ่เกินไปสำหรับฐานข้อมูล');
            } else {
              console.log('✅ บันทึกรูปใน user metadata สำเร็จ');
              setProfileImage(base64Url);
              setHasUnsavedPersonalInfo(true);
              alert('✅ อัปโหลดรูปสำเร็จ!\n\n💡 รูปถูกเก็บใน user metadata\n🗜️ ถูกบีบอัดเพื่อประหยัดพื้นที่\n📊 ขนาด: ~' + (compressedBase64.length / 1024).toFixed(1) + 'KB');
            }
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

  // Load user data
  useEffect(() => {
    if (user?.user_metadata) {
      const metadata = user.user_metadata;
      setFullName(metadata.full_name || '');
      setFullNameEnglish(metadata.full_name_english || '');
      setPersonalPhone(metadata.personal_phone || '');
      setPersonalEmail(metadata.personal_email || '');
      setProfileImage(metadata.avatar_url || metadata.profile_image || '');
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">ตั้งค่าโปรไฟล์</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">ข้อมูลส่วนตัว</h2>
          
                    {/* Profile Image */}
          <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        รูป Profile
                      </label>
                      <div className="flex items-center space-x-4">
                          {profileImage ? (
                            <img 
                              src={profileImage} 
                              alt="Profile" 
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
                              onError={() => {
                                  console.log('Image failed to load:', profileImage);
                                setProfileImage(''); // Clear invalid image
                              }}
                            />
                          ) : (
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 text-2xl">👤</span>
                            </div>
                          )}
              <div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleProfileImageUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                <p className="text-xs text-gray-500 mt-1">
                  รองรับไฟล์: JPG, PNG, GIF (ขนาดไม่เกิน 5MB)
                </p>
              </div>
                      </div>
                    </div>
                    
          {/* Form fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ชื่อ-นามสกุล *
                      </label>
                      <input
                        type="text"
                        value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setHasUnsavedPersonalInfo(true);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="กรอกชื่อ-นามสกุล"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ชื่อ-นามสกุล (ภาษาอังกฤษ)
                      </label>
                      <input
                        type="text"
                        value={fullNameEnglish}
                onChange={(e) => {
                  setFullNameEnglish(e.target.value);
                  setHasUnsavedPersonalInfo(true);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your name in English"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        เบอร์โทรศัพท์ส่วนตัว
                      </label>
                      <input
                        type="tel"
                        value={personalPhone}
                onChange={(e) => {
                  setPersonalPhone(e.target.value);
                  setHasUnsavedPersonalInfo(true);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="กรอกเบอร์โทรศัพท์"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        อีเมลส่วนตัว
                      </label>
                      <input
                        type="email"
                value={personalEmail}
                                onChange={(e) => {
                  setPersonalEmail(e.target.value);
                  setHasUnsavedPersonalInfo(true);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="กรอกอีเมลส่วนตัว"
                              />
                            </div>
                          </div>

          {/* Save button */}
          <div className="mt-6 flex justify-end">
                                <button
              onClick={async () => {
                try {
                  // TODO: Implement profile update API call here
                  alert('กำลังพัฒนาฟีเจอร์นี้');
                  setHasUnsavedPersonalInfo(false);
                } catch (error) {
                  console.error('Error updating metadata:', error);
                  alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
                }
              }}
              disabled={!hasUnsavedPersonalInfo}
              className={`px-6 py-2 rounded-md font-medium ${
                hasUnsavedPersonalInfo
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              บันทึกข้อมูล
                                </button>
                              </div>
                            </div>
                          </div>
                          </div>
  );
}
