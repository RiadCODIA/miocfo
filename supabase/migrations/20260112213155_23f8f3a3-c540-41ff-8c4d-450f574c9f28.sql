-- Add AI categorization columns to bank_transactions
ALTER TABLE bank_transactions 
ADD COLUMN IF NOT EXISTS ai_category_id UUID REFERENCES cost_categories(id),
ADD COLUMN IF NOT EXISTS ai_confidence INTEGER,
ADD COLUMN IF NOT EXISTS category_confirmed BOOLEAN DEFAULT false;

-- Create categorization_rules table for learning from user feedback
CREATE TABLE IF NOT EXISTS categorization_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern TEXT NOT NULL,
  category_id UUID REFERENCES cost_categories(id) ON DELETE CASCADE,
  match_type TEXT DEFAULT 'contains' CHECK (match_type IN ('contains', 'starts_with', 'exact', 'regex')),
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on categorization_rules
ALTER TABLE categorization_rules ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policies for categorization_rules (same pattern as bank_accounts)
CREATE POLICY "Allow all access to categorization_rules"
  ON categorization_rules FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index for faster pattern matching
CREATE INDEX IF NOT EXISTS idx_categorization_rules_pattern ON categorization_rules(pattern);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_ai_category ON bank_transactions(ai_category_id);