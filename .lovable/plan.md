

## Analisi e Miglioramento Sezione Scadenzario

### Problemi Identificati

#### 1. Manca la possibilità di inserire scadenze
**Gravità: CRITICA**

La sezione mostra "Nessuna scadenza programmata" ma non esiste NESSUN modo per l'utente di creare scadenze:
- Non c'è un bottone "Aggiungi scadenza"
- Non esiste un modale o form di inserimento
- La tabella `deadlines` è vuota (0 record)

#### 2. Nessun collegamento con le fatture
**Gravità: ALTA**

La tabella `deadlines` ha un campo `invoice_id` che collega alle fatture, ma:
- Quando si carica una fattura, NON viene creata automaticamente una scadenza
- Manca il flusso: fattura → data scadenza → creazione deadline

#### 3. Mancano azioni sulle scadenze esistenti
**Gravità: MEDIA**

L'hook `useCompleteDeadline` esiste ma non è usato nella UI:
- Non c'è bottone "Segna come completato"
- Non c'è possibilità di modificare o eliminare scadenze
- Non c'è filtro per vedere scadenze passate/completate

#### 4. Spiegazione dello scopo poco chiara
**Gravità: MEDIA**

Il sottotitolo "Gestione incassi e pagamenti futuri" è generico. Manca:
- Spiegazione del concetto di scadenzario
- Guida su come usarlo
- Connessione visiva con la previsione di liquidità

---

### Soluzione Proposta

#### A. Nuovo componente `CreateDeadlineModal`
Form modale per inserire manualmente scadenze:
- **Descrizione** (es. "Fattura fornitore ABC", "Incasso cliente XYZ")
- **Tipo**: Incasso o Pagamento (dropdown)
- **Importo** (€)
- **Data scadenza** (date picker)
- **Collega a fattura** (opzionale, dropdown fatture)

#### B. Azioni inline sulle scadenze
Per ogni scadenza nella lista:
- **✓ Completa**: Segna come pagato/incassato
- **✎ Modifica**: Apre form precompilato
- **✕ Elimina**: Con conferma

#### C. Generazione automatica da fatture
Quando viene caricata una fattura:
- Estrarre la data di scadenza pagamento (se presente nel PDF)
- Creare automaticamente una scadenza di tipo "pagamento"
- Collegare la scadenza alla fattura (`invoice_id`)

#### D. Filtri e visualizzazione migliorata
- **Filtro stato**: Tutte / Pendenti / Completate / Scadute
- **Filtro tipo**: Tutti / Incassi / Pagamenti
- **Range date**: Prossimi 7/30/90 giorni

#### E. Header migliorato con spiegazione
Aggiungere una descrizione più chiara dello scopo:
> "Pianifica incassi e pagamenti futuri per prevedere la liquidità disponibile. Le scadenze alimentano il grafico di proiezione."

---

### File da modificare

1. **`src/pages/Scadenzario.tsx`**
   - Aggiungere bottone "Nuova Scadenza"
   - Implementare filtri stato/tipo
   - Aggiungere azioni (completa/modifica/elimina) su ogni scadenza
   - Migliorare header con spiegazione

2. **Nuovo: `src/components/scadenzario/CreateDeadlineModal.tsx`**
   - Form completo per inserimento scadenza
   - Validazione importo > 0 e data futura
   - Collegamento opzionale a fattura

3. **`src/hooks/useDeadlines.ts`**
   - Aggiungere `useCreateDeadline` mutation
   - Aggiungere `useUpdateDeadline` mutation  
   - Aggiungere `useDeleteDeadline` mutation
   - Aggiungere parametri filtro a `useDeadlines`

4. **`supabase/functions/process-invoice/index.ts`** (opzionale follow-up)
   - Estrarre data scadenza dal PDF con AI
   - Creare automaticamente deadline dopo upload fattura

---

### Schema Flusso Migliorato

```text
┌─────────────────────────────────────────────────────────────────┐
│                        SCADENZARIO                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │ Upload Fattura  │───▶│ AI Estrae Data │───▶│ Auto-crea   │ │
│  │                 │    │ Scadenza       │    │ Deadline    │ │
│  └─────────────────┘    └─────────────────┘    └─────────────┘ │
│                                                       │         │
│  ┌─────────────────┐                                  ▼         │
│  │ [+ Nuova Scad.] │──────────────────────▶ ┌─────────────────┐│
│  │ (Manuale)       │                        │   Deadlines DB  ││
│  └─────────────────┘                        └────────┬────────┘│
│                                                      │         │
│                                                      ▼         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Lista Scadenze                                           │ │
│  │  ┌─────────────────────────────────────────────────────┐  │ │
│  │  │ 📅 Feb 05  Fattura ABC    Pagamento  -€5.000  [✓][✎]│  │ │
│  │  │ 📅 Feb 10  Cliente XYZ    Incasso    +€8.000  [✓][✎]│  │ │
│  │  └─────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                      │         │
│                                                      ▼         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  📈 Proiezione Liquidità 30gg (grafico)                   │ │
│  │     Saldo attuale + incassi - pagamenti = saldo futuro    │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Dettagli Tecnici

#### CreateDeadlineModal - Struttura Form

```text
┌────────────────────────────────────────────┐
│         Nuova Scadenza                  ✕  │
├────────────────────────────────────────────┤
│                                            │
│  Descrizione                               │
│  ┌────────────────────────────────────┐   │
│  │ Es. Fattura Fornitore ABC          │   │
│  └────────────────────────────────────┘   │
│                                            │
│  Tipo              Importo                 │
│  ┌──────────────┐  ┌──────────────────┐   │
│  │ ▾ Pagamento  │  │ € 1.500,00       │   │
│  └──────────────┘  └──────────────────┘   │
│                                            │
│  Data Scadenza                             │
│  ┌────────────────────────────────────┐   │
│  │ 📅 15/02/2026                      │   │
│  └────────────────────────────────────┘   │
│                                            │
│  Collega a fattura (opzionale)             │
│  ┌────────────────────────────────────┐   │
│  │ ▾ Seleziona fattura...             │   │
│  └────────────────────────────────────┘   │
│                                            │
│                        ┌──────────────────┐│
│                        │  Salva Scadenza  ││
│                        └──────────────────┘│
└────────────────────────────────────────────┘
```

#### Hook useDeadlines - Nuove mutations

- `useCreateDeadline({ description, type, amount, dueDate, invoiceId? })`
- `useUpdateDeadline({ id, description?, type?, amount?, dueDate?, status? })`
- `useDeleteDeadline(id)`

#### Filtri nella query

```typescript
useDeadlines({
  status?: "pending" | "completed" | "overdue" | "all",
  type?: "incasso" | "pagamento" | "all",
  fromDate?: string,
  toDate?: string,
})
```

---

### Risultato Atteso

1. **Inserimento manuale scadenze**: Bottone "Nuova Scadenza" apre modale → salva in DB → appare nella lista
2. **Azioni rapide**: Completare scadenze con un click, vedere lo stato aggiornarsi
3. **Proiezione funzionante**: Con scadenze inserite, il grafico proiezione liquidità si popola
4. **Collegamento fatture**: Possibilità di collegare scadenza a fattura esistente
5. **Filtri utili**: Vedere solo scadenze pendenti, solo pagamenti, ecc.

