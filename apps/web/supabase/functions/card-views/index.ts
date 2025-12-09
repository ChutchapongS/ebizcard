import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client (no auth required for public card view tracking)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (req.method === 'POST') {
      const { cardId, deviceInfo, cardName } = await req.json()

      if (!cardId) {
        return new Response(
          JSON.stringify({ success: false, message: 'cardId is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get client IP from headers
      const forwardedFor = req.headers.get('x-forwarded-for')
      const clientIp = forwardedFor?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'

      // Insert card view
      const { error } = await supabase
        .from('card_views')
        .insert({
          card_id: cardId,
          card_name: cardName ? cardName.toString().slice(0, 255) : null,
          viewer_ip: clientIp,
          device_info: (deviceInfo || '').toString().slice(0, 512),
        })

      if (error) {
        console.error('Failed to record card view:', error)
        return new Response(
          JSON.stringify({ success: false, message: 'Failed to record card view', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Card view tracking error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

