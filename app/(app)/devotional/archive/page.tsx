'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { Calendar, BookOpen, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface DevotionalRow {
  id: string;
  date: string;
  title: string;
  scripture_reference: string;
}

const COLUMNS = 'id, date, title, scripture_reference';

/** Noon avoids the UTC-midnight date shifting by a day in negative offsets. */
function parseDate(date: string): Date {
  return new Date(`${date}T12:00:00`);
}

export default function DevotionalArchivePage() {
  const [devotionals, setDevotionals] = useState<DevotionalRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    const today = new Date().toISOString().split('T')[0];

    (async () => {
      const { data } = await supabase
        .from('daily_devotionals')
        .select(COLUMNS)
        .lte('date', today)
        .order('date', { ascending: false })
        .limit(100);

      let rows = (data ?? []) as unknown as DevotionalRow[];

      // Fallback to the legacy archive table so the page is never blank
      // before the daily workflow has published its first entry.
      if (rows.length === 0) {
        const { data: legacy } = await supabase
          .from('devotionals')
          .select(COLUMNS)
          .lte('date', today)
          .order('date', { ascending: false })
          .limit(100);
        rows = (legacy ?? []) as unknown as DevotionalRow[];
      }

      if (!cancelled) setDevotionals(rows);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6 pb-32">
      <header>
        <h1 className="text-2xl font-bold text-wine-900 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-wine-600" aria-hidden="true" />
          Devotional Archive
        </h1>
        <p className="text-xs text-wine-500 mt-1">Past daily devotionals</p>
      </header>

      {devotionals === null ? (
        <div className="empty-state">
          <Loader2 className="empty-state-icon animate-spin" aria-hidden="true" />
          <p className="empty-state-title">Loading archive...</p>
        </div>
      ) : devotionals.length === 0 ? (
        <div className="empty-state py-12">
          <Calendar className="empty-state-icon text-wine-300" aria-hidden="true" />
          <p className="empty-state-title">No devotionals yet</p>
          <p className="empty-state-desc">Today&apos;s devotional will appear here once it is published.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {devotionals.map((devotional) => (
            <li key={`${devotional.date}-${devotional.id}`}>
              <Link
                href={`/devotional/${devotional.date}`}
                className="card-compact flex items-center gap-3 hover:border-wine-300/60"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-cream-200">
                  <Calendar className="h-4 w-4 text-wine-600" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-wine-900">{devotional.title}</p>
                  <p className="truncate text-xs text-wine-600">{devotional.scripture_reference}</p>
                  <p className="text-xs text-wine-500">{format(parseDate(devotional.date), 'EEEE, MMMM d, yyyy')}</p>
                </div>
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-wine-300" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
