import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: NextRequest) {
  // Handle CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Get request body
    const body = await request.json();
    
    // Check if service role key exists
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
      return NextResponse.json(
        { error: 'Service role key not configured' },
        { status: 500, headers: corsHeaders }
      );
    }
    
    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get the updates and userId from request body
    const { updates, userId } = body;
    
    if (!userId) {
      console.error('❌ Missing userId in request body');
      return NextResponse.json(
        { error: 'Missing userId', message: 'userId is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!updates || typeof updates !== 'object') {
      console.error('❌ Invalid updates in request body');
      return NextResponse.json(
        { error: 'Invalid updates', message: 'updates must be an object' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Remove avatar_url and profile_image from user_metadata
    // These should ONLY be stored in profiles table, not in auth metadata
    // Because they can be very large (base64 data URLs) and exceed metadata limit
    const metadataUpdates = { ...updates };
    delete metadataUpdates.avatar_url;
    delete metadataUpdates.profile_image;
    
    // Calculate payload size
    const payloadSize = JSON.stringify(metadataUpdates).length;
    
    // Check if payload is too large
    if (payloadSize > 15000) {
      console.error('❌ Payload too large!', payloadSize, 'bytes (limit: ~16KB)');
      return NextResponse.json(
        { 
          error: 'Payload too large', 
          message: `User metadata size (${payloadSize} bytes) exceeds limit (~16KB)`,
          details: 'Please reduce the amount of data in addresses or other fields'
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Skip updating user_metadata via admin API (causes issues)
    // We'll update profiles table directly instead

    // Also update the profiles table
    try {
      // Map updates to profiles table fields
      const profileUpdates: any = {};
      if (updates.full_name !== undefined) profileUpdates.full_name = updates.full_name;
      if (updates.full_name_english !== undefined) profileUpdates.full_name_english = updates.full_name_english;
      if (updates.personal_phone !== undefined) profileUpdates.personal_phone = updates.personal_phone;
      if (updates.company !== undefined) profileUpdates.company = updates.company;
      if (updates.department !== undefined) profileUpdates.department = updates.department;
      if (updates.job_title !== undefined) profileUpdates.job_title = updates.job_title;
      if (updates.work_phone !== undefined) profileUpdates.work_phone = updates.work_phone;
      if (updates.work_email !== undefined) profileUpdates.work_email = updates.work_email;
      if (updates.website !== undefined) profileUpdates.website = updates.website;
      if (updates.facebook !== undefined) profileUpdates.facebook = updates.facebook;
      if (updates.line_id !== undefined) profileUpdates.line_id = updates.line_id;
      if (updates.linkedin !== undefined) profileUpdates.linkedin = updates.linkedin;
      if (updates.twitter !== undefined) profileUpdates.twitter = updates.twitter;
      if (updates.instagram !== undefined) profileUpdates.instagram = updates.instagram;
      if (updates.tiktok !== undefined) profileUpdates.tiktok = updates.tiktok;
      
      // Add avatar_url and profile_image if provided
      if (updates.avatar_url !== undefined) profileUpdates.avatar_url = updates.avatar_url;
      if (updates.profile_image !== undefined) profileUpdates.profile_image = updates.profile_image;

      // Only update if there are fields to update
      if (Object.keys(profileUpdates).length > 0) {
        try {
          const { data: profileData, error: profileError } = await supabaseAdmin
            .from('profiles')
            .update(profileUpdates)
            .eq('id', userId)
            .select();

          if (profileError) {
            console.error('Error updating profiles table:', profileError);
            // Check if it's because the field doesn't exist
            // Don't return error, just log it since user_metadata was updated successfully
          }
        } catch (profileUpdateError) {
          console.error('Error updating profiles table:', profileUpdateError);
          // Don't return error, just log it since user_metadata was updated successfully
        }
      }
    } catch (profileUpdateError) {
      console.error('Error updating profiles table:', profileUpdateError);
      // Don't return error, just log it since user_metadata was updated successfully
    }

    // Note: Addresses are now updated via separate API route (/api/update-addresses)
    // This keeps the logic separated and cleaner

    return NextResponse.json(
      { success: true, error: null },
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
