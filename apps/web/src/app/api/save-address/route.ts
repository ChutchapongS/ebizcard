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

    // Check if address with same user_id and type already exists
    const { data: existingAddress, error: checkError } = await supabase
      .from('addresses')
      .select('id')
      .eq('user_id', address.user_id)
      .eq('type', address.type)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error checking existing address:', checkError);
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    let result;
    if (existingAddress) {
      // Update existing address
      const { data, error } = await supabase
        .from('addresses')
        .update(address)
        .eq('id', existingAddress.id)
        .select('id')
        .single();

      if (error) {
        console.error('❌ Error updating address:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      result = data;
    } else {
      // Insert new address
      const { data, error } = await supabase
        .from('addresses')
        .insert([address])
        .select('id')
        .single();

      if (error) {
        console.error('❌ Error inserting address:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      result = data;
    }

    return NextResponse.json({ id: result.id, message: existingAddress ? 'Address updated successfully' : 'Address saved successfully' });

  } catch (error) {
    console.error('❌ Error in save-address API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
