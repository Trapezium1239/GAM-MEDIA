'use client';

const STORAGE_KEY = 'gam-audio-position';
const NATIVE_URI_KEY = 'gam-audio-native-uris';

export interface AudioPosition {
  trackId: string;
  currentTime: number;
  duration: number;
  title: string;
  preacher: string;
  timestamp: number;
}

export function saveAudioPosition(position: AudioPosition): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
  } catch {
    // Ignore quota errors
  }
}

export function getAudioPosition(): AudioPosition | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const position = JSON.parse(stored) as AudioPosition;

    // Expire after 7 days
    if (Date.now() - position.timestamp > 7 * 24 * 60 * 60 * 1000) {
      clearAudioPosition();
      return null;
    }

    return position;
  } catch {
    return null;
  }
}

export function clearAudioPosition(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/** Persist a native file URI for a track so playback works fully offline. */
export function saveNativeAudioUri(trackId: string, uri: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(NATIVE_URI_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    map[trackId] = uri;
    localStorage.setItem(NATIVE_URI_KEY, JSON.stringify(map));
  } catch {
    // Ignore quota errors — IndexedDB blob cache remains the fallback
  }
}

export function getNativeAudioUri(trackId: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(NATIVE_URI_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, string>;
    return map[trackId] || null;
  } catch {
    return null;
  }
}

/** Resolve the best playable source: native file URI > cached blob > remote URL. */
export function resolveAudioSource(track: { id: string; audioUrl: string; offlineAudioUrl?: string }): string {
  if (track.offlineAudioUrl) return track.offlineAudioUrl;
  const nativeUri = getNativeAudioUri(track.id);
  if (nativeUri) return nativeUri;
  return track.audioUrl;
}
