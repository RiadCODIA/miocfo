

# Collegamento filtro periodo TopBar alle pagine

## Problema
Il selettore di periodo nella TopBar funziona visivamente ma non e' collegato ai dati. Ogni pagina (Transazioni, Area Economica, ecc.) ha i propri filtri indipendenti, quindi cambiare il periodo nella TopBar non ha effetto.

## Soluzione

Creare un contesto globale per il date range e collegarlo sia alla TopBar che alle pagine che mostrano dati filtrabili per periodo.

## Modifiche previste

### 1. Creare un DateRangeContext
Un nuovo context (`src/contexts/DateRangeContext.tsx`) che espone:
- `dateRange: { from: Date; to: Date }` (default: ultimi 30 giorni)
- `setDateRange(range)` - per aggiornare il periodo
- `activeLabel: string` - etichetta attiva nel selettore

### 2. Aggiornare MainLayout
- Wrappare i children con `DateRangeProvider`
- Collegare il context alla TopBar tramite le props esistenti

### 3. Aggiornare la pagina Transazioni
- Rimuovere il filtro "Periodo" locale (il select con "Tutti i periodi / Oggi / Settimana / Mese")
- Usare il `dateRange` dal context per passare `startDate` e `endDate` al hook `useTransactions`
- Mantenere gli altri filtri locali (ricerca, conto, categoria, filtri avanzati) invariati

### 4. Aggiornare la pagina Area Economica (opzionale)
- Collegare il context al selettore anno del Conto Economico

### File coinvolti

| File | Azione |
|------|--------|
| `src/contexts/DateRangeContext.tsx` | Creare - context globale per date range |
| `src/components/layout/MainLayout.tsx` | Modificare - aggiungere DateRangeProvider e collegare TopBar |
| `src/components/layout/TopBar.tsx` | Modificare - usare il context invece di stato locale |
| `src/pages/Transazioni.tsx` | Modificare - rimuovere filtro periodo locale, usare context |

### Dettagli tecnici

- Il context avra come default "Ultimi 30 giorni" con `from = subDays(now, 30)` e `to = now`
- Le date dal context verranno convertite in formato `yyyy-MM-dd` e passate come `startDate`/`endDate` al hook `useTransactions`
- Il filtro periodo locale della pagina Transazioni (select con "all/today/week/month") verra rimosso perche ridondante con la TopBar
- I filtri avanzati "Intervallo date" nel popover della pagina Transazioni verranno mantenuti come override locale se compilati

