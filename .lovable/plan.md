

# Fix Area Economica - Income Statement & Invoice Intelligence

## Problems Found

### 1. Income statement shows zero data (critical bug)
The `useContoEconomico` hook queries invoices with `invoice_type = "emessa"` (issued) and `invoice_type = "ricevuta"` (received), but ALL invoices in the database are stored as `"passive"`. This means the income statement table always shows empty/zero values.

### 2. Bank transactions should NOT be in the income statement
The hook currently fetches `bank_transactions` and mixes them into revenue and costs. The user explicitly wants the income statement to be based ONLY on invoices.

### 3. VAT and taxable amounts are always 0
The AI extraction prompt in `process-invoice` only extracts the total amount. It does not extract the taxable base (imponibile) and VAT amount separately, so `vat_amount` is always 0 in the database.

### 4. AI cannot distinguish issued vs received invoices
The current extraction prompt only asks for supplier name and amount. It does not analyze sender vs recipient headers to determine if the invoice was issued (emessa/active) or received (ricevuta/passive). Currently everything is hardcoded as `"passive"`.

### 5. Scadenzario and Previsioni tabs are duplicates
The user confirms these are copies of the Scadenzario and Budget & Previsioni pages already accessible from the sidebar. They should be removed from Area Economica.

---

## Solution

### Phase 1: Upgrade AI Invoice Extraction (`supabase/functions/process-invoice/index.ts`)

Enhance the AI prompt to extract:
- **Invoice direction**: Determine if the logged-in user/company is the SENDER or RECIPIENT (emessa vs ricevuta)
- **Taxable amount** (imponibile): The base amount before VAT
- **VAT amount**: The actual VAT amount on the invoice
- **VAT rate**: The percentage applied (4%, 10%, 22%, exempt, etc.)
- **Invoice subject/category**: What the invoice is for (goods, services, consulting, transport, maintenance, insurance, etc.)
- **Sender and recipient names**: Both parties on the invoice

Update the database insert to populate:
- `invoice_type`: `"emessa"` or `"ricevuta"` (instead of always `"passive"`)
- `vat_amount`: Actual extracted VAT
- `amount`: Taxable base (imponibile)
- `total_amount`: Grand total including VAT
- `vendor_name`: The supplier (if ricevuta) or blank
- `client_name`: The client (if emessa) or blank
- `extracted_data`: Store full breakdown including VAT rate, subject, sender/recipient

### Phase 2: Fix Income Statement Hook (`src/hooks/useContoEconomico.ts`)

- Query invoices with `invoice_type = "emessa"` for revenue and `invoice_type = "ricevuta"` for costs (these will now match after the AI extraction fix)
- **Remove** all bank transaction fetching and aggregation
- Remove `ricaviMovimenti`, `costiMovimentiPerCategoria`, `costiMovimentiTotali`, `movimentiCategoryNames` from the returned data
- Use `amount` (taxable/imponibile) for income statement rows
- Use `vat_amount` for the IVA section

### Phase 3: Simplify Income Statement UI (`src/components/area-economica/ContoEconomicoTab.tsx`)

- Remove all "Ricavi da movimenti bancari" and "Costi da movimenti bancari" rows
- Remove the `hasMovimenti` logic
- Update description text: "Analisi economica mensile basata su fatture emesse e ricevute"
- Keep revenue from issued invoices, costs from received invoices, personnel costs, IVA section

### Phase 4: Remove duplicate tabs (`src/pages/AreaEconomica.tsx`)

- Remove the "Scadenzario Clienti/Fornitori" tab
- Remove the "Previsioni" tab
- Area Economica will only contain the "Conto Economico" tab (can remove the tab wrapper entirely and just render ContoEconomicoTab directly)
- Delete imports for `ScadenzarioTab` and `PrevisioniTab`

---

## Technical Details

### Updated AI Prompt (process-invoice)

The new prompt will instruct the AI to return:

```text
{
  "invoice_number": "...",
  "invoice_date": "YYYY-MM-DD",
  "sender_name": "Company that ISSUED the invoice",
  "recipient_name": "Company that RECEIVED the invoice",
  "invoice_direction": "emessa" or "ricevuta",
  "subject": "goods/services/consulting/transport/etc.",
  "taxable_amount": 1000.00,
  "vat_rate": 22,
  "vat_amount": 220.00,
  "total_amount": 1220.00
}
```

Since the system cannot know who the logged-in user's company is at extraction time, the default will remain `"ricevuta"` (received invoice), as most uploaded invoices are from suppliers. Users can manually change the type in the Fatture page if needed.

However, the prompt will be enhanced to detect patterns:
- If the invoice has "FATTURA DI VENDITA", "Fattura emessa", or the user's company appears as sender, mark as `"emessa"`
- Otherwise default to `"ricevuta"`

### Database field mapping

| Extracted Field | DB Column | Notes |
|---|---|---|
| taxable_amount | amount | Was previously total, now imponibile |
| vat_amount | vat_amount | Was always 0, now actual VAT |
| total_amount | total_amount | Grand total with VAT |
| invoice_direction | invoice_type | "emessa" or "ricevuta" instead of "passive" |
| sender_name | vendor_name (if ricevuta) or client_name (if emessa) | Contextual mapping |
| subject | extracted_data.subject | Stored in JSONB for categorization |

### Files to modify

| File | Change |
|---|---|
| `supabase/functions/process-invoice/index.ts` | Enhanced AI prompt with VAT, direction, subject extraction; updated DB insert logic |
| `src/hooks/useContoEconomico.ts` | Remove bank transactions; keep invoice-only aggregation |
| `src/components/area-economica/ContoEconomicoTab.tsx` | Remove bank transaction rows; simplify UI |
| `src/pages/AreaEconomica.tsx` | Remove Scadenzario and Previsioni tabs; render ContoEconomicoTab directly |

### Impact on existing data

The 7 existing invoices all have `invoice_type = "passive"` and `vat_amount = 0`. After the fix:
- New uploads will have correct `invoice_type` and `vat_amount`
- Existing invoices can be reprocessed using the existing "Riprocessa" button in the Fatture page, which will re-run AI extraction with the updated prompt
- Until reprocessed, existing invoices won't appear in the income statement (since they have `invoice_type = "passive"`, not `"emessa"` or `"ricevuta"`)

