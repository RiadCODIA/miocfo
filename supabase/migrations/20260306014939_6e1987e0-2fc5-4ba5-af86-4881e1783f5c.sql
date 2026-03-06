
-- Create user_subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  ai_credits_remaining INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique constraint: one active subscription per user
CREATE UNIQUE INDEX user_subscriptions_user_id_active_idx ON public.user_subscriptions (user_id) WHERE status = 'active';

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
  ON public.user_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Super admins can manage all subscriptions
CREATE POLICY "Super admins can manage subscriptions"
  ON public.user_subscriptions
  FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Delete existing plans and seed the 4 new ones
DELETE FROM public.subscription_plans;

INSERT INTO public.subscription_plans (name, description, price_monthly, price_yearly, sort_order, is_active, max_users, max_bank_accounts, max_invoices_monthly, features)
VALUES
  ('Basic', 'Analisi dati bancari con caricamento estratti conto', 49, 490, 1, true, 1, 3, null, '["dashboard", "flussi_cassa", "transazioni", "conti_bancari"]'),
  ('Small', 'Analisi dati bancari con connessione Home Banking API', 79, 790, 2, true, 1, 5, null, '["dashboard", "collegamenti_banche", "flussi_cassa", "transazioni", "conti_bancari"]'),
  ('Pro', 'Analisi completa dati bancari e fatture', 239, 2390, 3, true, 3, 10, -1, '["dashboard", "collegamenti", "flussi_cassa", "transazioni", "conti_bancari", "conto_economico", "fatture", "scadenzario"]'),
  ('Full', 'Controllo totale con Budget, Previsioni e AI Assistant', 479, 4790, 4, true, -1, -1, -1, '["dashboard", "collegamenti", "flussi_cassa", "transazioni", "conti_bancari", "conto_economico", "budget_previsioni", "fatture", "scadenzario", "kpi_report", "alert_notifiche", "ai_assistant"]');
