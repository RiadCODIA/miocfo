-- Move any users on Basic plan to Small plan
UPDATE user_subscriptions 
SET plan_id = 'f682ca86-3692-4bd8-bfc8-cabae6c1dbd9'
WHERE plan_id = '98702c61-3d17-45a1-9dec-a09c7ec28601';

-- Deactivate Basic plan (don't delete due to potential historical references)
UPDATE subscription_plans 
SET is_active = false, sort_order = 99
WHERE id = '98702c61-3d17-45a1-9dec-a09c7ec28601';

-- Update Small: €49, sort_order 1
UPDATE subscription_plans SET 
  price_monthly = 49, price_yearly = 490, sort_order = 1,
  features = '["dashboard", "collegamenti_banche", "flussi_cassa", "transazioni", "conti_bancari"]'::jsonb,
  ai_monthly_limit_eur = 5, ai_topup_min_eur = 5, ai_upgrade_suggestion_after = 2,
  description = 'Analisi dati bancari con upload e collegamento Home Banking via API.'
WHERE id = 'f682ca86-3692-4bd8-bfc8-cabae6c1dbd9';

-- Update Pro: €79, sort_order 2
UPDATE subscription_plans SET 
  price_monthly = 79, price_yearly = 790, sort_order = 2,
  features = '["dashboard", "collegamenti", "flussi_cassa", "transazioni", "conti_bancari", "conto_economico", "fatture", "scadenzario"]'::jsonb,
  ai_monthly_limit_eur = 8, ai_topup_min_eur = 10, ai_upgrade_suggestion_after = 2,
  description = 'Analisi completa: dati bancari e fatture, upload e collegamento.'
WHERE id = '71d48f60-9cf6-4c7c-85da-b97a4473328d';

-- Update Full: €199, sort_order 3
UPDATE subscription_plans SET 
  price_monthly = 199, price_yearly = 1990, sort_order = 3,
  features = '["dashboard", "collegamenti", "flussi_cassa", "transazioni", "conti_bancari", "conto_economico", "budget_previsioni", "fatture", "scadenzario", "kpi_report", "alert_notifiche", "ai_assistant"]'::jsonb,
  ai_monthly_limit_eur = 20, ai_topup_min_eur = 20, ai_upgrade_suggestion_after = NULL,
  description = 'Controllo totale della tua attività con AI integrata e Budget & Previsioni.'
WHERE id = '34781b72-1b7a-4b13-b9eb-8a9ea9f13c08';