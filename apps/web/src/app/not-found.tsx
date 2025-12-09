'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Home } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // Check if we were redirected from 404.html
    const redirectPath = sessionStorage.getItem('404-redirect-path');
    if (redirectPath) {
      sessionStorage.removeItem('404-redirect-path');
      // Try to navigate to the original path
      router.push(redirectPath);
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-9xl font-bold text-gray-300 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            ไม่พบหน้าที่คุณกำลังมองหา
          </h2>
          <p className="text-gray-600 mb-6">
            หน้าที่คุณกำลังมองหาอาจถูกลบ ย้าย หรือ URL ไม่ถูกต้อง
          </p>
        </div>
        
        <ErrorMessage
          title="หน้าที่ไม่พบ"
          message="กรุณาตรวจสอบ URL หรือกลับไปที่หน้าหลัก"
          variant="error"
        />

        <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Home className="h-5 w-5 mr-2" />
            กลับหน้าหลัก
          </button>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            กลับหน้าก่อนหน้า
          </button>
        </div>
      </div>
    </div>
  );
}

