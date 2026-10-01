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

/**
 * Thenable stand-in for a PostgREST query builder: every chained method returns
 * the same builder, and awaiting it resolves to an empty result set.
 * `.single()` / `.maybeSingle()` resolve to `data: null` so callers such as
 * `notFound()` guards still behave correctly.
 */
function createMockQueryBuilder(): unknown {
  let expectsSingleRow = false

  const resolveResult = () => ({
    data: expectsSingleRow ? null : [],
    error: null,
    count: expectsSingleRow ? null : 0,
    status: 200,
    statusText: 'OK',
  })

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
 * Signed-out, read-empty and write-no-op, so pages render their empty states
 * instead of throwing `TypeError: Invalid URL`.
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
    from: () => createMockQueryBuilder(),
    rpc: () => createMockQueryBuilder(),
  }

  return mock as unknown as SupabaseClient
}
