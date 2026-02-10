CREATE UNIQUE INDEX IF NOT EXISTS bank_transactions_external_id_key 
ON public.bank_transactions (external_id) 
WHERE external_id IS NOT NULL;