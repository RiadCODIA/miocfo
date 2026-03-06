

## Plan: Restructure Subscription Plans and Implement Feature Gating

### Overview
Update the 4 subscription tiers with new pricing and implement access control so each plan only shows the allowed sections in the sidebar.

### New Plan Structure

```text
Plan        Price    Sections Accessible
─────────   ──────   ─────────────────────────────────────────────────────
Basic       €49/mo   Dashboard, Flussi di Cassa, Transazioni, Conti Correnti
Small       €79/mo   Basic + Collegamenti (solo Conti Bancari)
Pro         €239/mo  Small + Conto Economico, Fatture, Scadenzario, Collegamenti (full)
Full        €479/mo  Pro + Budget & Previsioni, AI Assistant (with chat credits)
```

### Changes Required

#### 1. Database: Create `user_subscriptions` table
A new table to track each user's active plan:
- `id`, `user_id`, `plan_id` (FK to subscription_plans), `status` (active/expired/trial), `started_at`, `expires_at`, `ai_credits_remaining` (for Full plan chat limits)
- RLS: users can view their own subscription; super_admins can manage all
- Default: new users get no plan (or a trial period -- to discuss)

#### 2. Database: Seed the 4 plans into `subscription_plans`
Insert the 4 plans with their `features` JSON arrays containing the section IDs they unlock:
- **Basic**: `["dashboard", "flussi_cassa", "transazioni", "conti_bancari"]`
- **Small**: `["dashboard", "collegamenti_banche", "flussi_cassa", "transazioni", "conti_bancari"]`
- **Pro**: `["dashboard", "collegamenti", "flussi_cassa", "transazioni", "conti_bancari", "conto_economico", "fatture", "scadenzario"]`
- **Full**: `["dashboard", "collegamenti", "flussi_cassa", "transazioni", "conti_bancari", "conto_economico", "budget_previsioni", "fatture", "scadenzario", "kpi_report", "alert_notifiche", "ai_assistant"]`

#### 3. Hook: `useUserSubscription`
New hook that fetches the current user's active subscription and returns the list of allowed feature IDs. Used by the Sidebar and route protection.

#### 4. Sidebar: Filter nav items by plan
Update `Sidebar.tsx` to use `useUserSubscription` and hide nav items the user's plan doesn't include. Items not in the user's `features` list are hidden or shown as locked (grayed out with upgrade prompt).

#### 5. Route Protection
Update `ProtectedRoute.tsx` (or create a wrapper) to redirect users who try to access a section not included in their plan to an upgrade page.

#### 6. Public Pricing Page (`PianiPricing.tsx`)
Update the hardcoded plans array with the 4 new plans (Basic €49, Small €79, Pro €239, Full €479), their descriptions and feature lists matching the user's specification. Update yearly prices proportionally.

#### 7. Admin Plans Page (`Piani.tsx`)
Update the `allFeatures` list to match the actual app sections (dashboard, collegamenti, flussi_cassa, transazioni, conti_bancari, conto_economico, budget_previsioni, fatture, scadenzario, kpi_report, alert_notifiche, ai_assistant).

### Technical Details

**Files to create:**
- `supabase/migrations/xxx_create_user_subscriptions.sql`
- `src/hooks/useUserSubscription.ts`

**Files to modify:**
- `src/pages/PianiPricing.tsx` -- new plan cards
- `src/pages/Piani.tsx` -- updated features list
- `src/components/layout/Sidebar.tsx` -- filter items by subscription
- `src/components/auth/ProtectedRoute.tsx` -- plan-based route guard

### Open Question: AI Credits
For the Full plan, you mentioned defining a chat interaction limit. What limit should we set initially? (e.g., 50 chats/month, 100 chats/month?) This can be changed later via the admin panel.

