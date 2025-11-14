'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/layout/Navbar';
import { SliderShowcase } from '@/components/landing/SliderShowcase';
import { Features } from '@/components/landing/Features';
import { Footer } from '@/components/landing/Footer';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  // No automatic redirect - let users stay on home page even when logged in
  useEffect(() => {
    try {
      // User state is handled by auth context
    } catch (err) {
      console.error('🏠 HomePage: Error in useEffect:', err);
      setError('เกิดข้อผิดพลาดในการโหลดหน้า');
    }
  }, [user, isLoading]);

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">เกิดข้อผิดพลาด</h1>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            โหลดใหม่
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Show home page content regardless of login status

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <SliderShowcase />
      <Features />
      <Footer />
    </div>
  );
}
