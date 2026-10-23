import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createStaticClient } from '@/lib/supabase/static';
import { format } from 'date-fns';
import { Calendar, BookOpen, Volume2, Play, Loader2, ChevronRight } from 'lucide-react';
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

export async function generateStaticParams() {
  const supabase = createStaticClient();
  const { data } = await supabase
    .from('topics')
    .select('slug')
    .order('name');

  if (!data || data.length === 0) {
    // Fallback for empty database at build time
    return [{ slug: 'general' }];
  }

  return data.map((t) => ({
    slug: t.slug,
  }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createStaticClient();
  const { data: topic } = await supabase
    .from('topics')
    .select('name')
    .eq('slug', slug)
    .single();

  if (topic) {
    return {
      title: `${topic.name} Sermons | GAM Church`,
      description: `Browse all sermons in the "${topic.name}" series`,
    };
  }
  return {
    title: 'Sermons by Topic | GAM Church',
  };
}

interface SermonWithTopic extends Sermon {
  topics: Topic | null;
}

export default async function SermonTopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = createStaticClient();

  const { data: topic } = await supabase
    .from('topics')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!topic) {
    notFound();
  }

  const { data: sermons } = await supabase
    .from('sermons')
    .select('*, topics(name, slug)')
    .eq('topic_id', topic.id)
    .order('date', { ascending: false });

  return (
    <div className="space-y-6 py-4 pb-32">
      <header>
        <h1 className="text-2xl font-bold text-wine-900 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-wine-600" />
          {topic.name}
        </h1>
        <p className="text-xs text-wine-500 mt-1">Sermons in this series</p>
      </header>

      {(sermons || []).length > 0 ? (
        <div className="space-y-3">
          {(sermons as SermonWithTopic[]).map((sermon) => (
            <article key={sermon.id} className="card space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-wine-100 flex items-center justify-center flex-shrink-0">
                  <Volume2 className="w-5 h-5 text-wine-700" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-wine-900 truncate">{sermon.title}</h3>
                  <p className="text-xs text-wine-500">
                    {sermon.preacher} · {format(new Date(sermon.date), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-cream-300">
                {sermon.audio_url && (
                  <PlaySermonButton
                    track={{
                      id: sermon.id,
                      title: sermon.title,
                      artist: sermon.preacher,
                      audioUrl: sermon.audio_url,
                    }}
                  />
                )}
                {sermon.video_link && (
                  <a
                    href={sermon.video_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost text-xs flex items-center gap-1"
                  >
                    <span className="w-3.5 h-3.5">▶</span>
                    Watch Video
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <BookOpen className="empty-state-icon" />
          <p className="empty-state-title">No Sermons in This Series</p>
          <p className="empty-state-desc">Sermons will appear here once added</p>
        </div>
      )}

      <div className="mt-6">
        <Link href="/sermons" className="btn-ghost flex items-center gap-1.5">
          <span className="w-4 h-4">←</span>
          All Sermons
        </Link>
      </div>
    </div>
  );
}