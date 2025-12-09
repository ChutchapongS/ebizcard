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

    // GET - Load level capabilities (public, no auth required)
    if (req.method === 'GET') {
      // Fetch all level capabilities
      const { data: capabilitiesData, error: capabilitiesError } = await supabase
        .from('level_capabilities')
        .select('*')
        .order('plan_name')

      if (capabilitiesError) {
        console.error('❌ Error fetching level capabilities:', capabilitiesError)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch level capabilities' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Convert array to object format
      const capabilities: Record<string, any> = {}
      
      capabilitiesData.forEach(capability => {
        capabilities[capability.plan_name] = {
          max_cards: capability.max_cards,
          max_templates: capability.max_templates,
          features: capability.features || [],
        }
      })

      return new Response(
        JSON.stringify({
          success: true,
          capabilities,
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // POST - Save level capabilities (admin only)
    if (req.method === 'POST') {
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
          JSON.stringify({ error: 'Insufficient permissions. Only admins and owners can update level capabilities.' }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Get capabilities from request body
      const body = await req.json()
      const capabilities = body.capabilities

      if (!capabilities || typeof capabilities !== 'object') {
        return new Response(
          JSON.stringify({ error: 'Invalid capabilities data' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Prepare upsert data
      const upsertData: Array<{
        plan_name: string
        max_cards: number
        max_templates: number
        features: string[]
      }> = []

      // Convert capabilities object to array format for upsert
      Object.entries(capabilities).forEach(([planName, planData]: [string, any]) => {
        upsertData.push({
          plan_name: planName,
          max_cards: parseInt(planData.max_cards) || 0,
          max_templates: parseInt(planData.max_templates) || 0,
          features: Array.isArray(planData.features) ? planData.features : [],
        })
      })

      // Upsert all capabilities
      const { error: upsertError } = await supabase
        .from('level_capabilities')
        .upsert(upsertData, {
          onConflict: 'plan_name',
        })

      if (upsertError) {
        console.error('❌ Error upserting level capabilities:', upsertError)
        return new Response(
          JSON.stringify({ error: `Failed to save level capabilities: ${upsertError.message}` }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Level capabilities saved successfully',
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


