DROP INDEX IF EXISTS bank_transactions_external_id_key;
CREATE UNIQUE INDEX bank_transactions_external_id_key ON public.bank_transactions (external_id);