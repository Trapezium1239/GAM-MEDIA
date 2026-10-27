import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createStaticClient } from '@/lib/supabase/static';
import { format } from 'date-fns';
import { Calendar, BookOpen, Heart, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { DevotionalActions } from '@/components/devotional/devotional-actions';

interface Devotional {
  id?: string;
  date: string;
  title: string;
  scripture_reference: string;
  scripture_text: string;
  reflection: string;
  prayer: string | null;
  application_question: string | null;
  source: string;
  created_at?: string;
  published_at?: string | null;
}

type StaticClient = ReturnType<typeof createStaticClient>;

/** New table first, legacy archive table as a fallback. */
async function fetchDevotional(supabase: StaticClient, date: string): Promise<Devotional | null> {
  const { data } = await supabase.from('daily_devotionals').select('*').eq('date', date).maybeSingle();
  if (data) return data as Devotional;

  const { data: legacy } = await supabase.from('devotionals').select('*').eq('date', date).maybeSingle();
  return (legacy as Devotional | null) ?? null;
}

export async function generateStaticParams() {
  const supabase = createStaticClient();
  const today = new Date().toISOString().split('T')[0];

  const { data } = await supabase
    .from('daily_devotionals')
    .select('date')
    .lte('date', today)
    .order('date', { ascending: false });

  if (data && data.length > 0) {
    return data.map((d) => ({ date: d.date }));
  }

  // Fallback: the legacy archive table already holds a full year of entries.
  const { data: legacy } = await supabase
    .from('devotionals')
    .select('date')
    .lte('date', today)
    .order('date', { ascending: false });

  if (legacy && legacy.length > 0) {
    return legacy.map((d) => ({ date: d.date }));
  }

  return [{ date: today }];
}

interface Props {
  params: Promise<{ date: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { date } = await params;
  const devotional = await fetchDevotional(createStaticClient(), date);

  if (devotional) {
    return {
      title: `${devotional.title} | ${format(new Date(date), 'MMMM d, yyyy')} | GAM Church`,
      description: devotional.scripture_reference,
    };
  }
  return {
    title: `Devotional | ${format(new Date(date), 'MMMM d, yyyy')} | GAM Church`,
  };
}

export default async function DevotionalDatePage({ params }: Props) {
  const { date } = await params;
  const devotional = await fetchDevotional(createStaticClient(), date);

  if (!devotional) {
    notFound();
  }

  const dateObj = new Date(devotional.date);

  return (
    <div className="space-y-6 pb-32 max-w-2xl mx-auto px-4">
      {/* Header */}
      <header className="text-center space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-wine-600/10 text-wine-700">
          <Calendar className="w-3 h-3" />
          {format(dateObj, 'EEEE, MMMM d, yyyy')}
        </span>
        <h1 className="text-2xl font-bold text-wine-900">{devotional.title}</h1>
        <p className="text-sm text-wine-600 font-medium">{devotional.scripture_reference}</p>
      </header>

      {/* Scripture Card */}
      <article className="card space-y-4 border-wine-300/60 bg-wine-50">
        <div className="flex items-center gap-2 text-wine-700">
          <BookOpen className="w-5 h-5" />
          <span className="text-sm font-semibold">{devotional.scripture_reference}</span>
          <span className="text-xs text-wine-500">{devotional.source === 'auto_esv' ? 'ESV' : devotional.source === 'auto_net' ? 'NET' : 'Manual'}</span>
        </div>
        <blockquote className="text-lg text-wine-900 italic leading-relaxed border-l-4 border-wine-500 pl-4">
          {devotional.scripture_text}
        </blockquote>
      </article>

      {/* Reflection */}
      <article className="card space-y-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-wine-900">
          <MessageSquare className="w-5 h-5 text-wine-600" />
          Reflection
        </h2>
        <div className="text-wine-800 leading-relaxed whitespace-pre-wrap">
          {devotional.reflection}
        </div>
      </article>

      {/* Application Question */}
      {devotional.application_question && (
        <article className="card space-y-3 border-wine-300/60 bg-wine-50">
          <h2 className="flex items-center gap-2 text-base font-semibold text-wine-700">
            <MessageSquare className="w-5 h-5" />
            Apply It Today
          </h2>
          <p className="text-wine-800 italic">{devotional.application_question}</p>
        </article>
      )}

      {/* Prayer */}
      {devotional.prayer && (
        <article className="card space-y-3 border-cream-300/60 bg-cream-100/60">
          <h2 className="flex items-center gap-2 text-base font-semibold text-wine-700">
            <Heart className="w-5 h-5" />
            Prayer
          </h2>
          <div className="text-wine-800 italic whitespace-pre-wrap">
            {devotional.prayer}
          </div>
        </article>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/devotional/archive"
          className="btn-secondary flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          View Archive
        </Link>
        <DevotionalActions />
      </div>

      {/* Navigation */}
      <nav className="flex items-center justify-center gap-4">
        <Link href="/devotional/archive" className="btn-ghost flex items-center gap-1.5">
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Link>
        <span className="text-xs text-wine-500">Today</span>
        <Link href="/devotional/archive" className="btn-ghost flex items-center gap-1.5">
          Next <ChevronRight className="w-4 h-4" />
        </Link>
      </nav>

      {/* Source Attribution */}
      <footer className="text-center text-xs text-wine-500 pt-6 border-t border-cream-300/60">
        <p>Scripture: {devotional.source === 'auto_esv' ? 'ESV' : devotional.source === 'auto_net' ? 'NET' : 'Manual'}</p>
        <p className="mt-1">
          {devotional.created_at ? `Published: ${format(new Date(devotional.published_at || devotional.created_at), 'MMMM d, yyyy')}` : ''}
        </p>
      </footer>
    </div>
  );
}