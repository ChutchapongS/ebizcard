import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Use service role key for testing (bypasses RLS)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { cardId } = await req.json();

    if (!cardId) {
      return new Response(
        JSON.stringify({ error: 'Card ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // First, let's check if the card exists at all
    const { data: allCards, error: allCardsError } = await supabaseClient
      .from('business_cards')
      .select('id, name, user_id')
      .limit(10);

    const { data: card, error: cardError } = await supabaseClient
      .from('business_cards')
      .select(`
        *,
        templates (
          id,
          name,
          elements
        )
      `)
      .eq('id', cardId)
      .single();

    if (cardError || !card) {
      return new Response(
        JSON.stringify({ 
          error: 'Card not found', 
          details: cardError,
          requestedCardId: cardId,
          availableCards: allCards,
          totalCards: allCards?.length || 0
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Return debug information as JSON
    const debugInfo = {
      cardId: cardId,
      cardData: card,
      fieldValues: card.field_values,
      templateId: card.template_id,
      templateData: card.templates,
      templateElements: card.templates?.elements || [],
      socialLinks: card.social_links,
      hasFieldValues: Object.keys(card.field_values || {}).length > 0,
      hasTemplateElements: (card.templates?.elements || []).length > 0,
      fieldValuesKeys: Object.keys(card.field_values || {}),
      templateElementTypes: (card.templates?.elements || []).map((el: any) => ({
        id: el.id,
        type: el.type || el.field_type,
        label: el.label || el.name,
        content: el.content
      }))
    };

    return new Response(
      JSON.stringify(debugInfo, null, 2),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        stack: error.stack 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
