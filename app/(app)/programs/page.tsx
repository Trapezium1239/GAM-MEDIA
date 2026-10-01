import { createClient } from '@/lib/supabase/server';
import { Calendar, Clock, MapPin, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface Program {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  venue: string;
  flyer_url: string | null;
}

export default async function ProgramsPage() {
  const supabase = await createClient();

  const { data: upcoming } = await supabase.from('programs').select('*').gte('event_date', new Date().toISOString()).order('event_date', { ascending: true });
  const { data: past } = await supabase.from('programs').select('*').lt('event_date', new Date().toISOString()).order('event_date', { ascending: false }).limit(10);

  return (
    <div className="space-y-6 py-4 pb-32">
      <header>
        <h1 className="text-2xl font-bold text-white">Programs & Itinerary</h1>
        <p className="text-xs text-zinc-400 mt-1">Upcoming and past church events</p>
      </header>

      {upcoming && upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Upcoming</h2>
          <div className="space-y-2">
            {upcoming.map((program) => (
              <article key={program.id} className="card space-y-2">
                <h3 className="text-sm font-semibold text-white">{program.title}</h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(program.event_date), 'EEEE, MMMM d, yyyy')}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{format(new Date(program.event_date), 'h:mm a')}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{program.venue}</span>
                </div>
                {program.description && (
                  <p className="mt-2 text-xs text-zinc-500 line-clamp-2">{program.description}</p>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {past && past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Past Events</h2>
          <div className="space-y-2">
            {past.map((program) => (
              <article key={program.id} className="card-compact opacity-70">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">{program.title}</h3>
                  <span className="text-xs text-zinc-500">{format(new Date(program.event_date), 'MMM d, yyyy')}</span>
                </div>
                <p className="text-xs text-zinc-500 mt-1">{program.venue}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {(!upcoming || upcoming.length === 0) && (!past || past.length === 0) && (
        <div className="empty-state">
          <Calendar className="empty-state-icon" />
          <p className="empty-state-title">No programs scheduled yet</p>
        </div>
      )}
    </div>
  );
}