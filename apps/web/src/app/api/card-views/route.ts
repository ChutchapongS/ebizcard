import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const getSupabaseKey = () => SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!SUPABASE_URL || !getSupabaseKey()) {
      console.error('Missing Supabase configuration for card view tracking');
      return NextResponse.json(
        { success: false, message: 'Supabase configuration is missing' },
        { status: 500 }
      );
    }

    const { cardId, deviceInfo, cardName } = await request.json();

    if (!cardId) {
      return NextResponse.json(
        { success: false, message: 'cardId is required' },
        { status: 400 }
      );
    }

    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor?.split(',')[0]?.trim() || request.ip || 'unknown';

    const supabaseResponse = await fetch(`${SUPABASE_URL}/rest/v1/card_views`, {
      method: 'POST',
      headers: {
        apikey: getSupabaseKey()!,
        Authorization: `Bearer ${getSupabaseKey()!}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        card_id: cardId,
        card_name: cardName ? cardName.toString().slice(0, 255) : null,
        viewer_ip: clientIp,
        device_info: (deviceInfo || '').toString().slice(0, 512),
      }),
    });

    if (!supabaseResponse.ok) {
      const errorText = await supabaseResponse.text();
      console.error('Failed to record card view:', supabaseResponse.status, errorText);
      return NextResponse.json(
        { success: false, message: 'Failed to record card view', details: errorText },
        { status: supabaseResponse.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Card view tracking error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}


