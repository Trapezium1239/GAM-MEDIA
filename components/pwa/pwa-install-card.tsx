'use client';

import { useEffect, useState } from 'react';
import { Smartphone, Download, Share2, Check, X, HelpCircle } from 'lucide-react';
import { InstallButton } from '@/components/pwa/install-button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallCard() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    const isIOSDevice = /iphone|ipad|ipod/.test(ua.toLowerCase());
    const isInStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsIOS(isIOSDevice);
    setIsInstalled(isInStandaloneMode);

    if (isInStandaloneMode) return;

    const dismissed = localStorage.getItem('gam_app_install_dismissed');
    const dismissUntil = dismissed ? Number(dismissed) + 86400_000 * 3 : 0; // 3-day cooldown

    if (dismissed && Date.now() < dismissUntil) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      const timer = setTimeout(() => {}, 10_000);
      return () => clearTimeout(timer);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (isIOSDevice && !isInStandaloneMode) {
      const timer = setTimeout(() => {}, 15_000);
      return () => clearTimeout(timer);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  if (isInstalled) {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
            <Check className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h3 className="font-semibold text-green-700">GAM App Installed</h3>
            <p className="text-sm text-green-600">You&apos;re using the full native experience.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      setShowIOSGuide(true);
      return;
    }
    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        setTimeout(() => setIsInstalled(false), 3000);
      }
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowIOSGuide(false);
    localStorage.setItem('gam_app_install_dismissed', String(Date.now()));
  };

  return (
    <div className="bg-wine-50 border border-wine-200 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-wine-100 flex items-center justify-center flex-shrink-0">
            <Download className="w-6 h-6 text-wine-600" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-wine-900">Install GAM App</h3>
            <p className="text-sm text-wine-600 mt-1">
              {isIOS
                ? 'Tap Share → Add to Home Screen for offline sermons & background audio.'
                : 'Add to home screen for offline playback, instant alerts, zero-login friction.'}
            </p>
          </div>
        </div>
        {showIOSGuide && (
          <button
            onClick={handleDismiss}
            className="text-wine-400 hover:text-wine-600 p-1 flex-shrink-0"
            aria-label="Dismiss install guide"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {!isIOS && deferredPrompt && (
        <button
          onClick={handleInstallClick}
          disabled={isInstalling}
          className="mt-3 w-full py-2.5 bg-wine-600 hover:bg-wine-700 disabled:bg-wine-600/70 text-cream-50 font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2"
        >
          {isInstalling ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Installing...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Add to Home Screen
            </>
          )}
        </button>
      )}

      {isIOS && (
        <div className="mt-3 space-y-3" style={{ animation: 'slideIn 0.3s ease-out' }}>
          <div className="p-3 bg-cream-100 border border-cream-300 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Share2 className="w-4 h-4 text-blue-600" />
              </div>
              <span className="font-medium text-wine-900 text-sm">iOS Installation</span>
            </div>
            <p className="text-xs text-wine-600">
              Tap the <strong>Share</strong> icon (square with arrow up) in Safari&apos;s bottom bar, 
              then scroll down and tap <strong>"Add to Home Screen"</strong>.
            </p>
          </div>
          <button
            onClick={handleInstallClick}
            disabled={isInstalling}
            className="w-full py-2.5 bg-wine-600 hover:bg-wine-700 disabled:bg-wine-600/70 text-cream-50 font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2"
          >
            <Smartphone className="w-4 h-4" />
            I Know How to Install
          </button>
          <button
            onClick={handleDismiss}
            className="w-full py-2 text-sm text-wine-500 hover:text-wine-700 font-medium"
          >
            Not now
          </button>
        </div>
      )}
    </div>
  );
}