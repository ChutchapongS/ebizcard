import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table');
  const select = searchParams.get('select') || '*';
  const userId = searchParams.get('user_id');
  const order = searchParams.get('order') || 'created_at.desc';

  if (!table) {
    return NextResponse.json({ error: 'Table parameter is required' }, { status: 400 });
  }

  try {
    // Build the Supabase URL
    let url = `${SUPABASE_URL}/rest/v1/${table}?select=${select}`;
    
    if (userId) {
      // Use proper Supabase filter syntax - for profiles table, use 'id' not 'user_id'
      if (table === 'profiles') {
        url += `&id=eq.${userId}`;
      } else {
        url += `&user_id=eq.${userId}`;
      }
    }
    
    if (order) {
      // Use proper Supabase order syntax
      url += `&order=${order}`;
    }

    // Append any other filters (e.g. id=eq.xxx, template_id=eq.yyy, etc.)
    const reservedKeys = new Set(['table', 'select', 'user_id', 'order']);
    searchParams.forEach((value, key) => {
      if (!reservedKeys.has(key)) {
        url += `&${key}=${value}`;
      }
    });

    // Make the request to Supabase
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Supabase API error:', response.status, errorText);
      
      // Special debug for addresses table errors
      if (table === 'addresses') {
        console.error('🔍 Addresses API Error:', {
          status: response.status,
          errorText,
          userId,
          url
        });
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch data from Supabase', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table');
  const action = searchParams.get('action');

  if (!table) {
    return NextResponse.json({ error: 'Table parameter is required' }, { status: 400 });
  }

  try {
    const body = await request.json();

    // Handle auth operations
    if (table === 'auth' && action === 'updateUser') {
      // Get user's access token from request body
      if (!body.accessToken) {
        return NextResponse.json(
          { error: 'Missing access token' },
          { status: 401 }
        );
      }

      const accessToken = body.accessToken;
      const url = `${SUPABASE_URL}/auth/v1/user`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'apikey': SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: body.updates }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Supabase Auth API error:', response.status, errorText);
        return NextResponse.json(
          { error: 'Failed to update user profile', details: errorText },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data);
    }

    // Handle regular table operations
    const url = `${SUPABASE_URL}/rest/v1/${table}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Supabase API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to create data in Supabase', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table');
  const id = searchParams.get('id');

  if (!table || !id) {
    return NextResponse.json({ error: 'Table and id parameters are required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const url = `${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Supabase API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to update data in Supabase', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table');
  const id = searchParams.get('id');

  if (!table || !id) {
    return NextResponse.json({ error: 'Table and id parameters are required' }, { status: 400 });
  }

  try {
    const url = `${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Supabase API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to delete data from Supabase', details: errorText },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
