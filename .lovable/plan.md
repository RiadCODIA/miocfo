

## Add "Abbonamento" Tab to Settings Page

Convert the current flat Settings page into a tabbed layout with two tabs:

### Structure

```text
Impostazioni
├── Tab: Profilo & Notifiche  (current content, unchanged)
└── Tab: Abbonamento           (new — shows current plan + upgrade/change)
```

### Changes

1. **`src/pages/Impostazioni.tsx`** — Wrap existing content in a `Tabs` component with two tabs:
   - **"Profilo"** tab (User icon) — contains the existing Profile + Notifications sections as-is
   - **"Abbonamento"** tab (Wallet icon) — new tab showing:
     - Current active plan name, status, and expiry date (from `useUserSubscription`)
     - A "Cambia Piano" button that either opens the `PaymentMethodModal` or links to `/piani`
     - Quick summary of plan features

2. **No new files needed** — reuse existing `useUserSubscription` hook and `PaymentMethodModal`. The tab layout follows the same pattern used in `Configurazione.tsx` (grid TabsList with icons).

