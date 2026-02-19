

# Fatture Page - Subtitle Fix and Supplier Summary Repositioning

## Change 1: Update Subtitle

The current subtitle at line 502 reads "Carica e gestisci le fatture ricevute" (only received invoices). It will be changed to cover both received and issued invoices:

**"Carica e gestisci le fatture ricevute ed emesse"**

**File**: `src/pages/Fatture.tsx` (line 502)

---

## Change 2: Move Supplier Summary to Bottom + Add Filter

Currently the "Riepilogo per Fornitore" card sits between the stats cards and the upload zone (lines 624-653). It needs to:

1. **Move to the bottom** of the page, after the Invoice Table
2. **Rename** to "Riepilogo per Fornitore / Cliente" since it covers both invoice types
3. **Add a filter dropdown** allowing the user to choose between:
   - "Tutti" (all suppliers/customers)
   - Individual supplier/customer names from the invoice data
4. **Show all entries** (remove the `.slice(0, 5)` limit), filtered by the selected value

The summary will dynamically group by `vendor_name` for expense invoices and `client_name` for income invoices (already stored in the `supplier` field of the transformed invoice).

### New Layout Order

```text
1. Header + subtitle
2. Upload progress bar (when active)
3. Stats cards (4 KPIs)
4. Upload Zone
5. Invoice Table
6. Supplier/Customer Summary (with filter) <-- moved here
7. Modals
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Fatture.tsx` | Update subtitle text; move Supplier Summary card after InvoiceTable; add a `Select` dropdown to filter by specific supplier/customer; remove 5-item limit; rename section title |

## Technical Details

- Add state: `const [supplierFilter, setSupplierFilter] = useState<string>("all")`
- Build full supplier list from `supplierSummary` keys for the dropdown options
- Filter `topSuppliers` by selected value (or show all if "all")
- The dropdown will be placed inline next to the section title

