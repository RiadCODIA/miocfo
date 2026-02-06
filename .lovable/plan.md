
## Fix A-Cube Business Registry Already Exists Error

### Problem
The A-Cube API returns a `422 Unprocessable Entity` error when trying to create a business registry with a `fiscalId` and `email` that already exist in the system. The current error handling only catches `409 Conflict` errors, so the 422 error propagates and crashes the connection flow.

**Error message:**
```
A-Cube API error: 422 - fiscalId: This value is already used. email: This value is already used.
```

### Root Cause
The `createBusinessRegistry` function tries to POST a new registry every time. When the registry already exists:
- A-Cube may return 409 (Conflict) or 422 (Unprocessable Entity) depending on the validation stage
- Current code only handles 409, not 422

### Solution
Update the `createBusinessRegistry` function to:
1. First check if a business registry already exists by doing a GET request
2. If it exists, try to enable it via PATCH
3. Only create a new one if it doesn't exist
4. Handle both 409 and 422 errors as "already exists" scenarios

### Technical Changes

**File: `supabase/functions/acube-banking/index.ts`**

Rewrite the `createBusinessRegistry` function:

```text
async function createBusinessRegistry(fiscalId: string): Promise<{ fiscalId: string; status: string }> {
  console.log(`[A-Cube] Creating/getting business registry for: ${fiscalId}`);
  
  // First, try to GET the existing business registry
  try {
    const existing = await acubeRequest(`/business-registry/${fiscalId}`, "GET");
    console.log("[A-Cube] Business registry already exists:", existing);
    
    // If it exists but is not enabled, try to enable it
    if (existing && typeof existing === "object" && "enabled" in existing && !existing.enabled) {
      try {
        await acubeRequest(`/business-registry/${fiscalId}`, "PATCH", { enabled: true });
        console.log("[A-Cube] Business registry enabled");
      } catch (patchError) {
        console.log("[A-Cube] Could not enable business registry:", patchError);
      }
    }
    return { fiscalId, status: "exists" };
  } catch (getError) {
    // If GET returns 404, the registry doesn't exist - we need to create it
    if (getError instanceof Error && getError.message.includes("404")) {
      console.log("[A-Cube] Business registry doesn't exist, creating new one");
      
      try {
        const result = await acubeRequest("/business-registry", "POST", {
          fiscalId: fiscalId,
          email: `business-${fiscalId}@miocfo.app`, // Unique email per business
          businessName: `Business ${fiscalId}`,
          enabled: true,
        });
        console.log("[A-Cube] Business registry created:", result);
        return { fiscalId, status: "created" };
      } catch (createError) {
        // Handle edge cases where registry was created between GET and POST
        if (createError instanceof Error && 
            (createError.message.includes("409") || createError.message.includes("422"))) {
          console.log("[A-Cube] Business registry was created in the meantime");
          return { fiscalId, status: "exists" };
        }
        throw createError;
      }
    }
    throw getError;
  }
}
```

### Key Improvements
1. **Check first, create later**: GET the registry before trying to POST
2. **Unique email per business**: Use fiscalId in the email to avoid duplicates (`business-{fiscalId}@miocfo.app`)
3. **Handle all conflict scenarios**: Catch both 409 and 422 as "already exists"
4. **Enable if disabled**: If registry exists but is disabled, enable it

### Expected Behavior After Fix
1. User enters Partita IVA and clicks "Continua"
2. Edge function checks if business registry exists
3. If exists: enable it (if needed) and proceed
4. If not exists: create it with unique email
5. Connection flow continues to A-Cube redirect
