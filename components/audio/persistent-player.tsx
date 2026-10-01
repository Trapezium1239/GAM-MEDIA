'use client';
import { useAudioStore } from '@/store/use-audio-store';
import { Play, Pause, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function PersistentPlayer() {
  const { currentTrack, isPlaying, togglePlay, stop } = useAudioStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [usingOffline, setUsingOffline] = useState(false);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => useAudioStore.setState({ isPlaying: false }));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTrack]);

  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: 'GAM App',
      });
      navigator.mediaSession.setActionHandler('play', () => useAudioStore.setState({ isPlaying: true }));
      navigator.mediaSession.setActionHandler('pause', () => useAudioStore.setState({ isPlaying: false }));
      navigator.mediaSession.setActionHandler('stop', () => stop());
      navigator.mediaSession.setActionHandler('previoustrack', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
    }
  }, [currentTrack, stop]);

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto bg-zinc-900/95 backdrop-blur-md border-t border-zinc-800 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-2xl flex items-center justify-between gap-3">
      <audio
        ref={audioRef}
        src={currentTrack.offlineAudioUrl || currentTrack.audioUrl}
        preload="auto"
        onEnded={stop}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-zinc-100 truncate">{currentTrack.title}</p>
          <p className="text-[10px] text-zinc-400 truncate">{currentTrack.artist}</p>
          {currentTrack.offlineAudioUrl && (
            <span className="px-1.5 py-0.5 text-[9px] bg-green-500/20 text-green-400 rounded-full font-medium">
              Offline
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          className="w-9 h-9 rounded-full bg-zinc-100 text-zinc-950 flex items-center justify-center touch-manipulation active:scale-95 transition"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>
        <button
          onClick={stop}
          aria-label="Stop and close player"
          className="w-8 h-8 rounded-full text-zinc-400 hover:text-white flex items-center justify-center touch-manipulation"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}