
-- Supplier learning table: stores {supplier_vat → category} per user
CREATE TABLE IF NOT EXISTS public.supplier_category_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_vat text NOT NULL,
  supplier_name text,
  category_id uuid REFERENCES public.cost_categories(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, supplier_vat)
);

ALTER TABLE public.supplier_category_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own supplier mappings" ON public.supplier_category_mappings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own supplier mappings" ON public.supplier_category_mappings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own supplier mappings" ON public.supplier_category_mappings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own supplier mappings" ON public.supplier_category_mappings
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- AI Usage Monthly tracking table
CREATE TABLE IF NOT EXISTS public.ai_usage_monthly (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_year text NOT NULL, -- format YYYY-MM
  cost_accumulated numeric NOT NULL DEFAULT 0,
  credit_recharged numeric NOT NULL DEFAULT 0,
  num_recharges integer NOT NULL DEFAULT 0,
  is_blocked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, month_year)
);

ALTER TABLE public.ai_usage_monthly ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI usage" ON public.ai_usage_monthly
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI usage" ON public.ai_usage_monthly
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Super admins can manage AI usage" ON public.ai_usage_monthly
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
