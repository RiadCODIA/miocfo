
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS critical_alerts boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_liquidity boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_cashflow boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notification_email text DEFAULT NULL;
