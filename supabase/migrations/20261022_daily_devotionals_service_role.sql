-- ============================================================
-- GRANT SERVICE ROLE ACCESS TO daily_devotionals
-- ============================================================

-- Grant table-level permissions to service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_devotionals TO service_role;

-- Service role full access policy (bypasses RLS for admin operations)
CREATE POLICY "Service role full access" ON public.daily_devotionals
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================
-- END OF MIGRATION
-- ============================================================