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
    const supabaseUrl = 'https://eccyqifrzipzrflkcdkd.supabase.co';
    const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjY3lxaWZyemlwenJmbGtjZGtkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY5MDcxNCwiZXhwIjoyMDczMjY2NzE0fQ.qajD-oJGkjiTQzpzj9TFbuDI4UJVWlEl_b3-2ehWIM8';
    
    const supabaseClient = createClient(supabaseUrl, serviceRoleKey);
    const { cardId } = await req.json();

    if (!cardId) {
      return new Response(
        JSON.stringify({ error: 'Card ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: card, error: cardError } = await supabaseClient
      .from('business_cards')
      .select('*, templates (id, name, elements)')
      .eq('id', cardId)
      .single();

    if (cardError || !card) {
      return new Response(
        JSON.stringify({ error: 'Card not found', details: cardError }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fieldValues = card.field_values || {};
    const templateElements = card.templates?.elements || [];
    
    // Find all email-related fields
    const emailFields = templateElements.filter((el: any) => 
      el.field && (
        el.field.includes('email') || 
        el.field.includes('Email') ||
        el.field === 'personalEmail' ||
        el.field === 'workEmail' ||
        el.field === 'homeEmail' ||
        el.field === 'email'
      )
    );
    
    const processingLog = [];
    
    templateElements.forEach((element: any) => {
      const fieldId = element.id;
      const fieldValue = fieldValues[fieldId];
      const fieldType = element.field;
      
      processingLog.push({
        fieldId,
        fieldType,
        fieldValue,
        hasValue: !!(fieldValue && fieldValue.trim() !== '')
      });
    });

    return new Response(
      JSON.stringify({
        success: true,
        cardId: cardId,
        cardName: card.name,
        emailFields: emailFields,
        allFields: processingLog,
        fieldValues: fieldValues,
        templateElementsCount: templateElements.length
      }, null, 2),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('Error in debug function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
