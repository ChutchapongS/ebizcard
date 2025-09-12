import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { Pricing } from '@/components/landing/Pricing';
import { Footer } from '@/components/landing/Footer';

export default async function HomePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-white">
      <Hero />
      <Features />
      <Pricing />
      <Footer />
    </div>
  );
}
