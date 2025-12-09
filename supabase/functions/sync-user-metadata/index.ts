import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the request body
    const { userId } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 1. ดึงข้อมูลที่อยู่จาก table addresses
    const { data: addresses, error: addressesError } = await supabaseClient
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false })

    if (addressesError) {
      console.error('Error fetching addresses:', addressesError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch addresses',
          details: addressesError.message
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Find primary address or most recent one
    let primaryAddress = null
    if (addresses && addresses.length > 0) {
      primaryAddress = addresses.find((addr: any) => addr.is_primary) || addresses[0]
    }

    // Build address parts
    const addressParts = []
    if (primaryAddress) {
      if (primaryAddress.address) addressParts.push(primaryAddress.address)
      if (primaryAddress.tambon) addressParts.push(primaryAddress.tambon)
      if (primaryAddress.district) addressParts.push(primaryAddress.district)
      if (primaryAddress.province) addressParts.push(primaryAddress.province)
      if (primaryAddress.postal_code) addressParts.push(primaryAddress.postal_code)
    }

    const combinedAddress = addressParts.join(' ')

    // Get current user metadata
    const { data: { user }, error: userError } = await supabaseClient.auth.admin.getUserById(userId)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const currentMetadata = user.user_metadata || {}

    // Update metadata with address information
    let updatedMetadata
    if (addresses && addresses.length > 0) {
      updatedMetadata = {
        ...currentMetadata,
        address: combinedAddress,
        address_detail: primaryAddress?.address || '',
        tambon: primaryAddress?.tambon || '',
        district: primaryAddress?.district || '',
        province: primaryAddress?.province || '',
        postal_code: primaryAddress?.postal_code || '',
        place: primaryAddress?.place || '',
        addresses: addresses // เก็บข้อมูล addresses ทั้งหมด
      }
    } else {
      // ไม่มีข้อมูลที่อยู่ ให้ลบข้อมูลที่อยู่จาก metadata
      updatedMetadata = {
        ...currentMetadata,
        address: '',
        address_detail: '',
        tambon: '',
        district: '',
        province: '',
        postal_code: '',
        place: '',
        addresses: []
      }
    }

    // Update user metadata
    const { error: updateError } = await supabaseClient.auth.admin.updateUserById(userId, {
      user_metadata: updatedMetadata
    })

    if (updateError) {
      console.error('Error updating user metadata:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update user metadata' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Successfully synced user metadata:', {
      userId,
      addressCount: addresses?.length || 0,
      primaryAddress: combinedAddress
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: addresses && addresses.length > 0 
          ? 'User metadata synced successfully'
          : 'User metadata cleared (no addresses found)',
        data: {
          addresses: addresses?.length || 0,
          primaryAddress: combinedAddress
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Sync error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
