-- Add A-Cube specific columns to bank_accounts
ALTER TABLE bank_accounts
ADD COLUMN IF NOT EXISTS fiscal_id TEXT,
ADD COLUMN IF NOT EXISTS acube_account_id TEXT;

-- Add index for fiscal_id lookups
CREATE INDEX IF NOT EXISTS idx_bank_accounts_fiscal_id ON bank_accounts(fiscal_id);

-- Add index for acube_account_id lookups
CREATE INDEX IF NOT EXISTS idx_bank_accounts_acube_account_id ON bank_accounts(acube_account_id);