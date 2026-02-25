
-- Rename "Acquisti" to "Acquisto materie prime"
UPDATE public.cost_categories 
SET name = 'Acquisto materie prime' 
WHERE id = 'd044bc1f-00fa-41a2-90bd-12b22ee0960f';

-- Add "Oneri bancari" (expense, fixed, sort_order 19)
INSERT INTO public.cost_categories (name, category_type, cost_type, cashflow_type, sort_order)
VALUES ('Oneri bancari', 'expense', 'fixed', 'operational', 19);

-- Add "Canoni vari" (expense, fixed, sort_order 20)
INSERT INTO public.cost_categories (name, category_type, cost_type, cashflow_type, sort_order)
VALUES ('Canoni vari', 'expense', 'fixed', 'operational', 20);
