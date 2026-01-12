-- Create storage bucket for bank statements
INSERT INTO storage.buckets (id, name, public)
VALUES ('bank-statements', 'bank-statements', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload bank statements
CREATE POLICY "Allow authenticated uploads to bank-statements"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'bank-statements');

-- Allow users to read their own bank statements
CREATE POLICY "Allow users to read own bank-statements"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'bank-statements');

-- Allow users to delete their own bank statements
CREATE POLICY "Allow users to delete own bank-statements"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'bank-statements');

-- Add source column to bank_accounts to distinguish Plaid vs manual accounts
ALTER TABLE public.bank_accounts 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'plaid' CHECK (source IN ('plaid', 'manual'));

-- Make plaid_item_id nullable for manual accounts
ALTER TABLE public.bank_accounts 
ALTER COLUMN plaid_item_id DROP NOT NULL;

-- Make plaid_access_token nullable for manual accounts
ALTER TABLE public.bank_accounts 
ALTER COLUMN plaid_access_token DROP NOT NULL;

-- Add index for filtering by source
CREATE INDEX IF NOT EXISTS idx_bank_accounts_source ON public.bank_accounts(source);