import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET - Load level capabilities
export async function GET(request: NextRequest) {
  try {
    // Create Supabase client (no auth required for reading public settings)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
    });

    // Fetch all level capabilities
    const { data: capabilitiesData, error: capabilitiesError } = await supabase
      .from('level_capabilities')
      .select('*')
      .order('plan_name');

    if (capabilitiesError) {
      console.error('❌ Error fetching level capabilities:', capabilitiesError);
      return NextResponse.json(
        { error: 'Failed to fetch level capabilities' },
        { status: 500 }
      );
    }

    // Convert array to object format
    const capabilities: Record<string, any> = {};
    
    capabilitiesData.forEach(capability => {
      capabilities[capability.plan_name] = {
        max_cards: capability.max_cards,
        max_templates: capability.max_templates,
        features: capability.features || [],
      };
    });

    return NextResponse.json({
      success: true,
      capabilities,
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Save level capabilities
export async function POST(request: NextRequest) {
  try {
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
        { error: 'Insufficient permissions. Only admins and owners can update level capabilities.' },
        { status: 403 }
      );
    }

    // Get capabilities from request body
    const body = await request.json();
    const capabilities = body.capabilities;

    if (!capabilities || typeof capabilities !== 'object') {
      return NextResponse.json(
        { error: 'Invalid capabilities data' },
        { status: 400 }
      );
    }

    // Prepare upsert data
    const upsertData: Array<{
      plan_name: string;
      max_cards: number;
      max_templates: number;
      features: string[];
    }> = [];

    // Convert capabilities object to array format for upsert
    Object.entries(capabilities).forEach(([planName, planData]: [string, any]) => {
      upsertData.push({
        plan_name: planName,
        max_cards: parseInt(planData.max_cards) || 0,
        max_templates: parseInt(planData.max_templates) || 0,
        features: Array.isArray(planData.features) ? planData.features : [],
      });
    });

    // Upsert all capabilities
    const { error: upsertError } = await supabase
      .from('level_capabilities')
      .upsert(upsertData, {
        onConflict: 'plan_name',
      });

    if (upsertError) {
      console.error('❌ Error upserting level capabilities:', upsertError);
      return NextResponse.json(
        { error: `Failed to save level capabilities: ${upsertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Level capabilities saved successfully',
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
