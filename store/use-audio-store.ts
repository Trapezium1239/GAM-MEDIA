'use client';
import { create } from 'zustand';

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

export const useAudioStore = create<AudioState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  playTrack: (track) => {
    const effectiveUrl = track.offlineAudioUrl || track.audioUrl;
    set({ currentTrack: { ...track, audioUrl: effectiveUrl }, isPlaying: true, currentTime: 0 });
    if ('mediaSession' in navigator && typeof MediaMetadata !== 'undefined') {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: 'GAM Media Vault',
      });
    }
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