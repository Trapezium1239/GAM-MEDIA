'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createMockClient, isSupabaseConfigured, warnMissingSupabaseConfig } from './mock'

export function createClient(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    warnMissingSupabaseConfig()
    return createMockClient()
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}