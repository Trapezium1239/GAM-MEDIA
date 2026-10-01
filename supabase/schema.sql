-- ============================================================
-- CHURCHVAULT PWA - COMPLETE SUPABASE SCHEMA (IDEMPOTENT)
-- Run this in Supabase SQL Editor. Safe to run multiple times.
-- ============================================================

-- UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS (idempotent creation)
-- ============================================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('member', 'admin', 'pastor');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE church_group AS ENUM ('general', 'choir', 'media', 'ushers', 'youth');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE alert_level AS ENUM ('info', 'advisory', 'urgent');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE,
  role user_role DEFAULT 'member'::user_role NOT NULL,
  church_group church_group DEFAULT 'general'::church_group NOT NULL,
  lite_mode BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- TOPIC SERIES
-- ============================================================
CREATE TABLE IF NOT EXISTS topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL
);

-- ============================================================
-- SERMONS / WORD VAULT
-- ============================================================
CREATE TABLE IF NOT EXISTS sermons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  preacher TEXT NOT NULL,
  date DATE NOT NULL,
  audio_url TEXT,
  video_link TEXT,
  notes TEXT,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- PROGRAMS / ITINERARY
-- ============================================================
CREATE TABLE IF NOT EXISTS programs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  venue TEXT NOT NULL,
  flyer_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- GALLERY ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS gallery_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  image_url TEXT NOT NULL,
  event_tag TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- CHURCH MUSIC / CHOIR PRODUCTION
-- ============================================================
CREATE TABLE IF NOT EXISTS church_music (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist_choir TEXT DEFAULT 'Church Choir' NOT NULL,
  audio_url TEXT NOT NULL,
  lyrics TEXT,
  release_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- CHURCH DIRECTORY (Pastor desk, Bank accounts, Contacts)
-- ============================================================
CREATE TABLE IF NOT EXISTS church_directory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  detail_value TEXT NOT NULL,
  extra_meta TEXT,
  display_order INT DEFAULT 0
);

-- ============================================================
-- EPHEMERAL TARGETED ALERTS (24-hr TTL)
-- ============================================================
CREATE TABLE IF NOT EXISTS alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  level alert_level NOT NULL,
  target_group church_group DEFAULT 'general'::church_group NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours') NOT NULL
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_sermons_date ON sermons(date DESC);
CREATE INDEX IF NOT EXISTS idx_sermons_topic ON sermons(topic_id);
CREATE INDEX IF NOT EXISTS idx_programs_date ON programs(event_date ASC);
-- NOTE: deliberately NOT a partial index. Postgres requires an index predicate to
-- be IMMUTABLE and NOW() is only STABLE, so `WHERE expires_at > NOW()` aborts the
-- whole script with "functions in index predicate must be marked IMMUTABLE".
-- The 24h TTL plus purge_expired_alerts() keeps this table tiny, so a plain
-- index is enough for the `expires_at > now()` + target_group filter.
CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(expires_at, target_group);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sermons ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE church_music ENABLE ROW LEVEL SECURITY;
ALTER TABLE church_directory ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- DROP EXISTING POLICIES TO AVOID CONFLICTS (idempotent)
-- ============================================================
DROP POLICY IF EXISTS "Public profile read" ON profiles;
DROP POLICY IF EXISTS "Self profile update" ON profiles;
DROP POLICY IF EXISTS "Read sermons" ON sermons;
DROP POLICY IF EXISTS "Read programs" ON programs;
DROP POLICY IF EXISTS "Read gallery" ON gallery_items;
DROP POLICY IF EXISTS "Read music" ON church_music;
DROP POLICY IF EXISTS "Read directory" ON church_directory;
DROP POLICY IF EXISTS "Read topics" ON topics;
DROP POLICY IF EXISTS "Read targeted unexpired alerts" ON alerts;
DROP POLICY IF EXISTS "Admin write sermons" ON sermons;
DROP POLICY IF EXISTS "Admin write programs" ON programs;
DROP POLICY IF EXISTS "Admin write gallery" ON gallery_items;
DROP POLICY IF EXISTS "Admin write music" ON church_music;
DROP POLICY IF EXISTS "Admin write directory" ON church_directory;
DROP POLICY IF EXISTS "Admin write alerts" ON alerts;
DROP POLICY IF EXISTS "Admin write topics" ON topics;

-- ============================================================
-- PROFILE HELPER FUNCTION (must exist before the policies below)
-- ============================================================
-- Returns the caller's stored role with RLS bypassed (owner is the table owner),
-- so it can be referenced inside a policy on profiles without recursing.
CREATE OR REPLACE FUNCTION public.own_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Profiles
CREATE POLICY "Public profile read" ON profiles
  FOR SELECT USING (true);

-- Members may edit their own row (full_name, phone, church_group, lite_mode) but
-- the WITH CHECK pins `role` to its stored value, so `UPDATE profiles SET
-- role='admin'` through the anon key silently affects 0 rows instead of
-- promoting the caller. Without WITH CHECK, USING is reused as the check and
-- self-promotion is allowed.
CREATE POLICY "Self profile update" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = public.own_role());

-- Public read for content tables
CREATE POLICY "Read sermons" ON sermons FOR SELECT USING (true);
CREATE POLICY "Read programs" ON programs FOR SELECT USING (true);
CREATE POLICY "Read gallery" ON gallery_items FOR SELECT USING (true);
CREATE POLICY "Read music" ON church_music FOR SELECT USING (true);
CREATE POLICY "Read directory" ON church_directory FOR SELECT USING (true);
CREATE POLICY "Read topics" ON topics FOR SELECT USING (true);

-- Alerts: read active unexpired alerts matching user group or general
CREATE POLICY "Read targeted unexpired alerts" ON alerts
  FOR SELECT USING (
    expires_at > NOW() AND (
      target_group = 'general'::church_group OR
      target_group = (SELECT church_group FROM profiles WHERE id = auth.uid())
    )
  );

-- ============================================================
-- ADMIN HELPER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION is_admin_or_pastor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'pastor')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ADMIN WRITE POLICIES
-- ============================================================
CREATE POLICY "Admin write sermons" ON sermons
  FOR ALL USING (is_admin_or_pastor()) WITH CHECK (is_admin_or_pastor());

CREATE POLICY "Admin write programs" ON programs
  FOR ALL USING (is_admin_or_pastor()) WITH CHECK (is_admin_or_pastor());

CREATE POLICY "Admin write gallery" ON gallery_items
  FOR ALL USING (is_admin_or_pastor()) WITH CHECK (is_admin_or_pastor());

CREATE POLICY "Admin write music" ON church_music
  FOR ALL USING (is_admin_or_pastor()) WITH CHECK (is_admin_or_pastor());

CREATE POLICY "Admin write directory" ON church_directory
  FOR ALL USING (is_admin_or_pastor()) WITH CHECK (is_admin_or_pastor());

CREATE POLICY "Admin write alerts" ON alerts
  FOR ALL USING (is_admin_or_pastor()) WITH CHECK (is_admin_or_pastor());

CREATE POLICY "Admin write topics" ON topics
  FOR ALL USING (is_admin_or_pastor()) WITH CHECK (is_admin_or_pastor());

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP (trigger)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role, church_group)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'New Member'),
    NEW.raw_user_meta_data->>'phone',
    'member'::user_role,
    'general'::church_group
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- AUTO-REFRESH updated_at ON profiles
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profile_updated ON profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- BACKGROUND CLEANUP FUNCTION (cron safety net)
-- ============================================================
CREATE OR REPLACE FUNCTION public.purge_expired_alerts()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.alerts WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- END OF SCHEMA
-- ============================================================