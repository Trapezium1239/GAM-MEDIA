'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AlertCircle, X } from 'lucide-react';

interface AlertItem {
  id: string;
  title: string;
  message: string;
  level: 'info' | 'advisory' | 'urgent';
  target_group: string;
}

const dismissedKey = (id: string) => `dismissed_alert_${id}`;

export function UrgentAlertModal() {
  const [activeAlert, setActiveAlert] = useState<AlertItem | null>(null);
  const [allAlerts, setAllAlerts] = useState<AlertItem[]>([]);

  const fetchAlerts = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('alerts')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (data) {
        setAllAlerts(data as AlertItem[]);
        const urgent = (data as AlertItem[]).find(
          (a) => a.level === 'urgent' && !sessionStorage.getItem(dismissedKey(a.id))
        );
        if (urgent) setActiveAlert(urgent);
      }
    } catch {
      // silent fail on alerts fetch
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  useEffect(() => {
    if (!allAlerts.length) return;
    const urgent = allAlerts.find(
      (a) => a.level === 'urgent' && !sessionStorage.getItem(dismissedKey(a.id))
    );
    if (urgent && (!activeAlert || activeAlert.id !== urgent.id)) {
      setActiveAlert(urgent);
    }
  }, [allAlerts, activeAlert]);

  const handleDismiss = () => {
    if (!activeAlert) return;
    sessionStorage.setItem(dismissedKey(activeAlert.id), 'true');
    setActiveAlert(null);
    const next = allAlerts.find(
      (a) => a.level === 'urgent' && !sessionStorage.getItem(dismissedKey(a.id))
    );
    if (next) setActiveAlert(next);
  };

  if (!activeAlert) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" role="alertdialog" aria-labelledby="urgent-alert-title">
      <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-red-500/50 p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between text-red-400">
          <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wide">
            <AlertCircle className="w-5 h-5 animate-pulse" aria-hidden="true" />
            Urgent Broadcast
          </div>
          <button onClick={handleDismiss} aria-label="Dismiss alert" className="text-zinc-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-1">
          <h3 id="urgent-alert-title" className="text-base font-bold text-white">{activeAlert.title}</h3>
          <p className="text-xs text-zinc-300 leading-relaxed">{activeAlert.message}</p>
        </div>
        <button
          onClick={handleDismiss}
          className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition touch-manipulation"
        >
          Acknowledge & Dismiss
        </button>
      </div>
    </div>
  );
}