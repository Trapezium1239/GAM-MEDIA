-- ============================================================================
-- LIVE DB REPAIR — idempotent patch for the GAM App Supabase project
-- ============================================================================
-- WHY PAGES SHOWED EMPTY
--
--   1. The new tables (sermons, topics, church_music, programs, devotionals,
--      church_directory, gallery_items, alerts) had their RLS RLS
--      ENABLE ROW LEVEL SECURITY turned on, but their PUBLIC-READ policies
--      were never applied to the live DB. The anon key then received
--      "permission denied", so every list page (sermons, music, programs,
--      devotionals, gallery, alerts, directory) rendered empty.
--
--   2. The daily-devotional table + its 3 RPCs (get_todays_devotional,
--      get_devotional_by_date, get_devotional_range) were never applied, so
--      /devotional, /devotional/archive and /devotional/[date] were empty.
--
--   3. The home-bundle RPC (get_home_vault_bundle) and the sermon-search RPC
--      (search_sermons) were never applied, so the home page and sermon
--      search were empty.
--
-- HOW TO APPLY
--   Option A (recommended): npx supabase db push   -- after linking the project
--   Option B: paste this whole file into the Supabase SQL Editor.
--
-- This file is safe to run multiple times (DROP POLICY IF EXISTS + idempotent
-- CREATE OR REPLACE + IF NOT EXISTS), so it can be re-applied after any fix.
-- ============================================================================

-- 1. SERMON SCHEMA PATCH (idempotent, preserves existing rows) --------------------
-- The live 'sermons' table was created without the columns used by the
-- home-bundle RPC (get_home_vault_bundle) and the search RPC
-- (search_sermons). This ALTER TABLE adds them safely and backfills audio_url
-- from the legacy r2_key, so no existing rows are dropped or reset.
ALTER TABLE sermons
  ADD COLUMN IF NOT EXISTS audio_url text,
  ADD COLUMN IF NOT EXISTS video_link text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Backfill audio_url from the legacy r2_key so older rows still play.
-- Runs after the ADD COLUMN above (the column exists by the time this runs).
UPDATE sermons
SET audio_url = r2_key
WHERE audio_url IS NULL AND r2_key IS NOT NULL;

-- 2. DAILY DEVOTIONAL TABLE ------------------------------------------------------


-- The `devotional_source` enum is normally created by 20260926_daily_devotionals.sql.
-- Guarded here so this repair script is self-contained on a live deployment that
-- never received that historical migration.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_type
    WHERE typname = 'devotional_source'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE devotional_source AS ENUM ('auto_esv', 'auto_net', 'manual');
  END IF;
END
$$;


CREATE TABLE IF NOT EXISTS public.daily_devotionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  title TEXT NOT NULL,
  scripture_reference TEXT NOT NULL,
  scripture_text TEXT NOT NULL,
  reflection TEXT NOT NULL,
  prayer TEXT,
  application_question TEXT,
  source devotional_source NOT NULL DEFAULT 'manual',
  external_id TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);


ALTER TABLE public.daily_devotionals ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS on_devotional_updated ON public.daily_devotionals;
CREATE OR REPLACE FUNCTION public.update_devotional_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_devotional_updated
  BEFORE UPDATE ON public.daily_devotionals
  FOR EACH ROW EXECUTE FUNCTION public.update_devotional_timestamp();

CREATE INDEX IF NOT EXISTS idx_devotionals_date ON public.daily_devotionals(date DESC);
CREATE INDEX IF NOT EXISTS idx_devotionals_source ON public.daily_devotionals(source);

-- 3. PUBLIC-READ RLS POLICIES -------------------------------------------------
-- sermons ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read sermons" ON public.sermons;
CREATE POLICY "Public read sermons" ON public.sermons FOR SELECT USING (true);

-- topics ----------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read topics" ON public.topics;
CREATE POLICY "Public read topics" ON public.topics FOR SELECT USING (true);

-- church_music -----------------------------------------------------------------
DROP POLICY IF EXISTS "Public read church music" ON public.church_music;
CREATE POLICY "Public read church music" ON public.church_music FOR SELECT USING (true);

-- programs ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read programs" ON public.programs;
CREATE POLICY "Public read programs" ON public.programs FOR SELECT USING (true);

-- devotionals (legacy, used by admin/overview) -----------------------------------
DROP POLICY IF EXISTS "Public read devotionals" ON public.devotionals;
CREATE POLICY "Public read devotionals" ON public.devotionals FOR SELECT USING (true);






-- daily_devotionals (daily feature) ---------------------------------------------
DROP POLICY IF EXISTS "Public read daily devotionals" ON public.daily_devotionals;
CREATE POLICY "Public read daily devotionals" ON public.daily_devotionals
  FOR SELECT USING (date <= CURRENT_DATE);

-- church_directory --------------------------------------------------------------
DROP POLICY IF EXISTS "Public read church directory" ON public.church_directory;
CREATE POLICY "Public read church directory" ON public.church_directory
  FOR SELECT USING (true);

-- gallery_items ------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read gallery" ON public.gallery_items;
CREATE POLICY "Public read gallery" ON public.gallery_items FOR SELECT USING (true);

-- alerts --------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read alerts" ON public.alerts;
CREATE POLICY "Public read alerts" ON public.alerts FOR SELECT USING (true);

-- first_timers -------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read first-timers" ON public.first_timers;
CREATE POLICY "Public read first-timers" ON public.first_timers FOR SELECT USING (true);


-- themes (topic series) -----------------------------------------------------------
DROP POLICY IF EXISTS "Public read themes" ON public.themes;
CREATE POLICY "Public read themes" ON public.themes FOR SELECT USING (true);

-- 4. DAILY DEVOTIONAL RPCs -----------------------------------------------------
DROP FUNCTION IF EXISTS public.get_todays_devotional();
CREATE OR REPLACE FUNCTION public.get_todays_devotional()
RETURNS JSONB LANGUAGE plpgsql STABLE AS $$
DECLARE result JSONB;
BEGIN
  SELECT COALESCE(row_to_json(d), '{}'::jsonb) INTO result
  FROM public.daily_devotionals d
  WHERE d.date = CURRENT_DATE LIMIT 1;
  RETURN result;
END;
$$;

DROP FUNCTION IF EXISTS public.get_devotional_by_date(date);
CREATE OR REPLACE FUNCTION public.get_devotional_by_date(p_date DATE)
RETURNS JSONB LANGUAGE plpgsql STABLE AS $$
DECLARE result JSONB;
BEGIN
  SELECT COALESCE(row_to_json(d), '{}'::jsonb) INTO result
  FROM public.daily_devotionals d
  
WHERE d.date = p_date LIMIT 1;
  RETURN result;
END;
$$;

DROP FUNCTION IF EXISTS public.get_devotional_range(date, date);
CREATE OR REPLACE FUNCTION public.get_devotional_range(p_start DATE, p_end DATE)
RETURNS JSONB LANGUAGE plpgsql STABLE AS $$
DECLARE result JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(row_to_json(d) ORDER BY d.date DESC), '[]'::jsonb)
  INTO result
  FROM public.daily_devotionals d
  WHERE d.date BETWEEN p_start AND p_end AND d.date <= CURRENT_DATE;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_todays_devotional() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_devotional_by_date(date) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_devotional_range(date, date) TO anon, authenticated;

-- 5. HOME VAULT BUNDLE RPC ------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_home_vault_bundle();
CREATE OR REPLACE FUNCTION public.get_home_vault_bundle()
RETURNS JSON LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'sermons', (
      SELECT COALESCE(json_agg(row_to_json(s)), '[]'::json)
      FROM (
        SELECT s.id, s.title, s.preacher, s.date, s.audio_url, s.video_link,
               t.name as topic_name, t.slug as topic_slug
        FROM public.sermons s
        LEFT JOIN public.topics t ON t.id = s.topic_id
        ORDER BY s.date DESC LIMIT 3
      ) s
    ),
    'programs', (
      SELECT COALESCE(json_agg(row_to_json(p)), '[]'::json)
      FROM (
        SELECT id, title, description, event_date, venue
        FROM public.programs
        WHERE event_date >= NOW() ORDER BY event_date ASC LIMIT 3
      ) p
    ),
    'music', (
      SELECT COALESCE(json_agg(row_to_json(m)), '[]'::json)
      FROM (
        SELECT id, title, artist_choir, audio_url, lyrics
        FROM public.church_music
        ORDER BY created_at DESC LIMIT 3
      ) m
    ),
    'stats', (
      SELECT json_build_object(
        'sermons_count', (SELECT COUNT(*) FROM public.sermons),
        'programs_count', (SELECT COUNT(*) FROM public.programs WHERE event_date >= NOW()),
        'alerts_count', (SELECT COUNT(*) FROM public.alerts WHERE expires_at > NOW()),
        'first_timers_count', (SELECT COUNT(*) FROM public.first_timers WHERE status = 'new')
      )
    )
  ) INTO result;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_home_vault_bundle() TO anon, authenticated;

-- 6. SERMON SEARCH RPCs -----------------------------------------------------------
DROP FUNCTION IF EXISTS public.search_sermons(text, uuid, int, int);
CREATE OR REPLACE FUNCTION public.search_sermons(
  p_query TEXT,
  p_topic_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID, title TEXT, preacher TEXT, date DATE,
  audio_url TEXT, video_link TEXT, notes TEXT,
  topic_id UUID, topics_name TEXT, topics_slug TEXT, rank REAL
)
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.title, s.preacher, s.date,
         s.audio_url, s.video_link, s.notes,
         s.topic_id, t.name AS topics_name, t.slug AS topics_slug,
         ts_rank_cd(s.search_vector, plainto_tsquery('english', p_query)) AS rank
  FROM public.sermons s
  LEFT JOIN public.topics t ON t.id = s.topic_id
  WHERE s.search_vector @@ plainto_tsquery('english', p_query)
    AND (p_topic_id IS NULL OR s.topic_id = p_topic_id)
  ORDER BY rank DESC, s.date DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

DROP FUNCTION IF EXISTS public.search_sermons_fuzzy(text, uuid, int, int);
CREATE OR REPLACE FUNCTION public.search_sermons_fuzzy(
  p_query TEXT,
  p_topic_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID, title TEXT, preacher TEXT, date DATE,
  audio_url TEXT, video_link TEXT, notes TEXT,
  topic_id UUID, topics_name TEXT, topics_slug TEXT, similarity REAL
)
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.title, s.preacher, s.date,
         s.audio_url, s.video_link, s.notes,
         s.topic_id, t.name AS topics_name, t.slug AS topics_slug,
         GREATEST(similarity(s.title, p_query), similarity(s.preacher, p_query)) AS similarity
  FROM public.sermons s
  LEFT JOIN public.topics t ON t.id = s.topic_id
  WHERE (similarity(s.title, p_query) > 0.3 OR similarity(s.preacher, p_query) > 0.3)
    AND (p_topic_id IS NULL OR s.topic_id = p_topic_id)
  ORDER BY similarity DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_sermons(text, uuid, int, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_sermons_fuzzy(text, uuid, int, int) TO anon, authenticated;



