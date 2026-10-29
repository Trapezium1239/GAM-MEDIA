'use client';

import { useEffect, useState } from 'react';
import { Music, Youtube } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAudioStore } from '@/store/use-audio-store';
import { UnifiedSearch } from '@/components/search/unified-search';
import { YouTubePlaylistEmbed } from '@/components/youtube/youtube-playlist-embed';
import { isPlayableAudio } from '@/lib/audio-url';

interface MusicTrack {
  id: string;
  title: string;
  artist_choir: string;
  audio_url: string;
  lyrics: string | null;
  release_date: string | null;
}

export default function MusicPage() {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const { playTrack } = useAudioStore();

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('church_music')
      .select('id, title, artist_choir, audio_url, lyrics, release_date')
      .order('title', { ascending: true })
      .then(({ data }) => {
        setTracks((data ?? []) as MusicTrack[]);
        setLoading(false);
      });
  }, []);

  const handlePlay = (track: MusicTrack) => {
    if (!isPlayableAudio(track.audio_url)) return;
    playTrack({
      id: track.id,
      title: track.title,
      artist: track.artist_choir,
      audioUrl: track.audio_url,
    });
  };

  const searchItems = tracks.map((track) => ({
    id: track.id,
    title: track.title,
    artist_choir: track.artist_choir,
    audio_url: track.audio_url,
    release_date: track.release_date,
    _type: 'music' as const,
  }));

  if (loading) {
    return (
      <div className="empty-state">
        <Music className="empty-state-icon" aria-hidden="true" />
        <p className="empty-state-title">Loading music...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4 pb-32">
      <header>
        <h1 className="text-2xl font-bold text-wine-900 flex items-center gap-2">
          <Music className="w-6 h-6 text-wine-600" aria-hidden="true" />
          Church Music
        </h1>
        <p className="text-xs text-wine-500 mt-1">Productions from our choir and worship teams</p>
      </header>

      <UnifiedSearch
        initialResults={searchItems}
        type="music"
        onResultClick={(result) => {
          const track = tracks.find((item) => item.id === result.id);
          if (track) handlePlay(track);
        }}
      />

      <section className="mt-8 border-t border-cream-300/50 pt-8">
        <div className="mb-4 text-center">
          <h2 className="text-lg font-bold text-wine-900 flex items-center justify-center gap-2">
            <Youtube className="w-5 h-5 text-red-500" aria-hidden="true" />
            GAM Music on YouTube
          </h2>
          <p className="mt-1 text-xs text-wine-500">Stream our full worship playlist on YouTube Music</p>
        </div>
        <YouTubePlaylistEmbed playlistId="PLEjZZqlkBhWs" title="Glorious Assembly Ministries Playlist" height={360} />
      </section>
    </div>
  );
}
