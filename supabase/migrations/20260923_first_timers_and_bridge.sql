-- ============================================================
-- FIRST TIMERS TABLE
-- ============================================================

CREATE TYPE first_timer_status AS ENUM ('new', 'contacted', 'integrated', 'closed');

CREATE TABLE IF NOT EXISTS public.first_timers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  is_first_time BOOLEAN NOT NULL DEFAULT true,
  prayer_request TEXT,
  interested_unit church_group DEFAULT 'general',
  assigned_shepherd_id UUID REFERENCES public.profiles(id),
  status first_timer_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.first_timers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public insert first_timers" ON public.first_timers;
CREATE POLICY "Public insert first_timers" ON public.first_timers
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Leadership view first_timers" ON public.first_timers;
CREATE POLICY "Leadership view first_timers" ON public.first_timers
  FOR SELECT USING (public.is_admin_or_pastor());

DROP POLICY IF EXISTS "Leadership update first_timers" ON public.first_timers;
CREATE POLICY "Leadership update first_timers" ON public.first_timers
  FOR UPDATE USING (public.is_admin_or_pastor());

-- ============================================================
-- BRIDGE CHANNELS TABLE (Telegram/WhatsApp Relay)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.bridge_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('telegram', 'whatsapp')),
  channel_id TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.bridge_channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manage bridge_channels" ON public.bridge_channels;
CREATE POLICY "Admin manage bridge_channels" ON public.bridge_channels
  FOR ALL USING (public.is_admin_or_pastor());

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_first_timers_status ON public.first_timers(status, created_at);
CREATE INDEX IF NOT EXISTS idx_first_timers_unit ON public.first_timers(interested_unit, created_at);
CREATE INDEX IF NOT EXISTS idx_bridge_channels_active ON public.bridge_channels(is_active);
