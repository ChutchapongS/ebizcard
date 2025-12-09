import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Fallback: Generate QR code directly if Edge Function fails
async function generateQRCodeFallback(cardId: string, publicUrl: string) {
  try {
    // Try to use qrcode library if available
    const QRCode = await import('qrcode').catch(() => null);
    
    if (QRCode && QRCode.default) {
      const qrCodeDataUrl = await QRCode.default.toDataURL(publicUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      return qrCodeDataUrl;
    }
    
    // If qrcode library is not available, return null to indicate fallback failed
    return null;
  } catch (error) {
    console.error('Error in QR code fallback generation:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { cardId } = await request.json();

    if (!cardId) {
      return NextResponse.json(
        { error: 'Card ID is required' },
        { status: 400 }
      );
    }

    // Create Supabase client with user's session
    const supabase = createClient();

    // Get the card to verify it exists and get the public URL
    const { data: card, error: cardError } = await supabase
      .from('business_cards')
      .select('id, name, job_title, company')
      .eq('id', cardId)
      .single();

    if (cardError || !card) {
      console.error('Card not found:', cardError);
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      );
    }

    // Type assertion for card (Supabase types may not include business_cards table)
    const cardData = card as { id: string; name: string; job_title: string; company: string };

    // Generate the public URL for the card
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    const publicUrl = `${siteUrl}/card/${cardId}`;

    // Try to invoke the Edge Function first
    let qrCodeDataUrl: string | null = null;
    let edgeFunctionError: any = null;

    try {
      const { data, error } = await supabase.functions.invoke('generate-qr', {
        body: { cardId },
      });

      if (!error && data && data.qrCode) {
        qrCodeDataUrl = data.qrCode;
      } else {
        edgeFunctionError = error;
        console.warn('Edge Function failed, trying fallback:', error);
      }
    } catch (error) {
      edgeFunctionError = error;
      console.warn('Edge Function invocation failed, trying fallback:', error);
    }

    // Fallback: Generate QR code directly if Edge Function failed
    if (!qrCodeDataUrl) {
      qrCodeDataUrl = await generateQRCodeFallback(cardId, publicUrl);
      
      if (!qrCodeDataUrl) {
        console.error('Both Edge Function and fallback failed');
        return NextResponse.json(
          { 
            error: 'Failed to generate QR code', 
            details: edgeFunctionError?.message || 'QR code generation unavailable'
          },
          { status: 500 }
        );
      }
    }

    // Track the QR code generation (optional, can fail silently)
    try {
      await (supabase
        .from('card_views') as any)
        .insert({
          card_id: cardId,
          viewer_ip: request.headers.get('x-forwarded-for') || 'unknown',
          device_info: 'QR Code Generated',
        });
    } catch (trackError) {
      // Log but don't fail the request
      console.warn('Failed to track QR code generation:', trackError);
    }
    
    // Return the response in the format expected by DashboardContent
    return NextResponse.json({
      success: true,
      qrCode: qrCodeDataUrl,
      publicUrl,
      card: {
        id: cardData.id,
        name: cardData.name,
        job_title: cardData.job_title,
        company: cardData.company,
      },
    });
  } catch (error) {
    console.error('Error in generate-qr route:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', { errorMessage, errorStack });
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}

