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
    const normalizeString = (value: unknown) =>
      typeof value === 'string' ? value.trim() || null : null;

    const requestBody = await req.json();
    const cardId = requestBody?.cardId;
    const visitorIdRaw =
      requestBody?.visitorId ??
      requestBody?.visitor_id ??
      requestBody?.visitor?.id;
    const visitorId = normalizeString(visitorIdRaw);
    let visitorName =
      normalizeString(requestBody?.visitorName) ??
      normalizeString(requestBody?.visitor_name) ??
      normalizeString(requestBody?.visitor?.name) ??
      normalizeString(requestBody?.visitor?.full_name);
    let visitorEmail =
      normalizeString(requestBody?.visitorEmail) ??
      normalizeString(requestBody?.visitor_email) ??
      normalizeString(requestBody?.visitor?.email);
    let visitorPhone =
      normalizeString(requestBody?.visitorPhone) ??
      normalizeString(requestBody?.visitor_phone) ??
      normalizeString(requestBody?.visitor?.phone);
    const leadSource =
      normalizeString(requestBody?.source) ??
      normalizeString(requestBody?.leadSource) ??
      normalizeString(requestBody?.utm_source) ??
      'vcard_download';
    let leadNote =
      normalizeString(requestBody?.note) ??
      normalizeString(requestBody?.message) ??
      normalizeString(requestBody?.visitor_note);

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

    if (visitorId && card.user_id) {
      try {
        const { data: visitorProfile, error: visitorProfileError } = await supabaseClient
          .from('profiles')
          .select('id, full_name, email, phone')
          .eq('id', visitorId)
          .maybeSingle();

        if (visitorProfileError) {
          console.error('Error verifying visitor profile:', visitorProfileError);
        } else if (visitorProfile) {
          visitorName = visitorName ?? normalizeString(visitorProfile.full_name);
          visitorEmail = visitorEmail ?? normalizeString(visitorProfile.email);
          visitorPhone = visitorPhone ?? normalizeString(
            (visitorProfile as Record<string, unknown>)?.phone,
          );

          const { error: contactError } = await supabaseClient
            .from('contacts')
            .upsert(
              {
                owner_id: card.user_id,
                visitor_id: visitorId,
                card_id: cardId,
              },
              {
                onConflict: 'owner_id,visitor_id,card_id',
                ignoreDuplicates: true,
              },
            );

          if (contactError) {
            console.error('Error inserting contact record:', contactError);
          }
        } else {
          console.warn('Visitor profile not found, skipping contact logging', { visitorId });
        }
      } catch (contactInsertError) {
        console.error('Unhandled error while inserting contact record:', contactInsertError);
      }
    }

    const leadMeta: Record<string, unknown> = {};
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor?.split(',')[0]?.trim();
    if (ipAddress) {
      leadMeta.ip = ipAddress;
    }

    const userAgent = req.headers.get('user-agent');
    if (userAgent) {
      leadMeta.userAgent = userAgent;
    }

    const referer = req.headers.get('referer') ?? req.headers.get('referrer');
    if (referer) {
      leadMeta.referer = referer;
    }

    if (requestBody?.utm && typeof requestBody.utm === 'object') {
      leadMeta.utm = requestBody.utm;
    }

    if (requestBody?.visitor && typeof requestBody.visitor === 'object') {
      leadMeta.visitorPayload = requestBody.visitor;
    }

    if (requestBody?.metadata && typeof requestBody.metadata === 'object') {
      leadMeta.extraMetadata = requestBody.metadata;
    }

    if (!leadNote && referer) {
      leadNote = `Downloaded via ${referer}`;
    }

    const leadInsert: Record<string, unknown> = {
      owner_id: card.user_id,
      card_id: cardId,
      source: leadSource,
    };

    if (visitorName) {
      leadInsert.name = visitorName;
    }
    if (visitorEmail) {
      leadInsert.email = visitorEmail;
    }
    if (visitorPhone) {
      leadInsert.phone = visitorPhone;
    }
    if (leadNote) {
      leadInsert.note = leadNote;
    }

    if (Object.keys(leadMeta).length > 0) {
      leadInsert.meta = leadMeta;
    }

    try {
      const { error: leadInsertError } = await supabaseClient
        .from('contact_leads')
        .insert(leadInsert);

      if (leadInsertError) {
        console.error('Error inserting contact lead:', leadInsertError);
      }
    } catch (leadUnexpectedError) {
      console.error('Unhandled error while inserting contact lead:', leadUnexpectedError);
    }

    const socialLinks = card.social_links || {};
    const fieldValues = card.field_values || {};
    const templateElements = card.templates?.elements || [];

    const sanitizeText = (text: any) =>
      (text ?? '')
        .toString()
        .replace(/[\r\n]+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();

    const escapeText = (
      text: any,
      options: { escapeSemicolons?: boolean } = {}
    ) => {
      const { escapeSemicolons = true } = options;
      let sanitized = sanitizeText(text);
      sanitized = sanitized
        .replace(/\\/g, '\\\\')
        .replace(/\n/g, '\\n')
        .replace(/,/g, '\\,');
      if (escapeSemicolons) {
        sanitized = sanitized.replace(/;/g, '\\;');
      }
      return sanitized;
    };

    const normalizeUrl = (value: any) => {
      const sanitized = sanitizeText(value);
      if (!sanitized) return '';
      if (/^(https?:\/\/)/i.test(sanitized)) return sanitized;
      if (/^(mailto:)/i.test(sanitized)) return sanitized;
      return `https://${sanitized}`;
    };

    const formatNameComponents = (value: string) => {
      const sanitized = sanitizeText(value);
      if (!sanitized) {
        return ';;;;';
      }
      const parts = sanitized.split(' ');
      if (parts.length === 1) {
        return `;${parts[0]};;;`;
      }
      const family = parts.pop();
      const given = parts.join(' ');
      return `${family};${given};;;`;
    };
    
    // Try to fetch profile as an additional fallback source for social links
    let profileSocial: Record<string, string> = {};
    try {
      if (card.user_id) {
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', card.user_id)
          .single();
        if (profile) {
          profileSocial = {
            facebook: profile.facebook || profile.user_metadata?.facebook || '',
            line: profile.lineId || profile.line || profile.user_metadata?.line_id || '',
            lineid: profile.lineId || profile.line || profile.user_metadata?.line_id || '',
            linkedin: profile.linkedin || profile.user_metadata?.linkedin || '',
            twitter: profile.twitter || profile.user_metadata?.twitter || '',
            instagram: profile.instagram || profile.user_metadata?.instagram || '',
            tiktok: profile.tiktok || profile.user_metadata?.tiktok || '',
            youtube: profile.youtube || profile.user_metadata?.youtube || '',
            telegram: profile.telegram || profile.user_metadata?.telegram || '',
            whatsapp: profile.whatsapp || profile.user_metadata?.whatsapp || '',
            wechat: profile.wechat || profile.user_metadata?.wechat || '',
            snapchat: profile.snapchat || profile.user_metadata?.snapchat || '',
            pinterest: profile.pinterest || profile.user_metadata?.pinterest || '',
            reddit: profile.reddit || profile.user_metadata?.reddit || '',
            discord: profile.discord || profile.user_metadata?.discord || '',
            slack: profile.slack || profile.user_metadata?.slack || '',
            viber: profile.viber || profile.user_metadata?.viber || '',
            skype: profile.skype || profile.user_metadata?.skype || '',
            zoom: profile.zoom || profile.user_metadata?.zoom || '',
            github: profile.github || profile.user_metadata?.github || '',
            twitch: profile.twitch || profile.user_metadata?.twitch || '',
            website: profile.workWebsite || profile.website || profile.user_metadata?.website || ''
          } as Record<string, string>;
        }
      }
    } catch (_) {
      // ignore profile fallback errors
    }
    
    let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
    vcard += `FN;CHARSET=UTF-8:${escapeText(card.name)}\n`;
    
    // Find Thai name for N field
    const thaiNameElement = templateElements.find((el: any) => el.field === 'name');
    const englishNameElement = templateElements.find((el: any) => el.field === 'nameEn');
    const thaiNameValue = thaiNameElement ? fieldValues[thaiNameElement.id] : '';
    const englishNameValue = englishNameElement ? fieldValues[englishNameElement.id] : '';
    
    const hasThai = !!(thaiNameValue && thaiNameValue.trim() !== '');
    const hasEng = !!(englishNameValue && englishNameValue.trim() !== '');
    if (hasEng) {
      vcard += `N;CHARSET=UTF-8:${formatNameComponents(englishNameValue)}\n`;
    } else if (hasThai) {
      vcard += `N;CHARSET=UTF-8:${formatNameComponents(thaiNameValue)}\n`;
    } else {
      vcard += `N;CHARSET=UTF-8:${formatNameComponents(card.name)}\n`;
    }

    // Ordered NOTE groups (will be combined at the end)
    const notePrimaryParts: string[] = [];
    if (hasEng && hasThai) {
      notePrimaryParts.push(`Name (Thai): ${sanitizeText(thaiNameValue)}`);
    }

    const processedFields = new Set();
    
    // Collect NOTE-style social entries to combine into a single NOTE line
    const socialNoteParts: string[] = [];
    
    // Collect all other NOTE entries that should be combined
    const noteParts: string[] = [];
    const appendSocial = (label: string, value: string) => {
      const sanitizedValue = sanitizeText(value);
      const lower = sanitizedValue.toLowerCase();
      if (lower.startsWith('http://') || lower.startsWith('https://')) {
        // True URLs remain separate URL lines
        vcard += `URL;TYPE=${label.toUpperCase()}:${normalizeUrl(sanitizedValue)}\n`;
      } else {
        socialNoteParts.push(`${label}: ${sanitizedValue}`);
      }
    };

    // Process template elements
    templateElements.forEach((element: any) => {
      const fieldId = element.id;
      const fieldType = element.field;
      const isSocialElement = (element.type === 'social');
      // Fallback strategy:
      // 1) explicit user override saved in field_values
      // 2) card.social_links[fieldType] (for old cards created before element existed)
      // 3) profiles table fields (user profile) as last resort
      // 4) for Line allow aliases: line, lineId, lineID
      let fieldValue = fieldValues[fieldId];
      if ((!fieldValue || fieldValue.trim() === '') && fieldType) {
        const lower = fieldType.toLowerCase();
        const fromSocial =
          lower === 'line' || lower === 'lineid' || lower === 'lineid'
            ? (socialLinks['line'] || socialLinks['lineId'] || socialLinks['lineID'] || '')
            : (socialLinks[lower] || '');
        const fromProfile = profileSocial[lower] || '';
        fieldValue = fromSocial || fromProfile;
      }
      
      if (!fieldValue || fieldValue.trim() === '') return;
      
      const fieldTypeLower = (fieldType || '').toLowerCase();
      
      // Debug: log field type and value for troubleshooting
      // console.log(`Processing field: ${fieldType} (${fieldTypeLower}), value: ${fieldValue.substring(0, 50)}...`);
      switch (fieldTypeLower) {
        case 'nameen':
          // Don't add to NOTE if we already have Thai Name
          // Full Name English should not be in NOTE
          break;
        case 'workposition':
          if (!processedFields.has('TITLE')) {
            vcard += `TITLE;CHARSET=UTF-8:${escapeText(fieldValue)}\n`;
            processedFields.add('TITLE');
          }
          break;
        case 'workphone':
          vcard += `TEL;TYPE=WORK:${fieldValue}\n`;
          break;
        case 'workemail':
          vcard += `EMAIL;TYPE=WORK:${fieldValue}\n`;
          break;
        case 'name':
          break; // Already used in N field
        case 'workname':
          if (!processedFields.has('ORG')) {
            vcard += `ORG;CHARSET=UTF-8:${escapeText(fieldValue)}\n`;
            processedFields.add('ORG');
          }
          break;
        case 'ที่อยู่':
          vcard += `ADR;TYPE=WORK;CHARSET=UTF-8:;;${escapeText(fieldValue)};;;;\n`;
          break;
        case 'personalphone':
        case 'mobile':
        case 'phone':
          vcard += `TEL;TYPE=CELL:${fieldValue}\n`;
          break;
        case 'personalemail':
        case 'homeemail':
        case 'email':
          vcard += `EMAIL;TYPE=HOME:${fieldValue}\n`;
          break;
        case 'homeaddress':
        case 'address':
          vcard += `ADR;TYPE=HOME;CHARSET=UTF-8:;;${escapeText(fieldValue)};;;;\n`;
          break;
        case 'linkedin':
        case 'facebook':
        case 'twitter':
        case 'instagram':
        case 'youtube':
        case 'tiktok':
        case 'telegram':
        case 'whatsapp':
        case 'wechat':
        case 'snapchat':
        case 'pinterest':
        case 'reddit':
        case 'discord':
        case 'slack':
        case 'viber':
        case 'skype':
        case 'zoom':
        case 'github':
        case 'twitch':
          appendSocial(fieldTypeLower === 'github' ? 'GitHub' : fieldTypeLower === 'wechat' ? 'WeChat' : fieldTypeLower === 'youtube' ? 'YouTube' : fieldTypeLower === 'tiktok' ? 'TikTok' : fieldTypeLower.charAt(0).toUpperCase() + fieldTypeLower.slice(1), fieldValue);
          break;
        case 'line':
        case 'lineid':
          appendSocial('Line ID', fieldValue);
          break;
        case 'website':
        case 'homepage':
        case 'workwebsite':
          // Website should be URL field, not in NOTE
          if (!processedFields.has('URL')) {
            const normalized = normalizeUrl(fieldValue);
            if (normalized) {
              vcard += `URL:${normalized}\n`;
              processedFields.add('URL');
            }
            processedFields.add('URL');
          }
          break;
        case 'birthday':
        case 'birthdate':
          vcard += `BDAY:${fieldValue}\n`;
          break;
        case 'department':
        case 'dept':
        case 'workdepartment':
          notePrimaryParts.push(`Department: ${sanitizeText(fieldValue)}`);
          break;
        case 'workaddress1':
        case 'work_address1':
        case 'workaddress_1':
          // Work Address 1 → ADR;TYPE=WORK (Work address in Outlook)
          const workAddress1Value = sanitizeText(fieldValue);
          vcard += `ADR;TYPE=WORK;CHARSET=UTF-8:;;${escapeText(workAddress1Value)};;;;\n`;
          break;
        case 'workaddress2':
        case 'work_address2':
        case 'workaddress_2':
          // Work Address 2 → ADR;TYPE=OTHER (Other address in Outlook)
          const workAddress2Value = sanitizeText(fieldValue);
          vcard += `ADR;TYPE=OTHER;CHARSET=UTF-8:;;${escapeText(workAddress2Value)};;;;\n`;
          break;
        case 'personaladdress1':
        case 'personal_address1':
        case 'personaladdress_1':
          // Personal Address 1 → ADR;TYPE=HOME (Home address in Outlook)
          const personalAddress1Value = sanitizeText(fieldValue);
          vcard += `ADR;TYPE=HOME;CHARSET=UTF-8:;;${escapeText(personalAddress1Value)};;;;\n`;
          break;
        case 'personaladdress2':
        case 'personal_address2':
        case 'personaladdress_2':
          // Personal Address 2 → ADR;TYPE=OTHER (Other address in Outlook)
          const personalAddress2Value = sanitizeText(fieldValue);
          vcard += `ADR;TYPE=OTHER;CHARSET=UTF-8:;;${escapeText(personalAddress2Value)};;;;\n`;
          break;
        case 'office':
        case 'officelocation':
          noteParts.push(`Office: ${sanitizeText(fieldValue)}`);
          break;
        default:
          // Priority: if element type is social, always combine into social NOTE
          if (isSocialElement) {
            const label = fieldTypeLower === 'github' ? 'GitHub' : fieldTypeLower === 'wechat' ? 'WeChat' : fieldTypeLower === 'youtube' ? 'YouTube' : fieldTypeLower === 'tiktok' ? 'TikTok' : fieldTypeLower === 'line' || fieldTypeLower === 'lineid' ? 'Line ID' : (fieldType || fieldId.replace('element-', 'Field '));
            appendSocial(label, fieldValue);
            break;
          }
          // Safety net: if field name looks like a social key but didn't match above, treat as social and combine
          const socialKeys = new Set([
            'facebook','instagram','twitter','linkedin','youtube','tiktok','telegram','whatsapp','wechat','snapchat','pinterest','reddit','discord','slack','viber','skype','zoom','github','twitch','line','lineid'
          ]);
          if (socialKeys.has(fieldTypeLower)) {
            const label = fieldTypeLower === 'github' ? 'GitHub' : fieldTypeLower === 'wechat' ? 'WeChat' : fieldTypeLower === 'youtube' ? 'YouTube' : fieldTypeLower === 'tiktok' ? 'TikTok' : fieldTypeLower === 'line' || fieldTypeLower === 'lineid' ? 'Line ID' : (fieldType || '');
            appendSocial(label, fieldValue);
            break;
          }
          // Check for personalId, taxIdMain, taxIdBranch, personalAddress1, personalAddress2 in default case
          if (fieldTypeLower === 'personalid' || fieldTypeLower === 'personal_id') { 
          notePrimaryParts.push(`ID Card: ${sanitizeText(fieldValue)}`); 
            break; 
          }
          if (fieldTypeLower === 'taxidmain' || fieldTypeLower === 'tax_id_main') { 
          notePrimaryParts.push(`Tax ID (Head Office): ${sanitizeText(fieldValue)}`); 
            break; 
          }
          if (fieldTypeLower === 'taxidbranch' || fieldTypeLower === 'tax_id_branch') { 
          notePrimaryParts.push(`Tax ID (Branch): ${sanitizeText(fieldValue)}`); 
            break; 
          }
          // Handle workAddress1, workAddress2, personalAddress1, personalAddress2 in default case
          if (fieldTypeLower === 'workaddress1' || fieldTypeLower === 'work_address1' || fieldTypeLower === 'workaddress_1') {
            const workAddress1Value = sanitizeText(fieldValue);
            vcard += `ADR;TYPE=WORK;CHARSET=UTF-8:;;${escapeText(workAddress1Value)};;;;\n`;
            break;
          }
          if (fieldTypeLower === 'workaddress2' || fieldTypeLower === 'work_address2' || fieldTypeLower === 'workaddress_2') {
            const workAddress2Value = sanitizeText(fieldValue);
            vcard += `ADR;TYPE=OTHER;CHARSET=UTF-8:;;${escapeText(workAddress2Value)};;;;\n`;
            break;
          }
          if (fieldTypeLower === 'personaladdress1' || fieldTypeLower === 'personal_address1' || fieldTypeLower === 'personaladdress_1') {
            const personalAddress1Value = sanitizeText(fieldValue);
            vcard += `ADR;TYPE=HOME;CHARSET=UTF-8:;;${escapeText(personalAddress1Value)};;;;\n`;
            break;
          }
          if (fieldTypeLower === 'personaladdress2' || fieldTypeLower === 'personal_address2' || fieldTypeLower === 'personaladdress_2') {
            const personalAddress2Value = sanitizeText(fieldValue);
            vcard += `ADR;TYPE=OTHER;CHARSET=UTF-8:;;${escapeText(personalAddress2Value)};;;;\n`;
            break;
          }
          // Skip website fields - they should be URL fields, not in NOTE
          if (fieldTypeLower === 'website' || fieldTypeLower === 'workwebsite' || fieldTypeLower === 'homepage') {
            break;
          }
          // Skip nameen - should not be in NOTE
          if (fieldTypeLower === 'nameen' || fieldTypeLower === 'name_en') {
            break;
          }
        const noteLabel = fieldType || fieldId.replace('element-', 'Field ');
        // Default non-social custom fields go to combined NOTE
        noteParts.push(`${noteLabel}: ${sanitizeText(fieldValue)}`);
          break;
      }
    });

    // Reorder notePrimaryParts to ensure correct order:
    // Name (Thai) → Department → ID Card → Tax ID (Branch) → Tax ID (Head Office)
    // Note: personalAddress1 and personalAddress2 are now ADR fields, not in NOTE
    const orderedNotePrimaryParts: string[] = [];
    const noteMap = new Map<string, string>();
    
    // Collect all notePrimaryParts into a map
    notePrimaryParts.forEach(note => {
      if (note.startsWith('Name (Thai):')) {
        noteMap.set('thaiName', note);
      } else if (note.startsWith('Department:')) {
        noteMap.set('department', note);
      } else if (note.startsWith('ID Card:')) {
        noteMap.set('personalId', note);
      } else if (note.startsWith('Tax ID (Branch):')) {
        noteMap.set('taxIdBranch', note);
      } else if (note.startsWith('Tax ID (Head Office):')) {
        noteMap.set('taxIdMain', note);
      }
    });
    
    // Add in correct order
    const order = ['thaiName', 'department', 'personalId', 'taxIdBranch', 'taxIdMain'];
    order.forEach(key => {
      if (noteMap.has(key)) {
        orderedNotePrimaryParts.push(noteMap.get(key)!);
      }
    });
    
    // Emit one combined NOTE in requested order (plain text, not BASE64)
    const finalNotes = [...orderedNotePrimaryParts, ...socialNoteParts, ...noteParts];
    if (finalNotes.length > 0) {
      const noteText = finalNotes.join(' | ');
      vcard += `NOTE;CHARSET=UTF-8:${escapeText(noteText)}\n`;
    }
    
    // Add website from social_links if not already processed
    if (socialLinks.website && !processedFields.has('URL')) {
      const normalizedWebsite = normalizeUrl(socialLinks.website);
      if (normalizedWebsite) {
        vcard += `URL:${normalizedWebsite}\n`;
      }
    }
    
    vcard += 'END:VCARD\n';

    // Force Windows-friendly CRLF for Outlook compatibility
    vcard = vcard.replace(/\n/g, '\r\n');
    if (!vcard.endsWith('\r\n')) {
      vcard += '\r\n';
    }

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
