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
    
    // Find Thai name and English name from template elements
    const thaiNameElement = templateElements.find((el: any) => el.field === 'name');
    const englishNameElement = templateElements.find((el: any) => el.field === 'nameEn');
    
    const thaiNameValue = thaiNameElement ? fieldValues[thaiNameElement.id] : '';
    const englishNameValue = englishNameElement ? fieldValues[englishNameElement.id] : '';
    
    if (thaiNameValue && thaiNameValue.trim() !== '') {
      // Use Thai name in N field
      vcard += `N:${thaiNameValue.split(' ').reverse().join(';')};;;\n`;
    } else if (englishNameValue && englishNameValue.trim() !== '') {
      // Use English name in N field
      vcard += `N:${englishNameValue.split(' ').reverse().join(';')};;;\n`;
    } else {
      // Fallback to card name
      vcard += `N:${card.name.split(' ').reverse().join(';')};;;\n`;
    }
    
    // Field mapping for vCard properties
    const processedFields = new Set<string>();
    const fieldCounts = new Map<string, number>();
    
    // Process template elements with correct field mapping
    templateElements.forEach((element: any) => {
      const fieldId = element.id;
      const fieldValue = fieldValues[fieldId];
      const fieldType = element.field;
      
      if (!fieldValue || fieldValue.trim() === '') return;
      
      // Map field types to vCard properties
      switch (fieldType) {
        case 'nameEn':
          // English name - add as NOTE only if not used in N field
          if (!englishNameValue || englishNameValue.trim() === '' || thaiNameValue) {
            vcard += `NOTE:Full Name English: ${fieldValue}\n`;
            processedFields.add('NOTE');
          }
          break;
          
        case 'workPosition':
          // Job title
          if (!processedFields.has('TITLE')) {
            vcard += `TITLE:${fieldValue}\n`;
            processedFields.add('TITLE');
          }
          break;
          
        case 'workPhone':
          // Work phone - add as TEL with WORK type
          vcard += `TEL;TYPE=WORK:${fieldValue}\n`;
          break;
          
        case 'workEmail':
          // Work email - add as EMAIL with WORK type
          vcard += `EMAIL;TYPE=WORK:${fieldValue}\n`;
          break;
          
        case 'name':
          // Thai name - already used in N field, skip NOTE
          break;
          
        case 'workName':
          // Company name
          if (!processedFields.has('ORG')) {
            vcard += `ORG:${fieldValue}\n`;
            processedFields.add('ORG');
          }
          break;
          
        case 'ที่อยู่':
          // Thai address - add as ADR with WORK type
          vcard += `ADR;TYPE=WORK:;;${fieldValue};;;;\n`;
          break;
          
        case 'personalPhone':
        case 'mobile':
        case 'phone':
          // Personal phone - always add as TEL with CELL type
          vcard += `TEL;TYPE=CELL:${fieldValue}\n`;
          break;
          
        case 'personalEmail':
        case 'homeEmail':
        case 'email':
          // Personal email - always add as EMAIL with HOME type
          vcard += `EMAIL;TYPE=HOME:${fieldValue}\n`;
          break;
          
        case 'homeAddress':
        case 'address':
          // Home address - add as ADR with HOME type
          vcard += `ADR;TYPE=HOME:;;${fieldValue};;;;\n`;
          break;
          
        case 'linkedin':
        case 'facebook':
        case 'twitter':
        case 'instagram':
          // Social media - add as URL with type
          vcard += `URL;TYPE=${fieldType.toUpperCase()}:${fieldValue}\n`;
          processedFields.add('URL');
          break;
          
        case 'line':
        case 'lineId':
        case 'lineID':
          // Line ID - add as NOTE
          vcard += `NOTE:Line ID: ${fieldValue}\n`;
          processedFields.add('NOTE');
          break;
          
        case 'website':
        case 'homepage':
          // Website - add as URL
          if (!processedFields.has('URL')) {
            vcard += `URL:${fieldValue}\n`;
            processedFields.add('URL');
          }
          break;
          
        case 'birthday':
        case 'birthDate':
          // Birthday - add as BDAY
          vcard += `BDAY:${fieldValue}\n`;
          break;
          
        case 'department':
        case 'dept':
          // Department - add as NOTE
          vcard += `NOTE:Department: ${fieldValue}\n`;
          processedFields.add('NOTE');
          break;
          
        case 'office':
        case 'officeLocation':
          // Office location - add as NOTE
          vcard += `NOTE:Office: ${fieldValue}\n`;
          processedFields.add('NOTE');
          break;
          
        default:
          // Other fields - add as NOTE with field type as label
          const noteLabel = fieldType || fieldId.replace('element-', 'Field ');
          vcard += `NOTE:${noteLabel}: ${fieldValue}\n`;
          processedFields.add('NOTE');
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
