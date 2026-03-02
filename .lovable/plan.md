
## Piano: Correggere il flusso dati Fatture → Conto Economico

### Problema identificato

Ho analizzato il codice e il database. Ci sono **2 problemi** che impediscono al Conto Economico di riflettere correttamente le categorie assegnate nelle Fatture:

**1. Categorie inattive ignorate**: Il Conto Economico carica solo le categorie con `is_active = true`, ma alcune fatture sono categorizzate con categorie inattive (es. "Forniture", "Viaggi e trasferte"). Queste fatture finiscono in "Non categorizzato" anche se hanno una categoria assegnata.

**2. Periodo non sincronizzato**: La pagina Fatture mostra tutte le fatture (2025 + 2026), ma il Conto Economico mostra solo l'anno selezionato (default: anno corrente). Se categorizzate fatture del 2025 ma guardate il P&L del 2026, non le vedete.

---

### Modifiche previste

#### 1. Hook `useContoEconomico` - Includere categorie inattive con dati

**File: `src/hooks/useContoEconomico.ts`**

Attualmente le query filtrano `is_active = true`. Cambio per caricare TUTTE le categorie (anche inattive), cosi le fatture categorizzate con categorie inattive appaiono nella riga corretta invece di finire in "Non categorizzato".

```text
Prima:  .eq("is_active", true)
Dopo:   (nessun filtro is_active, oppure OR con categorie usate)
```

#### 2. Pagina Fatture - Aggiungere indicatore anno visibile

**File: `src/pages/Fatture.tsx`**

Nessuna modifica strutturale necessaria - il flusso `category_id` update + invalidazione `conto-economico` query e gia presente (riga 269). Il problema e solo di visibilita: l'utente non si rende conto che il P&L filtra per anno.

#### 3. Conto Economico - Nota informativa sul periodo

**File: `src/components/area-economica/ContoEconomicoTab.tsx`**

Aggiungere un piccolo testo sotto il selettore anno che indica quante fatture ci sono per quell'anno, cosi l'utente capisce se sta guardando il periodo giusto.

---

### Dettagli tecnici

**`src/hooks/useContoEconomico.ts`**: Rimuovere il filtro `.eq("is_active", true)` dalle query delle categorie expense e revenue. In questo modo tutte le categorie (attive e inattive) vengono caricate e le fatture con categorie inattive vengono correttamente assegnate alla riga giusta nel P&L.

**Impatto**: Minimo - solo 2 file modificati, nessuna nuova tabella o edge function.
