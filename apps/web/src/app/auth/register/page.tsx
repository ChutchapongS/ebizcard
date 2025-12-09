'use client';

import { getWebSettings } from '@/lib/api-client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Eye, EyeOff, ArrowRight, X } from 'lucide-react';
import { sanitizeForInnerHTML } from '@/utils/sanitize';
import toast from 'react-hot-toast';
import 'react-quill/dist/quill.snow.css';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [privacyPolicy, setPrivacyPolicy] = useState<string>('');
  const [termsOfService, setTermsOfService] = useState<string>('');
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState<boolean>(false);
  const [modalPrivacyContent, setModalPrivacyContent] = useState<string>('');
  const [isTermsModalOpen, setIsTermsModalOpen] = useState<boolean>(false);
  const [modalTermsContent, setModalTermsContent] = useState<string>('');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [siteName, setSiteName] = useState<string>('e-BizCard');

  // Load privacy policy and terms of service
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await getWebSettings();
        if (data.success && data.settings) {
          if (data.settings.privacy_policy) {
            setPrivacyPolicy(data.settings.privacy_policy);
          }
          if (data.settings.terms_of_service) {
            setTermsOfService(data.settings.terms_of_service);
          }
          if (data.settings.logo_url) {
            setLogoUrl(data.settings.logo_url);
          }
          if (data.settings.site_name) {
            setSiteName(data.settings.site_name);
          }
        }
      } catch (error) {
        console.warn('Error loading settings:', error);
      }
    };
    loadSettings();
  }, []);

  // Sync modal content when modal opens
  useEffect(() => {
    if (isPrivacyModalOpen) {
      if (!modalPrivacyContent && privacyPolicy) {
        setModalPrivacyContent(privacyPolicy);
      }
    }
  }, [isPrivacyModalOpen, privacyPolicy, modalPrivacyContent]);

  useEffect(() => {
    if (isTermsModalOpen) {
      if (!modalTermsContent && termsOfService) {
        setModalTermsContent(termsOfService);
      }
    }
  }, [isTermsModalOpen, termsOfService, modalTermsContent]);

  // Use the imported supabase client

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      setIsLoading(false);
      return;
    }

    try {
      if (!supabase) {
        setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
        },
      });

      if (error) {
        setError(error.message);
      } else {
        toast.success('สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี');
        router.push('/auth/login');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการสมัครสมาชิก');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      if (!supabase) {
        setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
        return;
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        setError(error.message);
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkedInLogin = async () => {
    setIsLoading(true);
    try {
      if (!supabase) {
        setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
        return;
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        setError(error.message);
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={siteName}
              className="h-16 w-16 object-contain rounded-full bg-white border border-gray-200 p-2"
            />
          ) : (
            <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">e</span>
            </div>
          )}
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          สมัครสมาชิก
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          หรือ{' '}
          <Link
            href="/auth/login"
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            เข้าสู่ระบบ
          </Link>
          {' / '}
          <Link
            href="/"
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            กลับหน้าหลัก
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                ชื่อ-นามสกุล
              </label>
              <div className="mt-1">
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="กรอกชื่อ-นามสกุลของคุณ"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                อีเมล
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="กรอกอีเมลของคุณ"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                รหัสผ่าน
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="กรอกรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                ยืนยันรหัสผ่าน
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="agree-terms"
                name="agree-terms"
                type="checkbox"
                required
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="agree-terms" className="ml-2 block text-sm text-gray-900">
                ฉันยอมรับ{' '}
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const data = await getWebSettings();
                      if (data.success && data.settings?.terms_of_service) {
                        const termsContent = data.settings.terms_of_service;
                        setTermsOfService(termsContent);
                        setModalTermsContent(termsContent);
                      } else {
                        setTermsOfService('');
                        setModalTermsContent('');
                      }
                    } catch (error) {
                      console.warn('Error reloading terms of service:', error);
                    }
                    setIsTermsModalOpen(true);
                  }}
                  className="text-primary-600 hover:text-primary-500 underline"
                >
                  ข้อกำหนดการใช้งาน
                </button>{' '}
                และ{' '}
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const data = await getWebSettings();
                      if (data.success && data.settings?.privacy_policy) {
                        const policyContent = data.settings.privacy_policy;
                        setPrivacyPolicy(policyContent);
                        setModalPrivacyContent(policyContent);
                      } else {
                        setPrivacyPolicy('');
                        setModalPrivacyContent('');
                      }
                    } catch (error) {
                      console.warn('Error reloading privacy policy:', error);
                    }
                    setIsPrivacyModalOpen(true);
                  }}
                  className="text-primary-600 hover:text-primary-500 underline"
                >
                  นโยบายความเป็นส่วนตัว
                </button>
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {isLoading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">หรือสมัครสมาชิกด้วย</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="ml-2">Google</span>
              </button>

              <button
                onClick={handleLinkedInLogin}
                disabled={isLoading}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <span className="ml-2">LinkedIn</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Policy Modal */}
      {isPrivacyModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={() => setIsPrivacyModalOpen(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">นโยบายความเป็นส่วนตัว</h2>
              <button
                onClick={() => setIsPrivacyModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="ปิด"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {(() => {
                if (modalPrivacyContent && modalPrivacyContent.trim()) {
                  const isHTML = modalPrivacyContent.includes('<') && modalPrivacyContent.includes('>');
                  
                  if (isHTML) {
                    return (
                      <div 
                        className="ql-editor"
                        style={{
                          fontFamily: 'inherit',
                          fontSize: '14px',
                          lineHeight: '1.5',
                          padding: 0,
                          color: '#111827',
                        }}
                        dangerouslySetInnerHTML={sanitizeForInnerHTML(modalPrivacyContent)}
                      />
                    );
                  } else {
                    return (
                      <div 
                        className="ql-editor whitespace-pre-wrap"
                        style={{
                          fontFamily: 'inherit',
                          fontSize: '14px',
                          lineHeight: '1.5',
                          padding: 0,
                          color: '#111827',
                        }}
                      >
                        {modalPrivacyContent}
                      </div>
                    );
                  }
                } else {
                  return (
                    <div className="text-center py-12">
                      <p className="text-gray-500">ยังไม่มีเนื้อหานโยบายความเป็นส่วนตัว</p>
                      <p className="text-sm text-gray-400 mt-2">กรุณาติดต่อผู้ดูแลระบบ</p>
                    </div>
                  );
                }
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setIsPrivacyModalOpen(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terms of Service Modal */}
      {isTermsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={() => setIsTermsModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">ข้อกำหนดการใช้งาน</h2>
              <button
                onClick={() => setIsTermsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="ปิด"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {(() => {
                if (modalTermsContent && modalTermsContent.trim()) {
                  const isHTML = modalTermsContent.includes('<') && modalTermsContent.includes('>');

                  if (isHTML) {
                    return (
                      <div
                        className="ql-editor"
                        style={{
                          fontFamily: 'inherit',
                          fontSize: '14px',
                          lineHeight: '1.5',
                          padding: 0,
                          color: '#111827',
                        }}
                        dangerouslySetInnerHTML={sanitizeForInnerHTML(modalTermsContent)}
                      />
                    );
                  } else {
                    return (
                      <div
                        className="ql-editor whitespace-pre-wrap"
                        style={{
                          fontFamily: 'inherit',
                          fontSize: '14px',
                          lineHeight: '1.5',
                          padding: 0,
                          color: '#111827',
                        }}
                      >
                        {modalTermsContent}
                      </div>
                    );
                  }
                } else {
                  return (
                    <div className="text-center py-12">
                      <p className="text-gray-500">ยังไม่มีเนื้อหาข้อกำหนดการใช้งาน</p>
                      <p className="text-sm text-gray-400 mt-2">กรุณาติดต่อผู้ดูแลระบบ</p>
                    </div>
                  );
                }
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setIsTermsModalOpen(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
