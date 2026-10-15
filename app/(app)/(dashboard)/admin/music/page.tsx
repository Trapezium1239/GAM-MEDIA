'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Music } from 'lucide-react';

export default function AdminMusicPage() {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('Church Choir');
  const [audioUrl, setAudioUrl] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { error } = await supabase.from('church_music').insert({
        title: title.trim(),
        artist_choir: artist.trim() || 'Church Choir',
        audio_url: audioUrl.trim(),
        lyrics: lyrics.trim() || null,
        release_date: releaseDate || null,
      });

      if (error) throw new Error(error.message || 'Failed to add track');

      setResult({ ok: true, msg: 'Track added!' });
      setTitle('');
      setArtist('Church Choir');
      setAudioUrl('');
      setLyrics('');
      setReleaseDate('');
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
          <Music className="w-6 h-6 text-amber-400" />
          Add Music Track
        </h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
        <div className="space-y-1.5">
          <label htmlFor="m-title" className="label-base text-zinc-300">Title</label>
          <input id="m-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Song title" className="input-base" required minLength={3} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="m-artist" className="label-base text-zinc-300">Artist / Choir</label>
          <input id="m-artist" value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Church Choir" className="input-base" />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="m-audio" className="label-base text-zinc-300">Audio URL</label>
          <input id="m-audio" type="url" value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} placeholder="https://..." className="input-base" required />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="m-date" className="label-base text-zinc-300">Release Date (optional)</label>
          <input id="m-date" type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} className="input-base" />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="m-lyrics" className="label-base text-zinc-300">Lyrics (optional)</label>
          <textarea id="m-lyrics" value={lyrics} onChange={(e) => setLyrics(e.target.value)} placeholder="Paste lyrics here..." className="input-base min-h-[120px] resize-none" />
        </div>

        {result && (
          <p className={`text-xs rounded-lg px-3 py-2 ${result.ok ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`} role="alert">
            {result.msg}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full h-11">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-2" />Add Track</>}
        </button>
      </form>
    </div>
  );
}