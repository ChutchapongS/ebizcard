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

    console.log(`[Addresses API] Updating addresses for user: ${userId}, count: ${addresses.length}`);
    console.log(`[Addresses API] Address types being saved:`, addresses.map((a: any) => a.type));

    // Get existing addresses to compare
    const { data: existingAddresses, error: fetchError } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId);

    if (fetchError) {
      console.error('Error fetching existing addresses:', fetchError);
      // Continue anyway, might be first time
    }

    console.log(`[Addresses API] Found ${existingAddresses?.length || 0} existing addresses`);
    if (existingAddresses && existingAddresses.length > 0) {
      console.log(`[Addresses API] Existing address types:`, existingAddresses.map((a: any) => a.type));
      console.log(`[Addresses API] Existing address IDs:`, existingAddresses.map((a: any) => a.id));
    }
    
    // Also check if there are addresses with different user_ids (for debugging)
    const { data: allAddresses, error: allAddressesError } = await supabase
      .from('addresses')
      .select('user_id, type, id, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (!allAddressesError && allAddresses) {
      console.log(`[Addresses API] Recent addresses in database (last 10):`, 
        allAddresses.map((a: any) => ({ user_id: a.user_id, type: a.type, id: a.id.substring(0, 8) + '...' }))
      );
    }

    // Use upsert strategy instead of delete-all-then-insert
    // This prevents data loss if user ID changes or if there's a race condition
    if (addresses.length > 0) {
      const addressesToUpsert: AddressInsert[] = addresses.map((address: AddressInput) => ({
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

      // Upsert addresses (update if exists based on user_id + type, insert if not)
      // Note: This requires a unique constraint on (user_id, type) in the database
      // If the constraint doesn't exist, we'll fall back to delete-then-insert
      const { data, error: upsertError } = await supabase
        .from('addresses')
        .upsert(addressesToUpsert, {
          onConflict: 'user_id,type',
          ignoreDuplicates: false
        })
        .select();

      if (upsertError) {
        console.error('Error upserting addresses:', upsertError);
        // Fallback to delete-then-insert if upsert fails (for backward compatibility)
        console.log('Falling back to delete-then-insert strategy');
        
        // Delete existing addresses for this user
        const { error: deleteError } = await supabase
          .from('addresses')
          .delete()
          .eq('user_id', userId);

        if (deleteError) {
          console.error('Error deleting existing addresses:', deleteError);
          return NextResponse.json({ error: 'Failed to delete existing addresses' }, { status: 500 });
        }

        // Insert new addresses
        const { data: insertData, error: insertError } = await supabase
          .from('addresses')
          .insert(addressesToUpsert)
          .select();

        if (insertError) {
          console.error('Error inserting addresses:', insertError);
          return NextResponse.json({ error: 'Failed to insert addresses' }, { status: 500 });
        }

        console.log(`[Addresses API] Successfully inserted ${insertData?.length || 0} addresses`);
        return NextResponse.json({ data: insertData, error: null });
      }

      console.log(`[Addresses API] Successfully upserted ${data?.length || 0} addresses`);
      return NextResponse.json({ data, error: null });
    } else {
      // If addresses array is empty, delete all addresses for this user
      // This allows users to clear all addresses
      const { error: deleteError } = await supabase
        .from('addresses')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Error deleting addresses:', deleteError);
        return NextResponse.json({ error: 'Failed to delete addresses' }, { status: 500 });
      }

      console.log(`[Addresses API] Deleted all addresses for user ${userId}`);
      return NextResponse.json({ data: [], error: null });
    }
  } catch (error) {
    console.error('Error in POST /api/addresses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
