

## Issues

### 1. IVA Calculation is Wrong
In `IVASection.tsx`, the current logic only shows the **net** difference as either "a credito" OR "a debito" (one is always zero). In Italian accounting:
- **IVA a debito** = total VAT on issued invoices (`ivaRicavi`) — always shown
- **IVA a credito** = total VAT on received invoices (`ivaCosti`) — always shown  
- **IVA netta** = IVA a debito − IVA a credito (positive = you owe the state, negative = credit)

**Fix in `IVASection.tsx`**: Replace the incorrect conditional logic with direct display of `totalIvaRicavi` as "IVA a debito", `totalIvaCosti` as "IVA a credito", and `totalIvaRicavi - totalIvaCosti` as "IVA netta".

### 2. Remove "Incassi", "Bonifici", "Altri incassi" from Revenue Rows
These are revenue categories stored in the `cost_categories` table that shouldn't appear in the P&L. They represent payment methods, not economic revenue lines.

**Fix in `useContoEconomico.ts`**: Filter out these categories from `revenueCategories` before building the P&L data, using a name-based exclusion list: `["incassi", "bonifici", "altri incassi"]`. Invoices assigned to these excluded categories will fall back to "Altri ricavi e proventi" (existing fallback logic).

---

**Files to modify**: `src/components/area-economica/IVASection.tsx`, `src/hooks/useContoEconomico.ts`

