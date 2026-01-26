
# Landing Page per Finexa

## Panoramica
Creare una landing page moderna e professionale per Finexa, la piattaforma di gestione finanziaria per PMI. La pagina presenterà le funzionalita principali del SaaS senza includere il pricing.

## Struttura della Landing Page

### 1. Header/Navbar
- Logo Finexa a sinistra
- Menu di navigazione (Funzionalita, Come Funziona, Contatti)
- CTA "Accedi" e "Prova Gratis" a destra
- Design sticky con effetto glass su scroll

### 2. Hero Section
- Titolo principale: "Gestione Finanziaria Intelligente per la Tua Azienda"
- Sottotitolo che comunica il valore: sostituire Excel con una soluzione professionale
- Due CTA: "Inizia Gratuitamente" e "Guarda Demo"
- Immagine/mockup della dashboard o illustrazione astratta
- Background con gradient decorativo (primary to accent)

### 3. Sezione "Problema/Soluzione"
- Breve descrizione del problema: gestione finanziaria frammentata in Excel
- Come Finexa risolve il problema con una piattaforma unificata

### 4. Funzionalita Principali (Feature Grid)
6 card che mostrano le funzionalita chiave:
- Dashboard con KPI in tempo reale
- Collegamento conti bancari (Enable Banking)
- Gestione fatture con upload automatico
- Flussi di cassa e previsioni
- Analisi marginalita prodotti/servizi
- Alert e notifiche automatiche

### 5. Sezione "Come Funziona"
3 step semplici:
1. Registrati in pochi secondi
2. Collega i tuoi conti bancari
3. Monitora tutto da un'unica dashboard

### 6. Sezione Testimonial/Social Proof
- Placeholder per testimonial futuri
- Statistiche chiave (numero aziende, transazioni gestite, etc.)

### 7. CTA Finale
- Box con gradient che invita all'azione
- "Pronto a trasformare la gestione finanziaria della tua azienda?"
- Pulsante principale per registrazione

### 8. Footer
- Logo e breve descrizione
- Link utili (Privacy Policy, Terms, Contatti)
- Social links placeholder

## Dettagli Tecnici

### File da Creare
1. `src/pages/Landing.tsx` - Pagina principale della landing
2. `src/components/landing/LandingHeader.tsx` - Header/Navbar
3. `src/components/landing/HeroSection.tsx` - Sezione hero
4. `src/components/landing/FeaturesSection.tsx` - Griglia funzionalita
5. `src/components/landing/HowItWorks.tsx` - Sezione come funziona
6. `src/components/landing/CTASection.tsx` - Call to action finale
7. `src/components/landing/LandingFooter.tsx` - Footer

### Modifiche ai File Esistenti
- `src/App.tsx` - Aggiungere route `/landing` (o rendere la landing la home pubblica)

### Stile e Design
- Utilizzo del design system esistente (colori primary, accent, gradients)
- Font Quicksand come definito nel progetto
- Effetto glass per card e componenti
- Animazioni fade-in e slide-in gia presenti nel progetto
- Background decorativi con blur (come nella pagina Auth)
- Responsive design per mobile, tablet e desktop

### Componenti UI Riutilizzati
- Button (con varianti esistenti)
- Card
- Badge
- Icone da lucide-react

### Palette Colori
- Primary: blu (#2563eb area)
- Accent: viola (#9333ea area)
- Success: verde per elementi positivi
- Background bianco con sfumature grigie chiare
- Gradient primary-to-accent per elementi hero e CTA

## Note Implementative
- La landing sara accessibile senza autenticazione
- Link "Accedi" portera a `/auth`
- Link "Prova Gratis" / "Inizia Gratuitamente" portera a `/auth` (tab registrazione)
- Tutte le icone saranno da lucide-react (gia installato)
- Nessuna dipendenza aggiuntiva richiesta
