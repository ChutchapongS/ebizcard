import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/lib/supabase/database.types';

export async function POST(request: NextRequest) {
  try {
    // Get access token and addresses from body
    const body = await request.json();
    const accessToken = body.access_token;
    const addresses = body.addresses;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token provided' },
        { status: 401 }
      );
    }

    if (!addresses || !Array.isArray(addresses)) {
      return NextResponse.json(
        { error: 'Invalid addresses data' },
        { status: 400 }
      );
    }

    // Create Supabase client with Service Role Key
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookies().get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            try {
              cookies().set(name, value, options);
            } catch (error) {
              // Handle cookie setting errors
            }
          },
          remove(name: string, options: any) {
            try {
              cookies().set(name, '', options);
            } catch (error) {
              // Handle cookie removal errors
            }
          },
        },
      }
    );

    // Get current user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete all existing addresses for this user
    const { error: deleteError } = await supabase
      .from('addresses')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('❌ Error deleting existing addresses:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete existing addresses', details: deleteError.message },
        { status: 500 }
      );
    }

    // Insert new addresses
    if (addresses.length > 0) {
      const addressesToInsert = addresses.map((address: any, index: number) => ({
        user_id: user.id,
        type: address.type || 'home',
        place: address.place || null,
        address: address.address || '',
        tambon: address.tambon || null,
        district: address.district || null,
        province: address.province || null,
        postal_code: address.postalCode || null,
        country: address.country || 'Thailand',
        is_primary: index === 0, // First address is primary
      }));

      const { data: insertData, error: insertError } = await supabase
        .from('addresses')
        .insert(addressesToInsert as any)
        .select();

      if (insertError) {
        console.error('❌ Error inserting addresses:', insertError);
        return NextResponse.json(
          { error: 'Failed to insert addresses', details: insertError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Addresses updated successfully'
    });

  } catch (error: any) {
    console.error('❌ Update addresses error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

