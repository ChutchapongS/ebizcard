import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/database.types';
import type { ApiError } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    // ดึง body
    const body = await request.json();
    const accessToken = body.access_token;
    const updates = body.updates as Partial<Database['public']['Tables']['profiles']['Update']>;

    if (!accessToken) {
      return NextResponse.json({ error: 'No access token provided' }, { status: 401 });
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'Invalid updates' }, { status: 400 });
    }

    type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
    const allowedFields: Array<keyof ProfileUpdate> = [
      'email',
      'full_name',
      'avatar_url',
      'created_at',
      'user_type',
      'user_plan',
      'is_active',
      'role_permissions',
      'assigned_by',
      'role_updated_at'
    ];

    // sanitize updates
    const sanitizedUpdates: Partial<ProfileUpdate> = {};
    for (const field of allowedFields) {
      const value = updates[field];
      if (value !== null && value !== undefined) {
        // Type assertion needed because TypeScript can't narrow the union type properly
        (sanitizedUpdates as Record<string, unknown>)[field] = value;
      }
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid update fields provided' }, { status: 400 });
    }

    // สร้าง Supabase client with service role key
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // ดึง user จาก token
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // update profiles table แบบ type-safe
    const { error: updateError } = await supabase
      .from('profiles')
      // @ts-ignore - Supabase type inference issue with update method
      .update(sanitizedUpdates)
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Error updating profiles table:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profiles table', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Update profiles table error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json<ApiError>(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}
