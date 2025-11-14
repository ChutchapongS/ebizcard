import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/lib/supabase/database.types';

export async function POST(request: NextRequest) {
  try {
    // Get access token from body (to avoid 431 error with large tokens)
    const body = await request.json();
    const accessToken = body.access_token;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token provided' },
        { status: 401 }
      );
    }

    // Create Supabase client with Service Role Key for admin operations
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

    // Get current user from the provided token
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Query profiles table with service role key (bypass RLS)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('❌ Error querying profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch profile', details: profileError.message },
        { status: 500 }
      );
    }

    // Query addresses table
    const { data: addressesData, error: addressesError } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (addressesError) {
      console.warn('⚠️ Error querying addresses (table may not exist):', addressesError.message);
    }

    // Transform addresses to match the format used in the app
    const transformedAddresses = addressesData?.map((addr: any) => ({
      type: addr.type,
      place: addr.place || '',
      address: addr.address,
      tambon: addr.tambon || '',
      district: addr.district || '',
      province: addr.province || '',
      postalCode: addr.postal_code || '',
      country: addr.country || 'Thailand',
    })) || [];

    // Combine profile and addresses
    let finalAddresses = transformedAddresses;
    if ((!transformedAddresses || transformedAddresses.length === 0) && (profileData as any)?.addresses) {
      try {
        const rawAddresses = (profileData as any).addresses;
        if (typeof rawAddresses === 'string') {
          finalAddresses = JSON.parse(rawAddresses);
        } else if (Array.isArray(rawAddresses)) {
          finalAddresses = rawAddresses;
        }
      } catch (error) {
        console.warn('⚠️ Failed to parse addresses from profiles table:', error);
      }
    }

    const completeProfile = {
      ...(profileData as any),
      addresses: finalAddresses
    };

    return NextResponse.json({
      success: true,
      profile: completeProfile
    });

  } catch (error: any) {
    console.error('❌ Get profile error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

