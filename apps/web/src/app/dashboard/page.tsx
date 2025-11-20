'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/auth-context';
import { Layout } from '@/components/layout/Layout';

const DashboardContent = dynamic(
  () =>
    import('@/components/dashboard/DashboardContent').then((mod) => ({
      default: mod.DashboardContent,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="p-8 text-center text-gray-500">กำลังโหลดแดชบอร์ด...</div>
    ),
  }
);

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, isConnected } = useAuth();

  useEffect(() => {
    // Only redirect if not loading and no user
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  // Add a small delay to prevent flash of content during logout
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  useEffect(() => {
    if (!user && !isLoading) {
      setIsLoggingOut(true);
      // Small delay to show loading state
      const timer = setTimeout(() => {
        router.push('/auth/login');
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [user, isLoading, router]);

  if (isLoading || isLoggingOut) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isLoggingOut ? 'กำลังออกจากระบบ...' : 'กำลังโหลด...'}
          </p>
          {!isConnected && (
            <p className="text-red-500 text-sm mt-2">กำลังพยายามเชื่อมต่อ...</p>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังเปลี่ยนเส้นทาง...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <DashboardContent user={user as any} />
    </Layout>
  );
}
