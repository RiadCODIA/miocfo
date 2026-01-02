-- Fix search_path for validate_rollout_percentage function
CREATE OR REPLACE FUNCTION public.validate_rollout_percentage()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.rollout_percentage < 0 OR NEW.rollout_percentage > 100 THEN
    RAISE EXCEPTION 'rollout_percentage must be between 0 and 100';
  END IF;
  RETURN NEW;
END;
$$;