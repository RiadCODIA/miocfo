

## Update All Remaining "A-Cube" References to "Enable Banking"

### Overview
Several user-facing error messages and code comments still reference "A-Cube" instead of "Enable Banking". This plan fixes all remaining instances in frontend code.

### Changes

**1. `src/hooks/useBankingIntegration.ts`**
- Line 70: Change error message from `"Errore nella chiamata A-Cube"` to `"Errore nella chiamata Enable Banking"`

**2. `src/components/conti-bancari/ConnectBankModal.tsx`**
- Line 40: Update comment from `"Handle A-Cube callback"` to `"Handle Enable Banking callback"`
- Line 116: Rename function from `handleOpenAcubePortal` to `handleOpenBankingPortal`
- Line 241: Update `onClick={handleOpenAcubePortal}` to `onClick={handleOpenBankingPortal}`

These are the only remaining user-facing or near-user-facing "A-Cube" references in the frontend. Internal variable names like `callAcubeFunction`, database fields like `acube_account_id`, and the Edge Function code remain unchanged as they are backend/infrastructure concerns.

### What stays unchanged
- Edge Function (`supabase/functions/acube-banking/index.ts`) -- backend only
- `callAcubeFunction` variable name in hooks -- internal code, not shown to users
- `acube_account_id` fields -- database schema
- Provider value `"acube"` in source mappings -- internal identifier (already maps to "Enable Banking" label)

