

## Plan: Restructure Pricing Plans (4 → 3 tiers) with AI Credit System

### Current State
The DB has 4 plans: Basic (€49), Small (€79), Pro (€239), Full (€479). The landing page (`PianiPricing.tsx`) also shows 4 plans. AI credits are stored as a simple integer (`ai_credits_remaining`) with no cost-tracking or top-up mechanism.

### What Changes

#### 1. Database: Update subscription_plans rows
- **Delete** Basic plan (id: `98702c61...`) — no longer exists
- **Update** Small → €49/mo, sort_order 1, features: `[dashboard, collegamenti_banche, flussi_cassa, transazioni, conti_bancari]`
- **Update** Pro → €79/mo, sort_order 2, features: `[dashboard, collegamenti, flussi_cassa, transazioni, conti_bancari, conto_economico, fatture, scadenzario]`
- **Update** Full → €199/mo, sort_order 3, features: `[dashboard, collegamenti, flussi_cassa, transazioni, conti_bancari, conto_economico, budget_previsioni, fatture, scadenzario, kpi_report, alert_notifiche, ai_assistant]`

#### 2. Database: Add AI credit cost tracking
New table `ai_credit_topups` to track monthly AI spending and top-ups per user:

```sql
CREATE TABLE ai_credit_topups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_eur numeric NOT NULL, -- e.g. 5, 10, 20
  month_year text NOT NULL, -- e.g. '2026-03'
  created_at timestamptz NOT NULL DEFAULT now()
);
```

Add columns to `subscription_plans`:
- `ai_monthly_limit_eur numeric` — the free AI budget per month (Small=5, Pro=8, Full=20)
- `ai_topup_min_eur numeric` — minimum top-up amount (Small=5, Pro=10, Full=20)
- `ai_upgrade_suggestion_after integer` — number of top-ups before suggesting upgrade (Small=2, Pro=2, Full=null)

Add column to `user_subscriptions`:
- `ai_cost_used_eur numeric DEFAULT 0` — AI cost consumed this month (reset monthly)

#### 3. Landing page (`PianiPricing.tsx`)
Update from 4 plans to 3 plans with corrected pricing:
- Small: €49/mo — bank data analysis only (upload + API connection via A-Cube)
- Pro: €79/mo — adds invoices, P&L, deadlines
- Full: €199/mo — adds Budget & Forecasts, AI Assistant, all features

Update feature lists, descriptions, and "popular" badge (move to Pro).

#### 4. Admin page (`Piani.tsx`)
No structural changes needed — it reads plans dynamically from DB. The new columns (AI limits) should be shown in the edit sheet.

#### 5. LockedPageOverlay update
Change the copy from "Contatta l'amministratore" to a CTA linking to the Piani page, since users should now self-select plans. Add an "Upgrade" button pointing to `/piani-pricing`.

#### 6. Plan selection flow (no payment)
Since there's no Stripe/PayPal yet, the user selects a plan from the website and it creates a "pending" subscription request. The super admin still manually activates it, but the user sees which plan they requested.

New table `plan_requests`:
```sql
CREATE TABLE plan_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
```

Add a new page or section in Impostazioni where authenticated users can see available plans and request one. The super admin dashboard (UtentiGlobali) already has plan assignment — we add visibility of pending requests there.

### Summary of Changes

| Area | Change |
|------|--------|
| DB Migration | Delete Basic plan, update Small/Pro/Full pricing & features, add `ai_monthly_limit_eur` columns, create `plan_requests` table |
| `PianiPricing.tsx` | Rewrite plans array: 3 tiers with new prices and features |
| `LockedPageOverlay.tsx` | Add "Scegli un piano" button linking to pricing page |
| `Piani.tsx` (admin) | Add AI limit fields to the edit sheet |
| `useManageSubscriptions.ts` | Update default AI credits logic per plan |
| New: Plan request flow | Authenticated users can request a plan; super admins see and approve requests |

### Technical Details

- The AI cost tracking (`ai_cost_used_eur`) will be consumed by edge functions (like `analyze-spending`, `ai-assistant`) which should increment this value after each AI call and check against the plan's `ai_monthly_limit_eur` + top-ups before proceeding.
- Monthly reset of `ai_cost_used_eur` can be handled by a scheduled edge function or by checking the month boundary in code.
- The upgrade suggestion logic (after N top-ups) will be implemented as a frontend toast/banner that checks `ai_credit_topups` count for the current month.

