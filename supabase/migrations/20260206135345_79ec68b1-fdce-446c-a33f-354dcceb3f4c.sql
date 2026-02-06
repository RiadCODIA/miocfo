-- =====================================================
-- FASE 1: ENUMERAZIONI
-- =====================================================

CREATE TYPE public.app_role AS ENUM ('user', 'admin_aziendale', 'super_admin');
CREATE TYPE public.cashflow_type AS ENUM ('operational', 'investment', 'financing');
CREATE TYPE public.cost_type AS ENUM ('fixed', 'variable');

-- =====================================================
-- FASE 2: FUNZIONE UPDATE TIMESTAMP (non dipende da tabelle)
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FASE 3: TABELLE CORE
-- =====================================================

-- Profili utente
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  company_name text,
  phone text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ruoli utente (separati per sicurezza) - PRIMA di has_role()
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- =====================================================
-- FASE 4: FUNZIONE has_role (ORA che user_roles esiste)
-- =====================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- =====================================================
-- FASE 5: ALTRE TABELLE
-- =====================================================

-- Aliquote IVA
CREATE TABLE public.vat_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  rate numeric NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Categorie di costo
CREATE TABLE public.cost_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cost_type cost_type NOT NULL DEFAULT 'variable',
  parent_id uuid REFERENCES public.cost_categories(id),
  cashflow_type cashflow_type NOT NULL DEFAULT 'operational',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Centri di ricavo
CREATE TABLE public.revenue_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Conti bancari
CREATE TABLE public.bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  bank_name text NOT NULL,
  iban text,
  balance numeric DEFAULT 0,
  currency text DEFAULT 'EUR',
  account_type text DEFAULT 'checking',
  is_connected boolean DEFAULT false,
  external_id text,
  provider text,
  last_sync_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Transazioni bancarie
CREATE TABLE public.bank_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_account_id uuid REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  date date NOT NULL,
  amount numeric NOT NULL,
  description text,
  merchant_name text,
  category text,
  ai_category_id uuid REFERENCES public.cost_categories(id),
  category_confirmed boolean DEFAULT false,
  transaction_type text DEFAULT 'expense',
  external_id text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Fatture
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_number text,
  invoice_type text NOT NULL DEFAULT 'expense',
  vendor_name text,
  client_name text,
  amount numeric NOT NULL,
  vat_amount numeric DEFAULT 0,
  total_amount numeric NOT NULL,
  invoice_date date,
  due_date date,
  payment_status text DEFAULT 'pending',
  category_id uuid REFERENCES public.cost_categories(id),
  file_path text,
  file_name text,
  matched_transaction_id uuid REFERENCES public.bank_transactions(id),
  extracted_data jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Budget
CREATE TABLE public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category_id uuid REFERENCES public.cost_categories(id),
  amount numeric NOT NULL,
  period_type text DEFAULT 'monthly',
  start_date date NOT NULL,
  end_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Scadenze
CREATE TABLE public.deadlines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  amount numeric,
  due_date date NOT NULL,
  deadline_type text DEFAULT 'payment',
  status text DEFAULT 'pending',
  priority text DEFAULT 'medium',
  category_id uuid REFERENCES public.cost_categories(id),
  invoice_id uuid REFERENCES public.invoices(id),
  recurrence text,
  reminder_days integer DEFAULT 7,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Avvisi/Notifiche
CREATE TABLE public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  severity text DEFAULT 'info',
  is_read boolean DEFAULT false,
  action_url text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Dipendenti
CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text,
  annual_cost numeric,
  monthly_cost numeric,
  start_date date,
  end_date date,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Regole categorizzazione AI
CREATE TABLE public.categorization_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern text NOT NULL,
  category_id uuid REFERENCES public.cost_categories(id),
  priority integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Preferenze notifiche
CREATE TABLE public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_alerts boolean DEFAULT true,
  push_alerts boolean DEFAULT true,
  deadline_reminders boolean DEFAULT true,
  budget_alerts boolean DEFAULT true,
  weekly_summary boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- =====================================================
-- FASE 6: TABELLE CONSULENTE/ADMIN
-- =====================================================

-- Aziende clienti
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  vat_number text,
  fiscal_code text,
  address text,
  city text,
  postal_code text,
  country text DEFAULT 'IT',
  phone text,
  email text,
  website text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Relazione consulente-clienti
CREATE TABLE public.admin_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id),
  status text DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(admin_id, client_id)
);

-- Dati finanziari aziende
CREATE TABLE public.company_financials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  year integer NOT NULL,
  month integer,
  revenue numeric DEFAULT 0,
  expenses numeric DEFAULT 0,
  profit numeric DEFAULT 0,
  cash_flow numeric DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =====================================================
-- FASE 7: TABELLE SUPER ADMIN
-- =====================================================

-- Piani abbonamento
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price_monthly numeric NOT NULL,
  price_yearly numeric,
  features jsonb,
  max_users integer,
  max_bank_accounts integer,
  max_invoices_monthly integer,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Provider integrazioni
CREATE TABLE public.integration_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  description text,
  config jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Job sincronizzazione
CREATE TABLE public.sync_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  job_type text NOT NULL,
  status text DEFAULT 'pending',
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Log applicazione
CREATE TABLE public.application_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level text NOT NULL DEFAULT 'info',
  message text NOT NULL,
  source text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Audit trail
CREATE TABLE public.audit_trail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  table_name text,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Metriche sistema
CREATE TABLE public.system_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  metric_unit text,
  tags jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Feature flags
CREATE TABLE public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  is_enabled boolean DEFAULT false,
  rollout_percentage integer DEFAULT 0,
  conditions jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Richieste GDPR
CREATE TABLE public.gdpr_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  request_type text NOT NULL,
  status text DEFAULT 'pending',
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  notes text
);

-- IP Allowlist
CREATE TABLE public.ip_allowlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address inet NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Policy sicurezza
CREATE TABLE public.security_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  policy_type text NOT NULL,
  config jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =====================================================
-- FASE 8: TRIGGER
-- =====================================================

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bank_transactions_updated_at BEFORE UPDATE ON public.bank_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deadlines_updated_at BEFORE UPDATE ON public.deadlines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_financials_updated_at BEFORE UPDATE ON public.company_financials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_integration_providers_updated_at BEFORE UPDATE ON public.integration_providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_security_policies_updated_at BEFORE UPDATE ON public.security_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- FASE 9: FUNZIONE HANDLE NEW USER
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- FASE 10: FUNZIONE GET USERS WITH EMAIL
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_users_with_email()
RETURNS TABLE (
  id uuid,
  email text,
  last_sign_in_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    au.id,
    au.email::text,
    au.last_sign_in_at
  FROM auth.users au
  WHERE EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'super_admin'
  )
$$;

-- =====================================================
-- FASE 11: ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vat_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorization_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gdpr_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_allowlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_policies ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- USER_ROLES
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Super admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- VAT_RATES
CREATE POLICY "Anyone can view vat_rates" ON public.vat_rates FOR SELECT USING (true);
CREATE POLICY "Admins can manage vat_rates" ON public.vat_rates FOR ALL USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_aziendale'));

-- COST_CATEGORIES
CREATE POLICY "Anyone can view cost_categories" ON public.cost_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage cost_categories" ON public.cost_categories FOR ALL USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_aziendale'));

-- REVENUE_CENTERS
CREATE POLICY "Anyone can view revenue_centers" ON public.revenue_centers FOR SELECT USING (true);
CREATE POLICY "Admins can manage revenue_centers" ON public.revenue_centers FOR ALL USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_aziendale'));

-- BANK_ACCOUNTS
CREATE POLICY "Users can view own bank_accounts" ON public.bank_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bank_accounts" ON public.bank_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bank_accounts" ON public.bank_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bank_accounts" ON public.bank_accounts FOR DELETE USING (auth.uid() = user_id);

-- BANK_TRANSACTIONS
CREATE POLICY "Users can view own transactions" ON public.bank_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.bank_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.bank_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.bank_transactions FOR DELETE USING (auth.uid() = user_id);

-- INVOICES
CREATE POLICY "Users can view own invoices" ON public.invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own invoices" ON public.invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own invoices" ON public.invoices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own invoices" ON public.invoices FOR DELETE USING (auth.uid() = user_id);

-- BUDGETS
CREATE POLICY "Users can view own budgets" ON public.budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own budgets" ON public.budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budgets" ON public.budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own budgets" ON public.budgets FOR DELETE USING (auth.uid() = user_id);

-- DEADLINES
CREATE POLICY "Users can view own deadlines" ON public.deadlines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own deadlines" ON public.deadlines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own deadlines" ON public.deadlines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own deadlines" ON public.deadlines FOR DELETE USING (auth.uid() = user_id);

-- ALERTS
CREATE POLICY "Users can view own alerts" ON public.alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own alerts" ON public.alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own alerts" ON public.alerts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own alerts" ON public.alerts FOR DELETE USING (auth.uid() = user_id);

-- EMPLOYEES
CREATE POLICY "Users can view own employees" ON public.employees FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own employees" ON public.employees FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own employees" ON public.employees FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own employees" ON public.employees FOR DELETE USING (auth.uid() = user_id);

-- CATEGORIZATION_RULES
CREATE POLICY "Users can view own categorization_rules" ON public.categorization_rules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categorization_rules" ON public.categorization_rules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categorization_rules" ON public.categorization_rules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categorization_rules" ON public.categorization_rules FOR DELETE USING (auth.uid() = user_id);

-- NOTIFICATION_PREFERENCES
CREATE POLICY "Users can view own notification_preferences" ON public.notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notification_preferences" ON public.notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notification_preferences" ON public.notification_preferences FOR UPDATE USING (auth.uid() = user_id);

-- COMPANIES
CREATE POLICY "Admins can view companies" ON public.companies FOR SELECT USING (public.has_role(auth.uid(), 'admin_aziendale') OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins can manage companies" ON public.companies FOR ALL USING (public.has_role(auth.uid(), 'admin_aziendale') OR public.has_role(auth.uid(), 'super_admin'));

-- ADMIN_CLIENTS
CREATE POLICY "Admins can view own clients" ON public.admin_clients FOR SELECT USING (auth.uid() = admin_id OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins can manage own clients" ON public.admin_clients FOR ALL USING (auth.uid() = admin_id OR public.has_role(auth.uid(), 'super_admin'));

-- COMPANY_FINANCIALS
CREATE POLICY "Admins can view company_financials" ON public.company_financials FOR SELECT USING (public.has_role(auth.uid(), 'admin_aziendale') OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins can manage company_financials" ON public.company_financials FOR ALL USING (public.has_role(auth.uid(), 'admin_aziendale') OR public.has_role(auth.uid(), 'super_admin'));

-- SUBSCRIPTION_PLANS
CREATE POLICY "Anyone can view subscription_plans" ON public.subscription_plans FOR SELECT USING (true);
CREATE POLICY "Super admins can manage subscription_plans" ON public.subscription_plans FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- INTEGRATION_PROVIDERS
CREATE POLICY "Super admins can view integration_providers" ON public.integration_providers FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can manage integration_providers" ON public.integration_providers FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- SYNC_JOBS
CREATE POLICY "Users can view own sync_jobs" ON public.sync_jobs FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can insert own sync_jobs" ON public.sync_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Super admins can manage sync_jobs" ON public.sync_jobs FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- APPLICATION_LOGS
CREATE POLICY "Super admins can view application_logs" ON public.application_logs FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can manage application_logs" ON public.application_logs FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- AUDIT_TRAIL
CREATE POLICY "Super admins can view audit_trail" ON public.audit_trail FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can manage audit_trail" ON public.audit_trail FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- SYSTEM_METRICS
CREATE POLICY "Super admins can view system_metrics" ON public.system_metrics FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can manage system_metrics" ON public.system_metrics FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- FEATURE_FLAGS
CREATE POLICY "Authenticated can view feature_flags" ON public.feature_flags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can manage feature_flags" ON public.feature_flags FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- GDPR_REQUESTS
CREATE POLICY "Users can view own gdpr_requests" ON public.gdpr_requests FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can insert own gdpr_requests" ON public.gdpr_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Super admins can manage gdpr_requests" ON public.gdpr_requests FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- IP_ALLOWLIST
CREATE POLICY "Super admins can view ip_allowlist" ON public.ip_allowlist FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can manage ip_allowlist" ON public.ip_allowlist FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- SECURITY_POLICIES
CREATE POLICY "Super admins can view security_policies" ON public.security_policies FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can manage security_policies" ON public.security_policies FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- =====================================================
-- FASE 12: STORAGE BUCKETS
-- =====================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('bank-statements', 'bank-statements', false);

CREATE POLICY "Users can upload own invoices" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own invoices" ON storage.objects FOR SELECT USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own invoices" ON storage.objects FOR DELETE USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own bank-statements" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'bank-statements' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own bank-statements" ON storage.objects FOR SELECT USING (bucket_id = 'bank-statements' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own bank-statements" ON storage.objects FOR DELETE USING (bucket_id = 'bank-statements' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =====================================================
-- FASE 13: DATI INIZIALI
-- =====================================================

INSERT INTO public.vat_rates (name, rate, is_default) VALUES
  ('Aliquota ordinaria 22%', 22, true),
  ('Aliquota ridotta 10%', 10, false),
  ('Aliquota ridotta 5%', 5, false),
  ('Aliquota minima 4%', 4, false),
  ('Esente IVA', 0, false);

INSERT INTO public.cost_categories (name, cost_type, cashflow_type, sort_order) VALUES
  ('Personale', 'fixed', 'operational', 1),
  ('Affitto e utenze', 'fixed', 'operational', 2),
  ('Marketing', 'variable', 'operational', 3),
  ('Forniture', 'variable', 'operational', 4),
  ('Servizi professionali', 'variable', 'operational', 5),
  ('Tecnologia e software', 'fixed', 'operational', 6),
  ('Viaggi e trasferte', 'variable', 'operational', 7),
  ('Assicurazioni', 'fixed', 'operational', 8),
  ('Imposte e tasse', 'variable', 'operational', 9),
  ('Altro', 'variable', 'operational', 99);

INSERT INTO public.revenue_centers (name, description, sort_order) VALUES
  ('Vendite prodotti', 'Ricavi da vendita prodotti', 1),
  ('Servizi', 'Ricavi da prestazione servizi', 2),
  ('Consulenze', 'Ricavi da attività di consulenza', 3),
  ('Abbonamenti', 'Ricavi ricorrenti da abbonamenti', 4),
  ('Altro', 'Altri ricavi', 99);

INSERT INTO public.subscription_plans (name, description, price_monthly, price_yearly, features, max_users, max_bank_accounts, max_invoices_monthly, sort_order) VALUES
  ('Starter', 'Piano base per piccole attività', 19, 190, '{"bank_sync": false, "ai_categorization": false, "reports": "basic"}', 1, 2, 50, 1),
  ('Professional', 'Piano professionale per PMI', 49, 490, '{"bank_sync": true, "ai_categorization": true, "reports": "advanced"}', 5, 10, 500, 2),
  ('Enterprise', 'Piano enterprise personalizzato', 149, 1490, '{"bank_sync": true, "ai_categorization": true, "reports": "custom", "api_access": true}', -1, -1, -1, 3);