import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is not defined');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    // Get user information from Authorization header
    const authHeader = request.headers.get('authorization');
    let currentUserRole = 'user'; // Default to user role
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        
        if (!authError && user) {
          // Get user role from profiles table
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('user_type')
            .eq('id', user.id)
            .single();
          
          if (profile) {
            currentUserRole = profile.user_type;
          }
        }
      } catch (error) {
        console.warn('Error getting user role:', error);
      }
    }
    
    // Build query based on user role
    let query = supabaseAdmin
      .from('templates')
      .select('*');
    
    // Filter templates based on user role
    if (currentUserRole === 'user') {
      // Regular users can only see:
      // 1. Templates created by admin/owner (user_type = 'admin' or 'owner')
      // 2. Templates created by themselves (user_id matches)
      
      // Get current user ID if available
      let currentUserId = null;
      if (authHeader) {
        try {
          const token = authHeader.replace('Bearer ', '');
          const { data: { user } } = await supabaseAdmin.auth.getUser(token);
          currentUserId = user?.id;
        } catch (error) {
          console.warn('Error getting current user ID:', error);
        }
      }
      
      if (currentUserId) {
        // User is logged in - show admin/owner templates + their own templates
        query = query.or(`user_type.in.(admin,owner),user_id.eq.${currentUserId}`);
      } else {
        // User is not logged in - show only admin/owner templates
        query = query.in('user_type', ['admin', 'owner']);
      }
    }
    // Admin and Owner can see all templates (no additional filtering needed)
    
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching templates:', error);
      return NextResponse.json({ 
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      }, { status: 500 });
    }

    return NextResponse.json({ templates: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { name, paper, elements, user_id, preview_image } = body;
    
    if (!name || !paper || !elements) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get user role for the template creator
    let userType = 'user'; // Default
    if (user_id) {
      try {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('user_type')
          .eq('id', user_id)
          .single();
        
        if (profile) {
          userType = profile.user_type;
        }
      } catch (error) {
        console.warn('Error getting user type:', error);
      }
    }

    // Create template data for database
    const templateData = {
      name,
      theme: paper.background?.type || 'default',
      preview_url: preview_image || '', // Use captured image as preview
      paper_settings: paper,
      elements: elements,
      user_id: user_id || null,
      user_type: userType,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin
      .from('templates')
      .insert([templateData])
      .select()
      .single();

    if (error) {
      console.error('Error saving template:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
