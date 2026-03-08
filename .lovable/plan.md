

## Fix: Update Landing Plans to 3 Tiers and Remove Unused Routes

### Problems Found
1. **Landing.tsx has old 4 plans** (Basic €49, Small €79, Pro €239, Full €479) hardcoded -- never updated
2. **Separate route pages** (`/chi-siamo`, `/pricing`, `/faq`, `/contatti`) exist but are redundant since Landing.tsx already has all these as inline sections with anchor IDs (`#chi-siamo`, `#piani`, `#faq`, `#contatti`)
3. **LandingHeader** links to separate routes instead of same-page anchors

### Changes

#### 1. `src/pages/Landing.tsx`
- Replace the `plans` array (lines 52-96) with 3 plans: Small (€49), Pro (€79), Full (€199) -- same data as PianiPricing.tsx
- Change the grid from `lg:grid-cols-4` to `md:grid-cols-3` (line 393)

#### 2. `src/components/landing/LandingHeader.tsx`
- Change navLinks from separate routes to anchor links:
  - `"Chi Siamo" → "/#chi-siamo"`
  - `"Piani" → "/#piani"`
  - `"FAQ" → "/#faq"`
  - `"Contatti" → "/#contatti"`
- Add smooth scroll behavior for anchor navigation

#### 3. `src/App.tsx`
- Remove routes: `/landing`, `/chi-siamo`, `/faq`, `/contatti`
- Keep `/pricing` route (used by LockedPageOverlay for authenticated upgrade flow)
- Remove imports for ChiSiamo, FAQLanding, ContattiPage

#### 4. Files to keep
- `PianiPricing.tsx` stays -- it's the standalone pricing page for authenticated users accessing from the app
- Legal pages (`/privacy`, `/terms`, `/cookies`) stay

