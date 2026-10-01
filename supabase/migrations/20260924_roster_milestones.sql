-- ============================================================
-- WORKER SHIFT-SWAP MARKETPLACE & PROJECT MILESTONE TRACKER
-- ============================================================

-- A. ROSTER SHIFTS TABLE (Shift-Swap Marketplace)
-- ============================================================

CREATE TYPE shift_status AS ENUM ('assigned', 'swap_requested', 'covered', 'cancelled');
CREATE TYPE shift_unit AS ENUM ('choir', 'media', 'ushers', 'youth', 'general');

CREATE TABLE IF NOT EXISTS public.roster_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_date DATE NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  unit shift_unit NOT NULL DEFAULT 'general',
  status shift_status NOT NULL DEFAULT 'assigned',
  swap_reason TEXT,
  covered_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  covered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.roster_shifts ENABLE ROW LEVEL SECURITY;

-- Users can view their own shifts and shifts in their unit
CREATE POLICY "View own shifts" ON public.roster_shifts
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() = covered_by OR
    unit = (SELECT church_group FROM public.profiles WHERE id = auth.uid())
  );

-- Users can request swap on their own shifts
CREATE POLICY "Request swap on own shift" ON public.roster_shifts
  FOR UPDATE USING (auth.uid() = user_id AND status = 'assigned')
  WITH CHECK (auth.uid() = user_id AND status IN ('assigned', 'swap_requested'));

-- Users can cover shifts in their unit
CREATE POLICY "Cover shift in unit" ON public.roster_shifts
  FOR UPDATE USING (
    auth.uid() != user_id AND
    unit = (SELECT church_group FROM public.profiles WHERE id = auth.uid()) AND
    status = 'swap_requested'
  )
  WITH CHECK (
    auth.uid() != user_id AND
    unit = (SELECT church_group FROM public.profiles WHERE id = auth.uid()) AND
    status = 'covered' AND
    covered_by = auth.uid()
  );

-- Admin/pastor can manage all shifts
CREATE POLICY "Admin manage all shifts" ON public.roster_shifts
  FOR ALL USING (public.is_admin_or_pastor()) WITH CHECK (public.is_admin_or_pastor());

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_roster_shift_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_roster_shift_updated ON public.roster_shifts;
CREATE TRIGGER on_roster_shift_updated
  BEFORE UPDATE ON public.roster_shifts
  FOR EACH ROW EXECUTE FUNCTION public.update_roster_shift_timestamp();

CREATE INDEX IF NOT EXISTS idx_roster_shifts_date ON public.roster_shifts(service_date);
CREATE INDEX IF NOT EXISTS idx_roster_shifts_user ON public.roster_shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_roster_shifts_status ON public.roster_shifts(status, unit);

-- B. PROJECT MILESTONES TABLE (Transparent Project Tracker)
-- ============================================================

CREATE TYPE milestone_status AS ENUM ('planned', 'in_progress', 'completed', 'paused');

CREATE TABLE IF NOT EXISTS public.project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- e.g., 'building', 'outreach', 'equipment', 'renovation'
  target_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  current_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  target_date DATE,
  status milestone_status NOT NULL DEFAULT 'planned',
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;

-- Public read for transparency
CREATE POLICY "Public read milestones" ON public.project_milestones
  FOR SELECT USING (true);

-- Admin/pastor full management
CREATE POLICY "Admin manage milestones" ON public.project_milestones
  FOR ALL USING (public.is_admin_or_pastor()) WITH CHECK (public.is_admin_or_pastor());

CREATE OR REPLACE FUNCTION public.update_milestone_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_milestone_updated ON public.project_milestones;
CREATE TRIGGER on_milestone_updated
  BEFORE UPDATE ON public.project_milestones
  FOR EACH ROW EXECUTE FUNCTION public.update_milestone_timestamp();

-- Auto-update current_amount from tagged giving (runs via cron or webhook)
CREATE OR REPLACE FUNCTION public.refresh_milestone_amounts()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER := 0;
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT m.id, COALESCE(SUM(cd.detail_value::NUMERIC), 0) as total
    FROM public.project_milestones m
    LEFT JOIN public.church_directory cd
      ON cd.category = 'giving_milestone'
      AND cd.extra_meta = m.id::TEXT
    GROUP BY m.id
  LOOP
    UPDATE public.project_milestones
    SET current_amount = rec.total, updated_at = NOW()
    WHERE id = rec.id AND current_amount != rec.total;
    GET DIAGNOSTICS updated_count = ROW_COUNT;
  END LOOP;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE INDEX IF NOT EXISTS idx_milestones_category ON public.project_milestones(category, display_order);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON public.project_milestones(status);