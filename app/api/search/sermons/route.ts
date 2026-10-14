import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q')?.trim();
  const topicId = searchParams.get('topic_id') || undefined;
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  const offset = parseInt(searchParams.get('offset') || '0');
  const fuzzy = searchParams.get('fuzzy') === 'true';

  if (!query || query.length < 2) {
    return NextResponse.json({ 
      sermons: [], 
      total: 0,
      query,
      message: 'Query must be at least 2 characters'
    });
  }

  const supabase = await createClient();

  try {
    let data: any[] = [];
    let error: any = null;

    if (fuzzy) {
      const res = await supabase.rpc('search_sermons_fuzzy', {
        p_query: query,
        p_topic_id: topicId,
        p_limit: limit,
        p_offset: offset,
      });
      data = res.data || [];
      error = res.error;
    } else {
      const res = await supabase.rpc('search_sermons', {
        p_query: query,
        p_topic_id: topicId,
        p_limit: limit,
        p_offset: offset,
      });
      data = res.data || [];
      error = res.error;
    }

    if (error) throw error;

    return NextResponse.json({
      sermons: data,
      total: data.length,
      query,
      topic_id: topicId,
      fuzzy,
      limit,
      offset,
    });
  } catch (err) {
    console.error('Sermon search error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Search failed' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-static';