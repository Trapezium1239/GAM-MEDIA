'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

export function ConnectivityIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      if (!isOnline) {
        setIsOnline(true);
        if (wasOffline) {
          toast({
            type: 'success',
            title: 'Back online',
            description: 'Syncing data...',
            duration: 3000,
          });
          setWasOffline(false);
        }
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      toast({
        type: 'info',
        title: 'Offline mode',
        description: 'Playing from local storage. Changes will sync when online.',
        duration: 5000,
      });
    };

    // Initial check
    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnline, wasOffline, toast]);

  if (isOnline && !wasOffline) return null;

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
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
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