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

    const socialLinks = card.social_links || {};
    const fieldValues = card.field_values || {};
    const templateElements = card.templates?.elements || [];
    
    let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
    
    // Set FN based on available names
    if (thaiNameValue && thaiNameValue.trim() !== '') {
      vcard += `FN:${thaiNameValue}\n`;
    } else if (englishNameValue && englishNameValue.trim() !== '') {
      vcard += `FN:${englishNameValue}\n`;
    } else {
      vcard += `FN:${card.name}\n`;
    }
    
    // Find Thai name for N field
    const thaiNameElement = templateElements.find((el: any) => el.field === 'name');
    const englishNameElement = templateElements.find((el: any) => el.field === 'nameEn');
    const thaiNameValue = thaiNameElement ? fieldValues[thaiNameElement.id] : '';
    const englishNameValue = englishNameElement ? fieldValues[englishNameElement.id] : '';
    
    if (thaiNameValue && thaiNameValue.trim() !== '') {
      vcard += `N:${thaiNameValue.split(' ').reverse().join(';')};;;\n`;
    } else if (englishNameValue && englishNameValue.trim() !== '') {
      vcard += `N:${englishNameValue.split(' ').reverse().join(';')};;;\n`;
    } else {
      vcard += `N:${card.name.split(' ').reverse().join(';')};;;\n`;
    }
    
    const processedFields = new Set();
    
    // Process template elements
    templateElements.forEach((element: any) => {
      const fieldId = element.id;
      const fieldValue = fieldValues[fieldId];
      const fieldType = element.field;
      
      if (!fieldValue || fieldValue.trim() === '') return;
      
      switch (fieldType) {
        case 'nameEn':
          if (!englishNameValue || englishNameValue.trim() === '' || thaiNameValue) {
            vcard += `NOTE:Full Name English: ${fieldValue}\n`;
          }
          break;
        case 'workPosition':
          if (!processedFields.has('TITLE')) {
            vcard += `TITLE:${fieldValue}\n`;
            processedFields.add('TITLE');
          }
          break;
        case 'workPhone':
          vcard += `TEL;TYPE=WORK:${fieldValue}\n`;
          break;
        case 'workEmail':
          vcard += `EMAIL;TYPE=WORK:${fieldValue}\n`;
          break;
        case 'name':
          break; // Already used in N field
        case 'workName':
          if (!processedFields.has('ORG')) {
            vcard += `ORG:${fieldValue}\n`;
            processedFields.add('ORG');
          }
          break;
        case 'ที่อยู่':
          // First address goes to WORK, second goes to HOME
          if (!processedFields.has('WORK_ADDR')) {
            vcard += `ADR;TYPE=WORK:;;${fieldValue};;;;\n`;
            processedFields.add('WORK_ADDR');
          } else {
            vcard += `ADR;TYPE=HOME:;;${fieldValue};;;;\n`;
          }
          break;
        case 'personalPhone':
        case 'mobile':
        case 'phone':
          vcard += `TEL;TYPE=CELL:${fieldValue}\n`;
          break;
        case 'personalEmail':
        case 'homeEmail':
        case 'email':
          vcard += `EMAIL;TYPE=HOME:${fieldValue}\n`;
          break;
        case 'homeAddress':
        case 'address':
          vcard += `ADR;TYPE=HOME:;;${fieldValue};;;;\n`;
          break;
        case 'linkedin':
        case 'facebook':
        case 'twitter':
        case 'instagram':
          vcard += `URL;TYPE=${fieldType.toUpperCase()}:${fieldValue}\n`;
          break;
        case 'line':
        case 'lineId':
        case 'lineID':
          vcard += `NOTE:Line ID: ${fieldValue}\n`;
          break;
        case 'website':
        case 'homepage':
          if (!processedFields.has('URL')) {
            vcard += `URL:${fieldValue}\n`;
            processedFields.add('URL');
          }
          break;
        case 'birthday':
        case 'birthDate':
          vcard += `BDAY:${fieldValue}\n`;
          break;
        case 'department':
        case 'dept':
          vcard += `NOTE:Department: ${fieldValue}\n`;
          break;
        case 'office':
        case 'officeLocation':
          vcard += `NOTE:Office: ${fieldValue}\n`;
          break;
        default:
          const noteLabel = fieldType || fieldId.replace('element-', 'Field ');
          vcard += `NOTE:${noteLabel}: ${fieldValue}\n`;
          break;
      }
    });
    
    // Add website from social_links if not already processed
    if (socialLinks.website && !processedFields.has('URL')) {
      vcard += `URL:${socialLinks.website}\n`;
    }
    
    vcard += 'END:VCARD';

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
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
