UPDATE public.subscription_plans
SET
  ai_assistant_messages_limit_monthly = CASE lower(name)
    WHEN 'small' THEN 50
    WHEN 'pro' THEN 60
    WHEN 'full' THEN 100
    ELSE ai_assistant_messages_limit_monthly
  END,
  ai_transaction_analyses_limit_monthly = CASE lower(name)
    WHEN 'small' THEN 3
    WHEN 'pro' THEN 3
    WHEN 'full' THEN 5
    ELSE ai_transaction_analyses_limit_monthly
  END,
  ai_monthly_limit_eur = 0,
  ai_topup_min_eur = 0,
  ai_upgrade_suggestion_after = NULL,
  updated_at = now()
WHERE lower(name) IN ('small', 'pro', 'full');