-- Rimuovere la foreign key constraint che collega user_id a auth.users
ALTER TABLE public.invoices 
DROP CONSTRAINT IF EXISTS invoices_user_id_fkey;