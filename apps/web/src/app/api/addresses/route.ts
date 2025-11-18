import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { AddressInput, AddressInsert } from '@/types/api';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create client for server-side operations
const supabase = createClient(
  SUPABASE_URL!,
  SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// GET - Fetch addresses for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching addresses:', error);
      return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
    }

    return NextResponse.json({ data, error: null });
  } catch (error) {
    console.error('Error in GET /api/addresses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create or update addresses for a user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, addresses } = body;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('Missing Supabase configuration');
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    if (!userId || !Array.isArray(addresses)) {
      return NextResponse.json({ error: 'User ID and addresses array are required' }, { status: 400 });
    }

    // First, delete all existing addresses for this user
    const { error: deleteError } = await supabase
      .from('addresses')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error deleting existing addresses:', deleteError);
      return NextResponse.json({ error: 'Failed to delete existing addresses' }, { status: 500 });
    }

    // Then insert new addresses
    if (addresses.length > 0) {
      const addressesToInsert: AddressInsert[] = addresses.map((address: AddressInput) => ({
        user_id: userId,
        type: address.type || 'home',
        place: address.place || null,
        address: address.address || '',
        tambon: address.tambon || '',
        district: address.district || '',
        province: address.province || '',
        postal_code: address.postalCode || address.postal_code || null,
        country: address.country || 'Thailand'
      }));

      const { data, error: insertError } = await supabase
        .from('addresses')
        .insert(addressesToInsert)
        .select();

      if (insertError) {
        console.error('Error inserting addresses:', insertError);
        return NextResponse.json({ error: 'Failed to insert addresses' }, { status: 500 });
      }

      return NextResponse.json({ data, error: null });
    }

    return NextResponse.json({ data: [], error: null });
  } catch (error) {
    console.error('Error in POST /api/addresses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
