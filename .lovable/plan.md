

# Scadenzario e Previsioni con Analisi AI

## Problema
Le tab "Scadenzario Clienti/Fornitori" e "Previsioni" mostrano solo dati statici dal database senza nessuna analisi intelligente.

## Soluzione

Aggiungere analisi AI a entrambe le sezioni, riutilizzando la stessa edge function `analyze-conto-economico` con un parametro `type` per distinguere il tipo di analisi, oppure creando funzioni dedicate per maggiore chiarezza.

---

### Tab Scadenzario - Miglioramenti

**Dati esistenti:** scadenze clienti/fornitori con importi, date, stati (in attesa, scadute, completate)

**Aggiunta AI:**
- Pulsante "Analisi AI Scadenzario" che invia i dati delle scadenze all'AI
- L'AI analizza:
  - Rischio di liquidita basato sulle scadenze in arrivo
  - Clienti con pagamenti piu lenti / fornitori critici
  - Suggerimenti su priorita di incasso e pagamento
  - Previsione flusso di cassa basata sulle scadenze

**Report AI restituito:**
- Score rischio liquidita (1-100)
- Azioni prioritarie (quali incassi sollecitare, quali pagamenti posticipare)
- Alert su scadenze critiche
- Suggerimenti operativi

---

### Tab Previsioni - Miglioramenti

**Dati esistenti:** budget, confronto consuntivo vs previsionale, scostamenti

**Aggiunta AI:**
- Pulsante "Analisi AI Previsioni" che invia dati budget + consuntivo
- L'AI analizza:
  - Attendibilita delle previsioni rispetto al consuntivo
  - Trend di scostamento e cause probabili
  - Suggerimenti per migliorare la pianificazione
  - Previsioni aggiornate basate sui trend

**Report AI restituito:**
- Score attendibilita previsioni (1-100)
- Analisi scostamenti principali
- Suggerimenti di aggiustamento budget
- Forecast aggiornato

---

### File coinvolti

| File | Azione |
|------|--------|
| `supabase/functions/analyze-conto-economico/index.ts` | Modificare: aggiungere supporto per `type: "scadenzario"` e `type: "previsioni"` |
| `src/components/area-economica/ScadenzarioTab.tsx` | Modificare: aggiungere pulsante AI + sezione report |
| `src/components/area-economica/PrevisioniTab.tsx` | Modificare: aggiungere pulsante AI + sezione report |
| `src/components/area-economica/AIReportSection.tsx` | Modificare: rendere piu generico per supportare diversi tipi di report |

### Dettagli tecnici

**Edge function** - Aggiungere un campo `type` nel body della richiesta:
- `type: "conto-economico"` (default, comportamento attuale)
- `type: "scadenzario"` - prompt CFO focalizzato su gestione scadenze e rischio liquidita
- `type: "previsioni"` - prompt CFO focalizzato su analisi budget e forecasting

Ogni tipo avra un prompt specifico e una struttura JSON di risposta adatta.

**Frontend** - Riutilizzare il componente `AIReportSection` esistente con piccoli adattamenti per mostrare i campi specifici di ogni tipo di analisi (es. "Azioni prioritarie" per scadenzario, "Forecast aggiornato" per previsioni).

