
CREATE TABLE public.kpi_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  kpi_id TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, kpi_id)
);

ALTER TABLE public.kpi_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own kpi_targets" ON public.kpi_targets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own kpi_targets" ON public.kpi_targets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own kpi_targets" ON public.kpi_targets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own kpi_targets" ON public.kpi_targets FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_kpi_targets_updated_at
BEFORE UPDATE ON public.kpi_targets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
