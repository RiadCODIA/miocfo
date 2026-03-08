-- Add AI credit columns to subscription_plans
ALTER TABLE subscription_plans 
  ADD COLUMN IF NOT EXISTS ai_monthly_limit_eur numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_topup_min_eur numeric DEFAULT 5,
  ADD COLUMN IF NOT EXISTS ai_upgrade_suggestion_after integer;

-- Add AI cost tracking to user_subscriptions
ALTER TABLE user_subscriptions 
  ADD COLUMN IF NOT EXISTS ai_cost_used_eur numeric DEFAULT 0;

-- Create AI credit topups table
CREATE TABLE IF NOT EXISTS ai_credit_topups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount_eur numeric NOT NULL,
  month_year text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ai_credit_topups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own topups" ON ai_credit_topups
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own topups" ON ai_credit_topups
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Super admins can manage topups" ON ai_credit_topups
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Create plan_requests table
CREATE TABLE IF NOT EXISTS plan_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL REFERENCES subscription_plans(id),
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  processed_by uuid
);

ALTER TABLE plan_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own requests" ON plan_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own requests" ON plan_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Super admins can manage requests" ON plan_requests
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));