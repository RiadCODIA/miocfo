
## Rename "A-Cube" to "Enable Banking" in the UI

### Overview
Replace all user-facing references of "A-Cube" with "Enable Banking" across the frontend components. The backend Edge Function and internal variable names will keep their current naming (since they reference A-Cube API infrastructure), but all text shown to users will say "Enable Banking".

### Changes

**1. `src/components/conti-bancari/ConnectBankModal.tsx`**
- Line 100: `"sandbox A-Cube"` -> `"sandbox Enable Banking"`
- Line 111: `"Impossibile inizializzare A-Cube"` -> `"Impossibile inizializzare Enable Banking"`
- Line 147: `"Collega con A-Cube"` -> `"Collega con Enable Banking"`
- Line 154: `"portale A-Cube"` -> `"portale Enable Banking"`
- Line 196: `"portale A-Cube"` -> `"portale Enable Banking"`
- Line 236: `"Powered by A-Cube"` -> `"Powered by Enable Banking"`

**2. `src/components/conti-bancari/BankAccountCard.tsx`**
- Line 108: Provider label `"A-Cube"` -> `"Enable Banking"` for `acube` source
- Line 234: Debug label `"A-Cube Account ID"` -> `"Enable Banking Account ID"`

**3. `src/pages/ContiBancari.tsx`**
- Line 99: `"tramite A-Cube"` -> `"tramite Enable Banking"`
- Line 123: `"tramite A-Cube"` -> `"tramite Enable Banking"`

### What stays unchanged
- Edge Function code (`supabase/functions/acube-banking/index.ts`) -- internal/backend, not user-facing
- Hook variable names (`callAcubeFunction`, etc.) -- code internals
- Database column names (`acube_account_id`) -- schema
- Environment variable names (`ACUBE_*`) -- infrastructure
