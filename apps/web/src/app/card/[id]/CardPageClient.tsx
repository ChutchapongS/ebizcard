// CardPageClient.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { PublicCardView } from '@/components/card/PublicCardView';
import { BusinessCard } from '@/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { supabase } from '@/lib/supabase/client';

export default function CardPageClient() {
  const params = useParams();
  const id = params.id as string;
  const [card, setCard] = useState<BusinessCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const lastFetchedCardIdRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchCard = async () => {
      try {
        if (!supabase) {
          setError('ไม่สามารถเชื่อมต่อฐานข้อมูลได้');
          setLoading(false);
          return;
        }

        // Fetch card with related template data using Supabase client directly
        const { data, error } = await supabase
          .from('business_cards')
          .select('*,templates(id,name,elements,paper_settings,preview_url)')
          .eq('id', id)
          .single();
        
        if (error) {
          console.error('Error fetching card:', error);
          setError('ไม่พบนามบัตร');
          return;
        }

        if (!data) {
          setError('ไม่พบนามบัตร');
          return;
        }

        setCard(data as BusinessCard);

        // Track the view using Edge Function (skip duplicate tracking in dev StrictMode)
        const deviceInfo = `${navigator.userAgent || 'unknown'} - ${navigator.platform || 'unknown'}`;

        // Use Edge Function
        import('@/lib/api-client')
          .then(({ recordCardView }) => {
            return recordCardView(id, (data as BusinessCard)?.name || null, deviceInfo);
          })
          .catch((error) => {
            console.error('❌ Error tracking view:', error);
          });

      } catch (err) {
        console.error('Error:', err);
        setError('เกิดข้อผิดพลาด');
      } finally {
        setLoading(false);
      }
    };

    if (id && lastFetchedCardIdRef.current !== id) {
      lastFetchedCardIdRef.current = id;
      fetchCard();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="กำลังโหลดนามบัตร..." />
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <ErrorMessage
            title="ไม่พบนามบัตร"
            message={error || 'นามบัตรนี้อาจถูกลบหรือไม่ถูกต้อง'}
            variant="error"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <PublicCardView card={card} />
      </div>
    </div>
  );
}

