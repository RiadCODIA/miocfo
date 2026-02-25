

## Fix: Data Not Appearing Without Refresh (Stale Cache After Auth/HMR)

### Root Cause

When the app does a hot-module reload (HMR) after code changes, or when navigating between pages:

1. The `QueryClient` persists in memory with its 2-minute `staleTime` cache
2. During HMR, the auth session briefly becomes unavailable while `AuthProvider` re-initializes
3. React Query fires data fetches **before** the auth session is fully restored
4. Supabase RLS returns **empty results** (no auth = no data)
5. These empty results get cached with a 2-minute `staleTime`
6. When auth restores moments later, React Query does NOT refetch because the cached data isn't "stale" yet
7. Result: user sees empty pages until a full browser refresh clears the cache

### Fix

**File: `src/contexts/AuthContext.tsx`**

Import `useQueryClient` from `@tanstack/react-query` and invalidate all cached queries whenever the auth state changes (login, logout, session restore). This ensures all data-fetching queries immediately re-run with the correct session token.

```typescript
import { useQueryClient } from "@tanstack/react-query";

// Inside AuthProvider:
const queryClient = useQueryClient();

// In onAuthStateChange callback, after setting user/session:
queryClient.invalidateQueries();

// In getSession().then(), after setting user/session:
queryClient.invalidateQueries();
```

This single change forces all queries across the platform (transactions, invoices, dashboard KPIs, etc.) to refetch whenever auth state changes, eliminating stale empty caches.

### Why This Fixes the Whole Platform

- `invalidateQueries()` with no arguments invalidates ALL cached queries
- The realtime sync (`useRealtimeSync`) already handles data changes from the server side
- This addition covers the client-side auth lifecycle (login, logout, HMR, tab focus with expired session)
- No per-hook changes needed -- one fix in AuthContext propagates everywhere

