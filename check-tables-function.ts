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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { cardId } = await req.json();

    // Try different table names
    const tableNames = [
      'business_cards',
      'business_card', 
      'cards',
      'card',
      'user_cards',
      'user_card'
    ];

    const results = {};

    for (const tableName of tableNames) {
      try {
        const { data, error } = await supabaseClient
          .from(tableName)
          .select('id, name, user_id')
          .limit(3);
        
        results[tableName] = {
          success: !error,
          data: data,
          error: error?.message || null,
          count: data?.length || 0
        };
      } catch (err) {
        results[tableName] = {
          success: false,
          data: null,
          error: err.message,
          count: 0
        };
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Table check function',
        requestedCardId: cardId,
        tableResults: results,
        supabaseUrl: Deno.env.get('SUPABASE_URL'),
        hasServiceRoleKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
        hasAnonKey: !!Deno.env.get('SUPABASE_ANON_KEY')
      }, null, 2),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: 'Function error', 
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
