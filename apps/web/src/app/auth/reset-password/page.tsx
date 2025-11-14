'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Lock, CheckCircle2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [tokenStatus, setTokenStatus] = useState<'checking' | 'valid' | 'invalid'>('checking');

  useEffect(() => {
    const handleTokenFromHash = async () => {
      if (typeof window === 'undefined') return;

      const hash = window.location.hash;
      if (!hash || hash.length < 2) {
        setTokenStatus('invalid');
        return;
      }

      const params = new URLSearchParams(hash.substring(1));
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');

      if (!access_token || !refresh_token) {
        setTokenStatus('invalid');
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const { data, error } = await supabase!.auth.setSession({
          access_token,
          refresh_token,
        });

        if (error || !data?.session) {
          setTokenStatus('invalid');
          setError(error?.message || 'ไม่สามารถยืนยันลิงก์ได้');
        } else {
          setTokenStatus('valid');
        }
      } catch (err: any) {
        setTokenStatus('invalid');
        setError(err?.message || 'ไม่สามารถยืนยันลิงก์ได้');
      } finally {
        setIsLoading(false);
      }
    };

    handleTokenFromHash();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (tokenStatus !== 'valid') return;

    if (!newPassword || !confirmPassword) {
      setError('กรุณากรอกรหัสผ่านให้ครบถ้วน');
      return;
    }

    if (newPassword.length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const { error } = await supabase!.auth.updateUser({ password: newPassword });

      if (error) {
        throw error;
      }

      setSuccessMessage('ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        router.push('/auth/login');
      }, 2500);
    } catch (err: any) {
      setError(err?.message || 'ไม่สามารถตั้งรหัสผ่านใหม่ได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (tokenStatus === 'checking' || isLoading) {
      return (
        <div className="text-center text-gray-600">
          กำลังตรวจสอบลิงก์รีเซ็ตรหัสผ่าน...
        </div>
      );
    }

    if (tokenStatus === 'invalid') {
      return (
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            ไม่สามารถใช้งานลิงก์นี้ได้ กรุณาขอรับลิงก์ใหม่อีกครั้ง
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <Link
            href="/auth/forgot-password"
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            ขอรับลิงก์รีเซ็ตรหัสผ่านใหม่
          </Link>
        </div>
      );
    }

    return (
      <form className="space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start">
            <CheckCircle2 className="w-5 h-5 mr-2 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            รหัสผ่านใหม่
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="กรอกรหัสผ่านใหม่"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ยืนยันรหัสผ่านใหม่
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="ยืนยันรหัสผ่านใหม่"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
        >
          {isSubmitting ? 'กำลังตั้งรหัสผ่าน...' : 'ตั้งรหัสผ่านใหม่'}
        </button>
      </form>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          ตั้งรหัสผ่านใหม่
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

