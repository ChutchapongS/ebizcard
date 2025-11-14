import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET - Load menu visibility settings
export async function GET(request: NextRequest) {
  try {
    console.log('📥 Load Menu Visibility API called');

    // Create Supabase client (no auth required for reading public settings)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
    });

    // Fetch all menu visibility settings
    const { data: visibilityData, error: visibilityError } = await supabase
      .from('menu_visibility')
      .select('*')
      .order('menu_key, role');

    if (visibilityError) {
      console.error('❌ Error fetching menu visibility:', visibilityError);
      return NextResponse.json(
        { error: 'Failed to fetch menu visibility settings' },
        { status: 500 }
      );
    }

    // Convert array of settings to object format
    const menuVisibility: Record<string, Record<string, boolean>> = {};
    
    visibilityData.forEach(setting => {
      if (!menuVisibility[setting.menu_key]) {
        menuVisibility[setting.menu_key] = {};
      }
      menuVisibility[setting.menu_key][setting.role] = setting.is_visible;
    });

    console.log('✅ Menu visibility loaded:', menuVisibility);

    return NextResponse.json({
      success: true,
      settings: menuVisibility,
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Save menu visibility settings
export async function POST(request: NextRequest) {
  try {
    console.log('💾 Save Menu Visibility API called');

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Create Supabase client with service role for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
    });

    // Verify the user is authenticated and get user info
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin or owner
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('❌ Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to verify user permissions' },
        { status: 403 }
      );
    }

    if (profile.user_type !== 'admin' && profile.user_type !== 'owner') {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only admins and owners can update menu visibility settings.' },
        { status: 403 }
      );
    }

    // Get settings from request body
    const body = await request.json();
    const settings = body.settings;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings data' },
        { status: 400 }
      );
    }

    console.log('📝 Saving menu visibility settings:', settings);

    // Prepare upsert data
    const upsertData: Array<{
      menu_key: string;
      role: string;
      is_visible: boolean;
    }> = [];

    // Convert settings object to array format for upsert
    Object.entries(settings).forEach(([menuKey, roleSettings]) => {
      if (typeof roleSettings === 'object' && roleSettings !== null) {
        Object.entries(roleSettings).forEach(([role, isVisible]) => {
          upsertData.push({
            menu_key: menuKey,
            role: role,
            is_visible: Boolean(isVisible),
          });
        });
      }
    });

    // Upsert all settings
    const { error: upsertError } = await supabase
      .from('menu_visibility')
      .upsert(upsertData, {
        onConflict: 'menu_key,role',
      });

    if (upsertError) {
      console.error('❌ Error upserting menu visibility settings:', upsertError);
      return NextResponse.json(
        { error: `Failed to save menu visibility settings: ${upsertError.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Menu visibility settings saved successfully');

    return NextResponse.json({
      success: true,
      message: 'Menu visibility settings saved successfully',
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
