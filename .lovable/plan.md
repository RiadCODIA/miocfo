
Problema individuato: l’AI non ha “smesso in generale”, ma si è rotto il parsing delle fatture PDF.

Cosa ho verificato
- Le richieste dal frontend a `process-invoice` arrivano correttamente e rispondono `200`.
- Però la response contiene fatture vuote con:
  - `raw_data.error: "AI error: 400"`
  - `ai_confidence: 0`
- Nei log live della Edge Function `process-invoice` l’errore reale è:
  - `Invalid MIME type. Only image types are supported.`
  - `code: invalid_image_format`

Root cause
- In `supabase/functions/process-invoice/index.ts`, la funzione `extractInvoiceWithAI(...)` manda sempre il file al modello come:
  - `type: "image_url"`
  - `url: data:application/pdf;base64,...`
- Questo prima poteva essere tollerato o funzionare diversamente, ma ora l’API OpenAI rifiuta i PDF in quel formato.
- Quindi:
  - immagini `.png/.jpg` possono ancora funzionare
  - PDF no, e finiscono nel fallback con importi `0` e categoria vuota

Perché in UI sembra “non leggere e non categorizza più”
- Il frontend (`src/pages/Fatture.tsx`) non si rompe: riceve una risposta formalmente valida.
- La function inserisce comunque una fattura nel DB, ma con dati fallback:
  - numero `PDF-*`
  - fornitore sconosciuto / N.A.
  - importi zero
  - nessuna categoria
  - `Da verificare`
- Quindi visivamente sembra che l’AI non stia più leggendo nulla.

Piano di correzione
1. Correggere `process-invoice` per gestire i PDF con un percorso compatibile
- Separare il flusso:
  - immagini: continuare con `image_url`
  - PDF: non inviarli come `image_url` con MIME `application/pdf`
- Opzioni implementative, in ordine consigliato:
  1. Migrare a Lovable AI Gateway / modello compatibile con input file-documento
  2. Oppure convertire il PDF in immagini pagina-per-pagina prima dell’invio
  3. Oppure usare un endpoint/provider che supporti davvero PDF multimodali
- La soluzione migliore per stabilità futura è la prima: spostare la logica AI dal direct OpenAI call a un backend path compatibile e centralizzato.

2. Mantenere la logica esistente di business
- Conservare:
  - override manuale `invoiceType`
  - VAT fallback
  - mapping fornitore → categoria
  - `needs_review`
  - fallback category per bassa confidenza
- Cambiare solo il layer di estrazione AI, non le regole contabili.

3. Migliorare la gestione errori lato funzione
- Se l’AI fallisce su PDF, salvare un errore più esplicito in `raw_data`, ad esempio:
  - `AI extraction failed: PDF input not supported by provider`
- Evitare che l’errore sembri un “successo pulito”.

4. Migliorare il feedback lato UI
- In `src/pages/Fatture.tsx`, quando la response contiene fatture con `ai_confidence = 0` o `raw_data.error`, mostrare toast più chiaro:
  - “Il file è stato caricato ma l’estrazione AI è fallita”
- Così non sembra che la categorizzazione sia stata eseguita correttamente.

5. Verifica finale
- Testare con:
  - 1 PDF fattura emessa
  - 1 PDF fattura ricevuta
  - 1 immagine JPG/PNG
  - 1 XML
- Controllare che:
  - importi siano valorizzati
  - tipo fattura resti coerente con l’override
  - categoria venga assegnata o fallbackata correttamente
  - i casi falliti mostrino errore chiaro

Dettaglio tecnico
- File critico:
  - `supabase/functions/process-invoice/index.ts`
- Punto esatto del bug:
  - `extractInvoiceWithAI(...)`
  - costruzione payload con `image_url: data:application/pdf;base64,...`
- Evidenza raccolta:
  - network requests a `process-invoice`: risposta con `AI error: 400`
  - edge logs `process-invoice`: `Invalid MIME type. Only image types are supported.`

Impatto collaterale da valutare
- Ho visto pattern simile anche in `process-bank-statement`, che usa `image_url` con `data:${mimeType};base64,...`.
- Se carica PDF anche lì, è probabile che lo stesso problema possa colpire anche l’estrazione estratti conto PDF.
- Quando implemento la fix, conviene allineare anche quella function.

Esito
- La causa è chiara e riproducibile.
- Non è un problema di chiave API o di autenticazione.
- È una incompatibilità nel modo in cui i PDF vengono inviati al provider AI.

<lov-actions>
<lov-suggestion message="Testa end-to-end il caricamento di una fattura PDF, una JPG e una XML dopo la correzione per verificare lettura e categorizzazione AI.">Verifica che funzioni</lov-suggestion>
<lov-suggestion message="Correggi process-invoice per gestire i PDF con un flusso AI compatibile invece di inviarli come image_url con MIME application/pdf.">Correggi parsing PDF AI</lov-suggestion>
<lov-suggestion message="Applica la stessa verifica e correzione anche a process-bank-statement per evitare lo stesso errore sui PDF degli estratti conto.">Allinea estratti conto PDF</lov-suggestion>
<lov-suggestion message="Mostra un toast esplicito in Fatture quando il file viene caricato ma l’estrazione AI fallisce, invece di sembrare un successo completo.">Migliora messaggi errore</lov-suggestion>
</lov-actions>
