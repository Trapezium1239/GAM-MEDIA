-- ============================================================
-- SECURITY PATCHES (run after original schema.sql)
-- ============================================================

-- A. JWT CLAIM-GUARDED is_admin_or_pastor() — zero DB roundtrip for role checks
CREATE OR REPLACE FUNCTION public.is_admin_or_pastor()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Check custom JWT claims first (fast path, zero DB roundtrip)
  v_role := (auth.jwt() -> 'user_metadata' ->> 'role');
  IF v_role IN ('admin', 'pastor') THEN
    RETURN TRUE;
  END IF;

  -- Fallback to profiles table (cached by Supabase connection pool)
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'pastor')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B. Idempotency keys table — prevents double-submissions on bad networks
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash TEXT NOT NULL UNIQUE,
  action TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'processed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes')
);

ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User manage own idempotency_keys" ON public.idempotency_keys
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_idempotency_key_hash ON public.idempotency_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_idempotency_expires ON public.idempotency_keys(expires_at);

-- Auto-purge expired idempotency keys
CREATE OR REPLACE FUNCTION public.purge_expired_idempotency()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.idempotency_keys WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- C. Webhook replay protection — timestamp + signature validation
CREATE TABLE IF NOT EXISTS public.webhook_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signature_hash TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  endpoint TEXT NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.webhook_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read webhook_receipts" ON public.webhook_receipts
  FOR SELECT USING (public.is_admin_or_pastor());

CREATE OR REPLACE FUNCTION public.validate_webhook_timestamp(
  p_timestamp BIGINT,
  p_max_skew_seconds INTEGER DEFAULT 300
)
RETURNS BOOLEAN AS $$
DECLARE
  v_now BIGINT;
BEGIN
  v_now := EXTRACT(EPOCH FROM NOW())::BIGINT;
  RETURN ABS(v_now - p_timestamp) <= p_max_skew_seconds;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.store_webhook_receipt(
  p_signature_hash TEXT,
  p_timestamp BIGINT,
  p_endpoint TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_valid BOOLEAN;
BEGIN
  -- Check timestamp skew (max 300 seconds)
  v_valid := public.validate_webhook_timestamp(p_timestamp, 300);
  IF NOT v_valid THEN
    RAISE EXCEPTION 'Webhook timestamp skew exceeds 300 seconds';
  END IF;

  -- Check for replay
  IF EXISTS (SELECT 1 FROM public.webhook_receipts WHERE signature_hash = p_signature_hash AND processed = TRUE) THEN
    RAISE EXCEPTION 'Webhook replay detected';
  END IF;

  INSERT INTO public.webhook_receipts (signature_hash, timestamp, endpoint, processed)
  VALUES (p_signature_hash, p_timestamp, p_endpoint, TRUE);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- D. Auto-purge cron for expired records
-- Already exists: purge_expired_alerts, purge_expired_idempotency
-- Add: purge_expired_webhook_receipts (keep 7 days)
CREATE OR REPLACE FUNCTION public.purge_old_webhook_receipts()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.webhook_receipts WHERE created_at < NOW() - INTERVAL '7 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;