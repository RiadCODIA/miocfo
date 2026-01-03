-- 1. Aggiungere colonna user_id a companies per collegare l'utente proprietario
ALTER TABLE public.companies ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Rimuovere vecchie RLS policies su companies
DROP POLICY IF EXISTS "Admins can view all companies" ON public.companies;
DROP POLICY IF EXISTS "Admins can insert companies" ON public.companies;
DROP POLICY IF EXISTS "Admins can update companies" ON public.companies;
DROP POLICY IF EXISTS "Admins can delete companies" ON public.companies;

-- 3. Policy per admin: vedono solo le companies dei clienti che gestiscono
CREATE POLICY "Admins can view their clients companies" ON public.companies
FOR SELECT USING (
  has_role(auth.uid(), 'admin_aziendale'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.admin_clients 
    WHERE admin_clients.admin_id = auth.uid() 
    AND admin_clients.client_id = companies.id
  )
);

CREATE POLICY "Admins can insert their clients companies" ON public.companies
FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'admin_aziendale'::app_role)
);

CREATE POLICY "Admins can update their clients companies" ON public.companies
FOR UPDATE USING (
  has_role(auth.uid(), 'admin_aziendale'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.admin_clients 
    WHERE admin_clients.admin_id = auth.uid() 
    AND admin_clients.client_id = companies.id
  )
);

CREATE POLICY "Admins can delete their clients companies" ON public.companies
FOR DELETE USING (
  has_role(auth.uid(), 'admin_aziendale'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.admin_clients 
    WHERE admin_clients.admin_id = auth.uid() 
    AND admin_clients.client_id = companies.id
  )
);

-- 4. Policy per utenti: vedono solo la propria company
CREATE POLICY "Users can view their own company" ON public.companies
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own company" ON public.companies
FOR UPDATE USING (user_id = auth.uid());

-- 5. Super admin può vedere e gestire tutto
CREATE POLICY "Super admins can view all companies" ON public.companies
FOR SELECT USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can manage all companies" ON public.companies
FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- 6. Aggiornare RLS su company_financials per rispettare isolamento admin
DROP POLICY IF EXISTS "Admins can manage company financials" ON public.company_financials;
DROP POLICY IF EXISTS "Users can view company financials" ON public.company_financials;

CREATE POLICY "Admins can view their clients company financials" ON public.company_financials
FOR SELECT USING (
  has_role(auth.uid(), 'admin_aziendale'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.admin_clients ac
    JOIN public.companies c ON c.id = ac.client_id
    WHERE ac.admin_id = auth.uid() 
    AND company_financials.company_id = c.id
  )
);

CREATE POLICY "Users can view their own company financials" ON public.company_financials
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = company_financials.company_id
    AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Super admins can manage all company financials" ON public.company_financials
FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- 7. Aggiornare RLS su products_services
DROP POLICY IF EXISTS "Admins can manage products" ON public.products_services;
DROP POLICY IF EXISTS "Users can view their company products" ON public.products_services;

CREATE POLICY "Admins can view their clients products" ON public.products_services
FOR SELECT USING (
  has_role(auth.uid(), 'admin_aziendale'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.admin_clients ac
    WHERE ac.admin_id = auth.uid() 
    AND products_services.company_id = ac.client_id
  )
);

CREATE POLICY "Users can view their own company products" ON public.products_services
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = products_services.company_id
    AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Super admins can manage all products" ON public.products_services
FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));