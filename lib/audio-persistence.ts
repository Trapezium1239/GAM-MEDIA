'use client';

const STORAGE_KEY = 'gam-audio-position';

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