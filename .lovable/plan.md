

# Fix Conto Economico: 4 Issues

## Issue 1: Remove "Non categorizzato" line - Add Auto-Categorization

**Problem**: Invoices without a `category_id` appear as "Non categorizzato". Many invoices have `category_id = NULL` because the `process-invoice` function extracts a `subject` (goods, services, consulting, etc.) but never maps it to a `cost_category`.

**Solution**: 
- Modify `supabase/functions/process-invoice/index.ts` to auto-assign `category_id` based on the AI-extracted `subject` field
- Add a subject-to-category mapping that queries the user's cost_categories and matches:
  - `consulting` / `services` / `fees` -> "Servizi professionali"
  - `goods` -> "Forniture"
  - `transport` -> "Viaggi e trasferte"
  - `insurance` -> "Assicurazioni"
  - `utilities` / `rent` -> "Affitto e utenze"
  - `maintenance` -> "Tecnologia e software"
  - `other` -> "Altro"
- For existing uncategorized invoices: run a one-time data update to assign categories based on their `extracted_data->subject`, or prompt user to reprocess
- Keep the "Non categorizzato" row visible as a fallback but it should rarely appear

## Issue 2: Remove "Personale" from Fixed Costs

**Problem**: "Personale" exists as a fixed cost category (id: `b29fb127...`) in the database AND there's a separate manual "Costi Personale" section below with editable "Salari e stipendi" rows. This is redundant.

**Solution**:
- SQL update: Either deactivate the "Personale" cost_category (`is_active = false`) or delete it
- Any invoices currently assigned to "Personale" category will need to be reassigned
- The manual "Costi Personale" section with editable salary rows remains as the correct way to handle personnel costs

## Issue 3: Fix Cost Types for "Viaggi e trasferte" and "Imposte e tasse"

**Problem**: "Viaggi e trasferte" and "Imposte e tasse" are classified as `cost_type: variable` but should be `fixed`.

**Solution**:
- SQL update to change `cost_type` from `'variable'` to `'fixed'` for these two categories

## Issue 4: VAT Not Calculated on Uploaded Invoices

**Problem**: Many uploaded invoices have `vat_amount = 0` even though VAT is present. The AI extraction returns a simplified response without VAT breakdown for some invoices. Looking at the data, the `extracted_data.ai_response` for affected invoices only contains `amount` without `taxable_amount`, `vat_amount`, or `vat_rate`.

**Solution**:
- Improve the AI prompt in `process-invoice/index.ts` to be more explicit about always extracting VAT separately
- Add a post-extraction validation: if `vat_amount = 0` but `total_amount > taxable_amount`, compute `vat_amount = total_amount - taxable_amount`
- Add another fallback: if `amount == total_amount` and `vat_amount == 0`, check if the AI returned a `vat_rate > 0` and compute VAT from that
- For existing invoices with zero VAT: users can use the existing "Riprocessa" button to re-extract with the improved prompt

---

## Technical Details

### Files to Modify

1. **`supabase/functions/process-invoice/index.ts`**
   - Add auto-categorization function that maps `subject` to `category_id`
   - Query `cost_categories` table to find matching category for the user
   - Set `category_id` on insert/update
   - Strengthen the AI prompt for VAT extraction (add emphasis on ALWAYS separating imponibile from IVA)
   - Add post-extraction VAT validation/fallback logic

2. **SQL Data Update (via insert tool)**
   - Set "Personale" category to `is_active = false`
   - Update "Viaggi e trasferte" (`db49bbfa...`) `cost_type` from `'variable'` to `'fixed'`
   - Update "Imposte e tasse" (`c03bd5b9...`) `cost_type` from `'variable'` to `'fixed'`

3. **`src/hooks/useContoEconomico.ts`** (minor)
   - No structural changes needed; the hook already correctly reads categories by cost_type

### Auto-Categorization Mapping

```text
AI Subject        ->  Cost Category Name
─────────────────────────────────────────
consulting        ->  Servizi professionali
services          ->  Servizi professionali
fees              ->  Servizi professionali
goods             ->  Forniture
transport         ->  Viaggi e trasferte
insurance         ->  Assicurazioni
utilities         ->  Affitto e utenze
rent              ->  Affitto e utenze
maintenance       ->  Tecnologia e software
other             ->  Altro
```

### VAT Extraction Improvements

```text
1. Prompt enhancement: Add explicit instruction "SEMPRE separare imponibile e IVA, anche se nel documento non sono chiaramente distinti"
2. Fallback logic:
   - If vat_amount=0 AND total_amount > taxable_amount: vat_amount = total - taxable
   - If vat_amount=0 AND vat_rate > 0: vat_amount = taxable * vat_rate / 100
   - If amount == total_amount AND vat_amount=0 AND vat_rate > 0: recalculate taxable = total / (1 + rate/100)
```

