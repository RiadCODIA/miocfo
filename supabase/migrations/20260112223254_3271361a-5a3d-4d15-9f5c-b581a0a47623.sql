-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  critical_alerts BOOLEAN DEFAULT true,
  weekly_reports BOOLEAN DEFAULT false,
  notify_liquidity BOOLEAN DEFAULT true,
  notify_deadlines BOOLEAN DEFAULT true,
  notify_budget BOOLEAN DEFAULT true,
  notify_cashflow BOOLEAN DEFAULT true,
  notification_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can manage their own preferences
CREATE POLICY "Users can view own preferences" 
  ON public.notification_preferences FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" 
  ON public.notification_preferences FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" 
  ON public.notification_preferences FOR UPDATE 
  USING (auth.uid() = user_id);

-- Add email_sent column to alerts table for tracking
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT false;
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;

-- Enable realtime for alerts table
ALTER TABLE public.alerts REPLICA IDENTITY FULL;