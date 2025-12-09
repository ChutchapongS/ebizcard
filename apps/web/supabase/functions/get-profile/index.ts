import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'
import { authenticateUser, getSupabaseClient } from '../_shared/auth.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only allow POST method
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
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

    // Get Supabase client
    const supabase = getSupabaseClient()

    // Query profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error querying profile:', profileError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch profile', details: profileError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Query addresses table
    const { data: addressesData, error: addressesError } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (addressesError) {
      console.warn('Error querying addresses:', addressesError.message)
    }

    // Transform addresses to match the format used in the app
    const transformedAddresses = addressesData?.map((addr) => ({
      type: addr.type,
      place: addr.place || '',
      address: addr.address,
      tambon: addr.tambon || '',
      district: addr.district || '',
      province: addr.province || '',
      postalCode: addr.postal_code || '',
      country: addr.country || 'Thailand',
    })) || []

    // Combine profile and addresses
    let finalAddresses = transformedAddresses
    if ((!transformedAddresses || transformedAddresses.length === 0) && profileData && 'addresses' in profileData) {
      try {
        const rawAddresses = (profileData as { addresses?: unknown }).addresses
        if (typeof rawAddresses === 'string') {
          finalAddresses = JSON.parse(rawAddresses)
        } else if (Array.isArray(rawAddresses)) {
          finalAddresses = rawAddresses
        }
      } catch (error) {
        console.warn('Failed to parse addresses from profiles table:', error)
      }
    }

    // Ensure user_type and user_plan are explicitly included
    const completeProfile = {
      ...profileData,
      addresses: finalAddresses,
      user_type: profileData?.user_type ?? 'user',
      user_plan: profileData?.user_plan ?? 'Free',
    }

    return new Response(
      JSON.stringify({
        success: true,
        profile: completeProfile
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Get profile error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: errorMessage
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

