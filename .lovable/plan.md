

# Fix Enable Banking Integration - Wrong Signature Error

## Problem Identified

The Enable Banking API is returning a `401 - Wrong signature` error when trying to fetch the list of banks (ASPSPs). After reviewing the edge function code and the official Enable Banking documentation, I found the root cause.

## Root Cause

The JWT (JSON Web Token) used for authentication has an **incorrect `iss` (issuer) claim**:

| Field | Current Value | Required Value |
|-------|---------------|----------------|
| `iss` | `"enablebanking"` | `"enablebanking.com"` |

According to Enable Banking's documentation, the JWT body must contain:
- `"iss": "enablebanking.com"` (always the same)
- `"aud": "api.enablebanking.com"` (this is correct in current code)

## Solution

Update the `createJWT` function in the edge function to use the correct issuer value.

## File to Modify

```text
supabase/functions/enable-banking/index.ts
```

## Technical Change

**Line 44 - Change from:**
```javascript
iss: "enablebanking",
```

**To:**
```javascript
iss: "enablebanking.com",
```

## Additional Notes

1. The secrets `ENABLE_BANKING_APP_ID` and `ENABLE_BANKING_PRIVATE_KEY` are already configured correctly
2. The rest of the JWT structure (header with `kid`, payload with `aud`, `iat`, `exp`) follows the correct format
3. Once this fix is deployed, the API should successfully authenticate and return the list of Italian banks

## Expected Result

After this fix:
- Selecting "Italia" as the country will fetch and display available Italian banks
- Users will be able to proceed with bank connection via Enable Banking OAuth flow

