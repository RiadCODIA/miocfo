
# Fix: White Screen Freeze After Any Action

## Root Cause

The issue is in `src/hooks/use-toast.ts` on line 6:

```
const TOAST_REMOVE_DELAY = 1000000;  // ~16.6 MINUTES!
```

When a toast is dismissed (e.g., after "Sincronizzazione completata"), the Radix UI `ToastProvider` sets `pointer-events: none` on a wrapper element while the toast animates out and waits to be fully removed from the DOM. With a remove delay of **1,000,000 milliseconds (~16 minutes)**, the dismissed toast sits in the DOM in a "closed" state for that entire time, and the `pointer-events: none` style **blocks all user interaction** with the page -- making it appear frozen/white.

This is confirmed by the session replay which shows `pointer-events` being set to `none` on a container element right after toast notifications are closed.

## Fix

Change `TOAST_REMOVE_DELAY` from `1000000` to a reasonable value (e.g., `1000` ms = 1 second), which gives the close animation enough time to complete before the toast is removed from the DOM.

### File: `src/hooks/use-toast.ts`

**Line 6** -- Change:
```typescript
const TOAST_REMOVE_DELAY = 1000000;
```
To:
```typescript
const TOAST_REMOVE_DELAY = 1000;
```

This single-line change will fix the freeze across the entire application, since every toast notification (sync confirmations, error messages, success alerts) flows through this hook.

## Technical Details

- The Radix `ToastProvider` component manages a "swipe away" region that uses `pointer-events: none` during transitions
- When `DISMISS_TOAST` fires, the toast is marked `open: false` but stays in the toast array until `REMOVE_TOAST` fires after `TOAST_REMOVE_DELAY`
- During this window, the provider's internal state blocks pointer events on the page
- Reducing the delay to 1 second allows the exit animation to complete normally and then immediately cleans up the DOM element, restoring pointer events
