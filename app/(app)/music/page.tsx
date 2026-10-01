'use client';
import { useAudioStore } from '@/store/use-audio-store';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { Music, Play, Pause } from 'lucide-react';

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

  if (loading) {
    return <div className="empty-state"><Music className="empty-state-icon" /><p className="empty-state-title">Loading music...</p></div>;
  }

  return (
    <div className="space-y-6 py-4 pb-32">
      <header>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Music className="w-6 h-6 text-amber-400" />
          Church Music
        </h1>
        <p className="text-xs text-zinc-400 mt-1">Productions from our choir and worship teams</p>
      </header>

      {tracks.length === 0 ? (
        <div className="empty-state">
          <Music className="empty-state-icon" />
          <p className="empty-state-title">No music tracks uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tracks.map((track) => (
            <button
              key={track.id}
              onClick={() => handlePlay(track)}
              className="card-compact flex items-center gap-3 touch-manipulation text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                {currentTrack?.id === track.id && isPlaying ? (
                  <Pause className="w-5 h-5 text-amber-400" />
                ) : (
                  <Play className="w-5 h-5 text-amber-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{track.title}</p>
                <p className="text-xs text-zinc-400 truncate">{track.artist_choir}</p>
              </div>
              {track.lyrics && (
                <span className="text-[10px] text-zinc-500 px-2 py-1 bg-zinc-800 rounded">Lyrics</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}