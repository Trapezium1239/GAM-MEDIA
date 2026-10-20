export interface Topic {
  id: string
  name: string
  slug: string
}

export interface Sermon {
  id: string
  title: string
  preacher: string
  date: string
  audio_url: string | null
  video_link: string | null
  notes?: string | null
  topic_id?: string | null
  topics?: Topic | null
  topic_name?: string | null
  topic_slug?: string | null
}

export interface Program {
  id: string
  title: string
  description: string | null
  event_date: string
  venue: string
  flyer_url?: string | null
}

export interface MusicTrack {
  id: string
  title: string
  artist_choir: string
  audio_url: string
  lyrics?: string | null
  release_date?: string | null
}

export interface Devotional {
  id: string
  date: string
  title: string
  scripture_reference: string
  scripture_text: string
  reflection: string
  prayer: string | null
  application_question: string | null
  source: string
  created_at?: string
  published_at?: string | null
}

export interface HomeVaultBundle {
  sermons: Sermon[]
  programs: Program[]
  music: MusicTrack[]
  stats?: {
    sermons_count: number
    programs_count: number
    alerts_count: number
    first_timers_count: number
  }
}

export interface AlertItem {
  id: string
  title: string
  message: string
  level: 'info' | 'advisory' | 'urgent'
  target_group: string
  expires_at?: string
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function isHomeVaultBundle(value: unknown): value is HomeVaultBundle {
  if (!isRecord(value)) return false
  return Array.isArray(value.sermons) && Array.isArray(value.programs) && Array.isArray(value.music)
}

export function isDevotional(value: unknown): value is Devotional {
  if (!isRecord(value)) return false
  return (
    typeof value.title === 'string' &&
    typeof value.date === 'string' &&
    typeof value.scripture_reference === 'string' &&
    typeof value.scripture_text === 'string' &&
    typeof value.reflection === 'string'
  )
}
