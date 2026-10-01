import { createClient } from '@/lib/supabase/server';
import { Image, Calendar, Tag } from 'lucide-react';
import { format } from 'date-fns';

interface GalleryItem {
  id: string;
  title: string | null;
  image_url: string;
  event_tag: string | null;
  created_at: string;
}

export default async function GalleryPage() {
  const supabase = await createClient();

  const { data: items } = await supabase.from('gallery_items').select('*').order('created_at', { ascending: false });

  return (
    <div className="space-y-6 py-4 pb-32">
      <header>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Image className="w-6 h-6 text-purple-400" />
          Gallery
        </h1>
        <p className="text-xs text-zinc-400 mt-1">Memories from our church family</p>
      </header>

      {items && items.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => (
            <article key={item.id} className="card-compact overflow-hidden group">
              <div className="aspect-[4/3] relative overflow-hidden rounded-t-xl">
                <img
                  src={item.image_url}
                  alt={item.title || 'Gallery image'}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="p-3 space-y-1">
                {item.title && (
                  <h3 className="text-sm font-semibold text-white line-clamp-1">{item.title}</h3>
                )}
                <div className="flex items-center gap-2 text-[10px] text-zinc-500">
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