-- Drop the partial indexes that don't work with ON CONFLICT
DROP INDEX IF EXISTS bank_accounts_external_id_user_id_idx;
DROP INDEX IF EXISTS bank_accounts_acube_account_id_user_id_idx;
DROP INDEX IF EXISTS bank_transactions_external_id_user_id_idx;

-- Create standard composite unique indexes (no WHERE clause)
CREATE UNIQUE INDEX bank_accounts_external_id_user_id_idx 
  ON bank_accounts (external_id, user_id);

CREATE UNIQUE INDEX bank_accounts_acube_account_id_user_id_idx 
  ON bank_accounts (acube_account_id, user_id);

CREATE UNIQUE INDEX bank_transactions_external_id_user_id_idx 
  ON bank_transactions (external_id, user_id);