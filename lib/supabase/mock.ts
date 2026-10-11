import type { SupabaseClient } from '@supabase/supabase-js'

const PLACEHOLDER_VALUES = [
  'your_supabase_url_here',
  'your_supabase_anon_key_here',
  'your_service_role_key_here',
]

/**
 * True only when the public Supabase env vars are present and look like real
 * credentials, so `next dev` stays usable before `.env.local` is filled in.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) return false
  if (!/^https?:\/\//.test(url)) return false
  if (PLACEHOLDER_VALUES.includes(url) || PLACEHOLDER_VALUES.includes(anonKey)) return false

  return true
}

let hasWarned = false

export function warnMissingSupabaseConfig(): void {
  if (hasWarned) return
  hasWarned = true
  console.warn(
    '[supabase] Missing or placeholder credentials in .env.local - using the offline mock client. ' +
      'Pages render empty states and no data is read or written.'
  )
}

const MOCK_SERMONS = [
  {
    id: 'sermon-1',
    title: 'The Power of Faith',
    preacher: 'Pastor Adewale',
    date: '2025-12-07',
    audio_url: '/audio/sermon-1.mp3',
    video_link: 'https://youtube.com/watch?v=example1',
    topic_id: 'topic-1',
    topics: { id: 'topic-1', name: 'Faith', slug: 'faith' },
  },
  {
    id: 'sermon-2',
    title: 'Walking in Purpose',
    preacher: 'Rev. Samuel',
    date: '2025-11-30',
    audio_url: '/audio/sermon-2.mp3',
    video_link: null,
    topic_id: 'topic-2',
    topics: { id: 'topic-2', name: 'Purpose', slug: 'purpose' },
  },
  {
    id: 'sermon-3',
    title: 'Overcoming Fear',
    preacher: 'Pastor Adewale',
    date: '2025-11-23',
    audio_url: '/audio/sermon-3.mp3',
    video_link: 'https://youtube.com/watch?v=example3',
    topic_id: 'topic-1',
    topics: { id: 'topic-1', name: 'Faith', slug: 'faith' },
  },
  {
    id: 'sermon-4',
    title: 'The Holy Spirit & You',
    preacher: 'Rev. Samuel',
    date: '2025-11-16',
    audio_url: '/audio/sermon-4.mp3',
    video_link: null,
    topic_id: 'topic-3',
    topics: { id: 'topic-3', name: 'Holy Spirit', slug: 'holy-spirit' },
  },
  {
    id: 'sermon-5',
    title: 'Building Godly Character',
    preacher: 'Pastor Adewale',
    date: '2025-11-09',
    audio_url: '/audio/sermon-5.mp3',
    video_link: 'https://youtube.com/watch?v=example5',
    topic_id: 'topic-4',
    topics: { id: 'topic-4', name: 'Character', slug: 'character' },
  },
]

const MOCK_TOPICS = [
  { id: 'topic-1', name: 'Faith', slug: 'faith' },
  { id: 'topic-2', name: 'Purpose', slug: 'purpose' },
  { id: 'topic-3', name: 'Holy Spirit', slug: 'holy-spirit' },
  { id: 'topic-4', name: 'Character', slug: 'character' },
  { id: 'topic-5', name: 'Prayer', slug: 'prayer' },
]

const MOCK_MUSIC = [
  {
    id: 'music-1',
    title: 'Great Is Thy Faithfulness',
    artist_choir: 'GAM Choir',
    audio_url: '/audio/music-1.mp3',
    lyrics: 'Great is Thy faithfulness, O God my Father...',
    release_date: '2025-10-15',
  },
  {
    id: 'music-2',
    title: 'Holy Spirit Come',
    artist_choir: 'GAM Worship Team',
    audio_url: '/audio/music-2.mp3',
    lyrics: 'Holy Spirit, come and fill this place...',
    release_date: '2025-09-20',
  },
  {
    id: 'music-3',
    title: 'We Lift Our Hands',
    artist_choir: 'GAM Youth Choir',
    audio_url: '/audio/music-3.mp3',
    lyrics: 'We lift our hands in worship to You...',
    release_date: '2025-08-10',
  },
]

const MOCK_PROGRAMS = [
  {
    id: 'prog-1',
    title: 'New Year Crossover Service',
    description: 'Join us as we cross over into the new year with prayers and worship.',
    event_date: '2025-12-31T22:00:00',
    venue: 'Main Auditorium',
    flyer_url: null,
  },
  {
    id: 'prog-2',
    title: 'Annual Youth Conference',
    description: 'Three days of teaching, worship, and fellowship for young adults.',
    event_date: '2026-01-15T10:00:00',
    venue: 'Chapel Hall',
    flyer_url: null,
  },
  {
    id: 'prog-3',
    title: 'Midweek Bible Study',
    description: 'Weekly deep dive into the Word.',
    event_date: '2026-01-06T17:30:00',
    venue: 'Chapel Hall',
    flyer_url: null,
  },
  {
    id: 'prog-4',
    title: 'Women\'s Fellowship Retreat',
    description: 'A weekend of restoration and sisterhood.',
    event_date: '2026-02-14T09:00:00',
    venue: 'Prayer Mountain',
    flyer_url: null,
  },
]

const MOCK_DEVOTIONAL = {
  id: 'dev-1',
  date: new Date().toISOString().split('T')[0],
  title: 'Trust in the Lord',
  scripture_reference: 'Proverbs 3:5-6',
  scripture_text: 'Trust in the Lord with all your heart, and do not lean on your own understanding. In all your ways acknowledge him, and he will make straight your paths.',
  reflection: 'When life feels uncertain, our natural tendency is to rely on our own wisdom. But God calls us to a deeper trust — one that surrenders control and acknowledges His sovereignty in every area of life.',
  prayer: 'Lord, teach me to trust You completely. Help me release my need to understand everything and simply follow Your leading.',
  application_question: 'What is one area where you need to stop leaning on your own understanding and trust God instead?',
  source: 'manual',
  created_at: new Date().toISOString(),
  published_at: new Date().toISOString(),
}

const MOCK_HOME_BUNDLE = {
  sermons: MOCK_SERMONS,
  music: MOCK_MUSIC,
  programs: MOCK_PROGRAMS,
}

function createMockQueryBuilder(table?: string): unknown {
  let expectsSingleRow = false

  const getMockData = () => {
    switch (table) {
      case 'sermons':
        return MOCK_SERMONS
      case 'topics':
        return MOCK_TOPICS
      case 'church_music':
        return MOCK_MUSIC
      case 'programs':
        return MOCK_PROGRAMS
      case 'devotionals':
        return [MOCK_DEVOTIONAL]
      case 'church_directory':
        return []
      default:
        return []
    }
  }

  const resolveResult = () => {
    const data = getMockData()
    return {
      data: expectsSingleRow ? (data[0] || null) : data,
      error: null,
      count: data.length,
      status: 200,
      statusText: 'OK',
    }
  }

  const proxy: unknown = new Proxy(
    {},
    {
      get(_target, property: string | symbol) {
        if (property === 'then' || property === 'catch' || property === 'finally') {
          const settled = Promise.resolve(resolveResult()) as any
          return settled[property].bind(settled)
        }

        return (..._args: unknown[]) => {
          if (property === 'single' || property === 'maybeSingle') expectsSingleRow = true
          return proxy
        }
      },
    }
  )

  return proxy
}

/**
 * Drop-in replacement for `createClient()` when credentials are missing.
 * Returns mock data so pages render with content instead of empty states.
 */
export function createMockClient(): SupabaseClient {
  const mock = {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signOut: async () => ({ error: null }),
      signInWithOtp: async (_opts: { email: string }) => {
        console.warn(
          `[supabase] Offline mock: no magic link sent for ${_opts.email}. ` +
            'Fill in .env.local with real credentials to test sign-in.'
        )
        return { data: { user: null, session: null }, error: null }
      },
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
    },
    from: (table: string) => createMockQueryBuilder(table),
    rpc: (fn: string) => {
      const rpcMocks: Record<string, any> = {
        get_home_vault_bundle: () => Promise.resolve({ data: MOCK_HOME_BUNDLE, error: null }),
        get_todays_devotional: () => Promise.resolve({ data: MOCK_DEVOTIONAL, error: null }),
      }
      return rpcMocks[fn] ? rpcMocks[fn]() : createMockQueryBuilder()
    },
  }

  return mock as unknown as SupabaseClient
}