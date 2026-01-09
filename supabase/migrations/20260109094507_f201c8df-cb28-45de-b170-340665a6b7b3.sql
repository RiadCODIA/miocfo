-- Aggiorna la funzione handle_new_user per assegnare anche il ruolo
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Crea profilo
  INSERT INTO public.profiles (id, first_name, last_name, company_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.raw_user_meta_data ->> 'company_name'
  );
  
  -- Assegna ruolo (default: 'user')
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::app_role,
      'user'::app_role
    )
  );
  
  RETURN NEW;
END;
$$;

-- Policy per permettere agli utenti di leggere il proprio ruolo
CREATE POLICY "Users can read their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());