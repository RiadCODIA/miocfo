
-- bank_accounts: external_id should be unique per user, not globally
ALTER TABLE bank_accounts DROP CONSTRAINT IF EXISTS bank_accounts_external_id_key;
DROP INDEX IF EXISTS bank_accounts_external_id_user_id_idx;
CREATE UNIQUE INDEX bank_accounts_external_id_user_id_idx ON bank_accounts (external_id, user_id) WHERE external_id IS NOT NULL;

-- bank_accounts: acube_account_id should be unique per user
ALTER TABLE bank_accounts DROP CONSTRAINT IF EXISTS bank_accounts_acube_account_id_key;
DROP INDEX IF EXISTS bank_accounts_acube_account_id_user_id_idx;
CREATE UNIQUE INDEX bank_accounts_acube_account_id_user_id_idx ON bank_accounts (acube_account_id, user_id) WHERE acube_account_id IS NOT NULL;

-- bank_transactions: external_id should be unique per user
ALTER TABLE bank_transactions DROP CONSTRAINT IF EXISTS bank_transactions_external_id_key;
DROP INDEX IF EXISTS bank_transactions_external_id_user_id_idx;
CREATE UNIQUE INDEX bank_transactions_external_id_user_id_idx ON bank_transactions (external_id, user_id) WHERE external_id IS NOT NULL;
