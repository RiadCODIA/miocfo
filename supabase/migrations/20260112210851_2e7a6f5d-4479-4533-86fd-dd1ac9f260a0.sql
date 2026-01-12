-- Add user_id column to bank_accounts for manual imports
ALTER TABLE public.bank_accounts 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON public.bank_accounts(user_id);

-- Add RLS policy for users to see their own accounts
CREATE POLICY "Users can view their own bank accounts"
ON public.bank_accounts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bank accounts"
ON public.bank_accounts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bank accounts"
ON public.bank_accounts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bank accounts"
ON public.bank_accounts
FOR DELETE
USING (auth.uid() = user_id);