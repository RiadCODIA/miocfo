
# Composizione della Liquidita - Analisi Origini dei Flussi

## Obiettivo
Aggiungere alla pagina "Flussi di Cassa" una sezione che analizza la **composizione degli incassi**, classificando automaticamente le entrate in categorie significative per far capire al cliente da dove proviene la liquidita:
- Incassi da fatture / pagamenti clienti
- Prestiti e finanziamenti
- Trasferimenti e versamenti propri (top-up, bonifici interni)
- Versamenti in contanti
- Rimborsi
- Altre entrate non categorizzabili

Il risultato sara mostrato sia graficamente (grafico a torta/donut) che numericamente (lista con percentuali e importi).

## Come funziona la classificazione

L'algoritmo analizzera il campo `description` di ogni transazione positiva (incasso) e classifichera in base a pattern testuali:

```text
Categoria                  | Pattern riconosciuti
---------------------------|--------------------------------------------
Incassi Fatture            | "fattura", "pagamento", "invoice", "payment from" (quando non e rimborso)
Prestiti/Finanziamenti     | "prestito", "finanziamento", "loan", "mutuo"
Trasferimenti/Versamenti   | "top-up", "trasferimento", "bonifico", "transfer"
Versamenti Contanti        | "cash", "contanti", "deposito"
Rimborsi                   | "rimborso", "refund", "reso"
Altro                      | Tutto cio che non rientra nelle categorie sopra
```

## Modifiche tecniche

### 1. Nuovo hook: `useCashFlowComposition` (in `useCashFlowData.ts`)
- Query delle transazioni positive (`amount > 0`) nel periodo selezionato
- Classificazione di ogni transazione in base alla `description`
- Calcolo totale per categoria, percentuale, e importo
- Restituisce un array di oggetti `{ name, value, percentage, color }`

### 2. Nuovo componente: `CashFlowCompositionChart.tsx`
- Grafico a torta (PieChart di Recharts) che mostra la distribuzione degli incassi
- Legenda con ogni categoria, importo e percentuale
- Stile coerente con i chart esistenti (glass card, stessi colori del tema)

### 3. Aggiornamento pagina `FlussiCassa.tsx`
- Aggiungere la nuova sezione sotto i grafici esistenti (tra i chart e la tabella mensile)
- Layout: grafico donut a sinistra, dettaglio numerico (lista categorie con barra di progresso, importo e %) a destra

### 4. Aggiornamento realtime (`useRealtimeSync.ts`)
- Aggiungere il query key `cashflow-composition` alle invalidazioni della tabella `bank_transactions`

## Layout visuale

```text
+----------------------------------+----------------------------------+
|                                  |                                  |
|      [Grafico Donut]             |   Incassi Fatture    €12.500 45% |
|                                  |   ██████████░░░░░░               |
|        Composizione              |   Rimborsi           €8.200  30% |
|        Incassi                   |   ██████████░░░░░░               |
|                                  |   Prestiti           €4.000  15% |
|        Totale: €27.400           |   ██████░░░░░░░░░░               |
|                                  |   Trasferimenti      €1.700   6% |
|                                  |   ███░░░░░░░░░░░░░               |
|                                  |   Altro              €1.000   4% |
|                                  |   ██░░░░░░░░░░░░░░░              |
+----------------------------------+----------------------------------+
```

## File coinvolti
1. **`src/hooks/useCashFlowData.ts`** - Aggiunta hook `useCashFlowComposition`
2. **`src/components/flussi-cassa/CashFlowCompositionChart.tsx`** - Nuovo componente (grafico + dettaglio)
3. **`src/pages/FlussiCassa.tsx`** - Integrazione della nuova sezione
4. **`src/hooks/useRealtimeSync.ts`** - Aggiunta query key per invalidazione realtime
