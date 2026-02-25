

## Fix: Enable Revenue Category Selection for Issued Invoices (Emessa)

### Problem
The invoice table currently hides the category dropdown for "emessa" (issued) invoices (line 226 of `InvoiceTable.tsx`: `normalizedType !== 'emessa'`). This means users cannot categorize their revenue invoices. The Income Statement (Conto Economico) already supports revenue categories ("Ricavi delle vendite", "Ricavi delle prestazioni", "Altri ricavi e proventi") but invoices cannot be assigned to them from the Fatture page.

### Current State
- Database has 3 revenue categories: Ricavi delle vendite, Ricavi delle prestazioni, Altri ricavi e proventi
- The Conto Economico hook already falls back uncategorized emessa invoices to "Altri ricavi e proventi"
- The Fatture page fetches ALL categories without distinguishing revenue vs expense
- The InvoiceTable completely hides the dropdown for emessa invoices

### Plan

**File: `src/pages/Fatture.tsx`** -- Split the category query into two: one for expense, one for revenue categories, and pass both to the table with `category_type` info.

- Modify the `cost-categories-for-invoices` query to include `category_type` in the SELECT
- Pass the full category list (with type) to `InvoiceTable`

**File: `src/components/fatture/InvoiceTable.tsx`** -- Enable the category dropdown for all invoice types, filtering options by type.

- Update the `CostCategory` interface to include `category_type`
- Remove the `normalizedType !== 'emessa'` guard on line 226
- Filter displayed categories: show only `category_type === 'revenue'` for emessa invoices, only `category_type === 'expense'` for ricevuta/autofattura

### Technical Details

**InvoiceTable.tsx changes:**
```typescript
// Updated interface
export interface CostCategory {
  id: string;
  name: string;
  category_type?: string;
}

// In the category cell, replace the emessa guard with type-based filtering:
const filteredCategories = categories.filter(cat => 
  normalizedType === 'emessa' 
    ? cat.category_type === 'revenue' 
    : cat.category_type === 'expense'
);
// Show dropdown if filteredCategories.length > 0
```

**Fatture.tsx changes:**
```typescript
// Add category_type to the query SELECT
.select('id, name, category_type')
```

This ensures:
- Emessa invoices show: Ricavi delle vendite, Ricavi delle prestazioni, Altri ricavi e proventi
- Ricevuta/Autofattura invoices show: only expense categories
- Uncategorized emessa invoices continue to fall back to "Altri ricavi e proventi" in the Conto Economico

