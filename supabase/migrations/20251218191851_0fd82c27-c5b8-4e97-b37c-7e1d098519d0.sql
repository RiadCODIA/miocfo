-- Enum per tipologie cashflow (Rendiconto OIC)
CREATE TYPE public.cashflow_type AS ENUM ('operational', 'investment', 'financing');

-- Enum per tipo categoria costo
CREATE TYPE public.cost_type AS ENUM ('fixed', 'variable');

-- Tabella Aliquote IVA
CREATE TABLE public.vat_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rate DECIMAL(5,2) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabella Centri di Incasso
CREATE TABLE public.revenue_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabella Categorie Costi (fissi e variabili)
CREATE TABLE public.cost_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cost_type cost_type NOT NULL,
  parent_id UUID REFERENCES public.cost_categories(id) ON DELETE SET NULL,
  cashflow_type cashflow_type DEFAULT 'operational',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabella Dipendenti
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT,
  annual_cost DECIMAL(12,2) NOT NULL,
  monthly_cost DECIMAL(12,2) GENERATED ALWAYS AS (annual_cost / 12) STORED,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vat_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Politiche RLS (accesso pubblico per ora, da restringere con auth)
CREATE POLICY "Allow all access to vat_rates" ON public.vat_rates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to revenue_centers" ON public.revenue_centers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to cost_categories" ON public.cost_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to employees" ON public.employees FOR ALL USING (true) WITH CHECK (true);

-- Trigger per updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vat_rates_updated_at BEFORE UPDATE ON public.vat_rates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_revenue_centers_updated_at BEFORE UPDATE ON public.revenue_centers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cost_categories_updated_at BEFORE UPDATE ON public.cost_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inserimento dati iniziali: Aliquote IVA italiane
INSERT INTO public.vat_rates (name, rate, is_default) VALUES
  ('IVA 22%', 22.00, true),
  ('IVA 10%', 10.00, false),
  ('IVA 4%', 4.00, false),
  ('Esente IVA', 0.00, false),
  ('Fuori Campo IVA', 0.00, false);

-- Inserimento dati iniziali: Centri di Incasso esempio
INSERT INTO public.revenue_centers (name, description, sort_order) VALUES
  ('Vendita Prodotti', 'Ricavi da vendita prodotti', 1),
  ('Servizi', 'Ricavi da servizi', 2),
  ('Consulenze', 'Ricavi da consulenze', 3);

-- Inserimento dati iniziali: Categorie Costi Fissi
INSERT INTO public.cost_categories (name, cost_type, cashflow_type, sort_order) VALUES
  ('Personale', 'fixed', 'operational', 1),
  ('Compensi Amministratore', 'fixed', 'operational', 2),
  ('Affitto e Locazioni', 'fixed', 'operational', 3),
  ('Noleggi e Leasing', 'fixed', 'operational', 4),
  ('Consulenze e Servizi', 'fixed', 'operational', 5),
  ('Utenze', 'fixed', 'operational', 6),
  ('Marketing e Pubblicità', 'fixed', 'operational', 7),
  ('Imposte e Tasse (F24)', 'fixed', 'operational', 8),
  ('Interessi e Oneri Finanziari', 'fixed', 'financing', 9),
  ('Accantonamenti', 'fixed', 'operational', 10);

-- Inserimento dati iniziali: Categorie Costi Variabili
INSERT INTO public.cost_categories (name, cost_type, cashflow_type, sort_order) VALUES
  ('Acquisto Materiali', 'variable', 'operational', 1),
  ('Provvigioni Venditori', 'variable', 'operational', 2),
  ('Costi Accessori Vendita', 'variable', 'operational', 3),
  ('Trasporti e Spedizioni', 'variable', 'operational', 4);