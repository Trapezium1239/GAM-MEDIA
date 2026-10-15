'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';
import { PlaySermonButton } from '@/components/audio/play-button';
import { ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Topic {
  id: string;
  name: string;
}

interface Sermon {
  id: string;
  title: string;
  preacher: string;
  date: string;
  audio_url: string | null;
  video_link: string | null;
}

export default function TopicSermonsPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? '';
  const [topic, setTopic] = useState<Topic | null>(null);
  const [sermons, setSermons] = useState<Sermon[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    const supabase = createClient();
    (async () => {
      const { data: topicRow } = await supabase.from('topics').select('id, name').eq('slug', slug).maybeSingle();
      if (cancelled) return;
      if (!topicRow) {
        setTopic(null);
        setLoading(false);
        return;
      }
      setTopic(topicRow as Topic);
      const { data: sermonRows } = await supabase
        .from('sermons')
        .select('*')
        .eq('topic_id', (topicRow as Topic).id)
        .order('date', { ascending: false });
      if (cancelled) return;
      setSermons((sermonRows as Sermon[]) || []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="empty-state">
        <Loader2 className="empty-state-icon animate-spin" />
        <p className="empty-state-title">Loading series...</p>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="empty-state">
        <p className="text-sm text-zinc-400">Topic not found.</p>
        <Link href="/sermons" className="btn-ghost text-xs mt-3">Back to Word Vault</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      <div>
        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Series / Topic</span>
        <h1 className="text-xl font-bold text-white">{topic.name}</h1>
      </div>
      <div className="space-y-3">
        {sermons?.map((sermon) => (
          <article key={sermon.id} className="card space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">{sermon.date} • {sermon.preacher}</p>
                <h2 className="text-sm font-semibold text-white">{sermon.title}</h2>
              </div>
              {sermon.audio_url && (
                <PlaySermonButton
                  track={{ id: sermon.id, title: sermon.title, artist: sermon.preacher, audioUrl: sermon.audio_url }}
                />
              )}
            </div>
            {sermon.video_link && (
              <Link href={sermon.video_link} target="_blank" rel="noopener noreferrer" className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1">
                Watch Video <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </article>
        ))}
        {(!sermons || sermons.length === 0) && (
          <div className="empty-state py-8">
            <p className="text-xs text-zinc-500">No sermons logged under this topic yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}