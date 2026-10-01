import { createClient } from '@/lib/supabase/server';
import { format } from 'date-fns';
import { Calendar, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default async function DevotionalArchivePage() {
  const supabase = await createClient();

  const { data: devotionals } = await supabase
    .from('daily_devotionals')
    .select('*')
    .lte('date', new Date().toISOString().split('T')[0])
    .order('date', { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6 pb-32">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-amber-400" />
            Devotional Archive
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Past daily devotionals</p>
        </div>
      </header>

      {(!devotionals || devotionals.length === 0) ? (
        <div className="text-center py-16 text-zinc-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
          <p className="text-sm">No devotionals yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {devotionals.map((devotional) => {
            const date = new Date(devotional.date);
            return (
              <Link
                key={devotional.id}
                href={`/devotional/${devotional.date}`}
                className="card flex items-center justify-between gap-4 p-4 transition hover:border-amber-500/30"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-14 h-14 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{devotional.title}</p>
                    <p className="text-xs text-amber-400">{devotional.scripture_reference}</p>
                    <p className="text-[10px] text-zinc-500">{format(date, 'EEEE, MMMM d, yyyy')}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-500 flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}