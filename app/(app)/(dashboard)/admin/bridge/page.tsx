'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Wifi, Send, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface BridgeChannel {
  id: string;
  platform: string;
  channel_id: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminBridgePage() {
  const [rows, setRows] = useState<BridgeChannel[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from('bridge_channels')
      .select('id, platform, channel_id, is_active, created_at')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) {
          setError(err.message);
          setRows([]);
        } else {
          setRows((data || []) as BridgeChannel[]);
        }
      }, (err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load bridge channels');
        setRows([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (rows === null) {
    return (
      <div className="empty-state">
        <Loader2 className="empty-state-icon animate-spin" />
        <p className="empty-state-title">Loading relay channels...</p>
      </div>
    );
  }

  const activeCount = rows.filter((r) => r.is_active).length;

  return (
    <div className="space-y-6 py-4">
      <header>
        <h1 className="text-2xl font-bold text-wine-900 flex items-center gap-2">
          <Wifi className="w-6 h-6 text-wine-600" />
          Bridge Relay
        </h1>
        <p className="text-xs text-wine-500 mt-1">Telegram / WhatsApp broadcast destinations</p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl bg-cream-100 border border-cream-300/60">
          <p className="text-2xl font-bold text-wine-900">{rows.length}</p>
          <p className="text-[10px] uppercase tracking-wider text-wine-500 mt-1">Channels</p>
        </div>
        <div className="p-4 rounded-xl bg-cream-100 border border-cream-300/60">
          <p className="text-2xl font-bold text-wine-900">{activeCount}</p>
          <p className="text-[10px] uppercase tracking-wider text-wine-500 mt-1">Active</p>
        </div>
      </div>

      <section className="card space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-wine-900">
          <Send className="w-4 h-4 text-wine-600" />
          How dispatch works
        </h2>
        <ol className="text-xs text-wine-600 space-y-1.5 list-decimal list-inside">
          <li>Admin broadcasts an alert or a guest submits the Welcome form.</li>
          <li>Supabase Realtime pushes the new row to every open app instantly.</li>
          <li>Native devices also receive APNs/FCM push via stored device tokens.</li>
        </ol>
        <p className="text-[11px] text-wine-500">Manage channels directly in Supabase (bridge_channels) — toggling is_active pauses delivery without deleting history.</p>
      </section>

      {error && (
        <p role="alert" className="text-xs rounded-lg px-3 py-2 bg-red-500/10 text-red-700 border border-red-500/20">
          Could not load bridge channels: {error}
        </p>
      )}

      {rows.length === 0 && !error ? (
        <div className="text-center py-16">
          <Wifi className="w-12 h-12 mx-auto mb-3 text-cream-400" />
          <p className="text-sm font-semibold text-wine-700">No relay channels configured</p>
          <p className="text-xs text-wine-500 mt-1">Insert a row into bridge_channels (telegram + channel_id) to start relaying alerts.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((ch) => (
            <article key={ch.id} className="card-compact flex items-center gap-3">
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${ch.is_active ? 'bg-green-500/10 text-green-700' : 'bg-cream-200/70 text-cream-600'}`}>
                {ch.is_active ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-wine-900 capitalize">{ch.platform}</p>
                <p className="text-xs text-wine-500 truncate font-mono">{ch.channel_id}</p>
                <p className="text-[10px] text-wine-500">Added {format(new Date(ch.created_at), 'MMM d, yyyy')}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${ch.is_active ? 'bg-green-500/10 text-green-700' : 'bg-cream-200/70 text-cream-600'}`}>
                {ch.is_active ? 'Active' : 'Paused'}
              </span>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
