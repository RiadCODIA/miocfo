

## Plan: Add Invoice Type Selection on Upload + Fix IVA Display

### Problem
1. When uploading an invoice, there's no prompt asking the user whether the invoice was **emessa** (issued by them) or **ricevuta** (received from a supplier). The AI guesses the direction but can get it wrong, causing the IVA to appear in the wrong column (debito vs credito).
2. If a supplier invoice is incorrectly classified as "emessa", its VAT goes to "IVA a debito" instead of "IVA a credito".

### Solution

**1. Add an invoice type selection dialog before upload processing**

**File: `src/components/fatture/InvoiceTypeDialog.tsx`** (new)
- A simple dialog/modal that appears after file selection but before upload starts
- Two clear options: "Fattura emessa (vendita)" and "Fattura ricevuta (acquisto)"
- Optionally a third: "Autofattura"
- The selected type is passed along to the upload function

**2. Update `src/pages/Fatture.tsx`**
- When `handleUpload` is called with files, instead of immediately uploading, show the `InvoiceTypeDialog`
- Store the pending files in state
- On dialog confirm, pass the selected type to the upload mutation
- The upload mutation sends the `invoiceType` hint to the edge function

**3. Update `src/components/fatture/InvoiceUploadZone.tsx`**
- No changes needed — it just calls `onUpload(files)` which triggers the dialog

**4. Update `supabase/functions/process-invoice/index.ts`**
- Accept an optional `invoiceType` field in the JSON body
- If provided, override the AI's `invoice_direction` with the user's choice instead of guessing
- This ensures correct classification for IVA calculations

### Flow

```text
User drops file → InvoiceTypeDialog opens → User picks "Ricevuta" 
→ Upload starts with invoiceType="ricevuta" → Edge function uses it 
→ Invoice saved as ricevuta → IVA appears in "IVA a credito" ✓
```

### Files to modify
- `src/pages/Fatture.tsx` — add dialog state, intercept upload flow
- `supabase/functions/process-invoice/index.ts` — accept and use `invoiceType` override

### Files to create
- `src/components/fatture/InvoiceTypeDialog.tsx` — type selection dialog

