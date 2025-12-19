-- Table to link admin_aziendale to their clients
CREATE TABLE public.admin_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  client_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (admin_id, client_id)
);

-- Enable RLS
ALTER TABLE public.admin_clients ENABLE ROW LEVEL SECURITY;

-- Policy: Admin can view only their own clients
CREATE POLICY "Admins can view their own clients"
ON public.admin_clients
FOR SELECT
USING (auth.uid() = admin_id);

-- Policy: Admin can insert their own clients
CREATE POLICY "Admins can insert their own clients"
ON public.admin_clients
FOR INSERT
WITH CHECK (auth.uid() = admin_id);

-- Policy: Admin can delete their own clients
CREATE POLICY "Admins can delete their own clients"
ON public.admin_clients
FOR DELETE
USING (auth.uid() = admin_id);