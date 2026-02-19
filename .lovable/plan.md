

# Flussi di Cassa -- Semplificare i KPI

## Cosa cambia

Rimuovere le card KPI "Costi Operativi" e "Incidenza Costi" (che appartengono all'area economica) e sostituirle con "Totale Incassi" e "Totale Pagamenti" del periodo. La riga KPI diventa:

1. **Flusso di Cassa** -- saldo totale conti bancari (rimane com'e)
2. **Totale Incassi** -- somma incassi nel periodo selezionato
3. **Totale Pagamenti** -- somma pagamenti nel periodo selezionato
4. **Margine Operativo** -- percentuale margine (rimane com'e)

## Dettaglio tecnico

### `src/pages/FlussiCassa.tsx`
- Rimuovere la card "Incidenza Costi" (riga 83-89)
- Rimuovere la card "Costi Operativi" (riga 90-96)
- Aggiungere card "Totale Incassi" con icona ArrowUpRight, variante success, valore da `kpis.totaleIncassi`
- Aggiungere card "Totale Pagamenti" con icona ArrowDownRight, variante destructive, valore da `kpis.totalePagamenti`

### `src/hooks/useCashFlowData.ts`
- Rimuovere `breakEvenPoint` e `incidenzaCosti` dall'interfaccia `CashFlowKPIs`
- Aggiungere `totaleIncassi` e `totalePagamenti` all'interfaccia
- Nella funzione `useCashFlowKPIs`, restituire `currentIncassi` e `currentPagamenti` direttamente

### Layout KPI (3 colonne anziche 4)
- Cambiare la griglia da `lg:grid-cols-4` a `lg:grid-cols-3` se si decide di avere solo 3 card, oppure mantenere 4 con Margine Operativo

