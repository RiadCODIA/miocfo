-- Rimuovi il vecchio constraint
ALTER TABLE bank_accounts DROP CONSTRAINT IF EXISTS bank_accounts_source_check;

-- Aggiungi il nuovo constraint con enable_banking incluso
ALTER TABLE bank_accounts ADD CONSTRAINT bank_accounts_source_check 
  CHECK (source = ANY (ARRAY['plaid'::text, 'manual'::text, 'enable_banking'::text]));