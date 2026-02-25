

## Plan: Dashboard Improvements

### Issue 1: Add "MoM" label with info tooltip to the Liquidity Hero Card

**Current state**: The percentage badge next to the total balance just shows e.g. `+2.5%` with no explanation of what it refers to.

**Changes to `src/components/dashboard/LiquidityHeroCard.tsx`**:
- Add a short "MoM" label next to the percentage badge
- Add an info icon (`Info` from lucide-react) that, on hover, shows a tooltip explaining: *"Rappresenta la variazione percentuale del saldo complessivo dei conti correnti rispetto al mese precedente. Nello specifico: Liquidità Totale = Somma dei saldi di tutti i conti correnti."*
- Use the existing `Tooltip` / `TooltipTrigger` / `TooltipContent` / `TooltipProvider` components from `src/components/ui/tooltip.tsx`

The result will look like: `+2.5% MoM (i)` where the `(i)` icon triggers the tooltip on hover.

### Issue 2: "Conti Collegati" showing 0 instead of 3

**Root cause**: The query in `Dashboard.tsx` uses a static `queryKey: ["connected-accounts-count"]` that does not depend on the authenticated user. When the app loads (or the query runs before auth is fully resolved), it caches the result as `0`. Subsequent navigations reuse the stale cache.

**Changes to `src/pages/Dashboard.tsx`**:
- Add the authenticated user's ID to the query key so it re-fetches when the user changes: `queryKey: ["connected-accounts-count", user?.id]`
- Import and use `useAuth()` from `AuthContext` to get the current user
- Add `enabled: !!user` to prevent the query from running before authentication is ready

This ensures the query only runs when the user is authenticated, and re-runs if the user changes.

### Technical Details

**Files modified**:
1. `src/components/dashboard/LiquidityHeroCard.tsx` — Add "MoM" text + Info icon with Tooltip
2. `src/pages/Dashboard.tsx` — Fix connected accounts query to depend on auth state

**No new files or dependencies needed.** Uses existing Tooltip UI components and AuthContext.

