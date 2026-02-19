

# Scadenzario - Revisione Completa della Logica

## Problemi Attuali

Il sistema attualmente tratta TUTTE le fatture senza data di scadenza come se fossero in attesa di pagamento/incasso, generando valori errati nei contatori "Incassi Previsti" e "Pagamenti Programmati". Le fatture ricevute (pagate) senza scadenza appaiono come "Scaduto" anziche "Pagato". Inoltre, le scadenze derivate da fatture non permettono di essere marcate come completate.

---

## Cambiamento 1: Nuova logica di classificazione fatture nello Scadenzario

**Regola fondamentale**: Se una fattura NON ha `due_date`, significa che e gia stata pagata/incassata:
- Fattura ricevuta (expense) senza `due_date` --> status = "completed" (Pagata)
- Fattura emessa (income) senza `due_date` --> status = "completed" (Incassata)

Solo le fatture CON `due_date` rappresentano pagamenti/incassi futuri. Se la `due_date` e passata e non e stata marcata come `paid`, allora e "overdue".

**File**: `src/hooks/useDeadlines.ts` - funzione `invoiceToDeadline`

Logica attuale (errata):
```
const dueDate = inv.due_date || inv.invoice_date || today;
const isPaid = inv.payment_status === "paid";
const isOverdue = !isPaid && dueDate < today;
```

Nuova logica:
```
// Senza due_date = gia pagato/incassato
if (!inv.due_date) {
  status = "completed";
  dueDate = inv.invoice_date || today;
} else {
  const isPaid = inv.payment_status === "paid" || inv.payment_status === "matched";
  status = isPaid ? "completed" : (inv.due_date < today ? "overdue" : "pending");
  dueDate = inv.due_date;
}
```

---

## Cambiamento 2: Contatori Summary corretti

**File**: `src/hooks/useDeadlines.ts` - funzione `useDeadlinesSummary`

I contatori "Incassi Previsti" e "Pagamenti Programmati" devono contare SOLO le scadenze con status `pending` (cioe fatture con `due_date` futura e non ancora pagate). Le fatture senza `due_date` sono gia completate e non devono essere conteggiate.

La query attuale recupera tutte le fatture `neq("payment_status", "paid")`, ma non considera che senza `due_date` la fattura e gia pagata. Verra applicata la stessa logica del punto 1 e poi filtrate solo le entry `pending`/`overdue` per i contatori.

---

## Cambiamento 3: Permettere di completare scadenze da fattura (overdue)

**File**: `src/components/scadenzario/DeadlineList.tsx`

Attualmente la riga 183 blocca il pulsante "Completa" per le scadenze da fattura:
```
{!isCompleted && !isFromInvoice && (
```

Deve diventare:
```
{!isCompleted && (
```

Quando l'utente clicca "Completa" su una scadenza derivata da fattura, il sistema deve anche aggiornare il `payment_status` della fattura a `paid` nel database (tabella `invoices`).

La funzione `useCompleteDeadline` verra aggiornata per accettare un oggetto `Deadline` e, se `source === "invoice"`, aggiornare anche la fattura corrispondente.

---

## Cambiamento 4: Rimuovere la card "Saldo Minimo Previsto"

**File**: `src/pages/Scadenzario.tsx`

La terza card (righe 98-113) "Saldo Minimo Previsto" verra sostituita con una card "Scadenze Scadute" che mostra il conteggio e l'importo totale delle scadenze overdue - informazione piu utile e coerente.

---

## Cambiamento 5: Rinominare e ridisegnare il grafico

**File**: `src/pages/Scadenzario.tsx` e `src/components/scadenzario/LiquidityForecastChart.tsx` e `src/hooks/useDeadlines.ts`

### Titolo
Da "Previsione Liquidita" a "Previsione per Competenza"

### Nuova logica dati
Il grafico mostrera i ricavi e costi MENSILI dalle fatture, con due serie:
- **Linea piena (opaca)**: importi gia pagati/incassati (fatture senza `due_date` oppure con `payment_status = paid/matched`)
- **Linea tratteggiata (semi-trasparente)**: importi ancora da pagare/incassare (fatture con `due_date` e `payment_status != paid`)

Raggruppamento per mese di competenza (mese della `invoice_date` o `due_date`).

### Nuovo hook `useAccrualForecast`
Sostituira `useLiquidityForecast` con una query che recupera TUTTE le fatture dell'utente e le raggruppa per mese, separando in:
- `ricaviPagati` / `ricaviDaPagare`
- `costiPagati` / `costiDaPagare`

### Nuovo componente grafico
Il chart usera un `BarChart` (o `ComposedChart`) con barre impilate per mese:
- Barre piene verdi (ricavi pagati) e rosse (costi pagati)
- Barre semi-trasparenti/tratteggiate verdi (ricavi da incassare) e rosse (costi da pagare)

---

## Riepilogo file da modificare

| File | Modifiche |
|------|-----------|
| `src/hooks/useDeadlines.ts` | Riscrivere `invoiceToDeadline`, `useDeadlinesSummary`, sostituire `useLiquidityForecast` con `useAccrualForecast`, aggiornare `useCompleteDeadline` per gestire fatture |
| `src/components/scadenzario/DeadlineList.tsx` | Abilitare il pulsante "Completa" anche per scadenze da fattura |
| `src/pages/Scadenzario.tsx` | Sostituire card "Saldo Minimo Previsto" con "Scadenze Scadute"; rinominare titolo grafico; usare nuovo hook |
| `src/components/scadenzario/LiquidityForecastChart.tsx` | Ridisegnare con barre mensili piene/semi-trasparenti per ricavi e costi |

