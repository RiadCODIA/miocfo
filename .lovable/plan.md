

## Fix: Center the LockedPageOverlay popup on screen

### Problem
The overlay uses `absolute inset-0` positioning, which centers relative to its nearest positioned parent — not the viewport. If the parent container is offset (e.g., by the sidebar), the popup appears off-center.

### Fix
**File: `src/components/LockedPageOverlay.tsx`** (line 11)

Change `absolute` to `fixed` on the outer div so it covers and centers within the full viewport:

```tsx
// Before
<div className="absolute inset-0 z-50 flex items-center justify-center ...">

// After
<div className="fixed inset-0 z-50 flex items-center justify-center ...">
```

Single-line change, no other modifications needed.

