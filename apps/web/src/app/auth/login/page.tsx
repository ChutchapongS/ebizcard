'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [siteName, setSiteName] = useState<string>('e-BizCard');

  // Persist form data to prevent loss on refresh
  useEffect(() => {
    const savedEmail = localStorage.getItem('login-email');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
    }
  }, []);

  // Save email to localStorage when it changes
  useEffect(() => {
    if (formData.email) {
      localStorage.setItem('login-email', formData.email);
    }
  }, [formData.email]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/admin/web-settings');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.settings?.logo_url) {
            setLogoUrl(data.settings.logo_url);
          }
          if (data.success && data.settings?.site_name) {
            setSiteName(data.settings.site_name);
          }
        }
      } catch (error) {
        console.warn('Login: Error loading settings:', error);
      }
    };
    loadSettings();
  }, []);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOAuthWarning, setShowOAuthWarning] = useState(false);

  // No auth state listener - prevents refresh loops
  
  // Remove auto-redirect to prevent loop
  // useEffect(() => {
  //   const checkAuth = async () => {
  //     const { data: { session } } = await supabase.auth.getSession();
  //     if (session) {
  //       console.log('User already logged in, redirecting to dashboard...');
  //       router.push('/dashboard');
  //     }
  //   };
  //   
  //   checkAuth();
  // }, [router]);

  // Use the imported supabase client

  const handleSCGJWDLogin = () => {
    // Get user portal config from environment variables
    const userPortalUrl = process.env.NEXT_PUBLIC_USER_PORTAL_URL;
    const userPortalClientId = process.env.NEXT_PUBLIC_USER_PORTAL_CLIENT_ID || 'e-BizCard';
    
    if (!userPortalUrl) {
      setError('SCGJWD User Portal URL ยังไม่ได้ตั้งค่า กรุณาติดต่อผู้ดูแลระบบ');
      return;
    }

    // Normalize base URL (remove trailing slash)
    const normalizedPortalUrl = userPortalUrl.replace(/\/$/, '');

    // Build redirect & callback URLs according to the sequence diagram
    const returnUrl = `${window.location.origin}/dashboard`;
    const callbackUrl = `${window.location.origin}/auth/callback`;
    const callbackWithReturn = `${callbackUrl}?returnUrl=${encodeURIComponent(returnUrl)}`;

    const loginUrl = `${normalizedPortalUrl}/login?client_id=${encodeURIComponent(userPortalClientId)}&redirect_uri=${encodeURIComponent(callbackWithReturn)}`;
    
    window.location.href = loginUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) {
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      const { data, error } = await supabase!.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        console.error('Login error:', error);
        const friendlyMessage = error.message === 'Invalid login credentials'
          ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
          : error.message;
        setError(friendlyMessage);
        setIsLoading(false);
      } else {
        setIsLoading(false);
        
        // Wait a bit for auth state to update, then redirect
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
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
          เข้าสู่ระบบ
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          หรือ{' '}
          <Link
            href="/auth/register"
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            สมัครสมาชิกใหม่
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
              {error.includes('Login สำเร็จ') && (
                <div className="mt-2">
                  <button
                    onClick={() => window.location.href = '/dashboard'}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    ไป Dashboard
                  </button>
                </div>
              )}
            </div>
          )}

          {showOAuthWarning && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                <div>
                  <p className="font-medium">OAuth ยังไม่ได้เปิดใช้งาน</p>
                  <p className="text-sm mt-1">
                    กรุณาใช้การเข้าสู่ระบบด้วยอีเมลและรหัสผ่านแทน 
                    หรือติดต่อผู้ดูแลระบบเพื่อเปิดใช้งาน OAuth
                  </p>
                </div>
              </div>
            </div>
          )}

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
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="กรอกรหัสผ่านของคุณ"
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

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  จดจำการเข้าสู่ระบบ
                </label>
              </div>

              <div className="text-sm">
                <Link
                  href="/auth/forgot-password"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  ลืมรหัสผ่าน?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
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
                <span className="px-2 bg-white text-gray-500">หรือ</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleSCGJWDLogin}
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
              >
                SCGJWD User Portal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
