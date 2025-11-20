import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { UserTypeUpdate } from '@/types/api';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to check if user has admin/owner privileges
async function checkAdminPrivileges(userId: string) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    return false;
  }

  return ['owner', 'admin'].includes(profile.user_type);
}

export async function POST(request: NextRequest) {
  try {
    const { targetUserId, newRole, newPlan, reason } = await request.json();
    
    // Get the current user from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check if current user has admin privileges
    const hasPrivileges = await checkAdminPrivileges(user.id);
    if (!hasPrivileges) {
      return NextResponse.json(
        { error: 'Insufficient privileges' },
        { status: 403 }
      );
    }

    // Validate new role
    if (!['owner', 'admin', 'user'].includes(newRole)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "owner", "admin", or "user"' },
        { status: 400 }
      );
    }

    // Validate new plan (if provided)
    if (newPlan && !['Free', 'Standard', 'Pro'].includes(newPlan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be "Free", "Standard", or "Pro"' },
        { status: 400 }
      );
    }

    // Get current user role for audit
    const { data: currentProfile, error: currentError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', targetUserId)
      .single();

    if (currentError) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const oldRole = currentProfile.user_type;

    // Prevent demoting the last owner
    if (oldRole === 'owner' && newRole !== 'owner') {
      const { data: ownerCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('user_type', 'owner');

      if (ownerCount && ownerCount.length <= 1) {
        return NextResponse.json(
          { error: 'Cannot demote the last owner' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: UserTypeUpdate = {
      user_type: newRole,
      assigned_by: user.id,
      role_updated_at: new Date().toISOString()
    };

    // Update user plan if provided and user is not admin/owner
    if (newPlan && newRole === 'user') {
      updateData.user_plan = newPlan;
    } else if (newRole === 'admin' || newRole === 'owner') {
      // Admin and Owner always have Pro plan
      updateData.user_plan = 'Pro';
    }

    // Update user role and plan
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', targetUserId);

    if (updateError) {
      console.error('Error updating user role:', updateError);
      return NextResponse.json(
        { error: 'Failed to update user role' },
        { status: 500 }
      );
    }

    // Log role change for audit
    const { error: auditError } = await supabase
      .from('role_changes')
      .insert({
        user_id: targetUserId,
        old_role: oldRole,
        new_role: newRole,
        changed_by: user.id,
        reason: reason || null
      });

    if (auditError) {
      console.error('Error logging role change:', auditError);
      // Don't fail the request, just log the error
    }

    const message = newPlan && newRole === 'user' 
      ? `User role updated from ${oldRole} to ${newRole} and plan updated to ${newPlan}`
      : `User role updated from ${oldRole} to ${newRole}`;

    return NextResponse.json({ 
      success: true, 
      message,
      oldRole,
      newRole,
      newPlan: newPlan || (newRole === 'admin' || newRole === 'owner' ? 'Pro' : null)
    });

  } catch (error) {
    console.error('Error in update-user-role API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get all users with their roles (admin/owner only)
export async function GET(request: NextRequest) {
  try {
    // Get the current user from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check if current user has admin privileges
    const hasPrivileges = await checkAdminPrivileges(user.id);
    
    if (!hasPrivileges) {
      return NextResponse.json(
        { error: 'Insufficient privileges' },
        { status: 403 }
      );
    }

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(`
        id, 
        full_name, 
        email, 
        user_type, 
        user_plan,
        is_active,
        role_updated_at,
        created_at,
        assigned_by
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ users: profiles });

  } catch (error) {
    console.error('❌ Error in get-users API:', error);
    const err = error as Error;
    console.error('❌ Error details:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: err.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
