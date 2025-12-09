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
    // Authenticate user (optional - can be public if card is public)
    const { user, error: authError } = await authenticateUser(req)
    
    // Note: We allow unauthenticated requests for public cards
    // But we'll check card ownership if user is authenticated

    const supabase = getSupabaseClient()

    if (req.method === 'POST') {
      const { cardId, template, settings, format } = await req.json()

      if (!cardId) {
        return new Response(
          JSON.stringify({ error: 'Card ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get the card data
      const { data: card, error: cardError } = await supabase
        .from('business_cards')
        .select('*')
        .eq('id', cardId)
        .single()

      if (cardError || !card) {
        console.error('Card not found:', cardError)
        return new Response(
          JSON.stringify({ error: 'Card not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if user has permission to export this card
      // If authenticated, check ownership; if not, allow if card is public
      if (user && card.user_id !== user.id) {
        // Check if user is admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', user.id)
          .single()

        if (profile?.user_type !== 'admin' && profile?.user_type !== 'owner') {
          return new Response(
            JSON.stringify({ error: 'Forbidden', details: 'Cannot export other users\' cards' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      // Generate paper card based on template and settings
      const paperCardData = {
        card,
        template,
        settings,
        format
      }

      // TODO: Implement actual file generation
      // For now, return a placeholder response
      // In a real implementation, you would:
      // 1. Use a library like puppeteer, pdfkit, or canvas to generate the file
      // 2. Generate PDF, PNG, or SVG based on format
      // 3. Return the file as a blob

      // For now, return JSON response (client expects blob, but this is a placeholder)
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Paper card export functionality will be implemented',
          data: paperCardData
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

      // Future implementation example:
      // if (format === 'pdf') {
      //   // Generate PDF using pdfkit or similar
      //   const pdfBuffer = await generatePDF(paperCardData)
      //   return new Response(pdfBuffer, {
      //     status: 200,
      //     headers: {
      //       ...corsHeaders,
      //       'Content-Type': 'application/pdf',
      //       'Content-Disposition': `attachment; filename="${card.name}-business-card.pdf"`
      //     }
      //   })
      // } else if (format === 'png') {
      //   // Generate PNG using canvas or similar
      //   const pngBuffer = await generatePNG(paperCardData)
      //   return new Response(pngBuffer, {
      //     status: 200,
      //     headers: {
      //       ...corsHeaders,
      //       'Content-Type': 'image/png',
      //       'Content-Disposition': `attachment; filename="${card.name}-business-card.png"`
      //     }
      //   })
      // }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Export error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

