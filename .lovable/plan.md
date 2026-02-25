

## Scadenzario: Split Overdue Card into Two Tables + Chart Reactivity

### Current State
- A single summary card "Scadenze Scadute" shows combined overdue count/amount
- The chart already differentiates solid (paid/collected) vs transparent (pending) bars
- The chart uses `useAccrualForecast` which reads `payment_status` from invoices

### Changes

#### 1. Replace "Scadenze Scadute" summary card with two overdue tables

**File: `src/pages/Scadenzario.tsx`**

Replace the third summary card (lines 99-112, "Scadenze Scadute") with two side-by-side cards below the summary row:
- **"Incassi Scaduti"** — lists overdue deadlines of type `incasso` (green icon, shows each entry with amount and due date)
- **"Pagamenti Scaduti"** — lists overdue deadlines of type `pagamento` (red icon, shows each entry with amount and due date)

Each card will be a compact table/list showing: description, due date, and amount. Include a "complete" action button on each row.

#### 2. Update `useDeadlinesSummary` to return split overdue data

**File: `src/hooks/useDeadlines.ts`**

Extend the summary return to include:
- `overdueIncassi`: array of overdue receipt entries (type, amount, title/description, dueDate, id, source, invoiceId)
- `overduePagamenti`: array of overdue payment entries

This replaces the simple `overdueCount` / `overdueAmount` with structured lists.

#### 3. Create new component for overdue tables

**File: `src/components/scadenzario/OverdueTable.tsx`** (new)

A reusable component that renders a compact list of overdue deadlines with:
- Title/description column
- Due date column
- Amount column (green for incassi, red for pagamenti)
- Complete button (checkmark) that calls `useCompleteDeadline`

Props: `title`, `entries`, `type` ("incasso" | "pagamento"), `emptyMessage`

#### 4. Chart reactivity

The chart (`LiquidityForecastChart` + `useAccrualForecast`) already reads `payment_status` from invoices and splits data into solid (paid) vs transparent (pending) bars. When a user completes a deadline via the list or the overdue tables, the `useCompleteDeadline` mutation already invalidates `accrual-forecast` queries, so the chart updates automatically.

The existing bar colors (green solid for collected revenue, green transparent for pending revenue, red solid for paid costs, red transparent for pending costs) match the requested "thin candle" style with solid = completed and transparent = to be completed. No chart code changes needed.

### Layout

```text
┌─────────────────┐ ┌─────────────────┐ 
│ Incassi Previsti│ │Pagamenti Progr. │
└─────────────────┘ └─────────────────┘

┌─────────────────┐ ┌─────────────────┐
│ Incassi Scaduti │ │Pagamenti Scaduti│
│ (overdue table) │ │ (overdue table) │
└─────────────────┘ └─────────────────┘

┌─────────────────┐ ┌─────────────────┐
│ Scadenze (list) │ │ Previsione per  │
│                 │ │ Competenza      │
└─────────────────┘ └─────────────────┘
```

### Files to modify
- `src/hooks/useDeadlines.ts` — extend summary to return overdue entries split by type
- `src/pages/Scadenzario.tsx` — replace third card with two overdue table cards
- `src/components/scadenzario/OverdueTable.tsx` — new compact overdue list component

