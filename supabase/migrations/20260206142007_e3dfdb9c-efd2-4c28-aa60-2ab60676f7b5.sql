-- First, delete any existing roles for demo accounts to ensure clean state
DELETE FROM public.user_roles WHERE user_id IN (
  'e7de0df8-4e8a-49c8-ae6a-0a30fc115d71',
  '629a7994-1ec8-4b84-8abc-988059fa1aed',
  '53209e17-7ecc-4f80-adcf-82623a2a9e35'
);

-- Assign correct roles to each demo account
-- demo.user@finexa.it -> user role
INSERT INTO public.user_roles (user_id, role) VALUES 
  ('e7de0df8-4e8a-49c8-ae6a-0a30fc115d71', 'user');

-- demo.admin@finexa.it -> admin_aziendale role
INSERT INTO public.user_roles (user_id, role) VALUES 
  ('629a7994-1ec8-4b84-8abc-988059fa1aed', 'admin_aziendale');

-- demo.superadmin@finexa.it -> super_admin role
INSERT INTO public.user_roles (user_id, role) VALUES 
  ('53209e17-7ecc-4f80-adcf-82623a2a9e35', 'super_admin');

-- Also ensure profiles exist for these users
INSERT INTO public.profiles (id, first_name, last_name, company_name)
VALUES 
  ('e7de0df8-4e8a-49c8-ae6a-0a30fc115d71', 'Demo', 'User', 'Azienda Demo'),
  ('629a7994-1ec8-4b84-8abc-988059fa1aed', 'Demo', 'Admin', 'Studio Consulenza Demo'),
  ('53209e17-7ecc-4f80-adcf-82623a2a9e35', 'Demo', 'SuperAdmin', 'Finexa')
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  company_name = EXCLUDED.company_name;