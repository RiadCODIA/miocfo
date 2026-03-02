

## Piano: Aggiungere toggle "Saldato" nello Scadenzario

### Situazione attuale
Esiste gia un bottone verde (check) per segnare una scadenza come completata, ma:
- E' poco visibile (piccola icona tra gli altri bottoni)
- Non si puo tornare indietro (una volta completata, il check sparisce)
- Le scadenze completate non hanno modo di essere riaperte

### Modifiche previste

#### 1. DeadlineList - Aggiungere checkbox "Saldato" ben visibile

**File: `src/components/scadenzario/DeadlineList.tsx`**

- Sostituire il piccolo bottone check con una **Checkbox** visibile accanto a ogni scadenza
- La checkbox sara checkata se `status === "completed"`, non checkata se `pending`/`overdue`
- Cliccando la checkbox si togglare lo stato (saldato <-> non saldato)
- Le scadenze completate mostreranno il testo barrato e opacita ridotta (gia presente)

#### 2. Hook useDeadlines - Aggiungere mutation "uncomplete"

**File: `src/hooks/useDeadlines.ts`**

- Aggiungere `useUncompleteDeadline` per riportare una scadenza da "completed" a "pending"
- Per scadenze da fattura: aggiorna `payment_status` da "paid" a "pending" sulla tabella invoices
- Per scadenze manuali: aggiorna `status` da "completed" a "pending"/"overdue" (in base alla data)
- Invalidare tutte le query correlate (deadlines, summary, accrual-forecast, conto-economico)

#### 3. Aggiornamento dati a cascata

Quando si segna/desegna una scadenza:
- I **summary cards** (Incassi Previsti / Pagamenti Programmati) si aggiornano
- Le **tabelle scaduti** si aggiornano
- Il **grafico Previsione per Competenza** si aggiorna (pieno vs semitrasparente)
- Il **Conto Economico** riflette lo stato aggiornato delle fatture

### Dettagli tecnici

**Checkbox component**: Usa il componente `@/components/ui/checkbox` gia presente nel progetto.

**Toggle logic**:
```text
Se checkbox cliccata (da non-saldato a saldato):
  - Scadenza manuale: deadlines.status = "completed"
  - Scadenza da fattura: invoices.payment_status = "paid"

Se checkbox de-cliccata (da saldato a non-saldato):
  - Scadenza manuale: deadlines.status = "pending" o "overdue" (in base a due_date vs oggi)
  - Scadenza da fattura: invoices.payment_status = "pending"
```

**Query invalidate** (gia presente in useCompleteDeadline, replicato in uncomplete):
- `deadlines`, `deadlines-summary`, `accrual-forecast`, `conto-economico`

**File modificati**: `src/components/scadenzario/DeadlineList.tsx`, `src/hooks/useDeadlines.ts`
