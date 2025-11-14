import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { access_token, address } = await request.json();

    if (!access_token) {
      return NextResponse.json({ error: 'Access token required' }, { status: 401 });
    }

    if (!address) {
      return NextResponse.json({ error: 'Address data required' }, { status: 400 });
    }

    // Create Supabase client with the access token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      }
    );

    // Insert address into addresses table
    const { data, error } = await supabase
      .from('addresses')
      .insert([address])
      .select('id')
      .single();

    if (error) {
      console.error('❌ Error inserting address:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: data.id, message: 'Address saved successfully' });

  } catch (error) {
    console.error('❌ Error in save-address API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
