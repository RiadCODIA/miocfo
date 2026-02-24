
# Fix: White Screen Freeze After Any Action

## Root Cause Analysis

After thorough investigation, I identified **3 interacting bugs** that together cause the screen to freeze white after user actions:

### Bug 1: `useToast` Listener Memory Leak (PRIMARY CAUSE)
In `src/hooks/use-toast.ts` (line 177), the `useEffect` that registers the toast state listener has `[state]` in its dependency array. This means:
- Every time a toast fires, `state` changes
- The effect re-runs, removing and re-adding the listener
- During the gap between remove/add, dispatched events can be lost
- This creates a cascade where the Radix Toast Provider never properly cleans up its `pointer-events: none` style on the viewport, blocking all clicks

### Bug 2: Dual Toast Systems Conflict
Both `<Toaster />` (Radix) and `<Sonner />` are mounted in `App.tsx`. The codebase uses Sonner (`toast` from `sonner`) for most notifications, but the Radix `<Toaster />` is still rendered. The Radix ToastProvider applies `pointer-events: none` to its viewport container, and if any state desync occurs (due to Bug 1), it can permanently block interaction.

### Bug 3: Route Conflict on `/piani`
In `App.tsx`, there are TWO routes for `/piani`:
- Line 79: Public `<PianiPricing />` 
- Lines 147-155: Protected `<Piani />` (Super Admin)

React Router matches the first one, so the sidebar "Piani" link for super admins loads the public pricing page outside `MainLayout`, causing a layout break (white screen).

## Fix Plan

### 1. Fix `useToast` listener leak
**File:** `src/hooks/use-toast.ts`
- Change the `useEffect` dependency from `[state]` to `[]` (empty array)
- The listener should only be registered once on mount and cleaned up on unmount

### 2. Remove the unused Radix Toaster
**File:** `src/App.tsx`
- Remove `<Toaster />` (Radix) since the app exclusively uses Sonner for notifications
- Remove the import of `Toaster` from `@/components/ui/toaster`
- This eliminates the `pointer-events` conflict entirely

### 3. Fix the `/piani` route conflict
**File:** `src/App.tsx`
- Rename the public pricing route from `/piani` to `/pricing` (or keep as-is and rename the admin one)
- Update the super admin sidebar link to `/admin-piani`
- Update `LandingHeader.tsx` and `LandingFooter.tsx` if needed

**File:** `src/components/layout/Sidebar.tsx`
- Update the super admin "Piani" nav item path accordingly

### 4. Safety: Add `pointer-events: auto` guard to MainLayout
**File:** `src/components/layout/MainLayout.tsx`
- Add a `pointer-events-auto` class to the main content area as a defensive measure, so even if a portal overlay misbehaves, the main content stays interactive

## Technical Details

```text
useEffect dependency fix:

Before:  useEffect(() => { ... }, [state]);   // re-runs on every toast
After:   useEffect(() => { ... }, []);         // runs once on mount
```

```text
Route conflict resolution:

Before:  /piani -> PianiPricing (public)     [WINS - first match]
         /piani -> Piani (protected admin)   [NEVER REACHED]

After:   /pricing -> PianiPricing (public)
         /piani   -> Piani (protected admin)
```

## Files to Modify
1. `src/hooks/use-toast.ts` - Fix listener dependency
2. `src/App.tsx` - Remove Radix Toaster, fix route conflict
3. `src/components/layout/Sidebar.tsx` - No change needed (already points to `/piani`)
4. `src/components/landing/LandingHeader.tsx` - Update pricing link to `/pricing`
5. `src/components/landing/LandingFooter.tsx` - Update pricing link to `/pricing`
6. `src/components/layout/MainLayout.tsx` - Add `pointer-events-auto` safety class
