'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Mail, CheckCircle2, Clock, Users, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface FirstTimer {
  id: string;
  full_name: string;
  phone: string;
  is_first_time: boolean;
  prayer_request: string | null;
  interested_unit: string;
  status: string;
  created_at: string;
}

const statusStyles: Record<string, string> = {
  new: 'text-blue-700 bg-blue-500/10 border-blue-500/20',
  contacted: 'text-amber-700 bg-amber-500/10 border-amber-500/20',
  integrated: 'text-green-700 bg-green-500/10 border-green-500/20',
  closed: 'text-cream-600 bg-cream-200/60 border-cream-300/60',
};

export default function AdminFirstTimersPage() {
  const [rows, setRows] = useState<FirstTimer[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from('first_timers')
      .select('id, full_name, phone, is_first_time, prayer_request, interested_unit, status, created_at')
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) {
          setError(err.message);
          setRows([]);
        } else {
          setRows((data || []) as FirstTimer[]);
        }
      }, (err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load first-timers');
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
        <p className="empty-state-title">Loading first-timers...</p>
      </div>
    );
  }

  const newCount = rows.filter((r) => r.status === 'new').length;

  return (
    <div className="space-y-6 py-4">
      <header>
        <h1 className="text-2xl font-bold text-wine-900 flex items-center gap-2">
          <Mail className="w-6 h-6 text-wine-600" />
          First-Timers
        </h1>
        <p className="text-xs text-wine-500 mt-1">Welcome pipeline — follow up within 24 hours</p>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-cream-100 border border-cream-300/60">
          <p className="text-2xl font-bold text-wine-900">{rows.length}</p>
          <p className="text-xs uppercase tracking-wider text-wine-500 mt-1 flex items-center gap-1"><Users className="w-3 h-3" />Total</p>
        </div>
        <div className="p-4 rounded-xl bg-cream-100 border border-cream-300/60">
          <p className="text-2xl font-bold text-wine-900">{newCount}</p>
          <p className="text-xs uppercase tracking-wider text-wine-500 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" />New</p>
        </div>
        <div className="p-4 rounded-xl bg-cream-100 border border-cream-300/60">
          <p className="text-2xl font-bold text-wine-900">{rows.length - newCount}</p>
          <p className="text-xs uppercase tracking-wider text-wine-500 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Touched</p>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-xs rounded-lg px-3 py-2 bg-red-500/10 text-red-700 border border-red-500/20">
          Could not load first-timers: {error}
        </p>
      )}

      {rows.length === 0 && !error ? (
        <div className="text-center py-16">
          <Mail className="w-12 h-12 mx-auto mb-3 text-cream-400" />
          <p className="text-sm font-semibold text-wine-700">No first-timers yet</p>
          <p className="text-xs text-wine-500 mt-1">Submissions from the Welcome page will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <article key={row.id} className="card-compact space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-wine-900 truncate">{row.full_name}</p>
                  <p className="text-xs text-wine-500">{row.phone} • {format(new Date(row.created_at), 'MMM d, yyyy')}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border capitalize ${statusStyles[row.status] || statusStyles.new}`}>
                  {row.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-wine-500">
                <span className="px-2 py-0.5 rounded-full bg-cream-200/70 capitalize">{row.interested_unit}</span>
                {row.is_first_time && <span className="px-2 py-0.5 rounded-full bg-wine-600/10 text-wine-700">First visit</span>}
              </div>
              {row.prayer_request && (
                <p className="text-xs text-wine-700 bg-wine-50 border border-wine-200/60 rounded-lg px-3 py-2 line-clamp-2">
                  {row.prayer_request}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
