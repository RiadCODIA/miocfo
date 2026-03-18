

## Plan: Add ScrollArea to Deadline List and Overdue Tables

### What
Wrap the deadline list (`DeadlineList.tsx` line 120) and overdue entries (`OverdueTable.tsx` line 71) in a `ScrollArea` component with a fixed max height, replacing the raw `overflow-y-auto` approach with the styled Radix scroll bar.

### Changes

1. **`src/components/scadenzario/DeadlineList.tsx`**
   - Import `ScrollArea` from `@/components/ui/scroll-area`
   - Wrap the `<div className="space-y-3">` (line 120) in `<ScrollArea className="max-h-[500px]">` so the list scrolls with a styled scrollbar

2. **`src/components/scadenzario/OverdueTable.tsx`**
   - Import `ScrollArea`
   - Replace the `<div className="space-y-1 max-h-[220px] overflow-y-auto">` (line 71) with `<ScrollArea className="max-h-[220px]">` wrapping an inner `<div className="space-y-1">`

Both will use the project's existing `ScrollArea` component which provides a clean, styled scrollbar.

