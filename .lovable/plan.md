

## Switch all AI edge functions from Lovable AI Gateway to OpenAI API

The project currently uses `LOVABLE_API_KEY` + `ai.gateway.lovable.dev` across 7 edge functions. The user wants to use `OPENAI_API_KEY` (already configured as a secret) with the OpenAI API directly.

### Changes

**7 Edge Functions — replace API key, endpoint, and model:**

For each function, apply these 3 substitutions:
1. `Deno.env.get("LOVABLE_API_KEY")` → `Deno.env.get("OPENAI_API_KEY")`
2. `https://ai.gateway.lovable.dev/v1/chat/completions` → `https://api.openai.com/v1/chat/completions`
3. Model names: `google/gemini-3-flash-preview` → `gpt-4o-mini`, `google/gemini-2.5-flash` → `gpt-4o-mini`

Files:
- `supabase/functions/ai-assistant/index.ts`
- `supabase/functions/analyze-kpi/index.ts`
- `supabase/functions/analyze-conto-economico/index.ts`
- `supabase/functions/analyze-spending/index.ts`
- `supabase/functions/categorize-transactions/index.ts`
- `supabase/functions/process-invoice/index.ts`
- `supabase/functions/process-bank-statement/index.ts`

**3 Frontend hooks — remove "Lovable" from error messages:**

- `src/hooks/useSpendingAnalysis.ts` — "Crediti Lovable AI esauriti" → "Crediti AI esauriti"
- `src/hooks/useCategorizeTransactions.ts` (2 occurrences) — same change

**Other cleanup (from previous plan):**

- `vite.config.ts` — remove `lovable-tagger` import and `componentTagger()` plugin
- `index.html` — replace any `lovable.app` OG URLs with relative paths
- `README.md` — rewrite as mioCFO README, remove all Lovable branding
- `supabase/functions/analyze-spending/index.ts` — error message "Crediti Lovable AI esauriti" → "Crediti AI esauriti"
- Comment referencing "Lovable AI" in `categorize-transactions/index.ts` line 298

