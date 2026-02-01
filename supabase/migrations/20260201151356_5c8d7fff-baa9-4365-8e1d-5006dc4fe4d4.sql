-- Funzione RPC per ottenere utenti con email (solo super_admin)
CREATE OR REPLACE FUNCTION get_users_with_email()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verifica che il chiamante sia super_admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: super_admin role required';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.email::text,
    u.created_at,
    u.last_sign_in_at
  FROM auth.users u;
END;
$$;

-- Inserisci piani di abbonamento default
INSERT INTO subscription_plans (
  name, price, billing_cycle, status, 
  max_users, max_bank_accounts, max_transactions_month,
  ai_features_enabled, features
) VALUES 
('Starter', 29, 'monthly', 'active', 5, 2, 1000, false, 
 ARRAY['dashboard', 'transactions', 'basic_reports']),
('Professional', 79, 'monthly', 'active', 15, 10, 10000, true, 
 ARRAY['dashboard', 'transactions', 'basic_reports', 'cash_flow', 'budget', 'ai_categorization']),
('Enterprise', 199, 'monthly', 'active', -1, -1, -1, true, 
 ARRAY['dashboard', 'transactions', 'basic_reports', 'cash_flow', 'budget', 'ai_categorization', 'ai_forecast', 'api_access', 'sso', 'dedicated_support'])
ON CONFLICT DO NOTHING;

-- Inserisci integration providers
INSERT INTO integration_providers (
  name, provider_type, status, uptime, error_rate, rate_limit_hits, config
) VALUES 
('Enable Banking', 'open_banking', 'ok', 99.8, 0.2, 12, '{"api_base_url": "https://api.enablebanking.com"}'),
('Lovable AI', 'ai', 'ok', 99.9, 0.1, 45, '{"model": "lovable-ai"}')
ON CONFLICT DO NOTHING;

-- Crea company per utenti esistenti che non hanno già una company collegata
INSERT INTO companies (name, email, status, user_id, created_at)
SELECT 
  COALESCE(p.company_name, p.first_name || ' ' || COALESCE(p.last_name, '') || ' Company'),
  NULL,
  'active',
  p.id,
  NOW()
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM companies c WHERE c.user_id = p.id
);