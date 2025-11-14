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
    // Use the correct Supabase URL and service role key
    const supabaseUrl = 'https://eccyqifrzipzrflkcdkd.supabase.co';
    const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjY3lxaWZyemlwenJmbGtjZGtkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY5MDcxNCwiZXhwIjoyMDczMjY2NzE0fQ.qajD-oJGkjiTQzpzj9TFbuDI4UJVWlEl_b3-2ehWIM8';
    
    const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

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

    // Fetch the business card data with template information
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
          requestedCardId: cardId
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Generate vCard content
    const socialLinks = card.social_links as any || {};
    const fieldValues = card.field_values as any || {};
    const template = card.templates as any || {};
    const templateElements = template.elements || [];
    
    let vcard = 'BEGIN:VCARD\n';
    vcard += 'VERSION:3.0\n';
    vcard += `FN:${card.name}\n`;
    vcard += `N:${card.name.split(' ').reverse().join(';')};;;\n`;
    
    // Field mapping for vCard properties
    const processedFields = new Set<string>();
    
    // Process template elements with correct field mapping
    templateElements.forEach((element: any) => {
      const fieldId = element.id;
      const fieldValue = fieldValues[fieldId];
      const fieldType = element.field;
      
      if (!fieldValue || fieldValue.trim() === '') return;
      
      // Map field types to vCard properties
      switch (fieldType) {
        case 'nameEn':
          // English name - add as NOTE
          vcard += `NOTE:Full Name English: ${fieldValue}\n`;
          processedFields.add('NOTE');
          break;
          
        case 'workPosition':
          // Job title
          if (!processedFields.has('TITLE')) {
            vcard += `TITLE:${fieldValue}\n`;
            processedFields.add('TITLE');
          }
          break;
          
        case 'workPhone':
          // Work phone
          if (!processedFields.has('TEL')) {
            vcard += `TEL:${fieldValue}\n`;
            processedFields.add('TEL');
          }
          break;
          
        case 'workEmail':
          // Work email
          if (!processedFields.has('EMAIL')) {
            vcard += `EMAIL:${fieldValue}\n`;
            processedFields.add('EMAIL');
          }
          break;
          
        case 'name':
          // Thai name - add as NOTE
          vcard += `NOTE:Thai Name: ${fieldValue}\n`;
          processedFields.add('NOTE');
          break;
          
        case 'workName':
          // Company name
          if (!processedFields.has('ORG')) {
            vcard += `ORG:${fieldValue}\n`;
            processedFields.add('ORG');
          }
          break;
          
        case 'ที่อยู่':
          // Thai address - add as NOTE
          vcard += `NOTE:Thai Address: ${fieldValue}\n`;
          processedFields.add('NOTE');
          break;
          
        default:
          // Other fields - add as NOTE with field type as label
          const noteLabel = fieldType || fieldId.replace('element-', 'Field ');
          vcard += `NOTE:${noteLabel}: ${fieldValue}\n`;
          break;
      }
    });
    
    // Add website from social_links if not already processed
    if (socialLinks.website && !processedFields.has('URL')) {
      vcard += `URL:${socialLinks.website}\n`;
      processedFields.add('URL');
    }
    
    vcard += 'END:VCARD';

    // Track the vCard generation
    await supabaseClient
      .from('card_views')
      .insert({
        card_id: cardId,
        viewer_ip: req.headers.get('x-forwarded-for') || 'unknown',
        device_info: 'vCard Generated',
      });

    return new Response(vcard, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/vcard',
        'Content-Disposition': `attachment; filename="${card.name.replace(/\s+/g, '_')}.vcf"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating vCard:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
