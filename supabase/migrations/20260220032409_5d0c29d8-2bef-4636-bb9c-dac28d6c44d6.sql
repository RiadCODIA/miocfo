ALTER TABLE budgets 
ADD COLUMN IF NOT EXISTS budget_type text DEFAULT 'income' 
CHECK (budget_type IN ('income', 'expense'));

UPDATE budgets SET budget_type = CASE 
  WHEN amount < 0 THEN 'expense' 
  ELSE 'income' 
END
WHERE budget_type IS NULL;