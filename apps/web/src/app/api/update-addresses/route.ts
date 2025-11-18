import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/lib/supabase/database.types';
import type { CookieOptions, AddressInput, AddressInsert, ApiError } from '@/types/api';

/**
 * API Route: Update User Addresses
 * 
 * Updates user addresses by deleting all existing addresses and inserting new ones.
 * This endpoint uses a replace strategy (delete all, then insert new) to ensure
 * data consistency.
 * 
 * @route POST /api/update-addresses
 * @access Private (requires access token)
 * 
 * @param {NextRequest} request - The incoming request object
 * @param {string} request.body.access_token - The user's access token for authentication
 * @param {AddressInput[]} request.body.addresses - Array of address objects to save
 * 
 * @returns {Promise<NextResponse>} Response containing:
 *   - success: boolean
 *   - message: Success message
 * 
 * @throws {401} If access token is missing or invalid
 * @throws {400} If addresses data is invalid or not an array
 * @throws {500} If database operation fails
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/update-addresses', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     access_token: 'user-access-token',
 *     addresses: [
 *       {
 *         type: 'home',
 *         address: '123 Main St',
 *         district: 'District',
 *         province: 'Province',
 *         postalCode: '12345',
 *         country: 'Thailand'
 *       }
 *     ]
 *   })
 * });
 * ```
 */
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
          set(name: string, value: string, options?: CookieOptions) {
            try {
              cookies().set(name, value, options);
            } catch (error) {
              // Handle cookie setting errors
            }
          },
          remove(name: string, options?: CookieOptions) {
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
      const addressesToInsert: AddressInsert[] = addresses.map((address: AddressInput) => ({
        user_id: user.id,
        type: address.type || 'home',
        place: address.place || null,
        address: address.address || '',
        tambon: address.tambon || '',
        district: address.district || '',
        province: address.province || '',
        postal_code: address.postalCode || null,
        country: address.country || 'Thailand',
      }));

      const { data: insertData, error: insertError } = await supabase
        .from('addresses')
        .insert(addressesToInsert)
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

  } catch (error) {
    console.error('❌ Update addresses error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json<ApiError>(
      { 
        error: 'Internal server error', 
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}

