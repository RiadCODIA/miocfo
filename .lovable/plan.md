

## Fix: Transaction Categorization Crash in CategoryModal

### Root Cause

The crash occurs in `CategoryModal.tsx` because of two issues:

1. **Complex children inside `SelectItem`** (lines 188-195): A `<div>` wrapper with nested `<span>` is used inside `SelectItem`. When a value is selected, Radix Select's `SelectValue` tries to clone and render this content in the trigger area, passing refs through. This triggers the "Function components cannot be given refs" warning and can cause a crash, especially when React tries to reconcile the DOM.

2. **Missing `category_type` filtering**: The modal loads ALL active categories (both revenue and expense) but doesn't filter them based on the transaction's direction. The `filteredCategories` logic at lines 142-147 is a no-op (always returns `true`).

### Fix

**File: `src/components/transazioni/CategoryModal.tsx`**

**Change 1** — Add `category_type` to the interface (line 25-30):
```typescript
interface CostCategory {
  id: string;
  name: string;
  cost_type: string;
  cashflow_type: string;
  category_type: string;
}
```

**Change 2** — Add `category_type` to the query (line 80):
```typescript
.select("id, name, cost_type, cashflow_type, category_type")
```

**Change 3** — Fix the `filteredCategories` filter (lines 142-147):
```typescript
const filteredCategories = categories.filter((cat) => {
  if (isIncome) return cat.category_type === "revenue";
  return cat.category_type === "expense";
});
```

**Change 4** — Replace the `<div>` inside `SelectItem` with plain text to fix the ref crash (lines 187-196):
```tsx
{filteredCategories.map((cat) => (
  <SelectItem key={cat.id} value={cat.id}>
    {cat.name}
  </SelectItem>
))}
```

**Change 5** — Remove the "Tipo/Flusso" preview section that references `cost_type` and `cashflow_type` (lines 216-220), since this is no longer meaningful after the flat layout restructuring:
```tsx
{selectedCategory && (
  <div className="text-sm text-muted-foreground bg-muted/30 rounded p-2">
    Categoria selezionata: <span className="font-medium">{selectedCategory.name}</span>
  </div>
)}
```

### Summary
- Removes the `<div>` inside `SelectItem` that caused the ref crash
- Adds proper filtering so income transactions only see revenue categories and expense transactions only see expense categories
- Simplifies the preview section

