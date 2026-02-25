-- Re-activate "Spese bancarie" and "Oneri diversi", reorder them after Commissioni (sort_order 15)
UPDATE public.cost_categories SET is_active = true, sort_order = 16 WHERE id = '7ffd4044-25b3-4191-b50f-f4144279cfba'; -- Spese bancarie
UPDATE public.cost_categories SET is_active = true, sort_order = 17 WHERE id = '695df79b-4dc1-467a-a19a-2d0bf0c121b9'; -- Oneri diversi
UPDATE public.cost_categories SET sort_order = 18 WHERE id = '11dbdcb3-73f0-4d88-a98c-0b279e914ec8'; -- Altre spese (was 16)