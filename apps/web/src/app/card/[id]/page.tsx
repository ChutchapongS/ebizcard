'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { PublicCardView } from '@/components/card/PublicCardView';
import { BusinessCard } from '@/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

export default function CardPage() {
  const params = useParams();
  const id = params.id as string;
  const [card, setCard] = useState<BusinessCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const lastFetchedCardIdRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchCard = async () => {
      try {
        // Fetch card with related template data (including paper settings) and field_values
        // Encode the select parameter properly
        const selectParam = encodeURIComponent('*,templates(id,name,elements,paper_settings,preview_url)');
        const response = await fetch(`/api/supabase-proxy?table=business_cards&select=${selectParam}&id=eq.${id}`);
        
        if (!response.ok) {
          console.error('Error fetching card:', response.status);
          setError('ไม่พบนามบัตร');
          return;
        }

        const data = await response.json();
        
        if (!data || data.length === 0) {
          setError('ไม่พบนามบัตร');
          return;
        }

        setCard(data[0]);

        // Track the view using dedicated API (skip duplicate tracking in dev StrictMode)
        const deviceInfo = `${navigator.userAgent || 'unknown'} - ${navigator.platform || 'unknown'}`;

        fetch('/api/card-views', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cardId: id,
            cardName: data[0]?.name || null,
            deviceInfo,
          }),
        })
          .then(async (response) => {
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(errorText || `Failed with status ${response.status}`);
            }
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

