

# Area Economica - Nuova Pagina con Conto Economico, Scadenzario e Previsioni

## Panoramica

Creare una nuova pagina "Area Economica" accessibile dalla sidebar, con 3 tab principali come nel design di riferimento. I dati verranno calcolati automaticamente dalle fatture emesse (ricavi) e ricevute (costi), con possibilita di inserimento manuale per i costi del personale.

## Struttura della pagina

La pagina avra:
- Header con titolo "Area Economica" e sottotitolo
- Filtri (periodo, conti bancari)  
- 3 tab: **CONTO ECONOMICO**, **SCADENZARIO CLIENTI/FORNITORI**, **PREVISIONI**

### Tab 1: Conto Economico
Tabella mensile (GEN-DIC) con le seguenti righe:
- **RICAVI DA FATTURE EMESSE** - calcolato automaticamente dalle fatture con `invoice_type = 'emessa'`
- **COSTI** - calcolati dalle fatture con `invoice_type = 'ricevuta'`, suddivisi per categorie di costo (da `cost_categories`):
  - Acquisto materie prime, Energia, Lavorazioni di terzi, Provvigioni, Carburanti, Manutenzioni, Assicurazioni, Formazione, Marketing, Godimento beni di terzi, Canoni di leasing, Consulenze, Altre spese
- **PRIMO MARGINE** = Ricavi - Costi (con % sul fatturato)
- **Costi del personale** (inserimento manuale): Salari e stipendi, Compenso amministratore
- **MARGINE OPERATIVO (EBITDA)** = Primo Margine - Costi personale (con % sul fatturato)
- **Sezione IVA**: Calcolo IVA annuale con Ricavi, Costi, Differenza, A credito, A debito, IVA netta

### Tab 2: Scadenzario Clienti/Fornitori
Vista delle scadenze raggruppate per clienti e fornitori (riutilizzo logica esistente da `useDeadlines`)

### Tab 3: Previsioni
Vista previsionale (riutilizzo logica da `useBudgets` e `useBudgetComparison`)

## Modifiche alla Sidebar

Aggiornare "Area economica" nel gruppo "GESTIONE BUSINESS" per includere:
- **Conto Economico** (nuova voce, link a `/area-economica`)
- **Budget & Previsioni** (esistente)
- **Movimenti** (esistente)

## Dettagli tecnici

### File da creare

| File | Descrizione |
|------|-------------|
| `src/pages/AreaEconomica.tsx` | Pagina principale con i 3 tab |
| `src/components/area-economica/ContoEconomicoTab.tsx` | Tab Conto Economico con griglia mensile |
| `src/components/area-economica/ScadenzarioTab.tsx` | Tab Scadenzario Clienti/Fornitori |
| `src/components/area-economica/PrevisioniTab.tsx` | Tab Previsioni |
| `src/components/area-economica/IVASection.tsx` | Sezione calcolo IVA |
| `src/hooks/useContoEconomico.ts` | Hook per aggregare dati fatture per mese/categoria |

### File da modificare

| File | Modifica |
|------|----------|
| `src/components/layout/Sidebar.tsx` | Aggiungere voce "Conto Economico" in Area economica |
| `src/App.tsx` | Aggiungere route `/area-economica` |

### Fonti dati
- **Ricavi**: query su `invoices` dove `invoice_type = 'emessa'`, raggruppati per mese tramite `invoice_date`
- **Costi**: query su `invoices` dove `invoice_type = 'ricevuta'`, con join su `cost_categories` per suddivisione
- **IVA**: calcolata da `vat_amount` nelle fatture
- **Costi personale**: salvati in `localStorage` o in una nuova tabella (inizialmente localStorage per semplicita)
- **Scadenzario**: riutilizzo hook `useDeadlines` esistente
- **Previsioni**: riutilizzo hook `useBudgets` esistente

### Logica Conto Economico
- Anno selezionabile (default: anno corrente)
- Divisione: Mensile
- Celle editabili solo per costi del personale
- Totali calcolati automaticamente per ogni riga
- Percentuali sul fatturato calcolate dinamicamente

