'use client';
import { Calendar, Clock, MapPin, Search, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { UnifiedSearch } from '@/components/search/unified-search';

interface Program {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  venue: string;
  flyer_url: string | null;
}

export default async function ProgramsPage() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/programs`, {
    cache: 'no-store',
  });
  const programs: Program[] = (await res.json()) || [];

  const searchItems = programs.map(p => ({
    id: p.id,
    title: p.title,
    description: p.description,
    event_date: p.event_date,
    venue: p.venue,
    flyer_url: p.flyer_url,
    _type: 'programs' as const,
  }));

  return (
    <div className="space-y-6 py-4 pb-32">
      <header>
        <h1 className="text-2xl font-bold text-wine-900 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-wine-600" />
          Programs & Itinerary
        </h1>
        <p className="text-xs text-wine-500 mt-1">Upcoming and past church events</p>
      </header>

      <UnifiedSearch
        initialResults={searchItems}
        topics={[]}
        type="programs"
        serverSearchEnabled
        serverSearchThreshold={50}
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-wine-600 uppercase tracking-wider">Upcoming Events</h2>
        <div className="space-y-2">
          {searchItems
            .filter(p => new Date(p.event_date) >= new Date())
            .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
            .map((program) => (
              <article key={program.id} className="card space-y-2">
                <h3 className="text-sm font-semibold text-wine-900">{program.title}</h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-wine-500">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(program.event_date), 'EEEE, MMMM d, yyyy')}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{format(new Date(program.event_date), 'h:mm a')}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{program.venue}</span>
                </div>
                {program.description && (
                  <p className="mt-2 text-xs text-wine-500 line-clamp-2">{program.description}</p>
                )}
              </article>
            ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-wine-600 uppercase tracking-wider">Past Events</h2>
        <div className="space-y-2">
          {searchItems
            .filter(p => new Date(p.event_date) < new Date())
            .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())
            .slice(0, 10)
            .map((program) => (
              <article key={program.id} className="card-compact opacity-70">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-wine-900">{program.title}</h3>
                  <span className="text-xs text-wine-500">{format(new Date(program.event_date), 'MMM d, yyyy')}</span>
                </div>
                <p className="text-xs text-wine-500 mt-1">{program.venue}</p>
              </article>
            ))}
        </div>
      </section>
    </div>
  );
}