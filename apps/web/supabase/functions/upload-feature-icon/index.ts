import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { authenticateUser, getSupabaseClient } from '../_shared/auth.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // POST - Upload feature icon (admin only)
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

      const supabase = getSupabaseClient()

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
          JSON.stringify({ error: 'Insufficient permissions. Only admins and owners can upload feature icons.' }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Get form data
      const formData = await req.formData()
      const file = formData.get('icon') as File
      const featureId = formData.get('featureId') as string

      if (!file) {
        return new Response(
          JSON.stringify({ error: 'No file provided' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
      if (!validTypes.includes(file.type)) {
        return new Response(
          JSON.stringify({ error: 'Invalid file type. Only JPEG, PNG, WebP, and SVG are allowed.' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Validate file size (max 2MB for icons)
      const maxSize = 2 * 1024 * 1024 // 2MB
      if (file.size > maxSize) {
        return new Response(
          JSON.stringify({ error: 'File too large. Maximum size is 2MB.' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Generate unique filename
      const timestamp = Date.now()
      const fileExt = file.name.split('.').pop() || 'png'
      const fileName = featureId 
        ? `feature-icon-${featureId}-${timestamp}.${fileExt}`
        : `feature-icon-${timestamp}.${fileExt}`
      const filePath = `public/${fileName}`

      // Convert File to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      // Upload to Supabase Storage (use 'logos' bucket)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, uint8Array, {
          contentType: file.type,
          upsert: true,
          cacheControl: '3600',
        })

      if (uploadError) {
        console.error('❌ Upload error:', uploadError)
        return new Response(
          JSON.stringify({ error: `Failed to upload icon: ${uploadError.message}` }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath)

      const iconUrl = urlData.publicUrl

      return new Response(
        JSON.stringify({
          success: true,
          icon_url: iconUrl,
          message: 'Feature icon uploaded successfully',
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


