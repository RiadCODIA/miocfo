
Obiettivo: verificare se in Area Economica il riepilogo IVA e i dati contabili prendono davvero i valori corretti dalla sezione Fatture, in base a data fattura e stato pagata/da pagare.

Cosa ho verificato nel codice
- `useContoEconomico(year)` legge le fatture direttamente dalla tabella `invoices`.
- Per il riepilogo IVA usa:
  - `invoice_date` per decidere il mese/anno
  - `vat_amount` come IVA principale
  - fallback a `total_amount - amount` se `vat_amount` è nullo/zero
- Divide le fatture per tipo:
  - `emessa|active|income` → `ivaRicavi`
  - `ricevuta|passive|expense` → `ivaCosti`
- `IVASection` mostra solo aggregati già calcolati dal hook, quindi la logica vera è tutta in `useContoEconomico`.

Problema funzionale individuato
- Al momento il riepilogo IVA in Area Economica non considera se la fattura è “pagata” o “da pagare”.
- Usa tutte le fatture dell’anno filtrate per `invoice_date`, indipendentemente da `payment_status`.
- Quindi:
  - per una logica “IVA per competenza/liquidazione su data documento” va bene
  - per una logica “IVA pagata vs da pagare” non va bene, perché manca la distinzione
- Inoltre `InvoiceTable` in Fatture mostra uno “stato” di matching/abbinamento, non espone chiaramente il vero `payment_status` contabile nel flusso principale della tabella.

Conclusione pratica
- Se la tua domanda è: “il box IVA prende correttamente i dati da Fatture in base a data e IVA?” → sì, oggi prende `invoice_date` e `vat_amount`.
- Se la tua domanda è: “distingue anche IVA già pagata/incassata da quella ancora da pagare/incassare?” → no, oggi non lo fa.

Piano di implementazione
1. Chiarire la logica desiderata nel riepilogo IVA
- Mantenere l’attuale riepilogo come “IVA per data fattura” oppure
- aggiungere un filtro/modalità:
  - Tutte
  - Solo pagate/incassate
  - Solo da pagare/incassare

2. Estendere `useContoEconomico`
- Includere `payment_status` nella query alle `invoices`
- Introdurre un filtro opzionale per stato
- Applicare il filtro prima di calcolare:
  - `ivaRicavi`
  - `ivaCosti`
  - ricavi/costi imponibili se vuoi coerenza su tutto il conto economico

3. Aggiornare `IVASection`
- Aggiungere un selettore semplice vicino ad anno/mensile/trimestrale/annuale:
  - Totale
  - Pagata/Incassata
  - Da pagare/Incassare
- Aggiornare etichette e descrizione per far capire cosa si sta guardando

4. Allineare il significato degli stati
- Usare `payment_status` come fonte per la distinzione pagata/non pagata
- Considerare come “pagate/incassate” almeno:
  - `paid`
  - `matched` se nel progetto viene trattato come saldato
- Considerare come “da pagare/incassare” gli altri stati (`pending`, `overdue`, ecc.)

5. Migliorare trasparenza in UI
- In Fatture, valutare l’aggiunta visiva del vero `payment_status` nella tabella o nel preview
- Così l’utente può verificare facilmente perché una fattura entra o non entra nei conteggi IVA filtrati

Dettaglio tecnico
- Fonte dati attuale: `src/hooks/useContoEconomico.ts`
- Presentazione riepilogo: `src/components/area-economica/IVASection.tsx`
- Container pagina/tab: `src/components/area-economica/ContoEconomicoTab.tsx`
- Origine fatture: tabella `invoices`
- Campi oggi usati per IVA:
  - `invoice_date`
  - `vat_amount`
  - fallback `total_amount - amount`
  - `invoice_type`
- Campo non ancora usato ma necessario per “pagata/da pagare”:
  - `payment_status`

Esito atteso dopo la modifica
- Potrai vedere il riepilogo IVA per anno/mese/trimestre
- E anche distinguere tra:
  - IVA totale del periodo
  - IVA già pagata/incassata
  - IVA ancora da pagare/incassare
- Con coerenza diretta rispetto ai dati presenti nella sezione Fatture
