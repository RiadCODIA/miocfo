

# Fix Budget Chart: Proper Solid vs Dashed Candle Styling

## Problem
The chart currently uses Recharts' `strokeDasharray` property on `<Bar>`, but this renders as a barely-visible dashed outline on the SVG rectangle. The result doesn't match the requirement of clearly distinct solid bars (actuals) vs. transparent dashed bars (expected from invoices).

## Solution
Use a **custom bar shape** (`shape` prop) for the "expected" bars to render a proper dashed-border rectangle with transparent fill. This gives full SVG control over how each bar looks.

## Changes

### File: `src/pages/BudgetPrevisioni.tsx`

1. **Add a `DashedBar` custom shape component** that renders an SVG `<rect>` with:
   - `fill` at 15-20% opacity (semi-transparent)
   - `stroke` with `strokeDasharray="6 3"` for clearly visible dashed borders
   - `strokeWidth={1.5}` for visibility

2. **Update the 4 `<Bar>` components**:
   - **Ricavi Effettivi**: solid green fill (`hsl(142, 71%, 45%)`), no stroke changes needed
   - **Ricavi Previsti**: use `shape={<DashedBar color="hsl(142, 71%, 45%)" />}` -- transparent green with dashed border
   - **Costi Effettivi**: solid red fill (`hsl(0, 84%, 60%)`), no stroke changes needed
   - **Costi Previsti**: use `shape={<DashedBar color="hsl(0, 84%, 60%)" />}` -- transparent red with dashed border

3. **Adjust bar sizing**: reduce `barSize` to `10-12` for thinner candles as requested, and increase `barGap` slightly for visual clarity.

4. **Update Legend** to use custom icon renderers so the legend swatches also show dashed vs. solid distinction.

### Technical Detail: DashedBar Component

```tsx
const DashedBar = ({ x, y, width, height, color }: any) => {
  if (!height || height === 0) return null;
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={color}
      fillOpacity={0.18}
      stroke={color}
      strokeWidth={1.5}
      strokeDasharray="6 3"
      rx={2}
      ry={2}
    />
  );
};
```

This approach gives pixel-perfect control over the dashed appearance while keeping the standard Recharts data binding.

