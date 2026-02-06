
# Rebranding: Finexa to mioCFO

This plan covers all the changes needed to rebrand the platform from "Finexa" to "mioCFO".

## Summary

The rebranding involves updating text references, email domains, and logo assets across 14+ files. The platform will be renamed to "mioCFO" with a new brand identity.

## Changes Required

### 1. HTML Metadata (index.html)
- Update page title: "Finexa" to "mioCFO"
- Update meta author
- Update Open Graph title: "Finexa - Gestione Finanziaria Intelligente" to "mioCFO - Gestione Finanziaria Intelligente"
- Update Twitter title and site handle

### 2. Landing Page Components

**HeroSection.tsx**
- Change "Finexa ti offre..." to "mioCFO ti offre..."
- Update dashboard preview label from "Dashboard Finexa" to "Dashboard mioCFO"

**CTASection.tsx**
- Change "Finexa" reference in the CTA paragraph

**LandingHeader.tsx**
- Update logo alt text and import variable names

**LandingFooter.tsx**
- Update logo alt text
- Update copyright: "Finexa" to "mioCFO"
- Update email domain: "info@finexa.it" to "info@miocfo.it"

### 3. Authentication (Auth.tsx)
- Update logo alt text
- Change welcome message: "Benvenuto in Finexa" to "Benvenuto in mioCFO"

### 4. Layout Components (Sidebar.tsx)
- Update logo alt text references

### 5. Demo Accounts (AuthContext.tsx)
- Update email domains: "@finexa.it" to "@miocfo.it"
  - demo.user@miocfo.it
  - demo.admin@miocfo.it
  - demo.superadmin@miocfo.it

### 6. Legal Pages

**Terms.tsx** (~15 occurrences)
- Update all "Finexa" references to "mioCFO"
- Update company name: "Finexa S.r.l." to "mioCFO S.r.l."

**Privacy.tsx** (~10 occurrences)
- Update all "Finexa" references to "mioCFO"
- Update company name: "Finexa S.r.l." to "mioCFO S.r.l."
- Update email domains: "privacy@finexa.it", "info@finexa.it" to "@miocfo.it"

**Cookies.tsx** (~5 occurrences)
- Update all "Finexa" references to "mioCFO"
- Update email domains to "@miocfo.it"

### 7. Logo Assets
The logo files need to be renamed:
- `src/assets/finexa-logo.png` to `src/assets/miocfo-logo.png`
- `src/assets/finexa-logo-icon.png` to `src/assets/miocfo-logo-icon.png`

All import statements will be updated to use the new filenames.

## Important Notes

- You will need to provide new logo images for "mioCFO" (both full logo and icon versions)
- The demo accounts in Supabase Auth will need to have their emails updated to match the new domain (@miocfo.it)
- The current logo files will be renamed, but you should replace them with actual mioCFO branding

## Files to Modify

| File | Changes |
|------|---------|
| index.html | Title, meta tags, OG tags |
| src/components/landing/HeroSection.tsx | Brand text |
| src/components/landing/CTASection.tsx | Brand text |
| src/components/landing/LandingHeader.tsx | Logo import and alt |
| src/components/landing/LandingFooter.tsx | Logo, copyright, email |
| src/pages/Auth.tsx | Logo and welcome text |
| src/components/layout/Sidebar.tsx | Logo imports and alt |
| src/contexts/AuthContext.tsx | Demo account emails |
| src/pages/Terms.tsx | Legal entity name, brand references |
| src/pages/Privacy.tsx | Legal entity name, emails, brand references |
| src/pages/Cookies.tsx | Brand references, emails |
| src/assets/finexa-logo.png | Rename to miocfo-logo.png |
| src/assets/finexa-logo-icon.png | Rename to miocfo-logo-icon.png |

## Database Update Required

After implementation, you will need to update the demo user emails in Supabase Auth:
- demo.user@finexa.it to demo.user@miocfo.it
- demo.admin@finexa.it to demo.admin@miocfo.it
- demo.superadmin@finexa.it to demo.superadmin@miocfo.it
