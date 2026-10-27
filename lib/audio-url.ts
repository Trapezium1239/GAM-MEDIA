/**
 * Audio URL helpers.
 *
 * Supabase `audio_url` / `r2_key` columns may contain any of:
 *  - a full URL             https://media.example.com/audio/123.mp3
 *  - an R2 object key       audio/1234567890-filename.mp3
 *  - a bundled asset path   /audio/track.mp3
 *  - a device-local file    file:///... , capacitor://... , content://...
 *  - dead/placeholder data  local://Track.mp3 , audio/default-placeholder.mp3
 *
 * `resolveAudioUrl` turns the first four into something fetchable.
 * `isPlayableAudio` tells the UI whether a Play/Download button should even be
 * shown, so we never render a button that is guaranteed to fail.
 */

const R2_BASE = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/+$/, '') ?? '';

/** Values that can never be fetched from the web app or the native shell. */
const UNPLAYABLE_PATTERNS = [/^local:\/\//i, /default-placeholder/i];

/** Protocols/forms the browser or Capacitor webview can actually load. */
const DIRECT_PATTERNS = /^(https?:\/\/|blob:|file:|capacitor:\/\/|content:\/\/|\/)/i;

/** Trim stray whitespace/CRLF that CSV imports leave behind. */
function normalize(audioUrl: string): string {
  return audioUrl.replace(/[\r\n\t]+/g, ' ').trim();
}

/**
 * Resolves an audio reference to a fully-qualified, fetchable URL.
 * Returns '' when the value is empty; returns the raw value when no R2 base
 * URL is configured (callers should check `isPlayableAudio` first).
 */
export function resolveAudioUrl(audioUrl: string | null | undefined): string {
  if (!audioUrl) return '';
  const clean = normalize(audioUrl);
  if (!clean) return '';
  if (DIRECT_PATTERNS.test(clean)) return clean;
  if (R2_BASE) return `${R2_BASE}/${clean.replace(/^\/+/, '')}`;
  return clean;
}

/**
 * True only when the reference can realistically be streamed or downloaded.
 * Placeholder and `local://` rows return false so the UI can say
 * "Audio not available" instead of failing silently.
 */
export function isPlayableAudio(audioUrl: string | null | undefined): boolean {
  if (!audioUrl) return false;
  const clean = normalize(audioUrl);
  if (!clean) return false;
  if (UNPLAYABLE_PATTERNS.some((re) => re.test(clean))) return false;
  return DIRECT_PATTERNS.test(resolveAudioUrl(clean));
}
