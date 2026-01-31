
## Goal
Fix the balance parsing in the Enable Banking edge function so that FinecoBank (and other PSD2 banks) balances are correctly read and saved.

## Root Cause Identified
The edge function logs reveal the **exact problem**:

**API returns:**
```json
{"balances":[
  {"balance_type":"ITAV", "balance_amount":{"amount":"9951.52","currency":"EUR"}},
  {"balance_type":"ITBD", "balance_amount":{"amount":"10484.38","currency":"EUR"}}
]}
```

**Code looks for:**
- `"closingBooked"`, `"interimBooked"` for current balance
- `"interimAvailable"`, `"expected"` for available balance

**FinecoBank sends:**
- `"ITAV"` = Interim Available (ISO 20022 code)
- `"ITBD"` = Interim Booked (ISO 20022 code)
- `"FWAV"` = Forward Available

These are **ISO 20022 balance type codes** which are different from the human-readable strings the code currently checks. The real balance of **€10,484.38** is being ignored because the codes don't match.

## Solution
Update the balance parsing logic in both `completeSession()` and `syncAccount()` to recognize **ISO 20022 balance type codes** in addition to the human-readable names:

| ISO Code | Meaning | Map to |
|----------|---------|--------|
| ITBD | Interim Booked | currentBalance |
| CLBD | Closing Booked | currentBalance |
| ITAV | Interim Available | availableBalance |
| CLAV | Closing Available | availableBalance |
| FWAV | Forward Available | availableBalance (fallback) |

## Implementation

### File: `supabase/functions/enable-banking/index.ts`

1. **Update `completeSession()` balance parsing (around line 305-315)**
   - Add ISO 20022 codes: `ITBD`, `CLBD`, `ITAV`, `CLAV`, `FWAV`

2. **Update `syncAccount()` balance parsing (around line 488-496)**
   - Same change: add ISO 20022 codes

### Code Change (both locations)
```typescript
// Current balance: closingBooked, interimBooked, OR ISO codes CLBD, ITBD
if (["closingBooked", "interimBooked", "CLBD", "ITBD"].includes(balance.balance_type)) {
  currentBalance = amount;
}
// Available balance: interimAvailable, expected, OR ISO codes ITAV, CLAV, FWAV
if (["interimAvailable", "expected", "ITAV", "CLAV", "FWAV"].includes(balance.balance_type)) {
  availableBalance = amount;
}
```

## Expected Result
After this fix:
- EUR account: **€10,484.38** current, **€9,951.52** available
- Other currency accounts (USD, GBP, CHF): correctly show 0.00 as the API confirms
- Status remains "Attivo" as already working

## Files to Modify
- `supabase/functions/enable-banking/index.ts` (2 locations)

## Verification Steps
1. Deploy the edge function
2. Click "Sincronizza" on the EUR FinecoBank account
3. Verify the balance shows **€10,484.38** instead of €0.00
