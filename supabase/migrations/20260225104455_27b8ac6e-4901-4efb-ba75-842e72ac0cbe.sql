
-- Add category_type column to distinguish revenue vs expense categories
ALTER TABLE public.cost_categories ADD COLUMN category_type text NOT NULL DEFAULT 'expense';

-- All existing categories are expense type (already default)

-- Insert missing EXPENSE categories from user's list
INSERT INTO public.cost_categories (name, cost_type, cashflow_type, category_type, sort_order, is_active)
VALUES
  ('Acquisto materie prime', 'variable', 'operational', 'expense', 1, true),
  ('Energia e carburanti', 'variable', 'operational', 'expense', 2, true),
  ('Lavorazioni c/terzi', 'variable', 'operational', 'expense', 3, true),
  ('Provvigioni', 'variable', 'operational', 'expense', 4, true),
  ('Carburanti', 'variable', 'operational', 'expense', 5, true),
  ('Manutenzioni', 'fixed', 'operational', 'expense', 6, true),
  ('Formazione e ricerca', 'fixed', 'operational', 'expense', 7, true),
  ('Beni di terzi', 'fixed', 'operational', 'expense', 8, true),
  ('Canoni Leasing', 'fixed', 'financing', 'expense', 9, true),
  ('Consulenze', 'variable', 'operational', 'expense', 10, true),
  ('Spese bancarie', 'fixed', 'operational', 'expense', 11, true),
  ('Oneri diversi', 'variable', 'operational', 'expense', 12, true);

-- Rename "Marketing" → "Marketing e pubblicità"
UPDATE public.cost_categories SET name = 'Marketing e pubblicità' WHERE name = 'Marketing';

-- Rename "Altro" → "Altre spese"
UPDATE public.cost_categories SET name = 'Altre spese' WHERE name = 'Altro';

-- Insert REVENUE categories
INSERT INTO public.cost_categories (name, cost_type, cashflow_type, category_type, sort_order, is_active)
VALUES
  ('Ricavi da vendita', 'variable', 'operational', 'revenue', 1, true),
  ('Ricavi da servizi', 'variable', 'operational', 'revenue', 2, true),
  ('Altri ricavi', 'variable', 'operational', 'revenue', 3, true);
