import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { secureApi, requireAdminRole } from '@/lib/security/api';

interface SermonInput {
  title: string;
  preacher: string;
  date: string;
  audio_url?: string | null;
  video_link?: string | null;
  notes?: string | null;
  topic_id?: string | null;
}

interface BulkImportRequest {
  sermons: SermonInput[];
  options?: {
    skipDuplicates?: boolean; // Skip if title+date match existing
    uploadAudio?: boolean; // For future Cloudinary integration
  };
}

async function handler(req: Request) {
  const guard = await requireAdminRole(req);
  if (guard.error) return guard.error;

  try {
    const body: BulkImportRequest = await req.json();
    const { sermons, options = {} } = body;

    if (!sermons || !Array.isArray(sermons) || sermons.length === 0) {
      return NextResponse.json({ error: 'No sermons provided' }, { status: 400 });
    }

    if (sermons.length > 500) {
      return NextResponse.json({ error: 'Maximum 500 sermons per batch' }, { status: 400 });
    }

    const supabase = await createClient();

    // Validate each sermon
    const validSermons = [];
    const errors: { index: number; title: string; error: string }[] = [];

    for (let i = 0; i < sermons.length; i++) {
      const s = sermons[i];
      if (!s) continue;
      const errs: string[] = [];

      if (!s.title?.trim()) errs.push('Title required');
      if (!s.preacher?.trim()) errs.push('Preacher required');
      if (!s.date) errs.push('Date required');
      else if (isNaN(Date.parse(s.date))) errs.push('Invalid date format (use YYYY-MM-DD)');

      if (errs.length > 0) {
        errors.push({ index: i, title: s.title || '', error: errs.join(', ') });
      } else {
        validSermons.push({
          title: s.title.trim(),
          preacher: s.preacher.trim(),
          date: s.date,
          audio_url: s.audio_url?.trim() || null,
          video_link: s.video_link?.trim() || null,
          notes: s.notes?.trim() || null,
          topic_id: s.topic_id || null,
        });
      }
    }

    if (validSermons.length === 0) {
      return NextResponse.json({ 
        error: 'No valid sermons to import', 
        errors 
      }, { status: 400 });
    }

    let inserted = 0;
    let skipped = 0;
    const insertErrors: { title: string; error: string }[] = [];

    if (options.skipDuplicates) {
      // Check for existing sermons by title + date
      const existingQuery = validSermons.map(s => `title='${s.title.replace(/'/g, "''")}' AND date='${s.date}'`).join(' OR ');
      const { data: existing } = await supabase
        .from('sermons')
        .select('title, date')
        .or(existingQuery);
      
      const existingSet = new Set((existing || []).map(e => `${e.title}|${e.date}`));
      
      const toInsert = validSermons.filter(s => !existingSet.has(`${s.title}|${s.date}`));
      skipped = validSermons.length - toInsert.length;

      if (toInsert.length > 0) {
        const { data, error } = await supabase.from('sermons').insert(toInsert).select();
        if (error) {
          return NextResponse.json({ error: 'Bulk insert failed: ' + error.message }, { status: 500 });
        }
        inserted = data?.length || 0;
      }
    } else {
      const { data, error } = await supabase.from('sermons').insert(validSermons).select();
      if (error) {
        return NextResponse.json({ error: 'Bulk insert failed: ' + error.message }, { status: 500 });
      }
      inserted = data?.length || 0;
    }

    return NextResponse.json({
      status: 'completed',
      total: sermons.length,
      valid: validSermons.length,
      inserted,
      skipped,
      errors: [...errors, ...insertErrors],
    }, { status: 201 });

  } catch (err) {
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : 'Import failed' 
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return secureApi(req, handler);
}