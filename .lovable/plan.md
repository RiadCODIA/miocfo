
# Fix White Screen Freezes and Add Real-Time Updates Across the Entire Platform

## Problem
When any action is performed (creating, updating, deleting records), the screen freezes to a white page, requiring a manual refresh. The current `useRealtimeSync` hook only covers 6 tables, but the platform has many more data tables and query keys that need real-time synchronization.

## Root Causes Identified

1. **Incomplete Realtime Coverage**: The `useRealtimeSync` hook subscribes to `bank_accounts`, `bank_transactions`, `invoices`, `deadlines`, `budgets`, and `alerts` -- but misses `profiles`, `employees`, `cost_categories`, `revenue_centers`, `vat_rates`, `notification_preferences`, `categorization_rules`, and `companies`.

2. **Missing Query Key Invalidations**: Even for covered tables, some query keys are not invalidated. For example, when `bank_transactions` changes, query keys like `cash-flow-data`, `cash-flow-kpis`, `budget-comparison`, `budget-variance-summary`, `contoeconomico`, and `product-margins` are not invalidated.

3. **ContiBancari uses local state instead of React Query**: The `useBankingIntegration` hook manages accounts in local `useState` instead of React Query cache. When realtime events fire and invalidate query keys, this page does not benefit because it fetches data imperatively via `fetchAccounts()`.

4. **Alerts query key mismatch**: The realtime hook invalidates `["unread-alerts"]` but the `useAlerts` hook uses `["alerts-count"]` and `["alerts"]`.

## Plan

### Step 1: Expand `useRealtimeSync` to cover all tables and query keys

Update `src/hooks/useRealtimeSync.ts` to subscribe to all relevant tables:

- **`profiles`** -- invalidate `["profile"]`
- **`employees`** -- invalidate `["employees"]`
- **`cost_categories`** -- invalidate `["cost-categories"]`, `["category-analysis"]`
- **`revenue_centers`** -- invalidate `["revenue-centers"]`
- **`vat_rates`** -- invalidate `["vat-rates"]`
- **`notification_preferences`** -- invalidate `["notification-preferences"]`
- **`categorization_rules`** -- invalidate `["categorization-rules"]`
- **`companies`** -- invalidate `["companies"]`
- **`company_financials`** -- invalidate `["company-financials"]`, `["all-company-financials"]`, `["company-kpis"]`, `["aggregated-kpis"]`

Also add missing invalidations for already-subscribed tables:

- **`bank_transactions`** -- add: `["cash-flow-data"]`, `["cash-flow-kpis"]`, `["cash-flow-vs-budget"]`, `["budget-comparison"]`, `["budget-variance-summary"]`, `["contoeconomico"]`, `["product-margins"]`, `["liquidity-forecast"]`, `["deadlines-summary"]`
- **`bank_accounts`** -- add: `["bank-accounts-list"]`, `["cash-flow-data"]`, `["liquidity-forecast"]`
- **`invoices`** -- add: `["invoices-for-deadlines"]`, `["deadlines"]`, `["deadlines-summary"]`, `["liquidity-forecast"]`
- **`deadlines`** -- add: `["deadlines-summary"]`, `["liquidity-forecast"]`
- **`budgets`** -- add: `["budget-comparison"]`, `["budget-variance-summary"]`
- **`alerts`** -- fix: replace `["unread-alerts"]` with `["alerts-count"]`

### Step 2: Refactor ContiBancari to use React Query

Convert the `useBankingIntegration` hook's `fetchAccounts` to use React Query so it benefits from automatic cache invalidation. Alternatively, add a simpler approach: create a `useBankAccountsQuery` hook using `useQuery` and use it in `ContiBancari.tsx`, while keeping the imperative functions for mutations (sync, remove).

### Step 3: Add ErrorBoundary route-level reset

Update the `ErrorBoundary` to also reset when the route changes (using a `key` prop based on location), preventing stale error states when navigating between pages.

---

## Technical Details

### Files to modify:

1. **`src/hooks/useRealtimeSync.ts`** -- Expand with all table subscriptions and comprehensive query key invalidations.

2. **`src/pages/ContiBancari.tsx`** -- Replace the imperative `fetchAccounts()` pattern with a React Query-based approach so realtime invalidation works.

3. **`src/hooks/useBankingIntegration.ts`** -- Add a `useBankAccountsQuery` export that uses `useQuery` with the key `["bank-accounts"]`. Keep mutation functions separate.

4. **`src/components/layout/MainLayout.tsx`** -- Pass the current route path as a `key` to `ErrorBoundary` so it resets on navigation.

### Debouncing strategy

Add a small debounce (300ms) to the realtime invalidation callback to avoid redundant re-fetches when multiple rows change at once (e.g., during a batch import).
