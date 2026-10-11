'use client';
import { useAudioStore } from '@/store/use-audio-store';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { Music, Play, Pause, Youtube, Search } from 'lucide-react';
import { YouTubePlaylistEmbed } from '@/components/youtube/youtube-playlist-embed';
import { UnifiedSearch } from '@/components/search/unified-search';

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
  const { currentTrack, isPlaying, playTrack, togglePlay } = useAudioStore();

  useEffect(() => {
    const supabase = createClient();
    supabase.from('church_music').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setTracks(data || []);
      setLoading(false);
    });
  }, []);

  const handlePlay = (track: MusicTrack) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      playTrack({ id: track.id, title: track.title, artist: track.artist_choir, audioUrl: track.audio_url });
    }
  };

  const searchItems = tracks.map(t => ({
    id: t.id,
    title: t.title,
    artist_choir: t.artist_choir,
    audio_url: t.audio_url,
    release_date: t.release_date,
    _type: 'music' as const,
  }));

  if (loading) {
    return <div className="empty-state"><Music className="empty-state-icon" /><p className="empty-state-title">Loading music...</p></div>;
  }

  return (
    <div className="space-y-6 py-4 pb-32">
      <header>
        <h1 className="text-2xl font-bold text-wine-900 flex items-center gap-2">
          <Music className="w-6 h-6 text-wine-600" />
          Church Music
        </h1>
        <p className="text-xs text-wine-500 mt-1">Productions from our choir and worship teams</p>
      </header>

      <UnifiedSearch
        initialResults={searchItems}
        topics={[]}
        type="music"
        serverSearchEnabled
        serverSearchThreshold={50}
        onResultClick={(result) => handlePlay(tracks.find(t => t.id === result.id)!)}
      />

      {/* YouTube Music Playlist */}
      <section className="mt-8 pt-8 border-t border-cream-300/50">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-wine-900 flex items-center justify-center gap-2">
            <Youtube className="w-5 h-5 text-red-500" />
            GAM Music on YouTube
          </h2>
          <p className="text-wine-500 text-sm">Stream our full worship playlist on YouTube Music</p>
        </div>
        <YouTubePlaylistEmbed 
          playlistId="PLEjZZqlkBhWs"
          title="GAM Worship & Praise"
          height={500}
          autoplay={false}
        />
      </section>
    </div>
  );
}