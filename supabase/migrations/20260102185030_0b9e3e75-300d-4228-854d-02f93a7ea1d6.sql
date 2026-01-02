-- Permettere upload allo storage senza autenticazione (per demo)
CREATE POLICY "Allow public upload to invoices bucket"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'invoices');

-- Permettere lettura pubblica
CREATE POLICY "Allow public read from invoices bucket"
ON storage.objects
FOR SELECT
USING (bucket_id = 'invoices');

-- Permettere delete pubblica
CREATE POLICY "Allow public delete from invoices bucket"
ON storage.objects
FOR DELETE
USING (bucket_id = 'invoices');

-- Permettere update pubblico storage
CREATE POLICY "Allow public update to invoices bucket"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'invoices');

-- Permettere insert nella tabella invoices senza auth
DROP POLICY IF EXISTS "Users can insert own invoices" ON public.invoices;
CREATE POLICY "Allow public insert invoices"
ON public.invoices
FOR INSERT
WITH CHECK (true);

-- Permettere lettura pubblica fatture
DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;
CREATE POLICY "Allow public view invoices"
ON public.invoices
FOR SELECT
USING (true);

-- Permettere update pubblico fatture
DROP POLICY IF EXISTS "Users can update own invoices" ON public.invoices;
CREATE POLICY "Allow public update invoices"
ON public.invoices
FOR UPDATE
USING (true);

-- Permettere delete pubblico fatture
DROP POLICY IF EXISTS "Users can delete own invoices" ON public.invoices;
CREATE POLICY "Allow public delete invoices"
ON public.invoices
FOR DELETE
USING (true);