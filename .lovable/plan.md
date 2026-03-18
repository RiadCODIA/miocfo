
Goal: fix scrolling inside the Scadenzario cards so users can actually scroll long lists (not just clipped content).

Findings (root cause):
- In both `DeadlineList.tsx` and `OverdueTable.tsx`, `ScrollArea` is inside a wrapper with `max-h + overflow-hidden`, while `ScrollArea` itself uses `h-full`.
- `h-full` needs a parent with explicit height, but the wrapper only has `max-height` (not fixed height), so Radix viewport cannot compute a real scrollable height.
- Result: content gets visually cut by the wrapper, but the scroll viewport is not truly activated.

Implementation plan:
1. `src/components/scadenzario/DeadlineList.tsx`
   - Remove the extra outer wrapper (`max-h-[500px] overflow-hidden`).
   - Give `ScrollArea` a real height directly (e.g. `h-[500px]` plus responsive cap like `max-h-[65vh]`).
   - Keep inner content container (`space-y-3 pr-3`) unchanged.

2. `src/components/scadenzario/OverdueTable.tsx`
   - Remove the extra outer wrapper (`max-h-[220px] overflow-hidden`).
   - Set explicit height on `ScrollArea` directly (e.g. `h-[220px]`).
   - Keep inner rows container (`space-y-1 pr-3`) unchanged.

3. Usability polish
   - Optionally set `type="always"` on these two `ScrollArea` instances so scrollbar visibility is clearer.
   - Keep current styling and spacing to avoid regressions in the card layout.

Validation checklist (end-to-end):
- In `/scadenzario`, wheel/trackpad scroll works inside:
  - “Scadenze” card
  - “Incassi Scaduti” and “Pagamenti Scaduti” cards (when enough rows exist)
- Page scroll and card scroll do not conflict.
- No clipping of the last visible row.
- Behavior verified on desktop and mobile touch scrolling.
