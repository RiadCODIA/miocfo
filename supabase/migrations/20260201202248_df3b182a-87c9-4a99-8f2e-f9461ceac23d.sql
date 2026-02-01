-- =====================================================
-- FASE 1: Aggiungere colonne user_id alle tabelle mancanti
-- =====================================================

ALTER TABLE budgets ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE deadlines ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- =====================================================
-- FASE 2: Rimuovere policy permissive esistenti
-- =====================================================

-- bank_accounts
DROP POLICY IF EXISTS "Allow all access to bank_accounts" ON bank_accounts;

-- bank_transactions
DROP POLICY IF EXISTS "Allow all access to bank_transactions" ON bank_transactions;

-- budgets
DROP POLICY IF EXISTS "Allow all access to budgets" ON budgets;

-- deadlines
DROP POLICY IF EXISTS "Allow all access to deadlines" ON deadlines;

-- alerts
DROP POLICY IF EXISTS "Allow all access to alerts" ON alerts;

-- employees
DROP POLICY IF EXISTS "Allow all access to employees" ON employees;

-- categorization_rules
DROP POLICY IF EXISTS "Allow all access to categorization_rules" ON categorization_rules;

-- invoices (policy permissive esistenti)
DROP POLICY IF EXISTS "Allow public delete invoices" ON invoices;
DROP POLICY IF EXISTS "Allow public insert invoices" ON invoices;
DROP POLICY IF EXISTS "Allow public update invoices" ON invoices;
DROP POLICY IF EXISTS "Allow public view invoices" ON invoices;

-- =====================================================
-- FASE 3: Creare nuove policy RLS per user isolation
-- =====================================================

-- BANK_TRANSACTIONS: filtro via bank_accounts.user_id
CREATE POLICY "Users can view their own transactions"
  ON bank_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bank_accounts 
      WHERE bank_accounts.id = bank_transactions.bank_account_id 
        AND bank_accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own transactions"
  ON bank_transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bank_accounts 
      WHERE bank_accounts.id = bank_transactions.bank_account_id 
        AND bank_accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own transactions"
  ON bank_transactions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM bank_accounts 
      WHERE bank_accounts.id = bank_transactions.bank_account_id 
        AND bank_accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own transactions"
  ON bank_transactions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM bank_accounts 
      WHERE bank_accounts.id = bank_transactions.bank_account_id 
        AND bank_accounts.user_id = auth.uid()
    )
  );

-- BUDGETS
CREATE POLICY "Users can view their own budgets"
  ON budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budgets"
  ON budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets"
  ON budgets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets"
  ON budgets FOR DELETE
  USING (auth.uid() = user_id);

-- DEADLINES
CREATE POLICY "Users can view their own deadlines"
  ON deadlines FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own deadlines"
  ON deadlines FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deadlines"
  ON deadlines FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own deadlines"
  ON deadlines FOR DELETE
  USING (auth.uid() = user_id);

-- ALERTS
CREATE POLICY "Users can view their own alerts"
  ON alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own alerts"
  ON alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts"
  ON alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts"
  ON alerts FOR DELETE
  USING (auth.uid() = user_id);

-- EMPLOYEES
CREATE POLICY "Users can view their own employees"
  ON employees FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own employees"
  ON employees FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own employees"
  ON employees FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own employees"
  ON employees FOR DELETE
  USING (auth.uid() = user_id);

-- CATEGORIZATION_RULES
CREATE POLICY "Users can view their own categorization rules"
  ON categorization_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categorization rules"
  ON categorization_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categorization rules"
  ON categorization_rules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categorization rules"
  ON categorization_rules FOR DELETE
  USING (auth.uid() = user_id);

-- INVOICES
CREATE POLICY "Users can view their own invoices"
  ON invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoices"
  ON invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices"
  ON invoices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices"
  ON invoices FOR DELETE
  USING (auth.uid() = user_id);