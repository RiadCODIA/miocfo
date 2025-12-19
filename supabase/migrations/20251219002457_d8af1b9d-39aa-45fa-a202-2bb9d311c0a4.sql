-- Enum per i ruoli applicativi
CREATE TYPE public.app_role AS ENUM ('user', 'admin_aziendale');

-- Tabella user_roles per mappare utenti a ruoli
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Abilita RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Funzione security definer per verificare ruoli (evita ricorsione RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Policy: gli utenti possono vedere solo i propri ruoli
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: solo admin possono inserire ruoli
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin_aziendale'))
WITH CHECK (public.has_role(auth.uid(), 'admin_aziendale'));