-- =====================================================
-- Correzione policy per tabelle di configurazione condivise
-- Mantengo SELECT pubblico, ma limito modifiche agli admin
-- =====================================================

-- COST_CATEGORIES: solo admin/super_admin possono modificare
DROP POLICY IF EXISTS "Allow all access to cost_categories" ON cost_categories;

CREATE POLICY "Anyone can view cost categories"
  ON cost_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert cost categories"
  ON cost_categories FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin_aziendale'));

CREATE POLICY "Admins can update cost categories"
  ON cost_categories FOR UPDATE
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin_aziendale'));

CREATE POLICY "Admins can delete cost categories"
  ON cost_categories FOR DELETE
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin_aziendale'));

-- REVENUE_CENTERS: solo admin/super_admin possono modificare
DROP POLICY IF EXISTS "Allow all access to revenue_centers" ON revenue_centers;

CREATE POLICY "Anyone can view revenue centers"
  ON revenue_centers FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert revenue centers"
  ON revenue_centers FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin_aziendale'));

CREATE POLICY "Admins can update revenue centers"
  ON revenue_centers FOR UPDATE
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin_aziendale'));

CREATE POLICY "Admins can delete revenue centers"
  ON revenue_centers FOR DELETE
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin_aziendale'));

-- VAT_RATES: solo admin/super_admin possono modificare
DROP POLICY IF EXISTS "Allow all access to vat_rates" ON vat_rates;

CREATE POLICY "Anyone can view vat rates"
  ON vat_rates FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert vat rates"
  ON vat_rates FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin_aziendale'));

CREATE POLICY "Admins can update vat rates"
  ON vat_rates FOR UPDATE
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin_aziendale'));

CREATE POLICY "Admins can delete vat rates"
  ON vat_rates FOR DELETE
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin_aziendale'));