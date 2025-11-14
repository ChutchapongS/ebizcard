'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Mail, ArrowRight } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('กรุณากรอกอีเมล');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (!supabase) {
        setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
        return;
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        }
      );

      if (resetError) {
        throw resetError;
      }

      setSuccessMessage(
        'ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว กรุณาตรวจสอบกล่องจดหมายหรือโฟลเดอร์สแปม'
      );
      setEmail('');
    } catch (err) {
      console.error('Forgot password error:', err);
      const rawMessage =
        err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการส่งลิงก์รีเซ็ตรหัสผ่าน';
      const normalized = rawMessage.toLowerCase();

      let friendlyMessage = rawMessage;
      if (normalized.includes('email rate limit exceeded')) {
        friendlyMessage =
          'คุณได้ส่งคำขอรีเซ็ตรหัสผ่านหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง';
      } else if (normalized.includes('invalid login credentials')) {
        friendlyMessage = 'ไม่พบบัญชีผู้ใช้งานที่มีอีเมลนี้';
      }

      setError(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          ลืมรหัสผ่าน
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          กรุณากรอกอีเมลที่ใช้สมัครสมาชิก เราจะส่งลิงก์สำหรับรีเซ็ตรหัสผ่านให้คุณ
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

            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                {successMessage}
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="กรอกอีเมลของคุณ"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {isLoading ? 'กำลังส่งลิงก์...' : 'ส่งลิงก์รีเซ็ตรหัสผ่าน'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </form>

          <div className="mt-6 space-y-2 text-sm text-center text-gray-600">
            <Link href="/auth/login" className="text-primary-600 hover:text-primary-500">
              กลับไปหน้าเข้าสู่ระบบ
            </Link>
            <div>
              ยังไม่มีบัญชี?{' '}
              <Link href="/auth/register" className="text-primary-600 hover:text-primary-500">
                สมัครสมาชิกใหม่
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

