'use client';

import { useAudioStore } from '@/store/use-audio-store';
import { Play, Pause, X, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/components/ui/toast';
import { saveAudioPosition, getAudioPosition, clearAudioPosition, formatTime, type AudioPosition } from '@/lib/audio-persistence';

export function PersistentPlayer() {
  const { currentTrack, isPlaying, togglePlay, stop, seek, seekRelative, setCurrentTime } = useAudioStore();
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [usingOffline, setUsingOffline] = useState(false);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [resumePosition, setResumePosition] = useState<AudioPosition | null>(null);

  // Save position on time update
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    const handleTimeUpdate = () => {
      saveAudioPosition({
        trackId: currentTrack.id,
        currentTime: audio.currentTime,
        duration: audio.duration || 0,
        title: currentTrack.title,
        preacher: currentTrack.artist,
        timestamp: Date.now(),
      });
      setCurrentTime(audio.currentTime);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => audio.removeEventListener('timeupdate', handleTimeUpdate);
  }, [currentTrack, setCurrentTime]);

  // Check for resume position on mount
  useEffect(() => {
    const saved = getAudioPosition();
    if (saved && currentTrack?.id === saved.trackId) {
      setResumePosition(saved);
      setShowResumePrompt(true);
    }
  }, [currentTrack]);

  // Playback control
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => useAudioStore.setState({ isPlaying: false }));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTrack]);

  // Media Session API — lock-screen + background controls (native + web)
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator) || !currentTrack) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: 'GAM Media Vault',
      });
    } catch {
      return;
    }
    try {
      navigator.mediaSession.setActionHandler('play', () => useAudioStore.setState({ isPlaying: true }));
    } catch { /* handler unsupported — safe to ignore */ }
    try {
      navigator.mediaSession.setActionHandler('pause', () => useAudioStore.setState({ isPlaying: false }));
    } catch { /* handler unsupported — safe to ignore */ }
    try {
      navigator.mediaSession.setActionHandler('stop', () => stop());
    } catch { /* handler unsupported — safe to ignore */ }
    try {
      navigator.mediaSession.setActionHandler('seekbackward', () => seekRelative(-10));
    } catch { /* handler unsupported — safe to ignore */ }
    try {
      navigator.mediaSession.setActionHandler('seekforward', () => seekRelative(10));
    } catch { /* handler unsupported — safe to ignore */ }
    try {
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) {
          seek(details.seekTime);
        }
      });
    } catch { /* handler unsupported — safe to ignore */ }
  }, [currentTrack, stop, seek, seekRelative]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seekRelative(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seekRelative(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          seekRelative(30);
          break;
        case 'ArrowDown':
          e.preventDefault();
          seekRelative(-30);
          break;
        case 'm':
          e.preventDefault();
          togglePlay();
          break;
        case '0':
          e.preventDefault();
          seek(0);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, seek, seekRelative, stop]);

  if (!currentTrack) return null;

  const handleResume = () => {
    if (resumePosition && audioRef.current) {
      audioRef.current.currentTime = resumePosition.currentTime;
      clearAudioPosition();
      setShowResumePrompt(false);
      toast({
        type: 'success',
        title: 'Resumed playback',
        description: `Continuing from ${formatTime(resumePosition.currentTime)}`,
        duration: 2000,
      });
    }
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    clearAudioPosition();
    setShowResumePrompt(false);
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto bg-zinc-900/95 backdrop-blur-md border-t border-zinc-800 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-2xl flex items-center justify-between gap-3">
        <audio
          ref={audioRef}
          src={currentTrack.offlineAudioUrl || currentTrack.audioUrl}
          preload="auto"
          onEnded={() => {
            clearAudioPosition();
            stop();
          }}
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

      {showResumePrompt && (
        <div className="fixed bottom-24 left-4 right-4 z-50 max-w-md mx-auto animate-in slide-in-from-bottom-2">
          <div className="bg-wine-900/95 backdrop-blur-sm border border-wine-700 rounded-xl p-4 shadow-2xl text-cream-50">
            <div className="flex items-center gap-2 mb-3">
              <RotateCcw className="w-5 h-5 text-amber-400" />
              <span className="font-medium">Resume playback?</span>
            </div>
            <p className="text-sm text-cream-400 mb-4">
              Continue <strong>{resumePosition?.title}</strong> from <strong>{resumePosition ? formatTime(resumePosition.currentTime) : '0:00'}</strong> / {resumePosition ? formatTime(resumePosition.duration) : '0:00'}?
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleResume}
                className="flex-1 py-2 bg-amber-500 text-zinc-950 font-semibold rounded-lg touch-manipulation"
              >
                Resume
              </button>
              <button
                onClick={handleRestart}
                className="flex-1 py-2 bg-zinc-700 text-cream-50 font-semibold rounded-lg touch-manipulation"
              >
                Restart
              </button>
            </div>
            <button
              onClick={() => setShowResumePrompt(false)}
              className="absolute top-2 right-2 text-cream-400 hover:text-cream-200"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}