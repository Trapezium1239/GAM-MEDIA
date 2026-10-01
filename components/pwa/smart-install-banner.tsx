'use client';

import { useEffect, useState } from 'react';
import { Download, X, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function SmartInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    const isIOSDevice = /iphone|ipad|ipod/.test(ua.toLowerCase());
    const isInStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsIOS(isIOSDevice);

    if (isInStandaloneMode) return;

    const dismissed = localStorage.getItem('gam_app_install_dismissed');
    const dismissUntil = dismissed ? Number(dismissed) + 86400_000 * 3 : 0; // 3-day cooldown

    if (dismissed && Date.now() < dismissUntil) return;

    // Android/Chrome/Edge/Firefox: beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show after 15s engagement
      const timer = setTimeout(() => setShowBanner(true), 15_000);
      return () => clearTimeout(timer);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // iOS Safari: show after 20s if not standalone
    if (isIOSDevice && !isInStandaloneMode) {
      const timer = setTimeout(() => setShowBanner(true), 20_000);
      return () => clearTimeout(timer);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstalled(true);
        setShowBanner(false);
        setDeferredPrompt(null);
        setTimeout(() => setInstalled(false), 3000);
      }
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('gam_app_install_dismissed', String(Date.now()));
  };

  if (!showBanner || installed) return null;

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto bg-zinc-950/95 border border-amber-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5"
      role="region"
      aria-label="Install GAM App"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <Download className="w-4 h-4 text-amber-500" aria-hidden="true" />
            Install GAM App
          </h4>
          <p className="text-xs text-zinc-400 mt-1">
            {isIOS
              ? 'Tap the Share icon ⎋ below, then "Add to Home Screen" for native full-screen offline mode.'
              : 'Add to home screen for offline sermon playback, instant alerts, and zero-login friction.'}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-zinc-500 hover:text-zinc-300 p-1 flex-shrink-0"
          aria-label="Dismiss install prompt"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {!isIOS && deferredPrompt && (
        <button
          onClick={handleInstallClick}
          disabled={isInstalling}
          className="mt-3 w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/70 text-zinc-950 font-semibold text-xs rounded-xl transition"
        >
          {isInstalling ? (
            <>
              <svg className="w-4 h-4 mr-2 animate-spin" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Installing...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Add to Home Screen
            </>
          )}
        </button>
      )}

      {installed && (
        <div className="mt-3 p-3 bg-green-500/20 border border-green-500/40 rounded-xl flex items-center gap-2 text-green-400 text-xs">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>GAM App installed! Tap the app icon to open.</span>
        </div>
      )}
    </div>
  );
}