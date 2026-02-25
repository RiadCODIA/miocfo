

## Fix: Profile Name Not Updating in TopBar After Settings Save

### Root Cause

The greeting in `TopBar.tsx` reads `profile?.first_name` from `AuthContext`. But `AuthContext` fetches the profile via a direct Supabase call and stores it in React state (`useState`). When the user saves their name in Settings, `useUpdateProfile` only invalidates the React Query cache key `["profile"]` — which nothing listens to. The `AuthContext` state is never refreshed.

Result: the old `displayName` (email prefix fallback) persists until a full page refresh triggers `fetchProfile` again.

### Fix

**File: `src/contexts/AuthContext.tsx`**

1. Expose `refreshProfile` in the context value — a function that re-calls `fetchProfile` for the current user:

```typescript
// Add to the context interface:
refreshProfile: () => Promise<void>;

// In AuthProvider:
const refreshProfile = async () => {
  if (user) {
    await fetchProfile(user.id);
  }
};

// Add to the Provider value:
refreshProfile,
```

**File: `src/hooks/useProfile.ts`**

2. Call `refreshProfile()` in `onSuccess` of `useUpdateProfile` so the AuthContext state updates immediately:

```typescript
const { user, refreshProfile } = useAuth();

onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["profile"] });
  refreshProfile();
},
```

### Summary
- Adds a `refreshProfile` function to `AuthContext` that re-fetches the profile from Supabase
- Calls it after a successful profile update in Settings
- The TopBar greeting and any other component reading `profile` from AuthContext will update instantly without a page refresh

