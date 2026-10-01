-- ============================================================
-- DAILY DEVOTIONAL FEED
-- ============================================================

-- Enum for devotional source
CREATE TYPE devotional_source AS ENUM ('auto_esv', 'auto_net', 'manual');

-- Daily Devotionals Table
CREATE TABLE IF NOT EXISTS public.daily_devotionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  title TEXT NOT NULL,
  scripture_reference TEXT NOT NULL, -- e.g., "John 3:16-17"
  scripture_text TEXT NOT NULL,
  reflection TEXT NOT NULL, -- The devotional content
  prayer TEXT, -- Optional closing prayer
  application_question TEXT, -- Optional discussion/application question
  source devotional_source NOT NULL DEFAULT 'manual',
  external_id TEXT, -- Bible API reference ID
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ -- When it went live (for scheduling)
);

ALTER TABLE public.daily_devotionals ENABLE ROW LEVEL SECURITY;

-- Public read for today's and past devotionals
CREATE POLICY "Public read devotionals" ON public.daily_devotionals
  FOR SELECT USING (date <= CURRENT_DATE);

-- Admin full management
CREATE POLICY "Admin manage devotionals" ON public.daily_devotionals
  FOR ALL USING (public.is_admin_or_pastor()) WITH CHECK (public.is_admin_or_pastor());

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_devotional_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_devotional_updated ON public.daily_devotionals;
CREATE TRIGGER on_devotional_updated
  BEFORE UPDATE ON public.daily_devotionals
  FOR EACH ROW EXECUTE FUNCTION public.update_devotional_timestamp();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_devotionals_date ON public.daily_devotionals(date DESC);
CREATE INDEX IF NOT EXISTS idx_devotionals_source ON public.daily_devotionals(source);

-- Function to get today's devotional
CREATE OR REPLACE FUNCTION public.get_todays_devotional()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT COALESCE(row_to_json(d), '{}'::jsonb) INTO result
  FROM public.daily_devotionals d
  WHERE d.date = CURRENT_DATE
  LIMIT 1;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_todays_devotional() TO authenticated, anon;

-- Function to get devotional by date
CREATE OR REPLACE FUNCTION public.get_devotional_by_date(p_date DATE)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT COALESCE(row_to_json(d), '{}'::jsonb) INTO result
  FROM public.daily_devotionals d
  WHERE d.date = p_date
  LIMIT 1;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_devotional_by_date(DATE) TO authenticated, anon;

-- Function to get devotional range (for calendar view)
CREATE OR REPLACE FUNCTION public.get_devotional_range(p_start DATE, p_end DATE)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(row_to_json(d) ORDER BY d.date DESC), '[]'::jsonb) INTO result
  FROM public.daily_devotionals d
  WHERE d.date BETWEEN p_start AND p_end
    AND d.date <= CURRENT_DATE;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_devotional_range(DATE, DATE) TO authenticated, anon;