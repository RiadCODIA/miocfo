
-- Add user_id to cost_categories
ALTER TABLE cost_categories ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Add user_id to revenue_centers
ALTER TABLE revenue_centers ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Add user_id to vat_rates
ALTER TABLE vat_rates ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- RLS for cost_categories: allow authenticated users to manage their own entries
CREATE POLICY "Users can insert own cost_categories"
  ON cost_categories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cost_categories"
  ON cost_categories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cost_categories"
  ON cost_categories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS for revenue_centers: allow authenticated users to manage their own entries
CREATE POLICY "Users can insert own revenue_centers"
  ON revenue_centers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own revenue_centers"
  ON revenue_centers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own revenue_centers"
  ON revenue_centers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS for vat_rates: allow authenticated users to manage their own entries
CREATE POLICY "Users can insert own vat_rates"
  ON vat_rates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vat_rates"
  ON vat_rates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vat_rates"
  ON vat_rates FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger to auto-calculate monthly_cost from annual_cost on employees
CREATE OR REPLACE FUNCTION sync_employee_monthly_cost()
RETURNS trigger AS $$
BEGIN
  IF NEW.annual_cost IS NOT NULL THEN
    NEW.monthly_cost := NEW.annual_cost / 12.0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_employee_monthly_cost
  BEFORE INSERT OR UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION sync_employee_monthly_cost();

-- Backfill existing employees where monthly_cost is NULL but annual_cost is set
UPDATE employees SET monthly_cost = annual_cost / 12.0 WHERE annual_cost IS NOT NULL AND monthly_cost IS NULL;
