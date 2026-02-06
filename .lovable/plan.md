

# Migrate from Enable Banking to A-Cube Open Banking API

## Summary
Replace the Enable Banking integration with A-Cube's Open Banking API for PSD2-compliant bank account aggregation. A-Cube is an Italian fintech provider offering a simpler REST API with email/password authentication (JWT-based) compared to Enable Banking's RSA key-pair authentication.

## Key Differences Between Providers

| Aspect | Enable Banking | A-Cube |
|--------|---------------|--------|
| Base URL | `api.enablebanking.com` | `ob.api.acubeapi.com` (production) / `ob-sandbox.api.acubeapi.com` (sandbox) |
| Auth | RSA key-pair JWT signing | Email/password login for JWT token |
| Connection Flow | Direct redirect to bank | Business Registry + Connect Request flow |
| Account Model | User-centric | Business Registry (fiscalId) centric |
| Webhook Support | No | Yes (connect, reconnect, payment events) |

## Architecture Changes

### Current Enable Banking Flow
```text
User -> Select Bank -> createSession() -> Bank Redirect -> OAuth Callback -> completeSession() -> Save Accounts
```

### New A-Cube Flow
```text
1. Login to A-Cube API (email/password) -> Get JWT Token
2. Create/Get Business Registry (fiscalId = user's VAT/Tax ID)
3. POST /business-registry/{fiscalId}/connect -> Get redirect URL
4. User completes bank consent in mini-portal
5. Webhook receives "connect" event OR poll for accounts
6. GET /business-registry/{fiscalId}/accounts -> List accounts
7. GET /business-registry/{fiscalId}/transactions -> Get transactions
```

## Implementation Plan

### Phase 1: Configuration and Secrets

#### Required Secrets (to be added via Supabase dashboard)
| Secret Name | Description | Where to Get |
|-------------|-------------|--------------|
| `ACUBE_EMAIL` | A-Cube platform login email | A-Cube account registration |
| `ACUBE_PASSWORD` | A-Cube platform login password | A-Cube account registration |
| `ACUBE_ENV` | Environment: `sandbox` or `production` | Based on deployment stage |

#### Optional Secrets (for webhook verification)
| Secret Name | Description |
|-------------|-------------|
| `ACUBE_WEBHOOK_SECRET` | Webhook signature verification key |

### Phase 2: Database Schema Changes

Update the `bank_accounts` table to support A-Cube's data model:

```sql
-- Add A-Cube specific columns
ALTER TABLE bank_accounts
ADD COLUMN IF NOT EXISTS fiscal_id TEXT,
ADD COLUMN IF NOT EXISTS acube_account_id TEXT;

-- Update source constraint to include 'acube'
ALTER TABLE bank_accounts DROP CONSTRAINT IF EXISTS bank_accounts_source_check;
ALTER TABLE bank_accounts ADD CONSTRAINT bank_accounts_source_check 
  CHECK (provider = ANY (ARRAY['plaid', 'manual', 'enable_banking', 'acube']));
```

### Phase 3: Create A-Cube Edge Function

Create new edge function `supabase/functions/acube-banking/index.ts`:

**Key Actions to implement:**
- `login` - Get JWT token from A-Cube
- `create_business_registry` - Register user's company (fiscalId)
- `connect_request` - Start bank connection flow
- `get_accounts` - List connected accounts
- `get_transactions` - Fetch transactions for an account
- `get_balances` - Fetch account balances
- `remove_connection` - Disconnect account
- `webhook_handler` - Process A-Cube webhooks

**API Endpoints to call:**

| Action | Method | A-Cube Endpoint |
|--------|--------|-----------------|
| Login | POST | `common.api.acubeapi.com/login` |
| Create Business Registry | POST | `/business-registries` |
| Connect Request | POST | `/business-registry/{fiscalId}/connect` |
| List Accounts | GET | `/business-registry/{fiscalId}/accounts` |
| Get Transactions | GET | `/business-registry/{fiscalId}/transactions` |
| Account Balances | GET | `/business-registry/{fiscalId}/accounts/{accountId}/balances` |

### Phase 4: Update Frontend Hook

Modify `src/hooks/useEnableBanking.ts` -> rename to `src/hooks/useBankingIntegration.ts`:

- Update function URL to call new `acube-banking` edge function
- Modify `createSession` to return A-Cube's connect URL
- Update `completeSession` to handle webhook-based connection completion
- Add `fiscalId` (Partita IVA) input to connection flow

### Phase 5: Update UI Components

#### ConnectBankModal.tsx
- Remove Enable Banking bank selector (A-Cube uses its own mini-portal)
- Add Partita IVA (fiscalId) input field for Italian businesses
- Simplify flow: just enter company info -> redirect to A-Cube portal

#### ContiBancari.tsx
- Update provider references from "Enable Banking" to "A-Cube"
- Update help text and descriptions

### Phase 6: Optional - Webhook Handler

Create webhook endpoint to receive A-Cube events:

```typescript
// Handle "connect" event when user completes bank linking
POST /functions/v1/acube-banking-webhook
{
  "fiscalId": "IT12345678901",
  "success": true,
  "updatedAccounts": ["account-id-1", "account-id-2"]
}
```

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/acube-banking/index.ts` | Create (new edge function) |
| `src/hooks/useBankingIntegration.ts` | Create (replaces useEnableBanking.ts) |
| `src/hooks/useEnableBanking.ts` | Delete (replaced by useBankingIntegration.ts) |
| `src/components/conti-bancari/ConnectBankModal.tsx` | Modify (update connection flow) |
| `src/pages/ContiBancari.tsx` | Modify (update references) |
| `src/pages/Privacy.tsx` | Modify (update provider name) |
| `src/pages/Cookies.tsx` | Modify (update provider name) |
| Database migration | Create (add acube columns) |

## Secrets Cleanup

After migration, these Enable Banking secrets can be removed:
- `ENABLE_BANKING_APP_ID`
- `ENABLE_BANKING_PRIVATE_KEY`

## Testing Checklist
1. Register for A-Cube sandbox account at https://docs.acubeapi.com
2. Test JWT login flow
3. Test Business Registry creation with test fiscal ID
4. Test Connect Request flow in sandbox (use country code `XF` for fake banks)
5. Verify accounts are retrieved after connection
6. Test transaction sync
7. Test balance retrieval
8. Test account disconnection

