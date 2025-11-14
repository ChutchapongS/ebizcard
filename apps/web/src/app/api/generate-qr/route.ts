import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request: NextRequest) {
  try {
    const { cardId } = await request.json();

    if (!cardId) {
      return NextResponse.json(
        { error: 'Card ID is required' },
        { status: 400 }
      );
    }

    // Get the card data using direct fetch to avoid CORS issues
    const cardResponse = await fetch(`${SUPABASE_URL}/rest/v1/business_cards?select=*&id=eq.${cardId}`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

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

    // Generate public URL
    const publicUrl = `http://localhost:3000/card/${cardId}`;
    
    // Generate QR code locally
    try {
      // Dynamic import to avoid TypeScript issues
      const QRCode = (await import('qrcode')).default;
      
      const qrCodeDataUrl = await QRCode.toDataURL(publicUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      return NextResponse.json({
        success: true,
        qrCode: qrCodeDataUrl,
        publicUrl: publicUrl
      });
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
