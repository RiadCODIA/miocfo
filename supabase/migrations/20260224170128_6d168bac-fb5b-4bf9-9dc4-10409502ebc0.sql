-- Deactivate "Personale" category (redundant with manual personnel section)
UPDATE public.cost_categories SET is_active = false WHERE id = 'b29fb127-7e73-42a0-85bc-6ba5836d4012';

-- Fix cost_type: "Viaggi e trasferte" should be fixed, not variable
UPDATE public.cost_categories SET cost_type = 'fixed' WHERE id = 'db49bbfa-bcbd-483f-bc37-c36edf5f2ab0';

-- Fix cost_type: "Imposte e tasse" should be fixed, not variable
UPDATE public.cost_categories SET cost_type = 'fixed' WHERE id = 'c03bd5b9-a0cf-49eb-9dd6-af96a98ea34e';

-- Reassign any invoices that were on "Personale" category to NULL (they'll be re-categorized on reprocess)
UPDATE public.invoices SET category_id = NULL WHERE category_id = 'b29fb127-7e73-42a0-85bc-6ba5836d4012';
