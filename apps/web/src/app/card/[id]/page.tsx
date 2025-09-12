import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CardView } from '@/components/card/CardView';
import { CardAnalytics } from '@/components/card/CardAnalytics';

interface CardPageProps {
  params: {
    id: string;
  };
}

export default async function CardPage({ params }: CardPageProps) {
  const supabase = createClient();
  const { id } = params;

  // Fetch the business card data
  const { data: card, error } = await supabase
    .from('business_cards')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !card) {
    notFound();
  }

  // Track the view
  const { data: { user } } = await supabase.auth.getUser();
  const deviceInfo = typeof window !== 'undefined' 
    ? `${navigator.userAgent} - ${navigator.platform}`
    : 'Server Side';

  // Track view asynchronously (don't wait for it)
  supabase
    .from('card_views')
    .insert({
      card_id: id,
      viewer_ip: 'unknown', // Will be set by edge function
      device_info: deviceInfo,
    })
    .then(() => {
      console.log('View tracked successfully');
    })
    .catch((error) => {
      console.error('Error tracking view:', error);
    });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <CardView card={card} />
        {user?.id === card.user_id && (
          <div className="mt-8">
            <CardAnalytics cardId={id} />
          </div>
        )}
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: CardPageProps) {
  const supabase = createClient();
  const { id } = params;

  const { data: card } = await supabase
    .from('business_cards')
    .select('name, job_title, company, email')
    .eq('id', id)
    .single();

  if (!card) {
    return {
      title: 'นามบัตรไม่พบ',
    };
  }

  return {
    title: `นามบัตรของ ${card.name}`,
    description: `${card.job_title}${card.company ? ` ที่ ${card.company}` : ''}`,
    openGraph: {
      title: `นามบัตรของ ${card.name}`,
      description: `${card.job_title}${card.company ? ` ที่ ${card.company}` : ''}`,
      type: 'profile',
    },
  };
}
