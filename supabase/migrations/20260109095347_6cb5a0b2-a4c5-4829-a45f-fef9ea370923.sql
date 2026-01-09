-- Fix: plaid_item_id non deve essere UNIQUE (un item può avere più conti)
-- Invece, plaid_account_id identifica univocamente ogni conto

-- 1. Rimuovi il vincolo UNIQUE su plaid_item_id
ALTER TABLE public.bank_accounts DROP CONSTRAINT IF EXISTS bank_accounts_plaid_item_id_key;

-- 2. Aggiungi vincolo UNIQUE su plaid_account_id (identificatore univoco del conto)
ALTER TABLE public.bank_accounts ADD CONSTRAINT bank_accounts_plaid_account_id_key UNIQUE (plaid_account_id);

-- 3. Aggiungi indice su plaid_item_id per performance nelle query
CREATE INDEX IF NOT EXISTS idx_bank_accounts_plaid_item_id ON public.bank_accounts(plaid_item_id);