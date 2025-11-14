import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET - Load web settings
export async function GET(request: NextRequest) {
  try {
    // Create Supabase client (no auth required for reading public settings)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
    });

    // Fetch all settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('web_settings')
      .select('*');

    if (settingsError) {
      console.error('❌ Error fetching settings:', settingsError);
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      );
    }

    // Convert array of settings to object
    const settings: Record<string, any> = {};
    settingsData.forEach(setting => {
      settings[setting.setting_key] = setting.setting_value;
    });

    // Convert string numbers to actual numbers or objects
    if (settings.max_cards_per_user) {
      settings.max_cards_per_user = parseInt(settings.max_cards_per_user, 10);
    }
    if (settings.max_templates_per_user) {
      settings.max_templates_per_user = parseInt(settings.max_templates_per_user, 10);
    }
    
    // Parse JSON fields
    const jsonFields = ['home_slider', 'features_items'];
    jsonFields.forEach(field => {
      if (settings[field]) {
        try {
          settings[field] = typeof settings[field] === 'string' 
            ? JSON.parse(settings[field]) 
            : settings[field];
        } catch (error) {
          console.warn(`Failed to parse ${field} settings`, error);
        }
      }
    });

    return NextResponse.json({
      success: true,
      settings,
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Save web settings
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
        { error: 'Insufficient permissions. Only admins and owners can update settings.' },
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

    // Prepare upsert data
    const upsertData: Array<{ setting_key: string; setting_value: string }> = [];

    // Helper function to add setting to upsert array
    const addSetting = (key: string, value: any, isJson: boolean = false) => {
      if (value !== undefined && value !== null) {
        if (isJson) {
          try {
            const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
            upsertData.push({ setting_key: key, setting_value: jsonValue });
          } catch (error) {
            console.error(`❌ Error serializing ${key}:`, error);
            throw new Error(`Invalid ${key} configuration data`);
          }
        } else {
          upsertData.push({ setting_key: key, setting_value: value.toString() });
        }
      }
    };

    // Basic settings
    addSetting('site_name', settings.site_name);
    addSetting('logo_url', settings.logo_url);
    
    // Home page settings (legacy - may not be used anymore)
    addSetting('home_title', settings.home_title);
    addSetting('home_subtitle', settings.home_subtitle);
    addSetting('home_description', settings.home_description);
    
    // Site description and contact info
    addSetting('site_description', settings.site_description);
    addSetting('contact_email', settings.contact_email);
    addSetting('contact_phone', settings.contact_phone);
    addSetting('contact_address', settings.contact_address);
    
    // Social media links
    addSetting('social_line', settings.social_line);
    addSetting('social_facebook', settings.social_facebook);
    addSetting('social_youtube', settings.social_youtube);
    
    // Features settings
    addSetting('features_title', settings.features_title);
    addSetting('features_description', settings.features_description);
    addSetting('features_items', settings.features_items, true);
    
    // Slider settings
    addSetting('home_slider', settings.home_slider, true);
    addSetting('slider_section_background', settings.slider_section_background);
    
    // Color settings
    addSetting('navbar_color', settings.navbar_color);
    addSetting('navbar_font_color', settings.navbar_font_color);
    addSetting('footer_color', settings.footer_color);
    addSetting('footer_font_color', settings.footer_font_color);
    
    // Policy settings
    addSetting('privacy_policy', settings.privacy_policy);
    
    // System settings
    addSetting('max_cards_per_user', settings.max_cards_per_user);
    addSetting('max_templates_per_user', settings.max_templates_per_user);

    // Upsert all settings
    const { error: upsertError } = await supabase
      .from('web_settings')
      .upsert(upsertData, {
        onConflict: 'setting_key',
      });

    if (upsertError) {
      console.error('❌ Error upserting settings:', upsertError);
      return NextResponse.json(
        { error: `Failed to save settings: ${upsertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

