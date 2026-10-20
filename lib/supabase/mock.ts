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
      'Pages render sample content and no data is written to a live database.'
  )
}

const MOCK_USER = {
  id: 'mock-admin',
  email: 'pastor@gam.church',
  app_metadata: {},
  user_metadata: { full_name: 'Pastor Adewale' },
  aud: 'authenticated',
  created_at: '2025-01-01T00:00:00.000Z',
}

const MOCK_SESSION = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: MOCK_USER,
}

const MOCK_SERMONS = [
  {
    id: 'sermon-1',
    title: 'The Power of Faith',
    preacher: 'Pastor Adewale',
    date: '2025-12-07',
    audio_url: '/audio/sermon-1.mp3',
    video_link: 'https://youtube.com/watch?v=example1',
    notes: null,
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
    notes: null,
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
    notes: null,
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
    notes: null,
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
    notes: null,
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
    created_at: '2025-10-15T00:00:00.000Z',
  },
  {
    id: 'music-2',
    title: 'Holy Spirit Come',
    artist_choir: 'GAM Worship Team',
    audio_url: '/audio/music-2.mp3',
    lyrics: 'Holy Spirit, come and fill this place...',
    release_date: '2025-09-20',
    created_at: '2025-09-20T00:00:00.000Z',
  },
  {
    id: 'music-3',
    title: 'We Lift Our Hands',
    artist_choir: 'GAM Youth Choir',
    audio_url: '/audio/music-3.mp3',
    lyrics: 'We lift our hands in worship to You...',
    release_date: '2025-08-10',
    created_at: '2025-08-10T00:00:00.000Z',
  },
]

const MOCK_PROGRAMS = [
  {
    id: 'prog-1',
    title: 'New Year Crossover Service',
    description: 'Join us as we cross over into the new year with prayers and worship.',
    event_date: '2026-12-31T22:00:00',
    venue: 'Main Auditorium',
    flyer_url: null,
  },
  {
    id: 'prog-2',
    title: 'Annual Youth Conference',
    description: 'Three days of teaching, worship, and fellowship for young adults.',
    event_date: '2026-11-15T10:00:00',
    venue: 'Chapel Hall',
    flyer_url: null,
  },
  {
    id: 'prog-3',
    title: 'Midweek Bible Study',
    description: 'Weekly deep dive into the Word.',
    event_date: '2026-11-06T17:30:00',
    venue: 'Chapel Hall',
    flyer_url: null,
  },
  {
    id: 'prog-4',
    title: "Women's Fellowship Retreat",
    description: 'A weekend of restoration and sisterhood.',
    event_date: '2026-12-14T09:00:00',
    venue: 'Prayer Mountain',
    flyer_url: null,
  },
]

const today = new Date().toISOString().split('T')[0] ?? '2026-10-20'

const MOCK_DEVOTIONAL = {
  id: 'dev-1',
  date: today,
  title: 'Trust in the Lord',
  scripture_reference: 'Proverbs 3:5-6',
  scripture_text:
    'Trust in the Lord with all your heart, and do not lean on your own understanding. In all your ways acknowledge him, and he will make straight your paths.',
  reflection:
    'When life feels uncertain, our natural tendency is to rely on our own wisdom. But God calls us to a deeper trust — one that surrenders control and acknowledges His sovereignty in every area of life.',
  prayer:
    'Lord, teach me to trust You completely. Help me release my need to understand everything and simply follow Your leading.',
  application_question: 'What is one area where you need to stop leaning on your own understanding and trust God instead?',
  source: 'manual',
  created_at: new Date().toISOString(),
  published_at: new Date().toISOString(),
}

const MOCK_HOME_BUNDLE = {
  sermons: MOCK_SERMONS.slice(0, 3),
  music: MOCK_MUSIC,
  programs: MOCK_PROGRAMS.slice(0, 3),
  stats: {
    sermons_count: MOCK_SERMONS.length,
    programs_count: MOCK_PROGRAMS.length,
    alerts_count: 1,
    first_timers_count: 2,
  },
}

const MOCK_ALERTS = [
  {
    id: 'alert-1',
    title: 'Midweek Bible Study',
    message: 'Join us Tuesday 5:30 PM in Chapel Hall.',
    level: 'info' as const,
    target_group: 'general',
    expires_at: '2027-12-31T00:00:00.000Z',
    created_at: new Date().toISOString(),
  },
]

const MOCK_DIRECTORY = [
  {
    id: 'dir-1',
    category: 'bank_account',
    title: 'Main Giving Account',
    detail_value: '2209113248',
    extra_meta: 'UBA — GLORIOUS ASSEMBLY MINISTRIES INTERNATIONAL',
    display_order: 1,
  },
  {
    id: 'dir-2',
    category: 'pastor_desk',
    title: 'Senior Pastor',
    detail_value: 'Pastor Adewale',
    extra_meta: 'Pastoral care and counselling',
    display_order: 2,
  },
  {
    id: 'dir-3',
    category: 'contact',
    title: 'Church Office',
    detail_value: '+234 703 194 4460',
    extra_meta: 'info@gam.church',
    display_order: 3,
  },
]

const MOCK_GALLERY = [
  {
    id: 'gal-1',
    title: 'Sunday Worship',
    image_url: '/icon-192.png',
    event_tag: 'Sunday Service',
    created_at: '2026-01-05T00:00:00.000Z',
  },
]

const MOCK_MILESTONES = [
  {
    id: 'ms-1',
    title: 'Sanctuary Expansion',
    description: 'Additional seating and media booth for the main auditorium.',
    category: 'Building',
    target_amount: 25000000,
    current_amount: 8200000,
    target_date: '2026-12-31',
    status: 'in_progress',
    display_order: 1,
    created_at: '2025-06-01T00:00:00.000Z',
  },
]

const MOCK_FIRST_TIMERS = [
  {
    id: 'ft-1',
    full_name: 'Adaeze Okonkwo',
    phone: '+2348011111111',
    is_first_time: true,
    prayer_request: 'Wisdom for a new job',
    interested_unit: 'choir',
    status: 'new',
    created_at: new Date().toISOString(),
  },
  {
    id: 'ft-2',
    full_name: 'Chinedu Bello',
    phone: '+2348022222222',
    is_first_time: true,
    prayer_request: null,
    interested_unit: 'youth',
    status: 'contacted',
    created_at: new Date().toISOString(),
  },
]

const MOCK_ROSTER = [
  {
    id: 'shift-1',
    service_date: '2026-11-02',
    user_id: 'mock-admin',
    unit: 'ushers',
    status: 'assigned',
    swap_reason: null,
    covered_by: null,
    covered_at: null,
    created_at: new Date().toISOString(),
    profiles: { full_name: 'Pastor Adewale' },
  },
]

const MOCK_PROFILES = [
  {
    id: 'mock-admin',
    full_name: 'Pastor Adewale',
    role: 'admin',
    church_group: 'general',
    lite_mode: false,
  },
]

const MOCK_PUSH = [
  {
    id: 'push-1',
    endpoint: 'native:android:mock',
    p256dh: 'android',
    auth: 'native-fcm-apns',
    user_agent: 'gam-native/android',
    created_at: new Date().toISOString(),
    active: true,
  },
]

const MOCK_BRIDGE = [
  {
    id: 'bridge-1',
    platform: 'telegram',
    channel_id: '@gamhq',
    is_active: true,
    created_at: new Date().toISOString(),
  },
]

function createMockQueryBuilder(table?: string): unknown {
  let expectsSingleRow = false

  const getMockData = (): unknown[] => {
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
      case 'daily_devotionals':
        return [MOCK_DEVOTIONAL]
      case 'church_directory':
        return MOCK_DIRECTORY
      case 'gallery_items':
        return MOCK_GALLERY
      case 'alerts':
        return MOCK_ALERTS
      case 'project_milestones':
        return MOCK_MILESTONES
      case 'first_timers':
        return MOCK_FIRST_TIMERS
      case 'roster_shifts':
        return MOCK_ROSTER
      case 'profiles':
      case 'admin_users':
        return MOCK_PROFILES
      case 'push_subscriptions':
        return MOCK_PUSH
      case 'bridge_channels':
        return MOCK_BRIDGE
      default:
        return []
    }
  }

  const resolveResult = () => {
    const data = getMockData()
    return {
      data: expectsSingleRow ? (data[0] ?? null) : data,
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
          const settled = Promise.resolve(resolveResult()) as Promise<unknown>
          return (settled[property as keyof Promise<unknown>] as (...args: never[]) => unknown).bind(settled)
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

function searchSermons(query: string) {
  const q = query.toLowerCase()
  return MOCK_SERMONS.filter(
    (s) =>
      s.title.toLowerCase().includes(q) ||
      s.preacher.toLowerCase().includes(q) ||
      (s.topics?.name ?? '').toLowerCase().includes(q)
  ).map((s) => ({
    id: s.id,
    title: s.title,
    preacher: s.preacher,
    date: s.date,
    audio_url: s.audio_url,
    video_link: s.video_link,
    notes: s.notes,
    topic_id: s.topic_id,
    topics_name: s.topics?.name ?? null,
    topics_slug: s.topics?.slug ?? null,
    rank: 1,
    topics: s.topics,
  }))
}

/**
 * Drop-in replacement for `createClient()` when credentials are missing.
 * Returns mock data so pages render with content instead of empty states.
 */
export function createMockClient(): SupabaseClient {
  const mock = {
    auth: {
      getUser: async () => ({ data: { user: MOCK_USER }, error: null }),
      getSession: async () => ({ data: { session: MOCK_SESSION }, error: null }),
      signOut: async () => ({ error: null }),
      signInWithOtp: async (_opts: { email: string }) => {
        console.warn(
          `[supabase] Offline mock: no magic link sent for ${_opts.email}. ` +
            'Fill in .env.local with real credentials to test sign-in.'
        )
        return { data: { user: null, session: null }, error: null }
      },
      setSession: async () => ({ data: { session: MOCK_SESSION, user: MOCK_USER }, error: null }),
      exchangeCodeForSession: async () => ({ data: { session: MOCK_SESSION, user: MOCK_USER }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => undefined } },
      }),
    },
    from: (table: string) => createMockQueryBuilder(table),
    rpc: (fn: string, args?: Record<string, unknown>) => {
      if (fn === 'get_home_vault_bundle') {
        return Promise.resolve({ data: MOCK_HOME_BUNDLE, error: null })
      }
      if (fn === 'get_todays_devotional') {
        return Promise.resolve({ data: MOCK_DEVOTIONAL, error: null })
      }
      if (fn === 'get_devotional_by_date') {
        return Promise.resolve({ data: MOCK_DEVOTIONAL, error: null })
      }
      if (fn === 'get_devotional_range') {
        return Promise.resolve({ data: [MOCK_DEVOTIONAL], error: null })
      }
      if (fn === 'search_sermons' || fn === 'search_sermons_fuzzy') {
        const query = typeof args?.p_query === 'string' ? args.p_query : ''
        return Promise.resolve({ data: searchSermons(query), error: null })
      }
      return createMockQueryBuilder()
    },
    channel: () => {
      const channel = {
        on: () => channel,
        subscribe: () => channel,
      }
      return channel
    },
    removeChannel: async () => undefined,
  }

  return mock as unknown as SupabaseClient
}
