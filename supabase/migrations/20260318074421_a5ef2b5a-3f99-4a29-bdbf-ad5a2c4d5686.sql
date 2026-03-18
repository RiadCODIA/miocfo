-- Function A: Monthly cashflow summary
CREATE OR REPLACE FUNCTION public.get_cashflow_summary(p_from date, p_to date)
RETURNS TABLE(month_key text, incassi numeric, pagamenti numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT 
    to_char(date, 'YYYY-MM') as month_key,
    COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as incassi,
    COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as pagamenti
  FROM bank_transactions
  WHERE user_id = auth.uid()
    AND date >= p_from AND date <= p_to
  GROUP BY to_char(date, 'YYYY-MM')
  ORDER BY month_key;
$$;

-- Function B: Total income/expenses for a date range
CREATE OR REPLACE FUNCTION public.get_cashflow_totals(p_from date, p_to date)
RETURNS TABLE(total_income numeric, total_expenses numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT 
    COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0)
  FROM bank_transactions
  WHERE user_id = auth.uid()
    AND date >= p_from AND date <= p_to;
$$;

-- Function B2: Totals filtered by bank_account_id
CREATE OR REPLACE FUNCTION public.get_cashflow_totals_by_account(p_from date, p_to date, p_account_id uuid)
RETURNS TABLE(total_income numeric, total_expenses numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT 
    COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0)
  FROM bank_transactions
  WHERE user_id = auth.uid()
    AND date >= p_from AND date <= p_to
    AND bank_account_id = p_account_id;
$$;

-- Function C: Daily net amounts for liquidity chart
CREATE OR REPLACE FUNCTION public.get_daily_totals(p_from date, p_to date)
RETURNS TABLE(day date, net_amount numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT date as day, COALESCE(SUM(amount), 0) as net_amount
  FROM bank_transactions
  WHERE user_id = auth.uid()
    AND date >= p_from AND date <= p_to
  GROUP BY date ORDER BY date;
$$;

-- Function D: Monthly summary filtered by account
CREATE OR REPLACE FUNCTION public.get_cashflow_summary_by_account(p_from date, p_to date, p_account_id uuid)
RETURNS TABLE(month_key text, incassi numeric, pagamenti numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT 
    to_char(date, 'YYYY-MM') as month_key,
    COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as incassi,
    COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as pagamenti
  FROM bank_transactions
  WHERE user_id = auth.uid()
    AND date >= p_from AND date <= p_to
    AND bank_account_id = p_account_id
  GROUP BY to_char(date, 'YYYY-MM')
  ORDER BY month_key;
$$;