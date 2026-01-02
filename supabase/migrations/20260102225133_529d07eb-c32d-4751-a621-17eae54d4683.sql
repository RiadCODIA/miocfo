-- Create feature_flags table for global feature management
CREATE TABLE public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  enabled BOOLEAN DEFAULT false,
  rollout_percentage INTEGER DEFAULT 100,
  target_companies UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add constraint for rollout_percentage via trigger (CHECK constraints must be immutable)
CREATE OR REPLACE FUNCTION public.validate_rollout_percentage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rollout_percentage < 0 OR NEW.rollout_percentage > 100 THEN
    RAISE EXCEPTION 'rollout_percentage must be between 0 and 100';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_feature_flag_rollout
  BEFORE INSERT OR UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.validate_rollout_percentage();

-- Enable RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Only super_admin can manage feature flags
CREATE POLICY "Super admins can view feature flags"
  ON public.feature_flags FOR SELECT
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can insert feature flags"
  ON public.feature_flags FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update feature flags"
  ON public.feature_flags FOR UPDATE
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete feature flags"
  ON public.feature_flags FOR DELETE
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Add updated_at trigger
CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();