import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Calendar, BookOpen, Volume2, Play } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { PlaySermonButton } from '@/components/audio/play-button';

interface Sermon {
  id: string;
  title: string;
  preacher: string;
  date: string;
  audio_url: string | null;
  video_link: string | null;
  topic_id: string | null;
}

interface Topic {
  id: string;
  name: string;
  slug: string;
}

export default async function SermonsPage() {
  const supabase = await createClient();

  const [sermonsRes, topicsRes] = await Promise.all([
    supabase.from('sermons').select('*, topics(name, slug)').order('date', { ascending: false }),
    supabase.from('topics').select('*').order('name'),
  ]);

  const sermons = (sermonsRes.data || []) as (Sermon & { topics: Topic | null })[];
  const topics = (topicsRes.data || []) as Topic[];

  const grouped = sermons.reduce((acc, sermon) => {
    const key = sermon.topics?.slug || 'uncategorized';
    const label = sermon.topics?.name || 'Uncategorized';
    if (!acc[key]) acc[key] = { label, items: [] };
    acc[key].items.push(sermon);
    return acc;
  }, {} as Record<string, { label: string; items: typeof sermons }>);

  return (
    <div className="space-y-6 py-4 pb-32">
      <header>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-amber-400" />
          Word Vault
        </h1>
        <p className="text-xs text-zinc-400 mt-1">Sermons, teachings, and series</p>
      </header>

      {topics.length > 0 && (
        <nav className="overflow-x-auto pb-2 -mx-4 px-4" aria-label="Topic filters">
          <div className="flex gap-2 min-w-max">
            <Link
              href="/sermons"
              className="whitespace-nowrap px-3 py-1.5 rounded-full bg-zinc-800 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
            >
              All
            </Link>
            {topics.map((topic) => (
              <Link
                key={topic.id}
                href={`/sermons/topic/${topic.slug}`}
                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-zinc-800 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
              >
                {topic.name}
              </Link>
            ))}
          </div>
        </nav>
      )}

      {Object.keys(grouped).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(grouped).map(([key, group]) => (
            <section key={key} className="space-y-3">
              <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">{group.label}</h2>
              <div className="space-y-2">
                {group.items.map((sermon) => (
                  <article key={sermon.id} className="card space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0">
                        {sermon.video_link ? (
                          <Play className="w-6 h-6 text-zinc-500 ml-1" />
                        ) : (
                          <Volume2 className="w-6 h-6 text-zinc-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white truncate">{sermon.title}</h3>
                        <p className="text-xs text-zinc-400 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          {sermon.preacher} • {format(new Date(sermon.date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
                      {sermon.audio_url && (
                        <PlaySermonButton
                          track={{ id: sermon.id, title: sermon.title, artist: sermon.preacher, audioUrl: sermon.audio_url }}
                        />
                      )}
                      {sermon.video_link && (
                        <a href={sermon.video_link} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 text-xs font-medium text-amber-400 bg-amber-500/10 rounded-lg text-center hover:bg-amber-500/20 transition touch-manipulation">
                          Watch Video
                        </a>
                      )}
                      {(!sermon.audio_url && !sermon.video_link) && (
                        <span className="flex-1 py-2 text-xs text-zinc-500 text-center bg-zinc-800 rounded-lg">No media available</span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <BookOpen className="empty-state-icon" />
          <p className="empty-state-title">No sermons recorded yet</p>
          <p className="empty-state-desc">Admins can add sermons from the dashboard</p>
        </div>
      )}
    </div>
  );
}