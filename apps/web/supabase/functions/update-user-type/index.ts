import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { authenticateUser, getSupabaseClient } from '../_shared/auth.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = getSupabaseClient()

    // Helper function to check if user has admin/owner privileges
    async function checkAdminPrivileges(userId: string) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', userId)
        .single()

      if (error || !profile) {
        return false
      }

      return ['owner', 'admin'].includes(profile.user_type)
    }

    // GET - Get all users with their roles (admin/owner only)
    if (req.method === 'GET') {
      // Authenticate user
      const { user, error: authError } = await authenticateUser(req)
      
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized', details: authError || 'Invalid token' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Check if current user has admin privileges
      const hasPrivileges = await checkAdminPrivileges(user.id)
      
      if (!hasPrivileges) {
        return new Response(
          JSON.stringify({ error: 'Insufficient privileges' }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
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
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching users:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch users', details: error.message }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ users: profiles }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // POST - Update user type (admin/owner only)
    if (req.method === 'POST') {
      const body = await req.json()
      const { targetUserId, newRole, newPlan, reason } = body
      
      // Get the current user from the request
      const { user, error: authError } = await authenticateUser(req)
      
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized', details: authError || 'Invalid token' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Check if current user has admin privileges
      const hasPrivileges = await checkAdminPrivileges(user.id)
      if (!hasPrivileges) {
        return new Response(
          JSON.stringify({ error: 'Insufficient privileges' }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Validate new role
      if (!['owner', 'admin', 'user'].includes(newRole)) {
        return new Response(
          JSON.stringify({ error: 'Invalid role. Must be "owner", "admin", or "user"' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Validate new plan (if provided)
      if (newPlan && !['Free', 'Standard', 'Pro'].includes(newPlan)) {
        return new Response(
          JSON.stringify({ error: 'Invalid plan. Must be "Free", "Standard", or "Pro"' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Get current user role for audit
      const { data: currentProfile, error: currentError } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', targetUserId)
        .single()

      if (currentError) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const oldRole = currentProfile.user_type

      // Prevent demoting the last owner
      if (oldRole === 'owner' && newRole !== 'owner') {
        const { data: ownerCount } = await supabase
          .from('profiles')
          .select('id', { count: 'exact' })
          .eq('user_type', 'owner')

        if (ownerCount && ownerCount.length <= 1) {
          return new Response(
            JSON.stringify({ error: 'Cannot demote the last owner' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
      }

      // Prepare update data
      const updateData: Record<string, any> = {
        user_type: newRole,
        assigned_by: user.id,
        role_updated_at: new Date().toISOString()
      }

      // Update user plan if provided and user is not admin/owner
      if (newPlan && newRole === 'user') {
        updateData.user_plan = newPlan
      } else if (newRole === 'admin' || newRole === 'owner') {
        // Admin and Owner always have Pro plan
        updateData.user_plan = 'Pro'
      }

      // Update user role and plan
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', targetUserId)

      if (updateError) {
        console.error('Error updating user role:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to update user role' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
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
        })

      if (auditError) {
        console.error('Error logging role change:', auditError)
        // Don't fail the request, just log the error
      }

      const message = newPlan && newRole === 'user' 
        ? `User role updated from ${oldRole} to ${newRole} and plan updated to ${newPlan}`
        : `User role updated from ${oldRole} to ${newRole}`

      return new Response(
        JSON.stringify({ 
          success: true, 
          message,
          oldRole,
          newRole,
          newPlan: newPlan || (newRole === 'admin' || newRole === 'owner' ? 'Pro' : null)
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Method not allowed
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Error in update-user-type API:', error)
    const err = error instanceof Error ? error : new Error(String(error))
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: err.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})


