'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BookOpen, Loader2, AlertCircle } from 'lucide-react';
import { SermonSearch, type Sermon, type Topic } from '@/components/sermons/sermon-search';
import { SermonListSkeleton } from '@/components/ui/skeleton';

/** Enough for an instant first screen without shipping thousands of rows. */
const INITIAL_PAGE_SIZE = 200;

export default function SermonsPage() {
  const [sermons, setSermons] = useState<Sermon[] | null>(null);
  const [total, setTotal] = useState(0);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    (async () => {
      const [sermonsRes, topicsRes] = await Promise.all([
        supabase
          .from('sermons')
          .select(
            'id, title, preacher, date, duration, audio_url, video_link, topic_id, topics(name, slug)',
            { count: 'exact' }
          )
          .order('date', { ascending: false })
          .limit(INITIAL_PAGE_SIZE),
        supabase.from('topics').select('id, name, slug').order('name'),
      ]);

      if (cancelled) return;

      if (sermonsRes.error) {
        setError(sermonsRes.error.message);
        setSermons([]);
        return;
      }

      setSermons((sermonsRes.data ?? []) as unknown as Sermon[]);
      setTotal(sermonsRes.count ?? sermonsRes.data?.length ?? 0);
      setTopics((topicsRes.data ?? []) as Topic[]);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (sermons === null) {
    return (
      <div className="space-y-6 py-4 pb-32">
        <header>
          <h1 className="text-2xl font-bold text-wine-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-wine-600" aria-hidden="true" />
            Word Vault
          </h1>
          <p className="text-xs text-wine-500 mt-1">Sermons, teachings, and series</p>
        </header>
        <SermonListSkeleton count={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <AlertCircle className="empty-state-icon text-red-500" aria-hidden="true" />
        <p className="empty-state-title">Could not load sermons</p>
        <p className="empty-state-desc">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4 pb-32">
      <header>
        <h1 className="text-2xl font-bold text-wine-900 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-wine-600" aria-hidden="true" />
          Word Vault
        </h1>
        <p className="text-xs text-wine-500 mt-1">Sermons, teachings, and series</p>
      </header>

      <SermonSearch initialSermons={sermons} topics={topics} totalSermons={total} />
    </div>
  );
}
