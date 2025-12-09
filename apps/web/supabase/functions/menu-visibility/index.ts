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

    // GET - Load menu visibility settings (public, no auth required)
    if (req.method === 'GET') {
      console.log('📥 Load Menu Visibility API called')

      // Fetch all menu visibility settings
      const { data: visibilityData, error: visibilityError } = await supabase
        .from('menu_visibility')
        .select('*')
        .order('menu_key, role')

      if (visibilityError) {
        console.error('❌ Error fetching menu visibility:', visibilityError)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch menu visibility settings' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Convert array of settings to object format
      const menuVisibility: Record<string, Record<string, boolean>> = {}
      
      visibilityData.forEach(setting => {
        if (!menuVisibility[setting.menu_key]) {
          menuVisibility[setting.menu_key] = {}
        }
        menuVisibility[setting.menu_key][setting.role] = setting.is_visible
      })

      console.log('✅ Menu visibility loaded:', menuVisibility)

      return new Response(
        JSON.stringify({
          success: true,
          settings: menuVisibility,
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // POST - Save menu visibility settings (admin only)
    if (req.method === 'POST') {
      console.log('💾 Save Menu Visibility API called')

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

      // Check if user is admin or owner
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        console.error('❌ Error fetching profile:', profileError)
        return new Response(
          JSON.stringify({ error: 'Failed to verify user permissions' }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      if (profile.user_type !== 'admin' && profile.user_type !== 'owner') {
        return new Response(
          JSON.stringify({ error: 'Insufficient permissions. Only admins and owners can update menu visibility settings.' }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Get settings from request body
      const body = await req.json()
      const settings = body.settings

      if (!settings || typeof settings !== 'object') {
        return new Response(
          JSON.stringify({ error: 'Invalid settings data' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      console.log('📝 Saving menu visibility settings:', settings)

      // Prepare upsert data
      const upsertData: Array<{
        menu_key: string
        role: string
        is_visible: boolean
      }> = []

      // Convert settings object to array format for upsert
      Object.entries(settings).forEach(([menuKey, roleSettings]) => {
        if (typeof roleSettings === 'object' && roleSettings !== null) {
          Object.entries(roleSettings).forEach(([role, isVisible]) => {
            upsertData.push({
              menu_key: menuKey,
              role: role,
              is_visible: Boolean(isVisible),
            })
          })
        }
      })

      // Upsert all settings
      const { error: upsertError } = await supabase
        .from('menu_visibility')
        .upsert(upsertData, {
          onConflict: 'menu_key,role',
        })

      if (upsertError) {
        console.error('❌ Error upserting menu visibility settings:', upsertError)
        return new Response(
          JSON.stringify({ error: `Failed to save menu visibility settings: ${upsertError.message}` }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      console.log('✅ Menu visibility settings saved successfully')

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Menu visibility settings saved successfully',
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
    console.error('❌ Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})


