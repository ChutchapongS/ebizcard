import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RATE_LIMIT_CONFIGS, addRateLimitHeaders } from '@/lib/rate-limit';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  'http://localhost:3000';
const USE_SUPABASE_FUNCTION =
  process.env.NEXT_PUBLIC_USE_SUPABASE_QR === 'true' ||
  process.env.USE_SUPABASE_QR === 'true';

export async function POST(request: NextRequest) {
  const rateLimitResponse = rateLimit(request, RATE_LIMIT_CONFIGS.standard);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { cardId } = await request.json();

    if (!cardId) {
      return NextResponse.json(
        { error: 'Card ID is required' },
        { status: 400 }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('Supabase configuration missing');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Attempt to use Supabase Edge Function first (if enabled)
    if (USE_SUPABASE_FUNCTION) {
      try {
        const functionUrl = `${SUPABASE_URL}/functions/v1/generate-qr`;
        const functionKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

        const functionResponse = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': functionKey,
            'Authorization': `Bearer ${functionKey}`,
          },
          body: JSON.stringify({ cardId }),
        });

        const result = await functionResponse.json();
        if (functionResponse.ok && result?.success) {
          const response = NextResponse.json(result, {
            status: functionResponse.status,
          });
          return addRateLimitHeaders(response, request);
        }

        console.warn(
          'Supabase generate-qr function failed, falling back to local generation:',
          { status: functionResponse.status, body: result }
        );
      } catch (functionError) {
        console.warn(
          'Supabase generate-qr function error, falling back to local generation:',
          functionError
        );
      }
    }

    // Fallback: verify card exists via Supabase REST and generate locally
    const cardResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/business_cards?select=id,name,job_title,company&id=eq.${cardId}`,
      {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!cardResponse.ok) {
      console.error('Failed to fetch card:', cardResponse.status);
      return NextResponse.json(
        { error: 'Failed to fetch card data' },
        { status: cardResponse.status }
      );
    }

    const cardData = await cardResponse.json();
    const card = cardData[0];

    if (!card) {
      console.error('Card not found');
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      );
    }

    const normalizedSiteUrl = SITE_URL.replace(/\/$/, '');
    const publicUrl = `${normalizedSiteUrl}/card/${cardId}`;

    try {
      const { default: QRCode } = await import('qrcode');

      const qrCodeDataUrl = await QRCode.toDataURL(publicUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      const response = NextResponse.json({
        success: true,
        qrCode: qrCodeDataUrl,
        publicUrl,
        card: {
          id: card.id,
          name: card.name,
          job_title: card.job_title,
          company: card.company,
        },
      });
      return addRateLimitHeaders(response, request);
    } catch (qrError) {
      console.error('QR Code generation error:', qrError);
      return NextResponse.json(
        { error: 'Failed to generate QR code' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
