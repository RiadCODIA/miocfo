

# Fix Invoice Category Suggestions

## Problem

Two issues with invoice categorization:

1. **AI auto-categorization uses a hardcoded English keyword map** (`consulting` -> `Servizi professionali`, `goods` -> `Forniture`, etc.) instead of reading the actual categories from the database and intelligently matching based on invoice content. This produces incorrect or missing categories.

2. **The category dropdown shows all expense categories for every invoice type**, including "emessa" (issued/revenue) invoices which should not have expense categories assigned.

## Solution

### 1. Edge Function: Smart AI Categorization (`supabase/functions/process-invoice/index.ts`)

**Remove** the hardcoded `SUBJECT_CATEGORY_MAP` and the generic `subject` field from the AI prompt.

**Instead**, fetch all active `cost_categories` from the database (with their IDs and names), and include them directly in the AI prompt. Ask the AI to pick the best matching category by name based on what it reads in the invoice.

```text
Current flow:
  AI extracts subject="consulting" -> map to "Servizi professionali" -> lookup ID

New flow:
  Fetch categories from DB -> include in AI prompt as a list ->
  AI returns category_name="Servizi professionali" directly -> lookup ID
```

Changes to `resolveCategoryId`:
- Accept a list of categories instead of using the hardcoded map
- Match by name from AI response

Changes to the AI prompt:
- Remove the `subject` field with English keywords
- Add a `category_name` field with instruction: "Pick the best match from this list: [Affitto e utenze, Marketing, Forniture, Servizi professionali, Tecnologia e software, Viaggi e trasferte, Assicurazioni, Imposte e tasse, Altro]. If none match well, use 'Altro'."
- Only ask for category on "ricevuta" invoices

### 2. Frontend: Filter Categories by Invoice Type (`src/components/fatture/InvoiceTable.tsx`)

- For "ricevuta" and "autofattura" invoices: show all expense categories (current behavior)
- For "emessa" invoices: hide the category dropdown entirely (revenue doesn't need expense categorization -- revenue is tracked as a total from issued invoices in the Conto Economico)

### 3. Frontend: Pass Categories to Edge Function (`src/pages/Fatture.tsx`)

No changes needed here -- the edge function will fetch categories server-side.

## Technical Details

### Edge Function Changes

```text
1. Remove SUBJECT_CATEGORY_MAP constant
2. Update resolveCategoryId to accept category list and AI-suggested name
3. Before calling AI, fetch cost_categories from DB
4. Update AI prompt to include actual category names as options
5. Parse category_name from AI response instead of subject
```

### InvoiceTable Changes

```text
1. Pass invoice type info to category cell rendering
2. Only show category Select for ricevuta/autofattura invoices
3. For emessa invoices, show "--" or nothing
```

## Files to Modify

- `supabase/functions/process-invoice/index.ts` -- AI prompt and category resolution
- `src/components/fatture/InvoiceTable.tsx` -- filter category dropdown by invoice type

