import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is not defined');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = params.id;
    
    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const body = await request.json();
    
    const { name, paper, elements, user_id, preview_image } = body;
    
    if (!name || !paper || !elements) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get original template to preserve user_id
    const { data: originalTemplate } = await supabaseAdmin
      .from('templates')
      .select('user_id, user_type')
      .eq('id', templateId)
      .single();

    // Update template data (preserve original user_id and user_type)
    const templateData = {
      name,
      theme: paper.background?.type || 'default',
      preview_url: preview_image || '',
      paper_settings: paper,
      elements: elements,
      // Preserve original user_id and user_type to maintain visibility
      user_id: originalTemplate?.user_id || user_id || null,
      user_type: originalTemplate?.user_type || 'user',
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin
      .from('templates')
      .update(templateData)
      .eq('id', templateId)
      .select()
      .single();

    if (error) {
      console.error('Error updating template:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = params.id;
    
    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 }      );
    }

    // Check if any business cards are using this template
    const { data: cardsUsingTemplate, error: checkError } = await supabaseAdmin
      .from('business_cards')
      .select('id, name, user_id')
      .eq('template_id', templateId);

    if (checkError) {
      console.error('Error checking template usage:', checkError);
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    // If there are cards using this template, prevent deletion
    if (cardsUsingTemplate && cardsUsingTemplate.length > 0) {
      return NextResponse.json({ 
        error: 'ไม่สามารถลบแม่แบบนี้ได้ เนื่องจากมีนามบัตรที่กำลังใช้งานอยู่',
        details: {
          cardsCount: cardsUsingTemplate.length,
          cards: cardsUsingTemplate.map(card => ({
            id: card.id,
            name: card.name
          }))
        }
      }, { status: 409 }); // 409 Conflict
    }
    
    // No cards using this template, proceed with deletion
    const { error } = await supabaseAdmin
      .from('templates')
      .delete()
      .eq('id', templateId);

    if (error) {
      console.error('Error deleting template:', error);
      // Check if it's a foreign key constraint error (in case DB constraint is different)
      if (error.code === '23503') {
        return NextResponse.json({ 
          error: 'ไม่สามารถลบแม่แบบนี้ได้ เนื่องจากมีนามบัตรที่กำลังใช้งานอยู่',
          details: { error: error.message }
        }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
