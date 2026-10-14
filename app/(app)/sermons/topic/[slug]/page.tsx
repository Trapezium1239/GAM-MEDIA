import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PlaySermonButton } from '@/components/audio/play-button';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

export async function generateStaticParams() {
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data } = await supabase.from('topics').select('slug').limit(500)
  return (data || []).map(item => ({ slug: item.slug }))
}

export default async function TopicSermonsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: topic } = await supabase.from('topics').select('id, name').eq('slug', slug).single();
  if (!topic) notFound();

  const { data: sermons } = await supabase.from('sermons').select('*').eq('topic_id', topic.id).order('date', { ascending: false });

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