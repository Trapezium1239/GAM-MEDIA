import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Calendar, BookOpen, Volume2, Play } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { PlaySermonButton } from '@/components/audio/play-button';
import { SermonSearch } from '@/components/sermons/sermon-search';

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

  return (
    <div className="space-y-6 py-4 pb-32">
      <header>
        <h1 className="text-2xl font-bold text-wine-900 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-wine-600" />
          Word Vault
        </h1>
        <p className="text-xs text-wine-500 mt-1">Sermons, teachings, and series</p>
      </header>

      <SermonSearch initialSermons={sermons} topics={topics} serverSearchEnabled />
    </div>
  );
}