'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

/**
 * Callback page that completes the SCGJWD User Portal login handshake.
 *
 * Flow:
 * 1. Read ?code / ?returnUrl from query string
 * 2. Call Supabase Edge Function to exchange code → session
 * 3. Persist session via supabase.auth.setSession()
 * 4. Redirect to decoded returnUrl (default /dashboard)
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = React.useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = React.useState('กำลังตรวจสอบการเข้าสู่ระบบ...');

  const retryLogin = () => {
    const userPortalUrl = process.env.NEXT_PUBLIC_USER_PORTAL_URL;
    const userPortalClientId = process.env.NEXT_PUBLIC_USER_PORTAL_CLIENT_ID || 'e-BizCard';
    
    if (!userPortalUrl) {
      setMessage('SCGJWD User Portal URL ยังไม่ได้ตั้งค่า');
      return;
    }

    const normalizedPortalUrl = userPortalUrl.replace(/\/$/, '');
    const returnUrl = `${window.location.origin}/dashboard`;
    const callbackUrl = `${window.location.origin}/auth/callback`;
    const callbackWithReturn = `${callbackUrl}?returnUrl=${encodeURIComponent(returnUrl)}`;
    const loginUrl = `${normalizedPortalUrl}/login?client_id=${encodeURIComponent(userPortalClientId)}&redirect_uri=${encodeURIComponent(callbackWithReturn)}`;
    
    window.location.href = loginUrl;
  };

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get code/return URL from query parameters
        const authorizationCode = searchParams.get('code');
        const error = searchParams.get('error');
        const encodedReturnUrl = searchParams.get('returnUrl');
        const returnUrl = encodedReturnUrl ? decodeURIComponent(encodedReturnUrl) : '/dashboard';

        console.log('AuthCallbackPage mounted');
        console.log('Query params:', { code: authorizationCode, error, returnUrl: encodedReturnUrl });
        console.log('Code:', authorizationCode);

        // If there's an error from user portal
        if (error) {
          console.error('Error from user portal:', error);
          setStatus('error');
          setMessage(`เกิดข้อผิดพลาด: ${error}`);
          return;
        }

        // If no code, redirect to login
        if (!authorizationCode) {
          console.error('No authorization code received');
          setStatus('error');
          setMessage('ไม่พบ authorization code กรุณาลองใหม่อีกครั้ง');
          return;
        }

        // Build redirect URI (must match the value sent in login step)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const callbackUrl = `${window.location.origin}/auth/callback`;
        const redirectUri = `${callbackUrl}?returnUrl=${encodeURIComponent(returnUrl)}`;

        if (!supabaseUrl || !supabaseAnonKey) {
          console.error('Supabase env not configured', { supabaseUrl, supabaseAnonKey });
          setStatus('error');
          setMessage('Supabase environment ยังไม่ได้ตั้งค่า กรุณาตรวจสอบ NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY');
          return;
        }

        if (!supabase) {
          console.error('Supabase client not initialized');
          setStatus('error');
          setMessage('Supabase client ยังไม่ได้ตั้งค่า กรุณาตรวจสอบการติดตั้ง');
          return;
        }

        const supabaseClient = supabase;

        console.log('Attempting token exchange with code:', authorizationCode);
        const tokenResponse = await fetch(`${supabaseUrl}/functions/v1/user-portal-login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            code: authorizationCode,
            redirectUri,
          }),
        });

        const responseBody = await tokenResponse.json().catch(() => ({}));

        if (!tokenResponse.ok) {
          console.error('Token exchange failed:', responseBody);
          setStatus('error');
          setMessage(
            responseBody?.error ||
            responseBody?.details ||
            'ไม่สามารถแลก authorization code ได้ กรุณาลองใหม่อีกครั้ง'
          );
          return;
        }

        console.log('Token exchange response:', responseBody);

        if (!responseBody?.access_token) {
          console.error('Token response missing access_token:', responseBody);
          setStatus('error');
          setMessage('ไม่พบ access token ในการตอบกลับ');
          return;
        }

        // Set Supabase session with the token
        console.log('Setting Supabase session...');
        const { data: sessionData, error: sessionError } = await supabaseClient.auth.setSession({
          access_token: responseBody.access_token,
          refresh_token: responseBody.refresh_token || '',
        });

        if (sessionError) {
          console.error('Session error:', sessionError);
          setStatus('error');
          setMessage('ไม่สามารถสร้าง session ได้ กรุณาลองใหม่อีกครั้ง');
          return;
        }

        const { data: userResult, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !userResult?.user) {
          console.error('User verification failed:', userError);
          setStatus('error');
          setMessage('ไม่สามารถยืนยันตัวตนผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง');
          return;
        }

        console.log('Logged in with authorization code', {
          user: userResult.user.email,
        });

        // Success - redirect to the return URL
        setStatus('success');
        setMessage('เข้าสู่ระบบสำเร็จ กำลัง redirect...');
        
        // Decode return URL if it's encoded
        const decodedReturnUrl = decodeURIComponent(returnUrl);
        console.log('Redirecting to:', decodedReturnUrl);
        setTimeout(() => {
          router.push(decodedReturnUrl);
        }, 1000);
      } catch (error) {
        console.error('Callback error:', error);
        setStatus('error');
        setMessage('เกิดข้อผิดพลาดในการประมวลผล callback');
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">{message}</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="rounded-full h-12 w-12 bg-green-100 mx-auto mb-4 flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-600">{message}</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="rounded-full h-12 w-12 bg-red-100 mx-auto mb-4 flex items-center justify-center">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                <p className="font-bold">เกิดข้อผิดพลาด</p>
                <p>{message}</p>
              </div>
              <button
                onClick={retryLogin}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded"
              >
                ลองใหม่
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

