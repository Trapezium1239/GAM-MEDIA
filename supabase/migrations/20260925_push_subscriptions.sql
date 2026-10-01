-- ============================================================
-- PUSH NOTIFICATIONS SUBSCRIPTIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own subscriptions
CREATE POLICY "User manage own push_subscriptions" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Admin can view all subscriptions
CREATE POLICY "Admin view all push_subscriptions" ON public.push_subscriptions
  FOR SELECT USING (public.is_admin_or_pastor());

-- Admin can manage all subscriptions
CREATE POLICY "Admin manage push_subscriptions" ON public.push_subscriptions
  FOR ALL USING (public.is_admin_or_pastor()) WITH CHECK (public.is_admin_or_pastor());

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_push_subscription_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_push_subscription_updated ON public.push_subscriptions;
CREATE TRIGGER on_push_subscription_updated
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_push_subscription_timestamp();

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON public.push_subscriptions(active);