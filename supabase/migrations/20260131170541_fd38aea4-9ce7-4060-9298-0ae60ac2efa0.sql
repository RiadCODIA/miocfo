-- Add new columns to bank_transactions for complete Enable Banking data
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS value_date date;
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS transaction_date date;
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS credit_debit_indicator text;
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS creditor_name text;
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS creditor_iban text;
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS debtor_name text;
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS debtor_iban text;
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS mcc_code text;
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS bank_tx_code text;
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS bank_tx_description text;
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS reference_number text;
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS balance_after numeric;
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS entry_reference text;
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS raw_data jsonb;