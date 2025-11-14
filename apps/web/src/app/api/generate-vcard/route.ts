import { NextRequest, NextResponse } from 'next/server';
export async function POST(request: NextRequest) {
  try {
    const { cardId } = await request.json();

    if (!cardId) {
      return NextResponse.json(
        { error: 'Card ID is required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase configuration for generate-vcard route');
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/generate-vcard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ cardId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error invoking generate-vcard function:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to generate vCard', details: errorText },
        { status: response.status }
      );
    }

    // Forward the vCard response from the edge function
    // Clone headers so we can tweak for browser download
    const headers = new Headers(response.headers);
    headers.delete('content-encoding');
    headers.delete('transfer-encoding');
    headers.set('Content-Type', headers.get('Content-Type') || 'text/vcard; charset=utf-8');
    if (!headers.get('Content-Disposition')) {
      headers.set('Content-Disposition', 'attachment; filename="card.vcf"');
    }

    let vcardText = await response.text();
    if (!/END:VCARD/i.test(vcardText)) {
      vcardText = vcardText.replace(/\r?\n?$/, '');
      vcardText += '\r\nEND:VCARD\r\n';
    } else if (!/\r\nEND:VCARD\r\n?$/.test(vcardText)) {
      vcardText = vcardText.replace(/\s*END:VCARD\s*$/i, 'END:VCARD');
      vcardText += '\r\n';
    }

    return new NextResponse(vcardText, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
