
Obiettivo: fare in modo che Area Economica usi solo le fatture come fonte dati, senza riportare ricavi o costi da `bank_transactions`.

Cosa ho verificato
- In `src/hooks/useContoEconomico.ts` oggi vengono caricati sia:
  - fatture emesse/ricevute dalla tabella `invoices`
  - transazioni categorizzate dalla tabella `bank_transactions`
- Dopo aver letto le fatture, il hook aggiunge anche:
  - incassi positivi alle righe ricavi
  - spese negative alle righe costi
  - costi non categorizzati da transazioni
- Quindi il conto economico attuale è misto: fatture + transazioni.
- Tu hai confermato che il comportamento desiderato è: “Solo fatture”.

Implementazione proposta
1. Ripulire `useContoEconomico`
- Rimuovere dal hook tutte le query e la logica relative a:
  - `bank_transactions`
  - `matched_transaction_id`
  - merge transazioni → ricavi/costi
- Lasciare come unica fonte:
  - fatture emesse per i ricavi
  - fatture ricevute per i costi
- Mantenere invariata la logica IVA e la distinzione:
  - totale
  - pagate/incassate
  - da pagare/incassare

2. Mantenere la struttura UI attuale
- Lasciare invariati:
  - selettore anno
  - tabella conto economico
  - riepilogo IVA
  - filtri IVA per stato e periodo
- I numeri cambieranno automaticamente perché non verranno più sommati i movimenti bancari.

3. Aggiornare il testo descrittivo
- In `ContoEconomicoTab` aggiornare le frasi che oggi parlano di:
  - “fatture e transazioni categorizzate”
  - categorizzazione automatica delle transazioni
- Il copy deve essere coerente con la nuova regola:
  - analisi basata solo su fatture
- Valutare anche la rimozione/disattivazione del bottone “Categorizza in automatico” da questa schermata, perché non avrebbe più effetto utile sul conto economico.

4. Gestire i costi non categorizzati
- Tenere `costiNonCategorizzati`, ma calcolarlo solo dalle fatture ricevute senza categoria.
- Il messaggio di avviso in alto può restare, perché continua ad avere senso per le fatture.

5. Verifica funzionale attesa
- Se esiste una spesa solo in `bank_transactions`, non deve comparire più in Area Economica.
- Se esiste un ricavo solo in `bank_transactions`, non deve comparire più in Area Economica.
- Devono comparire solo documenti presenti in `invoices`, filtrati per:
  - `invoice_date`
  - `invoice_type`
  - `payment_status` per il riepilogo IVA filtrato

Dettaglio tecnico
- File principale da modificare: `src/hooks/useContoEconomico.ts`
- File UI da allineare: `src/components/area-economica/ContoEconomicoTab.tsx`
- Nessuna modifica necessaria alla logica base di `IVASection.tsx`, perché usa già i dati preparati dal hook.

Risultato finale
- Area Economica diventa coerente con la tua richiesta: solo fatture, senza contaminazione da movimenti bancari.
- Flussi di Cassa e Transazioni continueranno a usare `bank_transactions`; Area Economica no.
