import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/database.types';
import type { AddressRow } from '@/types/api';
import { rateLimit, RATE_LIMIT_CONFIGS, addRateLimitHeaders } from '@/lib/rate-limit';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

/**
 * API Route: Get User Profile
 * 
 * Retrieves the complete user profile including addresses from the database.
 * Uses service role key to bypass RLS policies for admin operations.
 * 
 * @route POST /api/get-profile
 * @access Private (requires access token)
 * 
 * @param {NextRequest} request - The incoming request object
 * @param {string} request.body.access_token - The user's access token for authentication
 * 
 * @returns {Promise<NextResponse>} Response containing:
 *   - success: boolean
 *   - profile: Complete profile object with addresses array
 * 
 * @throws {401} If access token is missing or invalid
 * @throws {500} If profile cannot be fetched from database
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/get-profile', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ access_token: 'user-access-token' })
 * });
 * const { success, profile } = await response.json();
 * ```
 */
export async function POST(request: NextRequest) {
  console.log('🔧 POST /api/get-profile called');
  try {
    // Apply rate limiting (standard for profile retrieval)
    try {
      console.log('🔧 Applying rate limiting');
      const rateLimitResponse = rateLimit(request, RATE_LIMIT_CONFIGS.standard);
      if (rateLimitResponse) {
        console.log('⚠️ Rate limit exceeded');
        return rateLimitResponse;
      }
      console.log('✅ Rate limit passed');
    } catch (rateLimitError) {
      console.error('❌ Rate limit error:', rateLimitError);
      // Continue if rate limit fails
    }

    // Get access token from body (to avoid 431 error with large tokens)
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('❌ Error parsing request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body', details: 'Request body must be valid JSON' },
        { status: 400 }
      );
    }
    const accessToken = body.access_token;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token provided' },
        { status: 401 }
      );
    }

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
      return NextResponse.json(
        { error: 'Server configuration error', details: 'Missing Supabase URL' },
        { status: 500 }
      );
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!serviceRoleKey) {
      console.error('❌ Missing Supabase service role key or anon key');
      return NextResponse.json(
        { error: 'Server configuration error', details: 'Missing Supabase keys' },
        { status: 500 }
      );
    }

    // Create Supabase client with Service Role Key for admin operations
    // Since we're using service role key, we can use createClient instead of createServerClient
    // This avoids cookie-related issues in Next.js App Router
    let supabase;
    try {
      console.log('🔧 Creating Supabase client with service role key');
      supabase = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        serviceRoleKey,
      {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );
      console.log('✅ Supabase client created successfully');
    } catch (supabaseError) {
      console.error('❌ Error creating Supabase client:', supabaseError);
      const errorDetails = supabaseError instanceof Error ? supabaseError.message : String(supabaseError);
      const errorStack = supabaseError instanceof Error ? supabaseError.stack : undefined;
      console.error('❌ Error stack:', errorStack);
      return NextResponse.json(
        { 
          error: 'Server configuration error', 
          details: `Failed to create Supabase client: ${errorDetails}` 
        },
        { status: 500 }
    );
    }

    // Get current user from the provided token
    console.log('🔧 Getting user from access token');
    let user;
    let authError;
    try {
      const authResult = await supabase.auth.getUser(accessToken);
      user = authResult.data.user;
      authError = authResult.error;
    } catch (getUserError) {
      console.error('❌ Error calling getUser:', getUserError);
      return NextResponse.json(
        { 
          error: 'Authentication error', 
          details: getUserError instanceof Error ? getUserError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token', details: authError?.message },
        { status: 401 }
      );
    }
    
    console.log('✅ User authenticated:', user.id);

    // Query profiles table with service role key (bypass RLS)
    console.log('🔧 Querying profiles table for user:', user.id);
    let profileData: ProfileRow | null;
    let profileError;
    try {
      const profileResult = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
      profileData = profileResult.data;
      profileError = profileResult.error;
    } catch (queryError) {
      console.error('❌ Error querying profile (exception):', queryError);
      return NextResponse.json(
        { 
          error: 'Failed to fetch profile', 
          details: queryError instanceof Error ? queryError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    if (profileError) {
      console.error('❌ Error querying profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch profile', details: profileError.message },
        { status: 500 }
      );
    }
    
    // TypeScript needs explicit type narrowing here
    const profile = profileData as ProfileRow | null;
    
    console.log('✅ Profile data retrieved:', {
      hasData: !!profile,
      hasAvatar: !!profile?.avatar_url,
      hasFullName: !!profile?.full_name
    });

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
    const transformedAddresses = addressesData?.map((addr: AddressRow) => ({
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
    if ((!transformedAddresses || transformedAddresses.length === 0) && profile && 'addresses' in profile) {
      try {
        const rawAddresses = (profile as { addresses?: unknown }).addresses;
        if (typeof rawAddresses === 'string') {
          finalAddresses = JSON.parse(rawAddresses);
        } else if (Array.isArray(rawAddresses)) {
          finalAddresses = rawAddresses;
        }
      } catch (error) {
        console.warn('⚠️ Failed to parse addresses from profiles table:', error);
      }
    }

    // Ensure user_type and user_plan are explicitly included
    // These fields now exist in TypeScript types, but we ensure they're included
    const completeProfile = {
      ...profile,
      addresses: finalAddresses,
      // Explicitly include user_type and user_plan from database
      // Use the actual values from database, defaulting to 'user' and 'Free' if null
      user_type: profile?.user_type ?? 'user',
      user_plan: profile?.user_plan ?? 'Free',
    };

    const response = NextResponse.json({
      success: true,
      profile: completeProfile
    });
    
    // Add rate limit headers if function exists
    try {
    return addRateLimitHeaders(response, request);
    } catch (rateLimitHeaderError) {
      console.warn('⚠️ Error adding rate limit headers:', rateLimitHeaderError);
      return response;
    }

  } catch (error) {
    console.error('❌ Get profile error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('❌ Error stack:', errorStack);
    console.error('❌ Error details:', {
      message: errorMessage,
      name: error instanceof Error ? error.name : undefined
    });
    
    // Make sure we always return JSON, not HTML
    try {
    return NextResponse.json(
      { 
        error: 'Internal server error', 
          details: errorMessage,
          stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
    } catch (jsonError) {
      // If even JSON response fails, return a simple text response
      console.error('❌ Failed to create JSON response:', jsonError);
      return new Response(
        JSON.stringify({ 
          error: 'Internal server error', 
          details: errorMessage 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
}

