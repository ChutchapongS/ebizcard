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
    
    // Track which fields we've already processed
    const processedFields = new Set();
    
    // Process template elements first
    templateElements.forEach((element: any) => {
      const fieldId = element.id;
      const fieldValue = fieldValues[fieldId] || element.content;
      const fieldType = element.type || element.field_type || '';
      const fieldLabel = element.label || element.name || fieldId;
      
      if (!fieldValue || fieldValue.trim() === '') return;
      
      // Determine field type based on content and label
      let fieldCategory = 'custom';
      
      if (/^(\+?66|0)[0-9]{8,9}$/.test(fieldValue) || /[0-9]{8,}/.test(fieldValue)) {
        fieldCategory = 'phone';
      } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fieldValue)) {
        fieldCategory = 'email';
      } else if (fieldLabel.toLowerCase().includes('company') || fieldLabel.toLowerCase().includes('organization')) {
        fieldCategory = 'company';
      } else if (fieldLabel.toLowerCase().includes('title') || fieldLabel.toLowerCase().includes('position')) {
        fieldCategory = 'title';
      } else if (fieldValue.startsWith('http') || fieldValue.includes('.com') || fieldValue.includes('.co.th')) {
        fieldCategory = 'website';
      }
      
      // Add to vCard based on category
      switch (fieldCategory) {
        case 'phone':
          vcard += `TEL:${fieldValue}\n`;
          processedFields.add('phone');
          break;
        case 'email':
          vcard += `EMAIL:${fieldValue}\n`;
          processedFields.add('email');
          break;
        case 'company':
          vcard += `ORG:${fieldValue}\n`;
          processedFields.add('company');
          break;
        case 'title':
          vcard += `TITLE:${fieldValue}\n`;
          processedFields.add('title');
          break;
        case 'website':
          vcard += `URL:${fieldValue}\n`;
          processedFields.add('website');
          break;
        default:
          // Custom fields as NOTE with better labels
          let noteLabel = fieldLabel.replace(/^Element-\d+:\s*/, '');
          
          if (noteLabel.toLowerCase().includes('full_name') || noteLabel.toLowerCase().includes('english')) {
            noteLabel = 'Full Name English';
          } else if (noteLabel.toLowerCase().includes('thai') || noteLabel.toLowerCase().includes('ชื่อไทย')) {
            noteLabel = 'Thai Name';
          } else if (noteLabel.toLowerCase().includes('address') || noteLabel.toLowerCase().includes('ที่อยู่')) {
            noteLabel = 'Thai Address';
          } else {
            noteLabel = noteLabel.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
          }
          
          vcard += `NOTE:${noteLabel}: ${fieldValue}\n`;
          break;
      }
    });
    
    // Add fallback fields only if not already processed
    if (!processedFields.has('title') && card.job_title) {
      vcard += `TITLE:${card.job_title}\n`;
    }
    
    if (!processedFields.has('company') && card.company) {
      vcard += `ORG:${card.company}\n`;
    }
    
    if (!processedFields.has('phone') && card.phone) {
      vcard += `TEL:${card.phone}\n`;
    }
    
    if (!processedFields.has('email') && card.email) {
      vcard += `EMAIL:${card.email}\n`;
    }
    
    if (!processedFields.has('website') && socialLinks.website) {
      vcard += `URL:${socialLinks.website}\n`;
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
