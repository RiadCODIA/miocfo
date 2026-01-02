-- Tabella alerts per sistema notifiche
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('warning', 'info', 'success', 'error')),
  alert_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'dismissed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabella deadlines per scadenzario
CREATE TABLE public.deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('incasso', 'pagamento')),
  amount DECIMAL NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue')),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabella budgets per previsioni
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month DATE NOT NULL,
  predicted_income DECIMAL DEFAULT 0,
  predicted_expenses DECIMAL DEFAULT 0,
  actual_income DECIMAL DEFAULT 0,
  actual_expenses DECIMAL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- RLS policies per alerts (public access per ora, da restringere in produzione)
CREATE POLICY "Allow all access to alerts" ON public.alerts FOR ALL USING (true) WITH CHECK (true);

-- RLS policies per deadlines
CREATE POLICY "Allow all access to deadlines" ON public.deadlines FOR ALL USING (true) WITH CHECK (true);

-- RLS policies per budgets
CREATE POLICY "Allow all access to budgets" ON public.budgets FOR ALL USING (true) WITH CHECK (true);

-- Triggers per updated_at
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON public.alerts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_deadlines_updated_at BEFORE UPDATE ON public.deadlines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indici per performance
CREATE INDEX idx_alerts_status ON public.alerts(status);
CREATE INDEX idx_alerts_priority ON public.alerts(priority);
CREATE INDEX idx_deadlines_due_date ON public.deadlines(due_date);
CREATE INDEX idx_deadlines_status ON public.deadlines(status);
CREATE INDEX idx_budgets_month ON public.budgets(month);