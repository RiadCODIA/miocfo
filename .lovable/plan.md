

# Replace all remaining "Finexa" references with "mioCFO"

## Overview

There are still 4 frontend files and 1 edge function containing "Finexa" references. The migration file is historical and won't be changed.

## Changes

### 1. `src/pages/DashboardSuperAdmin.tsx`
- "Panoramica globale della piattaforma Finexa" -> "Panoramica globale della piattaforma mioCFO"

### 2. `src/components/landing/SocialProofSection.tsx`
- Two testimonials mentioning "Finexa" -> replace with "mioCFO"

### 3. `src/components/landing/HowItWorks.tsx`
- "Configurare Finexa e veloce..." -> "Configurare mioCFO e veloce..."

### 4. `src/components/landing/FeaturesSection.tsx`
- "Finexa integra tutti gli strumenti..." -> "mioCFO integra tutti gli strumenti..."

### 5. `supabase/functions/send-alert-email/index.ts`
- Email sender: `Finexa <alerts@finexa.app>` -> `mioCFO <alerts@finexa.app>` (domain stays as-is since it's the actual email domain)
- Email header: "Finexa Alert" -> "mioCFO Alert"
- Link URL: `finexa.app/alert` -> `miocfo.lovable.app/alert`
- Footer: "Finexa - Gestione Finanziaria Intelligente" -> "mioCFO - Gestione Finanziaria Intelligente"

### Not changed
- `supabase/migrations/` -- historical SQL migration, already applied, changing it has no effect

## Total: 5 files, simple text replacements

