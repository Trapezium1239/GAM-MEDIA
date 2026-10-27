-- ============================================================================
-- GAM APP — APPLY THIS NOW (single paste, safe to re-run)
-- ============================================================================
-- Paste this whole file into:
--   https://supabase.com/dashboard/project/lxkugbswxdrkdhuyorwf/sql/new
-- then press "Run".
--
-- WHY THIS IS NEEDED
--   The tables exist and their RLS "public read" policies exist, but the
--   table-level GRANTs were never issued. RLS policies do NOT grant access on
--   their own. Result: every request from anon (the app, no login) and from
--   service_role (scripts) failed with:
--        42501 permission denied for table <name>
--   That is why /sermons showed "0 of 0", the music/gallery/programs lists
--   were empty, and the devotional seed inserted 0 rows.
--
--   This file only ADDS privileges and REPLACES three functions.
--   It does not drop tables, delete rows, or change any data.
-- ============================================================================

-- 1. SCHEMA USAGE ------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2. PUBLIC (NO-LOGIN) READ ACCESS -------------------------------------------
-- Only content tables. Personal tables (profiles, admin_users, first_timers,
-- push_subscriptions) are intentionally NOT readable by anon.
GRANT SELECT ON public.sermons           TO anon;
GRANT SELECT ON public.topics            TO anon;
GRANT SELECT ON public.themes            TO anon;
GRANT SELECT ON public.church_music      TO anon;
GRANT SELECT ON public.programs          TO anon;
GRANT SELECT ON public.gallery_items     TO anon;
GRANT SELECT ON public.milestones        TO anon;
GRANT SELECT ON public.rosters           TO anon;
GRANT SELECT ON public.alerts            TO anon;
GRANT SELECT ON public.church_directory  TO anon;
GRANT SELECT ON public.devotionals       TO anon;
GRANT SELECT ON public.daily_devotionals TO anon;
GRANT SELECT ON public.sermons_search    TO anon;

-- Visitors may submit the first-timer form without an account.
GRANT INSERT ON public.first_timers TO anon;

-- 3. LOGGED-IN USERS (admin screens) -----------------------------------------
-- RLS policies still decide what each row allows.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- 4. SERVICE ROLE (seed scripts, admin uploads) ------------------------------
GRANT ALL ON ALL TABLES    IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 5. FUTURE TABLES ------------------------------------------------------------
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES    TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;

-- 6. PUBLIC-READ POLICIES FOR GUEST-VISIBLE TABLES ---------------------------
DROP POLICY IF EXISTS "Public read rosters"    ON public.rosters;
CREATE POLICY "Public read rosters"    ON public.rosters    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read milestones" ON public.milestones;
CREATE POLICY "Public read milestones" ON public.milestones FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anon submit first-timer" ON public.first_timers;
CREATE POLICY "Anon submit first-timer" ON public.first_timers FOR INSERT TO anon WITH CHECK (true);

-- 7. DAILY DEVOTIONAL RPCs — FIXED -------------------------------------------
-- The previous bodies used COALESCE(row_to_json(d), '{}'::jsonb), which mixes
-- json and jsonb and always raised:
--   42846 COALESCE could not convert type jsonb to json
-- so /devotional never loaded. to_jsonb() removes the mismatch.
CREATE OR REPLACE FUNCTION public.get_todays_devotional()
RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT to_jsonb(d) FROM public.daily_devotionals d
      WHERE d.date = CURRENT_DATE
      ORDER BY d.date DESC LIMIT 1),
    '{}'::jsonb
  );
$$;

CREATE OR REPLACE FUNCTION public.get_devotional_by_date(p_date DATE)
RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT to_jsonb(d) FROM public.daily_devotionals d
      WHERE d.date = p_date
      ORDER BY d.date DESC LIMIT 1),
    '{}'::jsonb
  );
$$;

CREATE OR REPLACE FUNCTION public.get_devotional_range(p_start DATE, p_end DATE)
RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT jsonb_agg(to_jsonb(d) ORDER BY d.date DESC)
       FROM public.daily_devotionals d
      WHERE d.date BETWEEN p_start AND p_end
        AND d.date <= CURRENT_DATE),
    '[]'::jsonb
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_todays_devotional()            TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_devotional_by_date(date)       TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_devotional_range(date, date)   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_home_vault_bundle()            TO anon, authenticated;

-- 8. RELOAD POSTGREST SCHEMA CACHE -------------------------------------------
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- END
-- ============================================================================
