'use client';
import { useState } from 'react';
import { useAudioStore } from '@/store/use-audio-store';
import { Music, Pause, Download, Check, AlertCircle } from 'lucide-react';
import { cacheAudio, isAudioCached, getCachedAudio } from '@/lib/offline-storage';

interface PlayTrackData {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
}

export function PlaySermonButton({ 
  track, 
  className = '',
  dataPlayBtn = false
}: { 
  track: PlayTrackData;
  className?: string;
  dataPlayBtn?: boolean;
}) {
  const { currentTrack, isPlaying, playTrack, togglePlay, setOfflineAudioUrl } = useAudioStore();
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const isActive = currentTrack?.id === track.id;
  const isThisPlaying = isActive && isPlaying;

  const handleDownload = async () => {
    if (downloaded || downloading) return;
    setDownloading(true);
    setDownloadError(null);

    try {
      const response = await fetch(track.audioUrl);
      if (!response.ok) throw new Error('Failed to fetch audio');
      const blob = await response.blob();

      await cacheAudio(track.id, blob, {
        title: track.title,
        artist: track.artist,
        mimeType: blob.type,
      });

      const objectUrl = URL.createObjectURL(blob);
      setOfflineAudioUrl(track.id, objectUrl);

      setDownloaded(true);
      setDownloading(false);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Download failed');
      setDownloading(false);
    }
  };

  const handleClick = () => {
    if (isActive) {
      togglePlay();
    } else {
      playTrack(track);
    }
  };

  if (downloaded) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleClick}
          className={`flex-1 py-2 text-xs font-medium text-zinc-100 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition touch-manipulation flex items-center justify-center gap-1.5 ${className}`}
          aria-label={isThisPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
          {...(dataPlayBtn && { 'data-play-btn': true })}
        >
          {isThisPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5" /> Pause
            </>
          ) : (
            <>
              <Music className="w-3.5 h-3.5" /> Play Audio
            </>
          )}
        </button>
        <span className="px-2 py-1.5 text-xs text-green-400 bg-green-500/10 rounded-full flex items-center gap-1">
          <Check className="w-3.5 h-3.5" /> Offline Ready
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleClick}
        className={`flex-1 py-2 text-xs font-medium text-zinc-100 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition touch-manipulation flex items-center justify-center gap-1.5 ${className}`}
        aria-label={isThisPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
        {...(dataPlayBtn && { 'data-play-btn': true })}
      >
        {isThisPlaying ? (
          <>
            <Pause className="w-3.5 h-3.5" /> Pause
          </>
        ) : (
          <>
            <Music className="w-3.5 h-3.5" /> Play Audio
          </>
        )}
      </button>
      <button
        onClick={downloaded ? undefined : (downloading ? undefined : handleDownload)}
        disabled={downloading}
        className={`px-3 py-2 text-xs font-medium rounded-lg transition touch-manipulation flex items-center gap-1.5 ${downloaded ? 'text-green-400 bg-green-500/10' : 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'}`}
        aria-label={downloaded ? 'Downloaded' : downloading ? 'Downloading...' : 'Download for offline'}
      >
        {downloading ? (
          <>
            <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="sr-only">Downloading...</span>
          </>
        ) : downloaded ? (
          <>
            <Check className="w-3.5 h-3.5" />
            <span className="sr-only">Downloaded</span>
          </>
        ) : (
          <>
            <Download className="w-3.5 h-3.5" />
            <span>Save</span>
          </>
        )}
      </button>
      {downloadError && (
        <span className="text-[10px] text-red-400" role="alert">{downloadError}</span>
      )}
    </div>
  );
}

export function PlayMusicButton({ track }: { track: PlayTrackData }) {
  const { currentTrack, isPlaying, playTrack, togglePlay, setOfflineAudioUrl } = useAudioStore();
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const isActive = currentTrack?.id === track.id;
  const isThisPlaying = isActive && isPlaying;

  const handleDownload = async () => {
    if (downloaded || downloading) return;
    setDownloading(true);
    setDownloadError(null);

    try {
      const response = await fetch(track.audioUrl);
      if (!response.ok) throw new Error('Failed to fetch audio');
      const blob = await response.blob();

      await cacheAudio(track.id, blob, {
        title: track.title,
        artist: track.artist,
        mimeType: blob.type,
      });

      const objectUrl = URL.createObjectURL(blob);
      setOfflineAudioUrl(track.id, objectUrl);

      setDownloaded(true);
      setDownloading(false);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Download failed');
      setDownloading(false);
    }
  };

  const handleClick = () => {
    if (isActive) {
      togglePlay();
    } else {
      playTrack(track);
    }
  };

  if (downloaded) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleClick}
          className="w-full p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-left transition hover:border-zinc-700 touch-manipulation flex items-center gap-3"
          aria-label={isThisPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
        >
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            {isThisPlaying ? (
              <Pause className="w-5 h-5 text-amber-400" />
            ) : (
              <Music className="w-5 h-5 text-amber-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{track.title}</p>
            <p className="text-xs text-zinc-400 truncate">{track.artist}</p>
          </div>
          <span className="px-2 py-1 text-xs text-green-400 bg-green-500/10 rounded-full flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Offline Ready
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleClick}
        className="w-full p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-left transition hover:border-zinc-700 touch-manipulation flex items-center gap-3"
        aria-label={isThisPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
      >
        <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
          {isThisPlaying ? (
            <Pause className="w-5 h-5 text-amber-400" />
          ) : (
            <Music className="w-5 h-5 text-amber-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{track.title}</p>
          <p className="text-xs text-zinc-400 truncate">{track.artist}</p>
        </div>
      </button>
      <button
        onClick={downloaded ? undefined : (downloading ? undefined : handleDownload)}
        disabled={downloading}
        className={`p-2 rounded-lg transition touch-manipulation flex items-center gap-1.5 ${downloaded ? 'text-green-400 bg-green-500/10' : 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'}`}
        aria-label={downloaded ? 'Downloaded' : downloading ? 'Downloading...' : 'Download for offline'}
      >
        {downloading ? (
          <>
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="sr-only">Downloading...</span>
          </>
        ) : downloaded ? (
          <>
            <Check className="w-4 h-4" />
            <span className="sr-only">Downloaded</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Save</span>
          </>
        )}
      </button>
      {downloadError && (
        <span className="text-[10px] text-red-400" role="alert">{downloadError}</span>
      )}
    </div>
  );
}