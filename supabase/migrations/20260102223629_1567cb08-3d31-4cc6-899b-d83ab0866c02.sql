-- Tabella companies (gestione clienti/aziende)
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  vat_number TEXT,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'warning', 'suspended')),
  alerts_count INTEGER DEFAULT 0,
  revenue NUMERIC DEFAULT 0,
  cashflow NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Tabella subscription_plans (piani commerciali)
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
  max_users INTEGER DEFAULT 5,
  max_bank_accounts INTEGER DEFAULT 2,
  max_transactions_month INTEGER DEFAULT 1000,
  ai_features_enabled BOOLEAN DEFAULT false,
  features TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabella integration_providers (provider esterni)
CREATE TABLE public.integration_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider_type TEXT NOT NULL,
  status TEXT DEFAULT 'ok' CHECK (status IN ('ok', 'degraded', 'down')),
  uptime NUMERIC DEFAULT 100,
  error_rate NUMERIC DEFAULT 0,
  rate_limit_hits INTEGER DEFAULT 0,
  last_sync_at TIMESTAMPTZ,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabella sync_jobs (job di sincronizzazione)
CREATE TABLE public.sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.integration_providers(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'partial')),
  records_processed INTEGER DEFAULT 0,
  duration_ms INTEGER,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  stack_trace TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabella application_logs (log applicativi)
CREATE TABLE public.application_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL CHECK (level IN ('error', 'warn', 'info', 'debug')),
  service TEXT NOT NULL,
  message TEXT NOT NULL,
  request_id TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabella audit_trail (audit trail)
CREATE TABLE public.audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email TEXT,
  actor_role TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  target_name TEXT,
  result TEXT DEFAULT 'success' CHECK (result IN ('success', 'failure')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabella system_metrics (metriche di sistema)
CREATE TABLE public.system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL,
  value NUMERIC NOT NULL,
  environment TEXT DEFAULT 'production',
  measured_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Tabella gdpr_requests (richieste GDPR)
CREATE TABLE public.gdpr_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  company_name TEXT,
  request_type TEXT NOT NULL CHECK (request_type IN ('data_export', 'data_deletion')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  due_date DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabella ip_allowlist (allowlist IP)
CREATE TABLE public.ip_allowlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Tabella security_policies (policy di sicurezza)
CREATE TABLE public.security_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_type TEXT NOT NULL UNIQUE CHECK (policy_type IN ('password', 'session', 'retention')),
  settings JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Tabella products_services (prodotti/servizi per marginalità)
CREATE TABLE public.products_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabella product_financials (dati finanziari prodotti)
CREATE TABLE public.product_financials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products_services(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  revenue NUMERIC DEFAULT 0,
  variable_costs NUMERIC DEFAULT 0,
  fixed_costs_share NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabella company_financials (dati finanziari mensili per azienda - per KPI e flussi)
CREATE TABLE public.company_financials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  revenue NUMERIC DEFAULT 0,
  margin NUMERIC DEFAULT 0,
  cashflow NUMERIC DEFAULT 0,
  income NUMERIC DEFAULT 0,
  expenses NUMERIC DEFAULT 0,
  dso INTEGER DEFAULT 0,
  current_ratio NUMERIC DEFAULT 0,
  debt_ratio NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, month)
);

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gdpr_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_allowlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_financials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies (admin can manage their clients)
CREATE POLICY "Admins can view all companies" ON public.companies
  FOR SELECT USING (has_role(auth.uid(), 'admin_aziendale'));

CREATE POLICY "Admins can insert companies" ON public.companies
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin_aziendale'));

CREATE POLICY "Admins can update companies" ON public.companies
  FOR UPDATE USING (has_role(auth.uid(), 'admin_aziendale'));

CREATE POLICY "Admins can delete companies" ON public.companies
  FOR DELETE USING (has_role(auth.uid(), 'admin_aziendale'));

-- RLS Policies for subscription_plans (super admin only)
CREATE POLICY "Super admins can manage plans" ON public.subscription_plans
  FOR ALL USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Anyone can view active plans" ON public.subscription_plans
  FOR SELECT USING (status = 'active');

-- RLS Policies for integration_providers (super admin only)
CREATE POLICY "Super admins can manage providers" ON public.integration_providers
  FOR ALL USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can view providers" ON public.integration_providers
  FOR SELECT USING (has_role(auth.uid(), 'admin_aziendale'));

-- RLS Policies for sync_jobs
CREATE POLICY "Admins can view sync jobs" ON public.sync_jobs
  FOR SELECT USING (has_role(auth.uid(), 'admin_aziendale') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can manage sync jobs" ON public.sync_jobs
  FOR ALL USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- RLS Policies for application_logs (super admin only)
CREATE POLICY "Super admins can view logs" ON public.application_logs
  FOR SELECT USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "System can insert logs" ON public.application_logs
  FOR INSERT WITH CHECK (true);

-- RLS Policies for audit_trail (super admin only)
CREATE POLICY "Super admins can view audit trail" ON public.audit_trail
  FOR SELECT USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "System can insert audit entries" ON public.audit_trail
  FOR INSERT WITH CHECK (true);

-- RLS Policies for system_metrics (super admin only)
CREATE POLICY "Super admins can manage metrics" ON public.system_metrics
  FOR ALL USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- RLS Policies for gdpr_requests (super admin only)
CREATE POLICY "Super admins can manage GDPR requests" ON public.gdpr_requests
  FOR ALL USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- RLS Policies for ip_allowlist (super admin only)
CREATE POLICY "Super admins can manage IP allowlist" ON public.ip_allowlist
  FOR ALL USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- RLS Policies for security_policies (super admin only)
CREATE POLICY "Super admins can manage security policies" ON public.security_policies
  FOR ALL USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- RLS Policies for products_services (company-based access)
CREATE POLICY "Users can view their company products" ON public.products_services
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage products" ON public.products_services
  FOR ALL USING (has_role(auth.uid(), 'admin_aziendale'))
  WITH CHECK (has_role(auth.uid(), 'admin_aziendale'));

-- RLS Policies for product_financials
CREATE POLICY "Users can view product financials" ON public.product_financials
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage product financials" ON public.product_financials
  FOR ALL USING (has_role(auth.uid(), 'admin_aziendale'))
  WITH CHECK (has_role(auth.uid(), 'admin_aziendale'));

-- RLS Policies for company_financials
CREATE POLICY "Users can view company financials" ON public.company_financials
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage company financials" ON public.company_financials
  FOR ALL USING (has_role(auth.uid(), 'admin_aziendale'))
  WITH CHECK (has_role(auth.uid(), 'admin_aziendale'));

-- Create updated_at triggers for tables that need it
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_integration_providers_updated_at
  BEFORE UPDATE ON public.integration_providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_services_updated_at
  BEFORE UPDATE ON public.products_services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_security_policies_updated_at
  BEFORE UPDATE ON public.security_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();