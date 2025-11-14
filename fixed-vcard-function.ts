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
          requestedCardId: cardId,
          supabaseUrl: supabaseUrl
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
    
    // Process template elements - debug and fix pattern matching
    templateElements.forEach((element: any) => {
      const fieldId = element.id;
      const fieldValue = fieldValues[fieldId] || element.content;
      const fieldLabel = element.label || element.name || fieldId;
      
      if (!fieldValue || fieldValue.trim() === '') return;
      
      // Debug: Log field information
      console.log(`Processing field: ${fieldId}, label: ${fieldLabel}, value: ${fieldValue}`);
      
      // Simple pattern matching for field types
      if (/^(\+?66|0)[0-9]{8,9}$/.test(fieldValue) || /[0-9]{8,}/.test(fieldValue)) {
        // Phone number
        vcard += `TEL:${fieldValue}\n`;
        console.log(`Added TEL: ${fieldValue}`);
      } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fieldValue)) {
        // Email
        vcard += `EMAIL:${fieldValue}\n`;
        console.log(`Added EMAIL: ${fieldValue}`);
      } else if (fieldValue.startsWith('http') || fieldValue.includes('.com') || fieldValue.includes('.co.th')) {
        // Website
        vcard += `URL:${fieldValue}\n`;
        console.log(`Added URL: ${fieldValue}`);
      } else {
        // Custom fields as NOTE with better labels
        let noteLabel = fieldLabel.replace(/^[Ee]lement-\d+:\s*/, '');
        
        // If noteLabel is empty or still contains element, use a default based on fieldId or value
        if (!noteLabel || noteLabel.trim() === '' || noteLabel.includes('element-')) {
          // Try to infer label from fieldId or value
          if (fieldId.includes('5114554') || fieldValue.includes('Chutchapong')) {
            noteLabel = 'Full Name English';
          } else if (fieldId.includes('5178930') || fieldValue.includes('Manager')) {
            noteLabel = 'Job Title';
          } else if (fieldId.includes('5307353') || fieldValue.includes('ชัชพงษ์')) {
            noteLabel = 'Thai Name';
          } else if (fieldId.includes('5425772') || fieldValue.includes('SCGJWD')) {
            noteLabel = 'Company Name';
          } else if (fieldId.includes('5468633') || fieldValue.includes('ถ.ปูนซิเมนต์ไทย')) {
            noteLabel = 'Thai Address';
          } else {
            noteLabel = `Field ${fieldId}`;
          }
        }
        
        vcard += `NOTE:${noteLabel}: ${fieldValue}\n`;
        console.log(`Added NOTE: ${noteLabel}: ${fieldValue}`);
      }
    });
    
    // Add basic fields as fallback (only if not already processed)
    if (card.job_title && !vcard.includes('TITLE:') && !vcard.includes('Job Title:')) {
      vcard += `TITLE:${card.job_title}\n`;
      console.log(`Added fallback TITLE: ${card.job_title}`);
    }
    
    if (card.company && !vcard.includes('ORG:') && !vcard.includes('Company Name:')) {
      vcard += `ORG:${card.company}\n`;
      console.log(`Added fallback ORG: ${card.company}`);
    }
    
    if (card.phone && !vcard.includes('TEL:')) {
      vcard += `TEL:${card.phone}\n`;
      console.log(`Added fallback TEL: ${card.phone}`);
    }
    
    if (card.email && !vcard.includes('EMAIL:')) {
      vcard += `EMAIL:${card.email}\n`;
      console.log(`Added fallback EMAIL: ${card.email}`);
    }
    
    if (card.address && !vcard.includes('ADR:') && !vcard.includes('Thai Address:')) {
      vcard += `ADR:;;${card.address};;;;\n`;
      console.log(`Added fallback ADR: ${card.address}`);
    }
    
    if (socialLinks.website && !vcard.includes('URL:')) {
      vcard += `URL:${socialLinks.website}\n`;
      console.log(`Added fallback URL: ${socialLinks.website}`);
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
  } catch (error) {
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
