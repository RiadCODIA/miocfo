
Obiettivo: ridurre il Conto Economico alle sole voci dello screenshot come schema fisso, mantenendo però anche le righe Personale ed EBITDA sotto il margine.

Cosa cambierò
1. Sostituire l’elenco dinamico delle categorie
- Oggi il tab mostra tutte le categorie `revenueCategories` e `orderedCostCategories`.
- Lo convertirò in una struttura fissa di voci, coerente con lo screenshot:
  - Ricavi da vendita prodotti
  - Ricavi da prestazione servizi
  - Ricavi da canoni/abbonamenti
  - Altre entrate
  - Totale ricavi
  - Costi per materie prime / merci
  - Costi per servizi esterni
  - Affitti e locazioni
  - Utenze
  - Marketing e pubblicità
  - Software e licenze
  - Spese bancarie e assicurative
  - Spese di viaggio e trasferte
  - Spese di formazione
  - Altre uscite
  - Totale costi
  - Margine prima degli stipendi
  - poi personale + EBITDA come mi hai confermato

2. Mappare le fatture alle nuove voci
- In `useContoEconomico.ts` introdurrò una mappatura controllata tra categorie fatture e righe del conto economico.
- Le fatture emesse finiranno solo nelle 4 voci ricavi.
- Le fatture ricevute finiranno solo nelle 10 voci costi.
- Le fatture senza categoria o con categoria non riconosciuta confluiranno in:
  - `Altre entrate` per ricavi
  - `Altre uscite` per costi

3. Tenere il calcolo solo da fatture
- Nessun rientro di `bank_transactions`.
- Continueranno a valere:
  - filtro per anno su `invoice_date`
  - IVA calcolata da fatture emesse/ricevute
  - distinzione IVA totale / pagata / da pagare già presente

4. Aggiornare la UI del tab
- In `ContoEconomicoTab.tsx` smetterò di renderizzare le categorie dal database con `.map(...)`.
- Renderizzerò invece le righe in ordine fisso, come nello screenshot.
- Aggiornerò il messaggio di avviso:
  - non più “Non categorizzato” come riga separata
  - ma spiegazione che le fatture non classificate confluiscono in “Altre entrate” o “Altre uscite”

5. Preservare personale ed EBITDA
- Lascio invariati:
  - salari
  - compenso soci/amministratori
  - precompilazione da `employees`
  - salvataggio override in localStorage
  - EBITDA calcolato dopo il margine

Dettaglio tecnico
- `src/hooks/useContoEconomico.ts`
  - cambiare il modello dati da “categorie dinamiche” a “voci conto economico fisse”
  - aggiungere una funzione di mapping nome categoria → voce CE
  - calcolare i totali mensili per ciascuna voce fissa
- `src/components/area-economica/ContoEconomicoTab.tsx`
  - sostituire i loop su `revenueCategories` e `orderedCostCategories`
  - mostrare solo le righe richieste, nell’ordine dello screenshot
  - mantenere margine, personale ed EBITDA
- `src/components/area-economica/IVASection.tsx`
  - nessuna modifica strutturale prevista

Rischio da gestire
- Le categorie presenti in `cost_categories` potrebbero non avere nomi perfettamente identici a quelli dello screenshot.
- Quindi userò una mappatura robusta per parole chiave/sinonimi, così da far confluire correttamente le fatture nelle nuove righe; ciò che non combacia finirà in “Altre entrate” o “Altre uscite”.

Risultato atteso
- Il Conto Economico mostrerà solo le voci che hai indicato nello screenshot.
- I valori continueranno a provenire esclusivamente dalle fatture.
- Personale ed EBITDA resteranno visibili sotto “Margine prima degli stipendi”.
