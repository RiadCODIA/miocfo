
-- 1. Add "Fornitori Generici" expense category
INSERT INTO public.cost_categories (name, category_type, cost_type, cashflow_type, is_active, sort_order)
VALUES ('Fornitori Generici', 'expense', 'variable', 'operational', true, 24);

-- 2. Add revenue categories for bank transaction receipts
INSERT INTO public.cost_categories (name, category_type, cost_type, cashflow_type, is_active, sort_order)
VALUES 
  ('Incassi', 'revenue', 'variable', 'operational', true, 10),
  ('Versamenti', 'revenue', 'variable', 'operational', true, 11),
  ('Bonifici', 'revenue', 'variable', 'operational', true, 12),
  ('Altri incassi', 'revenue', 'variable', 'operational', true, 13);
