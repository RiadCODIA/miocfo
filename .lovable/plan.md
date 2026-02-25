

## Fix: IVA Section in Conto Economico

### Issues Identified

1. **VAT not calculated when `vat_amount` is missing**: The hook uses `inv.vat_amount` directly, but many invoices may have `vat_amount = 0` or `null` while having both `total_amount` and `amount` populated. VAT should be computed as `total_amount - amount` as a fallback.

2. **Column labels**: "A credito" and "A debito" must become "IVA a credito" and "IVA a debito".

3. **Remove redundant columns**: "Ricavi", "Costi", and "Differenza" columns should be removed from the table — the table should only show "IVA a credito", "IVA a debito", and "IVA netta".

### Changes

**File: `src/hooks/useContoEconomico.ts`**

Update the query to also fetch `total_amount` alongside `amount` and `vat_amount`. Then compute VAT as:

```typescript
const vat = Number(inv.vat_amount || 0) || (Number(inv.total_amount || 0) - Number(inv.amount || 0));
```

This applies to both the emesse query (line 47 → add `total_amount`) and ricevute query (line 53 → add `total_amount`), and the VAT accumulation lines (99, 133).

**File: `src/components/area-economica/IVASection.tsx`**

- Remove the table columns: "Ricavi", "Costi", "Differenza" (and their data cells)
- Rename "A credito" → "IVA a credito"
- Rename "A debito" → "IVA a debito"
- Keep "IVA netta" as is

The resulting table will have 3 columns: **IVA a credito** | **IVA a debito** | **IVA netta**

