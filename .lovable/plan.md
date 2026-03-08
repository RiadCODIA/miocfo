

## Plan: Convert Nav Links to Scroll-to-Section Navigation

The current nav menu (`Chi Siamo`, `Piani`, `FAQ`, `Contatti`) links to separate pages via React Router. Instead, each nav item will scroll smoothly to the corresponding section on the landing page.

### Changes

**1. `src/pages/Landing.tsx`** — Add `id` attributes to sections:
- Problems section → `id="chi-siamo"`
- Process section → `id="piani"` (or a pricing-like section)
- Features section → `id="faq"`
- CTA section → `id="contatti"`

More logically mapped:
- `id="problemi"` on Problems section
- `id="soluzione"` on Process section  
- `id="funzionalita"` on Features section
- `id="contatti"` on CTA section

The nav items will be renamed/remapped to match these sections.

**2. `src/components/landing/HeroSection.tsx`** — Change nav from `<Link to="...">` to `<a href="#section-id">` with smooth scroll:
- Update `menuItems` array to use anchor `href`s (`#problemi`, `#soluzione`, `#funzionalita`, `#contatti`)
- Replace `<Link>` with `<a>` tags that call `scrollIntoView({ behavior: 'smooth' })` on click
- Close mobile menu on click

### Section ↔ Nav Mapping

| Nav Label | Section ID | Landing Section |
|-----------|-----------|-----------------|
| Chi Siamo | `#chi-siamo` | Problems section |
| Piani | `#piani` | Process section |
| FAQ | `#funzionalita` | Features section |
| Contatti | `#contatti` | CTA/Footer section |

**Files to modify**: `src/components/landing/HeroSection.tsx`, `src/pages/Landing.tsx`

