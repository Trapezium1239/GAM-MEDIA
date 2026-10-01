-- ============================================================
-- PG_CRON AUTOMATION FOR CLEANUP FUNCTIONS
-- Run in Supabase SQL Editor after enabling pg_cron extension
-- ============================================================

-- Enable pg_cron extension (run once)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net; -- for HTTP requests if needed

-- Schedule cleanup jobs (run daily at 3 AM UTC)
-- 1. Purge expired alerts (24h TTL)
SELECT cron.schedule(
  'purge-expired-alerts',
  '0 3 * * *',
  $$SELECT public.purge_expired_alerts();$$
);

-- 2. Purge expired idempotency keys (10min TTL, but cleanup runs daily)
SELECT cron.schedule(
  'purge-expired-idempotency',
  '0 3 * * *',
  $$SELECT public.purge_expired_idempotency();$$
);

-- 3. Purge old webhook receipts (7 days retention)
SELECT cron.schedule(
  'purge-old-webhook-receipts',
  '0 3 * * *',
  $$SELECT public.purge_old_webhook_receipts();$$
);

-- 4. Refresh milestone amounts from tagged giving (every 6 hours)
SELECT cron.schedule(
  'refresh-milestone-amounts',
  '0 */6 * * *',
  $$SELECT public.refresh_milestone_amounts();$$
);

-- 5. Purge orphaned offline audio cache (weekly, Sunday 4 AM)
-- Note: This requires a function to be created in the app layer or via edge function
-- For now, we schedule a placeholder that logs the action
SELECT cron.schedule(
  'log-offline-cache-stats',
  '0 4 * * 0',
  $$
    INSERT INTO public.cron_log (job_name, run_at, status)
    VALUES ('offline_cache_stats', NOW(), 'scheduled');
  $$
);

-- 6. Daily Devotional Generation (6 AM UTC = 7 AM WAT / 2 AM EST)
-- Fetches today's passage from Bible API, creates devotional, sends push notification
SELECT cron.schedule(
  'daily-devotional-generation',
  '0 6 * * *',
  $$
    SELECT net.http_post(
      url := current_setting('app.devotional_webhook_url') || '/api/cron/daily-devotional',
      headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.cron_secret')),
      body := jsonb_build_object()
    );
  $$
);

-- Create cron_log table for audit trail
CREATE TABLE IF NOT EXISTS public.cron_log (
  id BIGSERIAL PRIMARY KEY,
  job_name TEXT NOT NULL,
  run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'completed',
  details JSONB
);

ALTER TABLE public.cron_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin view cron_log" ON public.cron_log;
CREATE POLICY "Admin view cron_log" ON public.cron_log FOR SELECT USING (public.is_admin_or_pastor());

-- View scheduled jobs
-- SELECT * FROM cron.job;
-- To unschedule: SELECT cron.unschedule('job-name');

-- Manual trigger functions (for testing)
CREATE OR REPLACE FUNCTION public.run_all_cleanup_manual()
RETURNS TABLE(job_name TEXT, result TEXT) AS $$
BEGIN
  RETURN QUERY SELECT 'purge_expired_alerts', public.purge_expired_alerts()::TEXT;
  RETURN QUERY SELECT 'purge_expired_idempotency', public.purge_expired_idempotency()::TEXT;
  RETURN QUERY SELECT 'purge_old_webhook_receipts', public.purge_old_webhook_receipts()::TEXT;
  RETURN QUERY SELECT 'refresh_milestone_amounts', public.refresh_milestone_amounts()::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;