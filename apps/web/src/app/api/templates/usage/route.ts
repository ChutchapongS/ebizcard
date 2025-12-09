import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering since we query database
// Note: API routes are not supported in static export mode
// When NEXT_STATIC_EXPORT=true, Next.js will skip API routes during build
// We use 'auto' instead of 'force-dynamic' for static export compatibility
export const dynamic: 'force-dynamic' | 'auto' = (process.env.NEXT_STATIC_EXPORT === 'true' ? 'auto' : 'force-dynamic') as 'force-dynamic' | 'auto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is not defined');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/templates/usage
 * Returns the count of business cards using each template
 */
export async function GET(request: NextRequest) {
  try {
    // Get all business cards with their template_id
    const { data: cards, error } = await supabaseAdmin
      .from('business_cards')
      .select('template_id');

    if (error) {
      // Silently handle errors during build time
      if (process.env.NEXT_PHASE === 'phase-production-build') {
        return NextResponse.json({ usage: {} }, { status: 200 });
      }
      console.error('Error fetching cards:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Count cards by template_id
    const usageMap: { [key: string]: number } = {};
    
    cards?.forEach(card => {
      if (card.template_id) {
        usageMap[card.template_id] = (usageMap[card.template_id] || 0) + 1;
      }
    });

    return NextResponse.json({ usage: usageMap });
  } catch (error) {
    // Silently handle errors during build time
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({ usage: {} }, { status: 200 });
    }
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

