'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Image, Calendar, Tag, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import NextImage from 'next/image';

interface GalleryItem {
  id: string;
  title: string | null;
  image_url: string;
  event_tag: string | null;
  created_at: string;
}

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from('gallery_items')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!cancelled) setItems((data as GalleryItem[]) || []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6 py-4 pb-32">
      <header>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Image className="w-6 h-6 text-purple-400" />
          Gallery
        </h1>
        <p className="text-xs text-zinc-400 mt-1">Memories from our church family</p>
      </header>

      {items === null ? (
        <div className="empty-state">
          <Loader2 className="empty-state-icon animate-spin" />
          <p className="empty-state-title">Loading gallery...</p>
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => (
            <article key={item.id} className="card-compact overflow-hidden group">
              <div className="aspect-[4/3] relative overflow-hidden rounded-t-xl">
                <NextImage
                  src={item.image_url}
                  alt={item.title || 'Gallery image'}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
                />
              </div>
              <div className="p-3 space-y-1">
                {item.title && (
                  <h3 className="text-sm font-semibold text-white line-clamp-1">{item.title}</h3>
                )}
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5" />
                    {format(new Date(item.created_at), 'MMM d, yyyy')}
                  </span>
                  {item.event_tag && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-zinc-800 rounded">
                      <Tag className="w-2.5 h-2.5" />
                      {item.event_tag}
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Image className="empty-state-icon" />
          <p className="empty-state-title">No gallery images yet</p>
        </div>
      )}
    </div>
  );
}