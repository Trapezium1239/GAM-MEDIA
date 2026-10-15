-- ============================================================
-- CONSOLIDATE MILESTONE SCHEMA — align on project_milestones
-- Drops the redundant `milestones` table introduced in
-- 20261011_create_missing_tables.sql. All app code + server
-- actions use `project_milestones`.
-- Idempotent: safe to run multiple times.
-- ============================================================

-- Drop dependent RLS policies first (idempotent guards)
DROP POLICY IF EXISTS "Public read milestones" ON public.milestones;
DROP POLICY IF EXISTS "Service role full access" ON public.milestones;

-- Drop the redundant table (only if it has no app-critical data).
-- If rows exist, archive them into project_milestones first.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'milestones') THEN
    -- Migrate any legacy rows that don't already exist by title
    INSERT INTO public.project_milestones (title, description, category, target_amount, current_amount, target_date, status, display_order)
    SELECT
      m.title,
      m.description,
      COALESCE(m.category, 'general'),
      COALESCE(m.target_amount, 0),
      COALESCE(m.current_amount, 0),
      m.target_date,
      CASE m.status
        WHEN 'in_progress' THEN 'in_progress'::milestone_status
        WHEN 'completed' THEN 'completed'::milestone_status
        WHEN 'paused' THEN 'paused'::milestone_status
        ELSE 'planned'::milestone_status
      END,
      COALESCE(m.display_order, 0)
    FROM public.milestones m
    WHERE NOT EXISTS (
      SELECT 1 FROM public.project_milestones pm WHERE pm.title = m.title
    );

    DROP TABLE public.milestones;
  END IF;
END
$$;
