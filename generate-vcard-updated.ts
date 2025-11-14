import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the card ID from the request
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
        JSON.stringify({ error: 'Card not found' }),
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
    
    // ใช้ข้อมูลจาก field_values เป็นหลัก ถ้าไม่มีค่อยใช้ข้อมูลพื้นฐาน
    const getFieldValue = (fieldKey: string, fallback?: string) => {
      return fieldValues[fieldKey] || fallback;
    };
    
    // ฟังก์ชันสำหรับดึงค่าจาก template elements
    const getTemplateFieldValue = (fieldId: string) => {
      if (fieldValues[fieldId]) {
        return fieldValues[fieldId];
      }
      
      // หา element จาก template ที่มี id ตรงกับ fieldId
      const element = templateElements.find((el: any) => el.id === fieldId);
      if (element && element.content) {
        return element.content;
      }
      
      return null;
    };
    
    // ประมวลผลข้อมูลจาก template elements
    templateElements.forEach((element: any) => {
      const fieldId = element.id;
      const fieldValue = getTemplateFieldValue(fieldId);
      const fieldType = element.type || element.field_type || '';
      const fieldLabel = element.label || element.name || fieldId;
      
      if (!fieldValue || fieldValue.trim() === '') return;
      
      // แปลง field type เป็น vCard format
      switch (fieldType.toLowerCase()) {
        case 'name':
        case 'full_name':
          if (fieldValue !== card.name) {
            vcard = vcard.replace(`FN:${card.name}`, `FN:${fieldValue}`);
            vcard = vcard.replace(`N:${card.name.split(' ').reverse().join(';')}`, `N:${fieldValue.split(' ').reverse().join(';')}`);
          }
          break;
          
        case 'job_title':
        case 'title':
        case 'position':
          vcard += `TITLE:${fieldValue}\n`;
          break;
          
        case 'company':
        case 'organization':
          vcard += `ORG:${fieldValue}\n`;
          break;
          
        case 'phone':
        case 'telephone':
        case 'mobile':
          vcard += `TEL:${fieldValue}\n`;
          break;
          
        case 'email':
        case 'email_address':
          vcard += `EMAIL:${fieldValue}\n`;
          break;
          
        case 'address':
        case 'location':
          vcard += `ADR:;;${fieldValue};;;;\n`;
          break;
          
        case 'website':
        case 'url':
        case 'web':
          vcard += `URL:${fieldValue}\n`;
          break;
          
        case 'linkedin':
          vcard += `URL:${fieldValue}\n`;
          break;
          
        case 'facebook':
          vcard += `URL:${fieldValue}\n`;
          break;
          
        case 'twitter':
          vcard += `URL:${fieldValue}\n`;
          break;
          
        case 'instagram':
          vcard += `URL:${fieldValue}\n`;
          break;
          
        default:
          // ฟิลด์อื่นๆ เพิ่มเป็น NOTE
          const noteLabel = fieldLabel.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
          vcard += `NOTE:${noteLabel}: ${fieldValue}\n`;
          break;
      }
    });
    
    // ใช้ข้อมูลพื้นฐานเป็น fallback ถ้าไม่มีใน template
    if (!templateElements.some((el: any) => el.type === 'job_title' || el.type === 'title')) {
      const jobTitle = getFieldValue('job_title', card.job_title);
      if (jobTitle) {
        vcard += `TITLE:${jobTitle}\n`;
      }
    }
    
    if (!templateElements.some((el: any) => el.type === 'company' || el.type === 'organization')) {
      const company = getFieldValue('company', card.company);
      if (company) {
        vcard += `ORG:${company}\n`;
      }
    }
    
    if (!templateElements.some((el: any) => el.type === 'phone' || el.type === 'telephone' || el.type === 'mobile')) {
      const phone = getFieldValue('phone', card.phone);
      if (phone) {
        vcard += `TEL:${phone}\n`;
      }
    }
    
    if (!templateElements.some((el: any) => el.type === 'email' || el.type === 'email_address')) {
      const email = getFieldValue('email', card.email);
      if (email) {
        vcard += `EMAIL:${email}\n`;
      }
    }
    
    if (!templateElements.some((el: any) => el.type === 'address' || el.type === 'location')) {
      const address = getFieldValue('address', card.address);
      if (address) {
        vcard += `ADR:;;${address};;;;\n`;
      }
    }
    
    // เพิ่มข้อมูลจาก social_links ถ้ายังไม่มี
    if (!templateElements.some((el: any) => el.type === 'website' || el.type === 'url')) {
      if (socialLinks.website) {
        vcard += `URL:${socialLinks.website}\n`;
      }
    }
    
    if (!templateElements.some((el: any) => el.type === 'linkedin')) {
      if (socialLinks.linkedin) {
        vcard += `URL:${socialLinks.linkedin}\n`;
      }
    }
    
    if (!templateElements.some((el: any) => el.type === 'facebook')) {
      if (socialLinks.facebook) {
        vcard += `URL:${socialLinks.facebook}\n`;
      }
    }
    
    if (!templateElements.some((el: any) => el.type === 'twitter')) {
      if (socialLinks.twitter) {
        vcard += `URL:${socialLinks.twitter}\n`;
      }
    }
    
    if (!templateElements.some((el: any) => el.type === 'instagram')) {
      if (socialLinks.instagram) {
        vcard += `URL:${socialLinks.instagram}\n`;
      }
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
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
