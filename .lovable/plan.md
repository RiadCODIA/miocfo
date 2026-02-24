

## Plan: Cleaner Bar Chart Style for "Incassi vs Pagamenti"

### Reference Analysis

The reference image shows a "Flusso di cassa" chart with these key visual characteristics:

- **Thin, narrow bars** (not wide/chunky) side-by-side for Entrate (green) and Uscite (coral/salmon)
- **Softer, more pastel colors**: mint green for income, soft coral/salmon for expenses
- **Dashed/striped bars** for projected data (Entrate previste, Uscite previste)
- **Clean horizontal grid lines** with no vertical grid lines
- **Pink dashed line** for the net cash flow trend
- **Light background**, minimal chrome
- **Legend at the top** with colored indicators

### Changes to `src/components/dashboard/IncomeExpenseChart.tsx`

1. **Narrower bars**: Set `barSize={14}` (or similar small value) and increase `barGap` for spacing between paired bars
2. **Softer colors**: Change from saturated green/red to softer mint green (`#2dd4a0` / `hsl(160, 64%, 52%)`) and soft coral (`#f87171` / salmon-ish tone) matching the reference
3. **Bar radius**: Keep rounded tops `[3, 3, 0, 0]` for a polished look
4. **Grid**: Keep `vertical={false}`, use lighter grid stroke color
5. **Saldo line**: Change to a pink/magenta dashed line (`strokeDasharray="6 4"`) matching the reference's trend line style
6. **Legend positioning**: Move legend above the chart or keep at bottom but style consistently

### Technical Details

- Modify `<Bar>` components: add `barSize={14}`, update `fill` colors
- Modify `<Line>` for saldo: change stroke to pink/magenta, add `strokeDasharray`
- Adjust `CartesianGrid` stroke to be lighter
- Optionally add `barCategoryGap` on `ComposedChart` for better spacing

No new files or dependencies needed. Single file edit to `IncomeExpenseChart.tsx`.

