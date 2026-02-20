
# Budget & Previsioni — Fix completo

## Problemi identificati

### 1. Non c'è separazione Ricavi / Costi nel modello dati
La tabella `budgets` ha un solo campo `amount` senza un campo `budget_type` (ricavo o costo). Attualmente il modal chiede un singolo importo e spiega con una nota a piè "usa il meno per i costi", ma:
- Il campo nella tabella non distingue se si tratta di un ricavo previsto o di un costo previsto
- L'interfaccia mostra una sola colonna "Importo Previsto", che è ambigua
- La logica di confronto in `useBudgets.ts` somma tutto insieme senza separare ricavi e costi

### 2. L'AI riceve dati di confronto errati
In `PrevisioniTab.tsx`, la funzione `runAIAnalysis` invia all'AI i dati di `comparison` (che contiene `consuntivo` e `previsionale` aggregati insieme senza distinzione ricavi/costi) e `variance`. Il problema è che:
- Se l'utente inserisce solo ricavi previsti (€14.000), il `previsionale` risultante è negativo perché `totalBudget` in `useBudgetComparison` somma tutti gli `amount` compresi quelli negativi (costi)
- Ma soprattutto, se l'utente ha inserito solo ricavi e nessuna transazione bancaria reale di quel mese, `consuntivo = 0 - 0 = 0`, mentre `previsionale = 14000`. L'AI vede `scostamento = 0 - 14000 = -14000` e dice che si è in perdita, quando in realtà si tratta solo di ricavi pianificati non ancora incassati

### 3. Il prompt AI non conosce il contesto dei budget
Il prompt inviato all'AI non spiega che i budget sono **previsioni future** (non consuntivi passati). L'AI interpreta gli scostamenti come perdite reali anziché come differenze tra pianificato e realizzato.

### 4. UX confusa per l'inserimento
Il modal ha un solo campo importo con note poco chiare. L'utente non sa se deve inserire -14000 per i costi o +14000 per i ricavi. Serve un campo `tipo` esplicito (Ricavo / Costo) che gestisca automaticamente il segno.

---

## Soluzione

### A. Aggiungere `budget_type` alla tabella `budgets` (migrazione DB)
Aggiungere la colonna `budget_type text DEFAULT 'income' CHECK (budget_type IN ('income', 'expense'))`.

### B. Aggiornare `CreateBudgetModal.tsx`
- Aggiungere un selettore **Tipo** con due opzioni: "Ricavo previsto" e "Costo previsto"
- Il modal gestirà automaticamente il segno: i ricavi salvati come positivi, i costi come negativi
- Rimuovere la confusa nota sul "segno meno"

### C. Aggiornare `useBudgets.ts`
- Aggiungere `budget_type` all'interfaccia `Budget`
- Aggiornare `useCreateBudget` per salvare `budget_type`
- Correggere `useBudgetComparison` e `useBudgetVarianceSummary`:
  - Separare `previsionaleRicavi` e `previsionaleC osti`
  - Il `previsionale` nel grafico diventa `previsionaleRicavi - previsionaleC osti` (netto)
  - Il confronto diventa: consuntivo reale vs cashflow netto previsto

### D. Aggiornare `PrevisioniTab.tsx` — dati inviati all'AI
Il payload inviato all'AI deve includere contesto chiaro:
```
budgetsRicavi: [...],  // lista budget di tipo income
budgetsC osti: [...],  // lista budget di tipo expense  
totaleRicaviPrevisti: 14000,
totaleCostiPrevisti: 0,
cashflowNettoPrevisto: 14000,
nota: "I budget sono previsioni future. Se non ci sono transazioni reali, lo scostamento indica dati non ancora realizzati, non una perdita."
```

### E. Aggiornare il prompt AI in `analyze-conto-economico/index.ts`
Il prompt per `type === "previsioni"` deve essere riscritto per:
- Chiarire esplicitamente che i budget sono previsioni, non consuntivi
- Indicare che scostamenti con transazioni reali = 0 significano mese futuro, non perdita
- Chiedere all'AI di commentare la solidità del piano, non di allarmarsi per mesi futuri

### F. Aggiornare `BudgetPrevisioni.tsx` (la pagina standalone)
Allineare la pagina `/budget` con la stessa logica corretta usata in `PrevisioniTab`.

---

## Dettaglio tecnico

### Migrazione DB
```sql
ALTER TABLE budgets 
ADD COLUMN IF NOT EXISTS budget_type text DEFAULT 'income' 
CHECK (budget_type IN ('income', 'expense'));
```

### Interfaccia `Budget` aggiornata
```typescript
interface Budget {
  // ... existing fields
  budgetType: 'income' | 'expense';
}
```

### Logica previsionale corretta
```typescript
// In useBudgetComparison:
const previsionaleRicavi = budgets
  .filter(b => b.budget_type === 'income' || Number(b.amount) > 0)
  .reduce((s, b) => s + Math.abs(Number(b.amount)), 0);

const previsionaleC osti = budgets
  .filter(b => b.budget_type === 'expense' || Number(b.amount) < 0)
  .reduce((s, b) => s + Math.abs(Number(b.amount)), 0);

const cashflowNetto = previsionaleRicavi - previsionaleC osti;
```

### Prompt AI corretto
```
Sei un CFO virtuale. Analizza i dati di BUDGET PREVISIONALE (piani futuri, non consuntivi). 
Ricorda: gli scostamenti con consuntivo = 0 indicano mesi futuri non ancora realizzati, 
non perdite. Valuta la coerenza del piano e suggerisci miglioramenti.
```

---

## File modificati
1. `supabase/migrations/` — aggiunta colonna `budget_type`
2. `src/hooks/useBudgets.ts` — logica separazione ricavi/costi, payload AI
3. `src/components/budget/CreateBudgetModal.tsx` — selettore tipo Ricavo/Costo
4. `src/components/area-economica/PrevisioniTab.tsx` — payload AI arricchito
5. `supabase/functions/analyze-conto-economico/index.ts` — prompt previsioni corretto
6. `src/pages/BudgetPrevisioni.tsx` — allineamento logica
