

## Plan: Show All Pages with Lock Overlay Instead of Hiding/Redirecting

### Current Behavior
- **Sidebar**: Filters out nav items the user doesn't have access to (`filterItems` hides them completely)
- **ProtectedRoute**: Redirects users to `/dashboard` if they lack access to a route

### New Behavior
- **Sidebar**: Show ALL nav items always, but display a lock icon on inaccessible ones
- **ProtectedRoute**: Instead of redirecting, render the page content with a lock overlay on top
- Users with no subscription see everything locked except always-allowed routes (dashboard, settings, config)
- Users with a plan see unlocked features for their tier, locked for the rest

### Changes

**1. `src/components/layout/Sidebar.tsx`**
- Remove the `filterItems` call — always show all nav items
- Pass a `locked` prop to `NavItemRow` when `!hasFeature(item.id)` and not super admin
- In `NavItemRow`: if locked, show a `Lock` icon instead of navigating, add reduced opacity styling, and prevent navigation (use `onClick` with `e.preventDefault()` or render a `<div>` instead of `<NavLink>`)
- Optionally show a tooltip on locked items: "Upgrade per accedere"

**2. `src/components/auth/ProtectedRoute.tsx`**
- Instead of redirecting when `!canAccessRoute` or `!hasSubscription`, render the children wrapped in a `LockedPageOverlay` component
- The overlay: a semi-transparent blur layer on top of the page content with a lock icon, message ("Funzionalità non disponibile nel tuo piano"), and an "Upgrade" or "Scegli un piano" button linking to the pricing section or settings

**3. New component: `src/components/LockedPageOverlay.tsx`**
- Full-page overlay (`absolute inset-0` with `backdrop-blur`, `z-50`)
- Centered card with Lock icon, title, description, and CTA button
- The actual page content renders behind it (visible but not interactive)

### Section-by-section detail

**Sidebar locked item styling:**
- Opacity reduced to 40%
- Lock icon replaces or appears next to the feature badge
- Cursor changes to `not-allowed`
- Click does nothing (or shows a toast "Upgrade per accedere a questa funzionalità")

**Lock overlay on page:**
- `pointer-events-none` on page content, `pointer-events-auto` on overlay
- Page renders normally behind a frosted glass effect
- CTA button navigates to dashboard or pricing

**Files to modify:**
- `src/components/layout/Sidebar.tsx`
- `src/components/auth/ProtectedRoute.tsx`

**Files to create:**
- `src/components/LockedPageOverlay.tsx`

