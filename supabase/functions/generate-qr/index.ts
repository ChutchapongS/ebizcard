import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { getSupabaseClient } from '../_shared/auth.ts'
import QRCode from 'https://esm.sh/qrcode@1.5.3?target=deno'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = getSupabaseClient()

    if (req.method === 'POST') {
      let body
      try {
        body = await req.json()
      } catch (parseError) {
        console.error('Error parsing request body:', parseError)
        return new Response(
          JSON.stringify({ error: 'Invalid request body', details: 'Request body must be valid JSON' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { cardId } = body

      if (!cardId || typeof cardId !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Card ID is required and must be a string' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verify card exists
      const { data: cardData, error: cardError } = await supabase
        .from('business_cards')
        .select('id, name, job_title, company')
        .eq('id', cardId)
        .single()

      if (cardError || !cardData) {
        console.error('Card not found:', cardError)
        return new Response(
          JSON.stringify({ error: 'Card not found', details: cardError?.message }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get site URL from environment or use default
      const siteUrl = Deno.env.get('NEXT_PUBLIC_SITE_URL') || 
                     Deno.env.get('SITE_URL') || 
                     'http://localhost:3000'
      const normalizedSiteUrl = siteUrl.replace(/\/$/, '')
      const publicUrl = `${normalizedSiteUrl}/card/${cardId}`

      // Generate QR code using qrcode library
      try {
        // Use static import with ?target=deno for Deno Edge Functions compatibility
        // Handle both default export and named export
        const qrcode = QRCode.default || QRCode
        
        const qrCodeDataUrl = await qrcode.toDataURL(publicUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        })

        return new Response(
          JSON.stringify({
            success: true,
            qrCode: qrCodeDataUrl,
            publicUrl,
            card: {
              id: cardData.id,
              name: cardData.name,
              job_title: cardData.job_title,
              company: cardData.company,
            },
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (qrError) {
        console.error('QR Code generation error:', qrError)
        const errorMessage = qrError instanceof Error ? qrError.message : String(qrError)
        const errorStack = qrError instanceof Error ? qrError.stack : undefined
        console.error('QR Error details:', { errorMessage, errorStack })
        
        return new Response(
          JSON.stringify({ 
            error: 'Failed to generate QR code', 
            details: errorMessage,
            stack: errorStack
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('API Error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error details:', { errorMessage, errorStack })
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: errorMessage,
        stack: errorStack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

