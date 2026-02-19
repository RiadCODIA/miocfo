

# KPI & Report - Revisione Completa

## Panoramica delle modifiche

La pagina KPI & Report necessita di tre modifiche principali: target KPI personalizzabili dall'utente, sostituzione del ROI con il ROS basato su fatture, e sostituzione dell'export CSV con un sommario AI inline + download PDF.

---

## Cambiamento 1: Target KPI personalizzabili dall'utente

Attualmente i target sono valori fissi nel codice (es. ROI 15%, DSO 45 giorni, ecc.). L'utente deve poterli modificare.

### Approccio
- Creare una nuova tabella `kpi_targets` in Supabase con colonne: `id`, `user_id`, `kpi_id` (text), `target_value` (numeric), `created_at`, `updated_at`
- Abilitare RLS per user_id
- Aggiungere un pulsante "Modifica Target" nella pagina che apre un modal/dialog
- Nel dialog, ogni KPI mostra il suo target attuale con un campo input editabile
- Al salvataggio, i valori vengono scritti in `kpi_targets`
- Il hook `useKPIData` legge i target dal database anziche usare valori hardcoded

### Nuova tabella (migrazione SQL)
```
kpi_targets:
  - id: uuid PK
  - user_id: uuid (auth.uid())
  - kpi_id: text (es. "ros", "dso", "current_ratio", ecc.)
  - target_value: numeric
  - created_at, updated_at: timestamptz
  - UNIQUE(user_id, kpi_id)
```

---

## Cambiamento 2: Sostituire ROI con ROS (Return on Sales)

### Formula ROS
`ROS = EBITDA / Ricavi Totali x 100`

Dove:
- **Ricavi Totali** = somma degli `amount` delle fatture emesse (`invoice_type = 'emessa'`) nel periodo
- **EBITDA** = Ricavi Totali - Costi Totali (somma `amount` fatture ricevute `invoice_type = 'ricevuta'`)

Questo corrisponde esattamente al calcolo gia presente nel Conto Economico (`useContoEconomico`), quindi utilizzeremo lo stesso approccio ma nel hook `useKPIData`.

### Modifiche nel hook `useKPIData`
- Rimuovere il calcolo ROI basato su transazioni bancarie
- Aggiungere query per fatture emesse e ricevute del mese corrente e precedente
- Calcolare EBITDA = Ricavi (fatture emesse) - Costi (fatture ricevute)
- Calcolare ROS = (EBITDA / Ricavi) x 100
- Il KPI si chiamera "ROS (Return on Sales)" con valore in percentuale
- Target di default: 10% (modificabile dall'utente tramite la nuova tabella)

---

## Cambiamento 3: Sommario AI inline + Download PDF (al posto del CSV)

### Nuovo flusso
1. Sotto le card dei KPI, viene mostrato automaticamente un breve **sommario testuale** generato dall'AI (2-3 frasi) che riassume lo stato dei KPI
2. Il pulsante "Analisi AI" resta e apre il report dettagliato completo (come adesso)
3. Il blocco "Esporta Report" in basso viene sostituito: invece di scaricare un CSV, il pulsante diventa **"Scarica PDF"** e genera un PDF della schermata dell'analisi AI con header mioCFO (logo)
4. Il pulsante "Scarica PDF" e disponibile solo dopo aver generato l'analisi AI

### Implementazione sommario AI
- Quando i KPI sono caricati, viene fatta una chiamata alla edge function `analyze-kpi` con un parametro `mode: "summary"` che restituisce solo 2-3 frasi di sommario
- Il sommario viene mostrato in un box sotto le card KPI
- L'edge function `analyze-kpi` verra aggiornata per supportare il parametro `mode`

### Implementazione PDF
- Utilizzare l'API nativa del browser `window.print()` con un'area stampabile dedicata, oppure una libreria leggera
- L'approccio piu semplice e robusto: creare una funzione che apre una finestra di stampa con il contenuto dell'analisi AI formattato, includendo l'header con il logo mioCFO
- L'utente puo scegliere "Salva come PDF" dal dialog di stampa del browser
- Il contenuto stampabile include: logo mioCFO, data, tutti i KPI con target, e il report AI completo

---

## Riepilogo file da modificare

| File | Modifiche |
|------|-----------|
| `src/hooks/useKPIData.ts` | Sostituire ROI con ROS basato su fatture; leggere target da tabella `kpi_targets`; aggiungere hook `useKPITargets` e `useUpdateKPITarget` |
| `src/pages/KPIReport.tsx` | Aggiungere modal modifica target; sommario AI inline sotto i KPI; sostituire export CSV con "Scarica PDF"; funzione di generazione PDF con header mioCFO |
| `supabase/functions/analyze-kpi/index.ts` | Aggiungere supporto `mode: "summary"` per generare solo 2-3 frasi di sommario |
| Migrazione SQL | Creare tabella `kpi_targets` con RLS |

---

## Dettagli tecnici

### Struttura KPI aggiornata
```text
1. ROS (Return on Sales) - basato su fatture emesse/ricevute
2. DSO (Days Sales Outstanding) - invariato
3. Current Ratio - invariato
4. Margine Operativo - invariato
5. Burn Rate Mensile - invariato
6. Crescita Ricavi - invariato
```

### PDF Generation (approccio window.print)
- Creare un div nascosto con id `printable-report`
- Al click su "Scarica PDF": popolare il div con header (logo + data), KPI cards, e analisi AI
- Chiamare `window.print()` con media query CSS `@media print` che mostra solo quel div
- Il risultato e un PDF pulito con branding mioCFO

