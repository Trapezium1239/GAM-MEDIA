'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { flushOfflineQueue, getOfflineQueueCount } from '@/lib/offline-queue';

async function getNativeStatus(): Promise<boolean> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return navigator.onLine;
    const { Network } = await import('@capacitor/network');
    const status = await Network.getStatus();
    return status.connected;
  } catch {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }
}

export function ConnectivityIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;

    const handleOnline = async () => {
      if (cancelled) return;
      setIsOnline(true);
      if (!wasOffline) return;
      setSyncing(true);
      try {
        const pendingBefore = await getOfflineQueueCount();
        const { flushed, pending } = await flushOfflineQueue();
        if (cancelled) return;
        toast({
          type: 'success',
          title: 'Back online',
          description:
            pendingBefore > 0
              ? `Synced ${flushed} queued submission${flushed === 1 ? '' : 's'}${pending > 0 ? ` — ${pending} still pending` : ''}.`
              : 'Syncing data...',
          duration: 4000,
        });
      } catch {
        if (!cancelled) toast({ type: 'info', title: 'Back online', description: 'Sync will retry shortly.', duration: 3000 });
      } finally {
        if (!cancelled) {
          setSyncing(false);
          setWasOffline(false);
        }
      }
    };

    const handleOffline = () => {
      if (cancelled) return;
      setIsOnline(false);
      setWasOffline(true);
      toast({
        type: 'info',
        title: 'Offline mode',
        description: 'Playing from local storage. Submissions queue and sync when online.',
        duration: 5000,
      });
    };

    getNativeStatus().then((online) => {
      if (!cancelled) setIsOnline(online);
    });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    let removeNativeListener: (() => void) | null = null;
    (async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;
        const { Network } = await import('@capacitor/network');
        const listener = await Network.addListener('networkStatusChange', (status) => {
          if (cancelled) return;
          if (status.connected) void handleOnline();
          else handleOffline();
        });
        removeNativeListener = () => void listener.remove();
      } catch {
        // web fallback already wired
      }
    })();

    return () => {
      cancelled = true;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (removeNativeListener) removeNativeListener();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wasOffline]);

  if (isOnline && !wasOffline && !syncing) return null;

  return (
    <div
      className={`fixed bottom-24 left-4 right-4 z-50 max-w-md mx-auto animate-in slide-in-from-bottom-2 ${
        isOnline ? 'bg-green-500/90' : 'bg-amber-500/90'
      } backdrop-blur-sm rounded-xl px-4 py-3 shadow-2xl flex items-center gap-3 text-cream-50`}
      role="status"
      aria-live="polite"
    >
      {isOnline ? (
        <>
          <RefreshCw className="w-5 h-5 animate-spin" aria-hidden="true" />
          <span className="text-sm font-medium">Back online — syncing...</span>
        </>
      ) : (
        <>
          <WifiOff className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-sm font-medium">Offline mode</p>
            <p className="text-[11px] opacity-80">Playing from local storage. Changes sync when online.</p>
          </div>
          <AlertCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
        </>
      )}
    </div>
  );
}

export function ConnectivityStatusIcon() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getNativeStatus().then((online) => {
      if (!cancelled) setIsOnline(online);
    });
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    let removeNativeListener: (() => void) | null = null;
    (async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;
        const { Network } = await import('@capacitor/network');
        const listener = await Network.addListener('networkStatusChange', (status) => {
          if (!cancelled) setIsOnline(status.connected);
        });
        removeNativeListener = () => void listener.remove();
      } catch {
        // silent
      }
    })();
    return () => {
      cancelled = true;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (removeNativeListener) removeNativeListener();
    };
  }, []);

  return (
    <button
      className={`relative p-1.5 rounded-lg transition-colors ${
        isOnline ? 'text-green-500 hover:bg-green-500/10' : 'text-amber-500 hover:bg-amber-500/10'
      }`}
      aria-label={isOnline ? 'Online' : 'Offline'}
    >
      {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
      <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-cream-50 ${isOnline ? 'bg-green-500' : 'bg-amber-500'}`} />
    </button>
  );
}