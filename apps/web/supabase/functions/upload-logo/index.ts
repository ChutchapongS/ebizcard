import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { authenticateUser, getSupabaseClient } from '../_shared/auth.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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

    const supabase = getSupabaseClient()

    if (req.method === 'POST') {
      const formData = await req.formData()
      const file = formData.get('logo') as File || formData.get('company_logo') as File
      const logoType = formData.get('type') as string || (formData.get('company_logo') ? 'company' : 'logo')

      if (!file) {
        return new Response(
          JSON.stringify({ error: 'No file provided' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        return new Response(
          JSON.stringify({ error: 'Invalid file type. Please upload an image.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return new Response(
          JSON.stringify({ error: 'File size too large. Maximum 5MB allowed.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Generate unique filename
      const timestamp = Date.now()
      const fileExtension = file.name.split('.').pop() || 'png'
      const fileName = logoType === 'company' 
        ? `company-logo-${user.id}-${timestamp}.${fileExtension}`
        : `logo-${timestamp}.${fileExtension}`
      
      // Determine bucket and path based on logo type
      const bucket = logoType === 'company' ? 'avatars' : 'business-cards'
      const filePath = logoType === 'company' 
        ? `company-logos/${fileName}`
        : `logos/${fileName}`

      // Convert File to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, uint8Array, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: logoType === 'company', // Allow overwrite for company logos
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return new Response(
          JSON.stringify({ error: 'Failed to upload file', details: uploadError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      const publicUrl = urlData.publicUrl

      // If company logo, update profiles table
      if (logoType === 'company') {
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email,
            company_logo: publicUrl,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          })

        if (profileUpdateError) {
          console.warn('Could not update profiles table:', profileUpdateError)
          // Continue anyway, the image is uploaded successfully
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          url: publicUrl,
          imageUrl: publicUrl, // For compatibility
          filename: fileName,
          bucket,
          size: file.size
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Upload error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

