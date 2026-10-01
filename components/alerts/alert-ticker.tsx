'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Info, AlertTriangle, AlertCircle } from 'lucide-react';

interface AlertItem {
  id: string;
  title: string;
  message: string;
  level: 'info' | 'advisory' | 'urgent';
  target_group: string;
}

const iconMap = {
  info: { icon: Info, cls: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  advisory: { icon: AlertTriangle, cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  urgent: { icon: AlertCircle, cls: 'text-red-400 bg-red-500/10 border-red-500/20' },
};

export function AlertTicker() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('alerts')
          .select('*')
          .gt('expires_at', new Date().toISOString())
          .neq('level', 'urgent')
          .order('created_at', { ascending: false })
          .limit(10);

        if (data) setAlerts(data as AlertItem[]);
      } catch {
        // silent
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!alerts.length) return null;

  const tickerContent = alerts.map((alert) => {
    const meta = iconMap[alert.level];
    const Icon = meta.icon;
    return (
      <span key={alert.id} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium whitespace-nowrap ${meta.cls}`}>
        <Icon className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
        <span className="uppercase tracking-wider font-bold">{alert.level}</span>
        <span className="font-semibold">{alert.title}</span>
        <span>{alert.message}</span>
      </span>
    );
  });

  return (
    <div className="overflow-hidden bg-zinc-900 border-b border-zinc-800" aria-live="polite">
      <div className="flex gap-6 py-2 px-4 animate-marquee whitespace-nowrap" style={{ width: 'max-content' }}>
        {tickerContent}
        {tickerContent}
      </div>
    </div>
  );
}