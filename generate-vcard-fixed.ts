import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const supabaseUrl = 'https://eccyqifrzipzrflkcdkd.supabase.co';
    const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjY3lxaWZyemlwenJmbGtjZGtkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY5MDcxNCwiZXhwIjoyMDczMjY2NzE0fQ.qajD-oJGkjiTQzpzj9TFbuDI4UJVWlEl_b3-2ehWIM8';
    const supabaseClient = createClient(supabaseUrl, serviceRoleKey);
    const { cardId } = await req.json();
    if (!cardId) {
      return new Response(JSON.stringify({
        error: 'Card ID is required'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const { data: card, error: cardError } = await supabaseClient.from('business_cards').select('*, templates (id, name, elements)').eq('id', cardId).single();
    if (cardError || !card) {
      return new Response(JSON.stringify({
        error: 'Card not found',
        details: cardError
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const fieldValues = card.field_values || {};
    const templateElements = card.templates?.elements || [];

    // Generate vCard content
    let vcardContent = 'BEGIN:VCARD\n';
    vcardContent += 'VERSION:3.0\n';

    // Track processed fields to avoid duplicates
    const processedFields = new Set();
    
    // Collect names and notes for processing
    let englishName = '';
    let thaiName = '';
    let allNotes = [];
    let otherFields = [];
    
    // First pass: collect names and notes
    templateElements.forEach((element) => {
      const fieldId = element.id;
      const fieldValue = fieldValues[fieldId];
      
      if (fieldValue && fieldValue.trim() !== '') {
        const fieldType = element.field || '';
        
        console.log('Processing element:', {
          fieldId: fieldId,
          fieldType: fieldType,
          fieldValue: fieldValue
        });
        
        // Check if this is an English name
        if (fieldType === 'nameEn') {
          englishName = fieldValue;
        }
        
        // Check if this is a Thai name
        if (fieldType === 'name') {
          thaiName = fieldValue;
        }
        
        // Collect notes in order
        if (fieldType === 'workDepartment') {
          allNotes.push(`Department: ${fieldValue}`);
        }
        if (fieldType === 'line' || fieldType === 'line_id') {
          allNotes.push(`Line ID: ${fieldValue}`);
        }
        if (fieldType === 'facebook') {
          allNotes.push(`Facebook: ${fieldValue}`);
        }
        if (fieldType === 'linkedin') {
          allNotes.push(`LinkedIn: ${fieldValue}`);
        }
        if (fieldType === 'twitter') {
          allNotes.push(`Twitter: ${fieldValue}`);
        }
        if (fieldType === 'instagram') {
          allNotes.push(`Instagram: ${fieldValue}`);
        }
        if (fieldType === 'tiktok') {
          allNotes.push(`TikTok: ${fieldValue}`);
        }
        
        // Collect other fields that are not bound to specific field types
        if (!fieldType && fieldValue && fieldValue.trim() !== '') {
          otherFields.push(fieldValue);
        }
      }
    });
    
    // Add names based on logic
    if (englishName && thaiName) {
      // Both names exist: use English for FN/N, Thai in NOTE
      vcardContent += `FN:${englishName}\n`;
      vcardContent += `N:${englishName};;;;\n`;
      allNotes.unshift(`Thai Name: ${thaiName}`); // Add Thai name at the beginning
    } else if (thaiName) {
      // Only Thai name exists: use Thai for FN/N (don't add to NOTE)
      vcardContent += `FN:${thaiName}\n`;
      vcardContent += `N:${thaiName};;;;\n`;
    } else if (englishName) {
      // Only English name exists: use English for FN/N
      vcardContent += `FN:${englishName}\n`;
      vcardContent += `N:${englishName};;;;\n`;
    }
    
    // Add all notes as a single NOTE field in the specified order
    console.log('All notes collected:', allNotes);
    console.log('Other fields collected:', otherFields);
    
    let finalNotes = [...allNotes];
    if (otherFields.length > 0) {
      finalNotes = finalNotes.concat(otherFields);
    }
    
    if (finalNotes.length > 0) {
      vcardContent += `NOTE:${finalNotes.join(' | ')}\n`;
    }

    // Process template elements
    templateElements.forEach((element)=>{
      const fieldId = element.id;
      const fieldValue = fieldValues[fieldId];
      if (fieldValue && fieldValue.trim() !== '') {
        const fieldType = element.field || '';
        
         // Skip name fields and note fields as they're already processed
         if (fieldType === 'name' || fieldType === 'nameEn' || 
             fieldType === 'workDepartment' || fieldType === 'facebook' || 
             fieldType === 'linkedin' || fieldType === 'twitter' || 
             fieldType === 'instagram' || fieldType === 'line' || 
             fieldType === 'line_id' || fieldType === 'tiktok') {
           return;
         }
         
        
        // Map field types to vCard properties
        switch(fieldType){
          case 'workPosition':
          case 'jobTitle':
            if (!processedFields.has('TITLE')) {
              vcardContent += `TITLE:${fieldValue}\n`;
              processedFields.add('TITLE');
            }
            break;
          case 'workName':
          case 'company':
            if (!processedFields.has('ORG')) {
              vcardContent += `ORG:${fieldValue}\n`;
              processedFields.add('ORG');
            }
            break;
          case 'workPhone':
          case 'phone':
            if (!processedFields.has('TEL')) {
              vcardContent += `TEL;TYPE=WORK:${fieldValue}\n`;
              processedFields.add('TEL');
            }
            break;
          case 'personalPhone':
            vcardContent += `TEL;TYPE=HOME:${fieldValue}\n`;
            break;
          case 'workEmail':
          case 'email':
            if (!processedFields.has('EMAIL')) {
              vcardContent += `EMAIL;TYPE=WORK:${fieldValue}\n`;
              processedFields.add('EMAIL');
            }
            break;
          case 'personalEmail':
            vcardContent += `EMAIL;TYPE=HOME:${fieldValue}\n`;
            break;
          case 'workWebsite':
          case 'website':
            if (!processedFields.has('URL')) {
              vcardContent += `URL:${fieldValue}\n`;
              processedFields.add('URL');
            }
            break;
          case 'ที่อยู่':
          case 'address':
          case 'homeAddress':
            vcardContent += `ADR;TYPE=HOME:;;${fieldValue};;;;\n`;
            break;
          default:
            // For other fields, add as NOTE
            if (fieldType && fieldType.trim() !== '') {
              vcardContent += `NOTE:${fieldType}: ${fieldValue}\n`;
            } else {
              // If no field type, just add the value as NOTE
              vcardContent += `NOTE:${fieldValue}\n`;
            }
            break;
        }
      } else if (element.content && element.content.trim() !== '') {
        // If no field value but has element content, add as NOTE
        const fieldType = element.field || '';
        if (fieldType && fieldType.trim() !== '') {
          vcardContent += `NOTE:${fieldType}: ${element.content}\n`;
        } else {
          vcardContent += `NOTE:${element.content}\n`;
        }
      }
    });
    vcardContent += 'END:VCARD\n';
    return new Response(vcardContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/vcard',
        'Content-Disposition': `attachment; filename="${card.name || 'business-card'}.vcf"`
      }
    });
  } catch (error) {
    console.error('Error in vCard generation:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});