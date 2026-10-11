'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Plus, BookOpen, Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function AdminSermonsPage() {
  const [title, setTitle] = useState('');
  const [preacher, setPreacher] = useState('');
  const [date, setDate] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const payload = {
        title: title.trim(),
        preacher: preacher.trim(),
        date,
        audio_url: audioUrl.trim() || undefined,
        video_link: videoLink.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      const res = await fetch('/api/admin/sermons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Failed to create sermon');

      setResult({ ok: true, msg: 'Sermon added!' });
      setTitle('');
      setPreacher('');
      setDate('');
      setAudioUrl('');
      setVideoLink('');
      setNotes('');
      router.refresh();
    } catch (err) {
      setResult({ ok: false, msg: err instanceof Error ? err.message : 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-400" />
          Add Sermon
        </h1>
        <Link href="/admin/sermons/bulk" className="btn-secondary inline-flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Bulk Import
        </Link>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
        <div className="space-y-1.5">
          <label htmlFor="s-title" className="label-base text-zinc-300">Title</label>
          <input id="s-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sermon title" className="input-base" required minLength={3} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="s-preacher" className="label-base text-zinc-300">Preacher</label>
          <input id="s-preacher" value={preacher} onChange={(e) => setPreacher(e.target.value)} placeholder="Preacher name" className="input-base" required minLength={2} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="s-date" className="label-base text-zinc-300">Date</label>
          <input id="s-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-base" required />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="s-audio" className="label-base text-zinc-300">Audio URL (optional)</label>
          <input id="s-audio" type="url" value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} placeholder="https://..." className="input-base" />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="s-video" className="label-base text-zinc-300">Video URL (optional)</label>
          <input id="s-video" type="url" value={videoLink} onChange={(e) => setVideoLink(e.target.value)} placeholder="https://..." className="input-base" />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="s-notes" className="label-base text-zinc-300">Notes (optional)</label>
          <textarea id="s-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Key points, scripture references..." className="input-base min-h-[80px] resize-none" />
        </div>

        {result && (
          <p className={`text-xs rounded-lg px-3 py-2 ${result.ok ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`} role="alert">
            {result.msg}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full h-11">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-2" />Add Sermon</>}
        </button>
      </form>
    </div>
  );
}