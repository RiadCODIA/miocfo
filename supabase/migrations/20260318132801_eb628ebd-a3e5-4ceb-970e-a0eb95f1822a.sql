-- Add fixed monthly AI quota columns to plans
ALTER TABLE public.subscription_plans
ADD COLUMN IF NOT EXISTS ai_assistant_messages_limit_monthly integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_transaction_analyses_limit_monthly integer NOT NULL DEFAULT 0;

-- Add monthly usage counters for assistant messages and transaction analyses
ALTER TABLE public.ai_usage_monthly
ADD COLUMN IF NOT EXISTS assistant_messages_used integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS transaction_analyses_used integer NOT NULL DEFAULT 0;

-- Create persistent documents archive for AI analyses
CREATE TABLE IF NOT EXISTS public.ai_analysis_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  month_year text NOT NULL,
  analysis_type text NOT NULL DEFAULT 'transaction_spending',
  title text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_analysis_documents ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_analysis_documents_user_created_at
  ON public.ai_analysis_documents (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_analysis_documents_user_month_year
  ON public.ai_analysis_documents (user_id, month_year);

CREATE INDEX IF NOT EXISTS idx_ai_usage_monthly_user_month_year
  ON public.ai_usage_monthly (user_id, month_year);

-- Update timestamp trigger
DROP TRIGGER IF EXISTS update_ai_analysis_documents_updated_at ON public.ai_analysis_documents;
CREATE TRIGGER update_ai_analysis_documents_updated_at
BEFORE UPDATE ON public.ai_analysis_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS policies for analysis documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ai_analysis_documents'
      AND policyname = 'Users can view own AI analysis documents'
  ) THEN
    CREATE POLICY "Users can view own AI analysis documents"
    ON public.ai_analysis_documents
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ai_analysis_documents'
      AND policyname = 'Users can insert own AI analysis documents'
  ) THEN
    CREATE POLICY "Users can insert own AI analysis documents"
    ON public.ai_analysis_documents
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ai_analysis_documents'
      AND policyname = 'Users can update own AI analysis documents'
  ) THEN
    CREATE POLICY "Users can update own AI analysis documents"
    ON public.ai_analysis_documents
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ai_analysis_documents'
      AND policyname = 'Users can delete own AI analysis documents'
  ) THEN
    CREATE POLICY "Users can delete own AI analysis documents"
    ON public.ai_analysis_documents
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ai_analysis_documents'
      AND policyname = 'Super admins can manage AI analysis documents'
  ) THEN
    CREATE POLICY "Super admins can manage AI analysis documents"
    ON public.ai_analysis_documents
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'super_admin'))
    WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
  END IF;
END $$;