

# Fix filtri Transazioni

## Problemi identificati

### 1. Il filtro date e sempre vincolato al DateRangeContext (ultimi 30 giorni)
Il codice attuale (riga 78 di Transazioni.tsx) fa:
```
startDate: startDate || contextStartDate,
endDate: endDate || contextEndDate,
```
Questo significa che anche quando l'utente non imposta date personalizzate, il contesto globale forza sempre un intervallo (default: ultimi 30 giorni). Non e possibile visualizzare TUTTE le transazioni.

### 2. I filtri avanzati sono reattivi ma il pulsante "Applica" non li conferma
Le date nei filtri avanzati cambiano lo stato immediatamente (reattivo), ma il pulsante "Applica filtri" chiude solo il popover senza fare nulla di specifico. Questo puo confondere l'utente.

### 3. Il filtro per conto funziona tecnicamente ma potrebbe non mostrare risultati
Il filtro per conto (`accountId`) e implementato correttamente nel hook, ma se non ci sono conti bancari configurati il Select mostra solo "Tutti i conti".

## Modifiche previste

### File: `src/pages/Transazioni.tsx`

1. **Rimuovere la dipendenza forzata dal DateRangeContext**: Non usare piu `contextStartDate`/`contextEndDate` come fallback. Se l'utente non imposta date nei filtri avanzati e il periodo globale e "Ultimi 30 giorni", passare quel range; ma aggiungere un'opzione esplicita per vedere "Tutte le date" (nessun filtro temporale).

2. **Aggiungere un pulsante "Tutte le date"**: Permettere all'utente di rimuovere qualsiasi filtro temporale per vedere tutte le transazioni storiche.

3. **Rendere il pulsante "Applica filtri" funzionale**: Il pulsante applichera i filtri in modo esplicito (copiando i valori temporanei in quelli effettivi), dando un feedback chiaro all'utente.

### File: `src/hooks/useTransactions.ts`

4. **Rendere opzionale il filtro date**: Se `startDate` e `endDate` sono entrambi vuoti/undefined, non applicare alcun filtro temporale alla query Supabase, permettendo di caricare tutte le transazioni.

## Dettaglio tecnico

### Transazioni.tsx - Logica filtri rivista

- Introdurre uno stato `useGlobalDateRange` (default `true`) che indica se usare il range dal contesto globale
- Quando l'utente imposta date nei filtri avanzati, disattivare automaticamente `useGlobalDateRange`
- Aggiungere un chip/badge visibile "Tutte le date" quando nessun filtro temporale e attivo
- Il pulsante "Applica filtri" chiudera il popover e forza un refetch

### useTransactions.ts - Nessuna modifica strutturale necessaria

Il hook gia gestisce correttamente il caso in cui `startDate` e `endDate` siano undefined (righe 70-86). Il problema e solo che il componente Transazioni li passa sempre valorizzati.

### Riepilogo modifiche

| File | Modifica |
|------|----------|
| `src/pages/Transazioni.tsx` | Rimuovere fallback forzato a contextStartDate/contextEndDate; aggiungere opzione "Tutte le date"; rendere filtri espliciti con pulsante Applica |

