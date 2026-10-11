'use client';

import { useState } from 'react';
import { Play, Volume2, VolumeX, ChevronRight, ExternalLink } from 'lucide-react';

interface YouTubePlaylistEmbedProps {
  playlistId: string;
  title?: string;
  height?: number;
  autoplay?: boolean;
  showControls?: boolean;
}

export function YouTubePlaylistEmbed({ 
  playlistId, 
  title = 'GAM Music Playlist',
  height = 400,
  autoplay = false,
  showControls = true
}: YouTubePlaylistEmbedProps) {
  const [isMuted, setIsMuted] = useState(!autoplay);
  const [iframeReady, setIframeReady] = useState(false);

  const embedUrl = `https://www.youtube.com/embed/videoseries?list=${playlistId}&autoplay=${autoplay ? 1 : 0}&mute=${autoplay ? 1 : 0}&controls=${showControls ? 1 : 0}&modestbranding=1&rel=0&playsinline=1`;

  return (
    <div className="w-full rounded-2xl overflow-hidden bg-zinc-900/50 border border-zinc-800/50">
      {/* Header */}
      <div className="px-4 py-3 bg-zinc-900/50 border-b border-zinc-800/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
            <Play className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{title}</h3>
            <p className="text-xs text-zinc-500">YouTube Music Playlist</p>
          </div>
        </div>
        <a
          href={`https://music.youtube.com/playlist?list=${playlistId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-zinc-400 hover:text-amber-400 flex items-center gap-1 transition"
        >
          <ExternalLink className="w-3 h-3" />
          Open in YouTube Music
        </a>
      </div>

      {/* Iframe */}
      <div className="relative" style={{ paddingBottom: '56.25%' }}>
        <iframe
          title={title}
          src={embedUrl}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 0,
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          onLoad={() => setIframeReady(true)}
          referrerPolicy="strict-origin-when-cross-origin"
        />
        {!iframeReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50">
            <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Volume toggle for autoplay-muted */}
      {autoplay && showControls && (
        <div className="p-3 bg-zinc-900/50 border-t border-zinc-800/50 flex items-center justify-end">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition text-sm"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{isMuted ? 'Unmute' : 'Mute'}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export function YouTubeVideoEmbed({ 
  videoId, 
  title = 'GAM Video',
  height = 400,
  autoplay = false
}: { 
  videoId: string;
  title?: string;
  height?: number;
  autoplay?: boolean;
}) {
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&mute=${autoplay ? 1 : 0}&controls=1&modestbranding=1&rel=0&playsinline=1`;

  return (
    <div className="w-full rounded-2xl overflow-hidden bg-zinc-900/50 border border-zinc-800/50">
      <div className="relative" style={{ paddingBottom: '56.25%' }}>
        <iframe
          title={title}
          src={embedUrl}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 0,
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  );
}