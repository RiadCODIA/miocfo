

## Redesign dell'applicazione in stile mioCFO Reference

Questo piano copre il redesign completo del layout, sidebar e dashboard per allinearsi al design di riferimento.

### 1. Sidebar -- Stile dark navy con navigazione raggruppata

**File: `src/components/layout/Sidebar.tsx`**

- Cambiare lo sfondo della sidebar in dark navy (`bg-[#1a1f3d]` / simile) con testo bianco
- Aggiungere sezioni raggruppate con etichette uppercase grigie:
  - **NAVIGAZIONE**: Dashboard, Collegamenti, Conti & Transazioni
  - **Gestione Business** (collapsible): Area finanziaria, Area economica
  - **ANALYTICS & AI**: Dati & Statistiche, Comunicazioni, AI Assistant
  - In basso: Impostazioni, Logout
- Item attivo con sfondo semitrasparente e dot indicator blu
- Icone bianche/grigie, testo bianco
- Logo mioCFO in bianco in alto
- Riorganizzare le voci di menu per matchare la struttura del reference

### 2. Layout principale -- Top bar con greeting e filtri

**File: `src/components/layout/MainLayout.tsx`**

- Aggiungere una top bar sopra il contenuto con:
  - Icona building + "Buongiorno/Buonasera, [Nome]" + "Ecco la tua panoramica finanziaria"
  - A destra: filtro data ("Ultimi 30...") + badge "Trial"
- Background della pagina principale in grigio chiaro (`bg-gray-50` o simile)

### 3. Dashboard -- Nuovo layout con hero card

**File: `src/pages/Dashboard.tsx`**

- Rimuovere l'header attuale e il componente `DashboardFilters` (spostato nella top bar)
- Aggiungere una **hero card "LIQUIDITA TOTALE"** a larghezza piena:
  - Grande valore in euro con formato europeo (es. 795.069 euro)
  - Percentuale di variazione con freccia
  - "Ultimo aggiornamento: [data e ora]"
  - Filtro "Tutti i conti" a destra
- Sotto: **3 card KPI** in griglia:
  - Entrate (con icona grafico verde)
  - Uscite (con icona grafico rosso)
  - Conti Collegati (numero + "Conti attivi")
- Sotto: **2 card grandi** in griglia 5/7:
  - Sinistra: "Analisi Categorie" (placeholder/locked con icona lucchetto)
  - Destra: "Saldi per Conto" (lista conti con nome banca, tipo conto, saldo, percentuale)

### 4. KPICard -- Nuovo design

**File: `src/components/dashboard/KPICard.tsx`**

- Redesign con sfondo bianco, bordi arrotondati, ombre leggere
- Titolo piccolo in alto a sinistra, valore grande sotto, subtitle ("+0% del totale")
- Icona colorata in alto a destra (dentro cerchio colorato)

### 5. CSS / Theme aggiornamenti

**File: `src/index.css`**

- Aggiornare le variabili CSS per il tema light (sfondo pagina grigio chiaro, card bianche)
- Sidebar con colori dark navy dedicati
- Card con ombre leggere e bordi sottili

### 6. Nuovi componenti

**File: `src/components/dashboard/LiquidityHeroCard.tsx`** (nuovo)
- Card hero grande con liquidita totale, variazione, ultimo aggiornamento, filtro conti

**File: `src/components/dashboard/AccountBalancesList.tsx`** (nuovo)
- Lista "Saldi per Conto" con icona banca, nome, tipo, saldo e percentuale

**File: `src/components/dashboard/CategoryAnalysisCard.tsx`** (nuovo)
- Card placeholder "Analisi Categorie" con lucchetto e pulsante Upgrade

**File: `src/components/layout/TopBar.tsx`** (nuovo)
- Barra superiore con greeting dinamico (Buongiorno/Buonasera basato sull'ora), filtri data, badge piano

### Dettagli tecnici

- I colori della sidebar useranno variabili CSS dedicate (`--sidebar-background: 230 30% 15%` circa)
- La navigazione della sidebar sara riorganizzata con un array di gruppi, ognuno con label e items
- Il greeting nella top bar usera `new Date().getHours()` per determinare Buongiorno/Buonasera
- I componenti chart esistenti (`LiquidityChart`, `IncomeExpenseChart`) saranno mantenuti ma visivamente aggiornati con sfondo bianco
- `AlertsSummary` sara spostato piu in basso o rimosso dal dashboard principale
- Il layout del dashboard passera da 6 colonne KPI a: 1 hero card + 3 card + 2 card grandi

