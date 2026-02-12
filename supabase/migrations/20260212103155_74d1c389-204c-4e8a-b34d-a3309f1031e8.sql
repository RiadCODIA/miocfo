
-- Add source column to invoices table
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual';

-- Add acube_invoice_id for deduplication
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS acube_invoice_id text;

-- Create unique index on acube_invoice_id to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_acube_invoice_id ON public.invoices (acube_invoice_id) WHERE acube_invoice_id IS NOT NULL;
