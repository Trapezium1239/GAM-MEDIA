'use client';

import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { Calendar, BookOpen, Heart, MessageSquare, ChevronLeft, ChevronRight, Download, Share2 } from 'lucide-react';
import Link from 'next/link';

export default async function DevotionalPage() {
  const supabase = await createClient();

  const { data: devotional } = await supabase.rpc('get_todays_devotional');

  if (!devotional || Object.keys(devotional).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <BookOpen className="w-16 h-16 text-zinc-600" />
        <h2 className="text-2xl font-bold text-white">No Devotional Today</h2>
        <p className="text-sm text-zinc-400 max-w-sm">
          Today's devotional hasn't been published yet. Check back later!
        </p>
      </div>
    );
  }

  const date = new Date(devotional.date);

  return (
    <div className="space-y-6 pb-32 max-w-2xl mx-auto px-4">
      {/* Header */}
      <header className="text-center space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">
          <Calendar className="w-3 h-3" />
          {format(date, 'EEEE, MMMM d, yyyy')}
        </span>
        <h1 className="text-2xl font-bold text-white">{devotional.title}</h1>
        <p className="text-sm text-amber-400 font-medium">{devotional.scripture_reference}</p>
      </header>

      {/* Scripture Card */}
      <article className="card space-y-4 border-amber-500/30 bg-amber-500/5">
        <div className="flex items-center gap-2 text-amber-400">
          <BookOpen className="w-5 h-5" />
          <span className="text-sm font-semibold">{devotional.scripture_reference}</span>
          <span className="text-xs text-zinc-500">{devotional.source === 'auto_esv' ? 'ESV' : devotional.source === 'auto_net' ? 'NET' : 'Manual'}</span>
        </div>
        <blockquote className="text-lg text-zinc-100 italic leading-relaxed border-l-4 border-amber-500 pl-4">
          {devotional.scripture_text}
        </blockquote>
      </article>

      {/* Reflection */}
      <article className="card space-y-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-white">
          <MessageSquare className="w-5 h-5 text-amber-400" />
          Reflection
        </h2>
        <div className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
          {devotional.reflection}
        </div>
      </article>

      {/* Application Question */}
      {devotional.application_question && (
        <article className="card space-y-3 border-amber-500/20 bg-amber-500/5">
          <h2 className="flex items-center gap-2 text-base font-semibold text-amber-400">
            <MessageSquare className="w-5 h-5" />
            Apply It Today
          </h2>
          <p className="text-zinc-300 italic">{devotional.application_question}</p>
        </article>
      )}

      {/* Prayer */}
      {devotional.prayer && (
        <article className="card space-y-3 border-purple-500/20 bg-purple-500/5">
          <h2 className="flex items-center gap-2 text-base font-semibold text-purple-400">
            <Heart className="w-5 h-5" />
            Prayer
          </h2>
          <div className="text-zinc-300 italic whitespace-pre-wrap">
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
        <button
          className="btn-secondary flex items-center gap-2"
          onClick={async () => {
            if (navigator.share) {
              await navigator.share({
                title: 'Daily Devotional',
                text: `Daily Devotional — ${new Date().toLocaleDateString()}`,
                url: window.location.href,
              });
            } else {
              await navigator.clipboard.writeText(window.location.href);
              alert('Link copied to clipboard!');
            }
          }}
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
        <button className="btn-secondary flex items-center gap-2">
          <Download className="w-4 h-4" />
          Save
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex items-center justify-center gap-4">
        <Link href="/devotional/archive" className="btn-ghost flex items-center gap-1.5">
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Link>
        <span className="text-xs text-zinc-500">Today</span>
        <Link href="/devotional/archive" className="btn-ghost flex items-center gap-1.5">
          Next <ChevronRight className="w-4 h-4" />
        </Link>
      </nav>

      {/* Source Attribution */}
      <footer className="text-center text-[10px] text-zinc-500 pt-6 border-t border-zinc-800">
        <p>Scripture: {devotional.source === 'auto_esv' ? 'ESV' : devotional.source === 'auto_net' ? 'NET' : 'Manual'}</p>
        <p className="mt-1">
          {devotional.created_at ? `Published: ${format(new Date(devotional.published_at || devotional.created_at), 'MMMM d, yyyy')}` : ''}
        </p>
      </footer>
    </div>
  );
}