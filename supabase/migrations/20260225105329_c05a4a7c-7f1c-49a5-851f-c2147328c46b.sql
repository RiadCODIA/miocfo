
-- Rename existing categories to match user's P&L structure
UPDATE public.cost_categories SET name = 'Acquisti', sort_order = 1 WHERE id = 'd044bc1f-00fa-41a2-90bd-12b22ee0960f';
UPDATE public.cost_categories SET name = 'Energia e combustibili', sort_order = 2 WHERE id = 'a04edd91-6005-4ad7-a6e8-0ff1e63fde10';
UPDATE public.cost_categories SET name = 'Lavorazioni di terzi', sort_order = 3 WHERE id = '643fb30e-dbc7-4d80-b5a9-5d0440f009f9';
UPDATE public.cost_categories SET sort_order = 4 WHERE id = 'ba487942-c676-4ac9-9ae9-cf56d81116cd'; -- Provvigioni
UPDATE public.cost_categories SET sort_order = 5 WHERE id = '2400dfb0-61a7-4c8c-bc0b-ca92359b7740'; -- Carburanti
UPDATE public.cost_categories SET sort_order = 6 WHERE id = '53a13e82-19ce-4e06-917a-7cb506e69bcc'; -- Manutenzioni
UPDATE public.cost_categories SET sort_order = 7 WHERE id = '452d6222-d5c7-40c0-9234-3dd98d9dd03e'; -- Assicurazioni
UPDATE public.cost_categories SET sort_order = 8 WHERE id = 'f68cab61-dc6a-44d7-9ce8-147a2bb59484'; -- Formazione e ricerca
UPDATE public.cost_categories SET sort_order = 9 WHERE id = 'da95e309-1c2c-4545-829a-e9c4cb91f60b'; -- Marketing e pubblicità
UPDATE public.cost_categories SET name = 'God. Beni di terzi', sort_order = 10 WHERE id = 'bf6fae3b-d482-4e3b-b11d-eede8cc350a4';
UPDATE public.cost_categories SET name = 'Canoni di leasing', sort_order = 11 WHERE id = '64fd7183-eaaf-45aa-be53-154e1e70f540';
UPDATE public.cost_categories SET sort_order = 12 WHERE id = 'cf38c937-d441-4969-a0ca-982718ab82ec'; -- Consulenze

-- Rename "Tecnologia e software" → "Software" (has invoices, rename in-place)
UPDATE public.cost_categories SET name = 'Software', sort_order = 13 WHERE id = 'fbce7099-d304-427b-ba87-400bdefa393c';

-- Rename "Servizi professionali" → "Servizi generali" (has invoices, rename in-place)
UPDATE public.cost_categories SET name = 'Servizi generali', sort_order = 14 WHERE id = '160dd491-d69d-4c7b-ba13-a6cd8cff1137';

-- Add "Commissioni" (new expense category)
INSERT INTO public.cost_categories (name, category_type, cost_type, cashflow_type, sort_order, is_active)
VALUES ('Commissioni', 'expense', 'variable', 'operational', 15, true);

-- Set Altre spese sort_order to 16
UPDATE public.cost_categories SET sort_order = 16 WHERE id = '11dbdcb3-73f0-4d88-a98c-0b279e914ec8';

-- Deactivate categories not in user's list
UPDATE public.cost_categories SET is_active = false WHERE id IN (
  'e30757d0-a136-45ff-8701-910ef49156dc', -- Affitto e utenze
  '1db05c72-0d1a-4614-9bdd-e37538917735', -- Forniture
  'db49bbfa-bcbd-483f-bc37-c36edf5f2ab0', -- Viaggi e trasferte
  'c03bd5b9-a0cf-49eb-9dd6-af96a98ea34e', -- Imposte e tasse
  '7ffd4044-25b3-4191-b50f-f4144279cfba', -- Spese bancarie
  '695df79b-4dc1-467a-a19a-2d0bf0c121b9'  -- Oneri diversi
);

-- Rename revenue categories
UPDATE public.cost_categories SET name = 'Ricavi delle vendite', sort_order = 1 WHERE id = '053b2bb6-3d63-45d6-94ac-ad3938c17685';
UPDATE public.cost_categories SET name = 'Ricavi delle prestazioni', sort_order = 2 WHERE id = 'd7c588be-9eb9-437f-b0a0-cf074b41e505';
UPDATE public.cost_categories SET name = 'Altri ricavi e proventi', sort_order = 3 WHERE id = '1b215fca-952d-4180-8fce-d2e360178036';
