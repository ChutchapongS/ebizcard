import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'
import { authenticateUser, getSupabaseClient } from '../_shared/auth.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = getSupabaseClient()

    // GET - Fetch addresses for a user
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

      // Get userId from query params or use authenticated user
      const url = new URL(req.url)
      const userId = url.searchParams.get('userId') || user.id

      // Only allow users to fetch their own addresses (unless admin)
      if (userId !== user.id) {
        // Check if user is admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', user.id)
          .single()

        if (profile?.user_type !== 'admin' && profile?.user_type !== 'owner') {
          return new Response(
            JSON.stringify({ error: 'Forbidden', details: 'Cannot access other users\' addresses' }),
            { 
              status: 403, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
      }

      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching addresses:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch addresses', details: error.message }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ data, error: null }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // POST - Create or update addresses (replace strategy)
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

      const body = await req.json().catch(() => null)

      if (!body || typeof body !== 'object') {
        return new Response(
          JSON.stringify({ error: 'Invalid request body' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const { userId, addresses, address } = body

      // Handle single address save (from save-address API)
      if (address) {
        const targetUserId = address.user_id || userId || user.id

        // Only allow users to save their own addresses
        if (targetUserId !== user.id) {
          return new Response(
            JSON.stringify({ error: 'Forbidden', details: 'Cannot save addresses for other users' }),
            { 
              status: 403, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Check if address with same user_id and type already exists
        const { data: existingAddress, error: checkError } = await supabase
          .from('addresses')
          .select('id')
          .eq('user_id', targetUserId)
          .eq('type', address.type)
          .maybeSingle()

        if (checkError) {
          console.error('Error checking existing address:', checkError)
          return new Response(
            JSON.stringify({ error: checkError.message }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        let result
        if (existingAddress) {
          // Update existing address
          const { data, error: updateError } = await supabase
            .from('addresses')
            .update(address)
            .eq('id', existingAddress.id)
            .select('id')
            .single()

          if (updateError) {
            console.error('Error updating address:', updateError)
            return new Response(
              JSON.stringify({ error: updateError.message }),
              { 
                status: 500, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            )
          }

          result = data
        } else {
          // Insert new address
          const { data, error: insertError } = await supabase
            .from('addresses')
            .insert([address])
            .select('id')
            .single()

          if (insertError) {
            console.error('Error inserting address:', insertError)
            return new Response(
              JSON.stringify({ error: insertError.message }),
              { 
                status: 500, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            )
          }

          result = data
        }

        return new Response(
          JSON.stringify({ 
            id: result.id, 
            message: existingAddress ? 'Address updated successfully' : 'Address saved successfully' 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Handle multiple addresses (upsert strategy - from update-addresses API)
      if (!addresses || !Array.isArray(addresses)) {
        return new Response(
          JSON.stringify({ error: 'User ID and addresses array are required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const targetUserId = userId || user.id

      // Only allow users to update their own addresses
      if (targetUserId !== user.id) {
        return new Response(
          JSON.stringify({ error: 'Forbidden', details: 'Cannot update addresses for other users' }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Use upsert strategy instead of delete-all-then-insert
      // This prevents data loss if user ID changes or if there's a race condition
      if (addresses.length > 0) {
        const addressesToUpsert = addresses.map((addr: any) => ({
          user_id: targetUserId,
          type: addr.type || 'home',
          place: addr.place || null,
          address: addr.address || '',
          tambon: addr.tambon || '',
          district: addr.district || '',
          province: addr.province || '',
          postal_code: addr.postalCode || addr.postal_code || null,
          country: addr.country || 'Thailand',
        }))

        // Try upsert first (requires unique constraint on user_id, type)
        const { data: upsertData, error: upsertError } = await supabase
          .from('addresses')
          .upsert(addressesToUpsert, {
            onConflict: 'user_id,type',
            ignoreDuplicates: false
          })
          .select()

        if (upsertError) {
          console.error('Error upserting addresses:', upsertError)
          console.log('Falling back to delete-then-insert strategy')
          
          // Fallback to delete-then-insert if upsert fails (for backward compatibility)
          const { error: deleteError } = await supabase
            .from('addresses')
            .delete()
            .eq('user_id', targetUserId)

          if (deleteError) {
            console.error('Error deleting existing addresses:', deleteError)
            return new Response(
              JSON.stringify({ 
                error: 'Failed to delete existing addresses', 
                details: deleteError.message 
              }),
              { 
                status: 500, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            )
          }

          const { data: insertData, error: insertError } = await supabase
            .from('addresses')
            .insert(addressesToUpsert)
            .select()

          if (insertError) {
            console.error('Error inserting addresses:', insertError)
            return new Response(
              JSON.stringify({ 
                error: 'Failed to insert addresses', 
                details: insertError.message 
              }),
              { 
                status: 500, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            )
          }

          return new Response(
            JSON.stringify({
              success: true,
              message: 'Addresses updated successfully',
              data: insertData
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Addresses updated successfully',
            data: upsertData
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      } else {
        // If addresses array is empty, delete all addresses for this user
        // This allows users to clear all addresses
        const { error: deleteError } = await supabase
          .from('addresses')
          .delete()
          .eq('user_id', targetUserId)

        if (deleteError) {
          console.error('Error deleting addresses:', deleteError)
          return new Response(
            JSON.stringify({ 
              error: 'Failed to delete addresses', 
              details: deleteError.message 
            }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Addresses cleared successfully',
            data: []
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
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
    console.error('Addresses error:', error)
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

