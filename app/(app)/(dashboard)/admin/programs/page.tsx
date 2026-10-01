'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Calendar } from 'lucide-react';

export default function AdminProgramsPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [venue, setVenue] = useState('');
  const [flyerUrl, setFlyerUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          event_date: new Date(eventDate).toISOString(),
          venue: venue.trim(),
          flyer_url: flyerUrl.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Failed to create program');

      setResult({ ok: true, msg: 'Program added!' });
      setTitle('');
      setDescription('');
      setEventDate('');
      setVenue('');
      setFlyerUrl('');
      router.refresh();
    } catch (err) {
      setResult({ ok: false, msg: err instanceof Error ? err.message : 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
      <header>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Calendar className="w-6 h-6 text-green-400" />
          Add Program
        </h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
        <div className="space-y-1.5">
          <label htmlFor="p-title" className="label-base text-zinc-300">Title</label>
          <input id="p-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Program title" className="input-base" required minLength={3} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="p-date" className="label-base text-zinc-300">Date & Time</label>
          <input id="p-date" type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="input-base" required />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="p-venue" className="label-base text-zinc-300">Venue</label>
          <input id="p-venue" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Main Auditorium" className="input-base" required minLength={2} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="p-desc" className="label-base text-zinc-300">Description (optional)</label>
          <textarea id="p-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Event details..." className="input-base min-h-[80px] resize-none" />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="p-flyer" className="label-base text-zinc-300">Flyer URL (optional)</label>
          <input id="p-flyer" type="url" value={flyerUrl} onChange={(e) => setFlyerUrl(e.target.value)} placeholder="https://..." className="input-base" />
        </div>

        {result && (
          <p className={`text-xs rounded-lg px-3 py-2 ${result.ok ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`} role="alert">
            {result.msg}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full h-11">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-2" />Add Program</>}
        </button>
      </form>
    </div>
  );
}