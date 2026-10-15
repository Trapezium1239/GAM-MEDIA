'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Image } from 'lucide-react';

export default function AdminGalleryPage() {
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [eventTag, setEventTag] = useState('');
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
      const { error } = await supabase.from('gallery_items').insert({
        title: title.trim() || null,
        image_url: imageUrl.trim(),
        event_tag: eventTag.trim() || null,
      });

      if (error) throw new Error(error.message || 'Failed to add image');

      setResult({ ok: true, msg: 'Image added to gallery!' });
      setTitle('');
      setImageUrl('');
      setEventTag('');
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
          <Image className="w-6 h-6 text-purple-400" />
          Add Gallery Image
        </h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
        <div className="space-y-1.5">
          <label htmlFor="g-url" className="label-base text-zinc-300">Image URL</label>
          <input id="g-url" type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className="input-base" required />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="g-title" className="label-base text-zinc-300">Title (optional)</label>
          <input id="g-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Youth Conference 2026" className="input-base" maxLength={100} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="g-tag" className="label-base text-zinc-300">Event Tag (optional)</label>
          <input id="g-tag" value={eventTag} onChange={(e) => setEventTag(e.target.value)} placeholder="e.g. Sunday Service" className="input-base" maxLength={50} />
        </div>

        {result && (
          <p className={`text-xs rounded-lg px-3 py-2 ${result.ok ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`} role="alert">
            {result.msg}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full h-11">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-2" />Add Image</>}
        </button>
      </form>
    </div>
  );
}