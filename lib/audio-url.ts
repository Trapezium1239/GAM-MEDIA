/**
 * Resolves an audio URL to a fully-qualified, fetchable URL.
 *
 * The Supabase `audio_url` column may contain either:
 *  - A full URL (https://...) — used as-is
 *  - An R2 object key (audio/1234567890-filename.mp3) — needs the R2 public base URL prepended
 *
 * Set NEXT_PUBLIC_R2_PUBLIC_URL in your environment to the base of your R2 public bucket,
 * e.g. https://pub-<account-id>.r2.cloudflarestorage.com/<bucket-name>
 */
export function resolveAudioUrl(audioUrl: string | null | undefined): string {
  if (!audioUrl) return '';
  if (audioUrl.startsWith('http://') || audioUrl.startsWith('https://')) return audioUrl;

  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (base) {
    return base.replace(/\/$/, '') + '/' + audioUrl.replace(/^\//, '');
  }

  // No base URL configured — return as-is. Playback/download will fail with a clear error.
  return audioUrl;
}
