import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface SearchParams {
  q: string;
  type: 'sermons' | 'music' | 'programs' | 'all';
  topic_id?: string;
  limit?: number;
  offset?: number;
  fuzzy?: boolean;
}

function validateParams(params: SearchParams) {
  if (!params.q || params.q.trim().length < 2) {
    return { valid: false, error: 'Query must be at least 2 characters' };
  }
  if (params.limit && (params.limit < 1 || params.limit > 100)) {
    return { valid: false, error: 'Limit must be 1-100' };
  }
  return { valid: true };
}

async function searchSermons(supabase: any, params: SearchParams) {
  const fn = params.fuzzy ? 'search_sermons_fuzzy' : 'search_sermons';
  const { data, error } = await supabase.rpc(fn, {
    p_query: params.q,
    p_topic_id: params.topic_id,
    p_limit: params.limit || 20,
    p_offset: params.offset || 0,
  });
  return { data, error, type: 'sermons' };
}

async function searchMusic(supabase: any, params: SearchParams) {
  // For music, we'll do a direct query since we don't have a search function yet
  let query = supabase
    .from('church_music')
    .select('id, title, artist_choir, audio_url, lyrics, release_date')
    .order('created_at', { ascending: false });

  if (params.topic_id) {
    // Music doesn't have topics yet, but could be added
  }

  // Use text search on title and artist
  const searchTerms = params.q.split(' ').filter(Boolean);
  const orConditions = searchTerms.flatMap(term => [
    `title.ilike.%${term}%`,
    `artist_choir.ilike.%${term}%`,
    `lyrics.ilike.%${term}%`,
  ]);

  if (orConditions.length > 0) {
    query = query.or(orConditions.join(','));
  }

  const { data, error } = await query.range(params.offset || 0, (params.offset || 0) + (params.limit || 20) - 1);
  return { data: data || [], error, type: 'music' };
}

async function searchPrograms(supabase: any, params: SearchParams) {
  let query = supabase
    .from('programs')
    .select('id, title, description, event_date, venue')
    .order('event_date', { ascending: true });

  const searchTerms = params.q.split(' ').filter(Boolean);
  const orConditions = searchTerms.flatMap(term => [
    `title.ilike.%${term}%`,
    `description.ilike.%${term}%`,
    `venue.ilike.%${term}%`,
  ]);

  if (orConditions.length > 0) {
    query = query.or(orConditions.join(','));
  }

  const { data, error } = await query.range(params.offset || 0, (params.offset || 0) + (params.limit || 20) - 1);
  return { data: data || [], error, type: 'programs' };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  
  const params: SearchParams = {
    q: searchParams.get('q')?.trim() || '',
    type: (searchParams.get('type') as SearchParams['type']) || 'all',
    topic_id: searchParams.get('topic_id') || undefined,
    limit: Math.min(parseInt(searchParams.get('limit') || '20'), 50),
    offset: parseInt(searchParams.get('offset') || '0'),
    fuzzy: searchParams.get('fuzzy') === 'true',
  };

  const validation = validateParams(params);
  if (!validation.valid) {
    return NextResponse.json({ results: [], total: 0, query: params.q, error: validation.error });
  }

  const supabase = await createClient();

  try {
    let results: any[] = [];
    let total = 0;

    if (params.type === 'sermons' || params.type === 'all') {
      const res = await searchSermons(supabase, params);
      if (res.error) throw res.error;
      results.push(...(res.data || []).map((r: any) => ({ ...r, _type: 'sermons' })));
    }

    if (params.type === 'music' || params.type === 'all') {
      const res = await searchMusic(supabase, params);
      if (res.error) throw res.error;
      results.push(...(res.data || []).map((r: any) => ({ ...r, _type: 'music' })));
    }

    if (params.type === 'programs' || params.type === 'all') {
      const res = await searchPrograms(supabase, params);
      if (res.error) throw res.error;
      results.push(...(res.data || []).map((r: any) => ({ ...r, _type: 'programs' })));
    }

    // Sort by relevance (sermons have rank, others by date)
    if (params.type === 'all') {
      results.sort((a, b) => {
        if (a.rank && b.rank) return b.rank - a.rank;
        if (a.rank) return -1;
        if (b.rank) return 1;
        return new Date(b.date || b.event_date || b.release_date || 0).getTime() - 
               new Date(a.date || a.event_date || a.release_date || 0).getTime();
      });
    }

    total = results.length;

    return NextResponse.json({
      results,
      total,
      query: params.q,
      type: params.type,
      limit: params.limit,
      offset: params.offset,
    });
  } catch (err) {
    console.error('Search error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Search failed' },
      { status: 500 }
    );
  }
}