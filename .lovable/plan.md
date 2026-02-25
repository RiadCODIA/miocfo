

## Plan: Fix Conto Economico Issues + Invoice Matching Categories

This plan addresses 4 distinct issues on the Area Economica and Fatture pages.

---

### Issue 1: AI Analysis not working

**Root cause**: The edge function works correctly when called directly (tested and confirmed). The console logs show a `Badge` ref warning in `AIReportSection` but no blocking errors. The most likely cause is that the `supabase.functions.invoke` call returns the result wrapped differently than expected, or the error handling in `ContoEconomicoTab.tsx` silently swallows the response.

**Investigation needed**: The `supabase.functions.invoke` returns `{ data, error }` where `data` can be the parsed response. However, when the function returns an HTTP error status (e.g., 402 for credits), `.invoke()` puts it in `error` rather than `data`. The current code at line 113 checks `result?.error` but `result` is `data` from the invoke response -- if `data` is `null` due to a non-200 status, the `error` field on the outer destructuring catches it and throws. This should work.

**Action**: Add console logging to the `handleAIAnalysis` function to capture the exact response, and ensure the `result` is correctly handled. Also check if `LOVABLE_API_KEY` secret is properly configured (it is, confirmed in secrets list).

**Changes to `src/components/area-economica/ContoEconomicoTab.tsx`**:
- Add better error logging in `handleAIAnalysis` to surface what's happening
- Ensure the toast error message is shown even for edge cases (e.g., empty response)

---

### Issue 2: Arrows inconsistent with Revenue/Cost

**Root cause**: The P&L table currently does not show any directional arrows. The user expects visual indicators: up arrow for revenue rows, down arrow for cost rows. This is a missing UI feature.

**Changes to `src/components/area-economica/ContoEconomicoTab.tsx`**:
- Add `TrendingUp` (green) icon next to revenue row labels
- Add `TrendingDown` (red) icon next to cost/expense row labels
- Apply to section headers and subtotal rows for visual consistency

---

### Issue 3: Does not display data from existing invoices

**Root cause**: The database has 4 `emessa` and 14 `ricevuta` invoices. The `useContoEconomico` hook correctly queries both naming conventions (lines 41-49). Need to verify by checking the actual invoice dates to ensure they fall within the selected year.

**Verification**: Query the database to check what year the invoices belong to. If they're in 2025 and the user is viewing 2025, the data should appear. The hook logic looks correct -- this may be a year selection issue or the invoices may have null `invoice_date`.

**Changes**: After verification, if dates are correct, no hook changes needed. If there's a date parsing issue, fix the date comparison logic.

---

### Issue 4: Invoice matching modal - category dropdown not filtered by type

**Current state**: The `InvoiceMatchingModal` fetches ALL `cost_categories` from the DB and shows them regardless of whether the invoice is revenue (emessa) or expense (ricevuta). The current DB categories are all operational expense categories (Marketing, Forniture, etc.) with no revenue categories.

**Required changes**:

**A. Add missing cost categories to the database** (via migration or insert):
The user's specified list vs what exists:

**Existing expense categories** (need to add missing ones):
- Acquisto materie prime (NEW)
- Energia e carburanti (NEW)
- Lavorazioni c/terzi (NEW)  
- Provvigioni (NEW)
- Carburanti (NEW)
- Manutenzioni (NEW - currently only "Marketing" exists)
- Assicurazioni (EXISTS)
- Formazione e ricerca (NEW)
- Marketing e pubblicità (EXISTS as "Marketing" - rename)
- Beni di terzi (NEW)
- Canoni Leasing (NEW)
- Consulenze (NEW)
- Altre spese (EXISTS as "Altro")
- Spese bancarie (NEW)
- Oneri diversi (NEW)

Also existing that the user didn't list: "Affitto e utenze", "Forniture", "Servizi professionali", "Tecnologia e software", "Viaggi e trasferte", "Imposte e tasse"

**Revenue categories** (need to add to `cost_categories` or use `revenue_centers`):
- Ricavi da vendita
- Ricavi da servizi
- Altri ricavi
- Spese bancarie (user said add to both)
- Oneri diversi (user said add to both)

The `revenue_centers` table already has similar entries. We need to decide whether to:
1. Add a `category_type` field to `cost_categories` to distinguish revenue vs expense categories, OR
2. Use `revenue_centers` for revenue categories in the matching modal

**Recommended approach**: Add a `category_type` column (`'revenue'` | `'expense'`) to `cost_categories` to unify the dropdown. Then filter in the matching modal based on invoice type.

**B. Update `InvoiceMatchingModal.tsx`**:
- Filter categories by `category_type`: show revenue categories for `emessa`, expense categories for `ricevuta`/`autofattura`
- Make category selection **mandatory** (currently optional)

**C. Update `cost_categories` table**:
- Add `category_type` column with values `'revenue'` or `'expense'`
- Insert the missing categories per the user's list
- Update existing categories with the correct `category_type`

---

### Technical Details

**Files to modify**:
1. `src/components/area-economica/ContoEconomicoTab.tsx` - Fix AI analysis error handling, add revenue/cost arrows
2. `src/components/fatture/InvoiceMatchingModal.tsx` - Filter categories by invoice type, make mandatory
3. `src/hooks/useContoEconomico.ts` - Verify invoice date handling (may need minor fix)
4. Database migration - Add `category_type` column to `cost_categories`, insert missing categories

**Database changes**:
- `ALTER TABLE cost_categories ADD COLUMN category_type text NOT NULL DEFAULT 'expense'`
- Insert ~12 new expense categories + 3 revenue categories
- Update existing categories with proper `category_type` and `cost_type` (variable/fixed) assignments matching the user's P&L structure

**No new dependencies needed.**

