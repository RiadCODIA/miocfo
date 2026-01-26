
# Pagine Legali per Finexa

## Panoramica
Creare le tre pagine legali richieste da Enable Banking per la registrazione Production e gia linkate nel footer della landing page.

## Pagine da Creare

### 1. Privacy Policy (`/privacy`)
Informativa sulla privacy conforme al GDPR con sezioni:
- Titolare del trattamento
- Tipologie di dati raccolti
- Finalita del trattamento
- Base giuridica
- Condivisione con terze parti (Enable Banking, Supabase)
- Diritti degli utenti
- Conservazione dei dati
- Contatti

### 2. Termini di Servizio (`/terms`)
Condizioni generali di utilizzo con sezioni:
- Accettazione dei termini
- Descrizione del servizio
- Registrazione e account
- Obblighi dell'utente
- Collegamento conti bancari (Enable Banking)
- Limitazioni di responsabilita
- Proprieta intellettuale
- Modifiche ai termini
- Legge applicabile

### 3. Cookie Policy (`/cookies`)
Informativa sui cookie con sezioni:
- Cosa sono i cookie
- Tipologie di cookie utilizzati (tecnici, analitici)
- Cookie di terze parti
- Gestione delle preferenze
- Contatti

## Dettagli Tecnici

### File da Creare
```text
src/pages/Privacy.tsx
src/pages/Terms.tsx
src/pages/Cookies.tsx
src/components/legal/LegalPageLayout.tsx (componente riutilizzabile)
```

### Modifiche ai File Esistenti
- `src/App.tsx` - Aggiungere le route `/privacy`, `/terms`, `/cookies`

### Design e Layout
Ogni pagina legale avra:
- Header con logo Finexa (riutilizza LandingHeader o versione semplificata)
- Titolo principale della pagina
- Data ultimo aggiornamento
- Contenuto formattato con sezioni e sottosezioni
- Footer (riutilizza LandingFooter)
- Stile coerente con il design system (font Quicksand, colori primary/accent)
- Layout responsive

### Componente LegalPageLayout
Un wrapper riutilizzabile che include:
- LandingHeader (sticky)
- Container centrato per il contenuto
- Tipografia ottimizzata per la lettura (prose-like)
- LandingFooter

### Stile Contenuto Legale
- Titoli sezione: font-semibold, text-xl
- Paragrafi: text-muted-foreground con buon line-height
- Liste puntate per elenchi
- Card opzionali per sezioni importanti
- Scroll-to-top button (opzionale)

## Note
- Contenuti placeholder ma realistici e professionali
- Menzione specifica di Enable Banking per la gestione dati bancari
- Riferimenti al GDPR per conformita europea
- Data di ultimo aggiornamento dinamica o placeholder "Gennaio 2026"
