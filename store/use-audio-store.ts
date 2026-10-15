'use client';
import { create } from 'zustand';
import { getNativeAudioUri } from '@/lib/audio-persistence';

interface Track {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  offlineAudioUrl?: string;
}

interface AudioState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playTrack: (track: Track) => void;
  togglePlay: () => void;
  stop: () => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  seek: (time: number) => void;
  seekRelative: (delta: number) => void;
  setOfflineAudioUrl: (id: string, url: string) => void;
}

/** Push track metadata to the native Media Session (lock screen / background). */
function publishMediaSession(track: Track) {
  try {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    if (typeof MediaMetadata === 'undefined') return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: 'GAM Media Vault',
    });
  } catch {
    // Media Session is progressive enhancement — never break playback
  }
}

export const useAudioStore = create<AudioState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  playTrack: (track) => {
    // Prefer cached offline URL, then native file URI, then remote stream.
    const nativeUri = getNativeAudioUri(track.id);
    const effectiveUrl = track.offlineAudioUrl || nativeUri || track.audioUrl;
    const next: Track = { ...track, audioUrl: effectiveUrl };
    if (!track.offlineAudioUrl && nativeUri) next.offlineAudioUrl = nativeUri;
    set({ currentTrack: next, isPlaying: true, currentTime: 0 });
    publishMediaSession(next);
  },
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  stop: () => set({ currentTrack: null, isPlaying: false, currentTime: 0, duration: 0 }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  seek: (time) => set({ currentTime: time }),
  seekRelative: (delta) => set((state) => ({ currentTime: Math.max(0, Math.min(state.duration, state.currentTime + delta)) })),
  setOfflineAudioUrl: (id, url) => set((state) => {
    if (state.currentTrack?.id === id) {
      return { currentTrack: { ...state.currentTrack, offlineAudioUrl: url, audioUrl: url } };
    }
    return {};
  }),
}));