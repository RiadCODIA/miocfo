
## Abilitare AI nella sezione Fatture

La funzione edge `process-invoice` esiste gia con la logica AI (Lovable AI Gateway + Gemini), ma ha due problemi critici che le impediscono di funzionare:

### Problema 1: URL Supabase sbagliato nel frontend

Il file `Fatture.tsx` chiama un URL hardcoded errato:
- Attuale: `https://ublsnradzhfpqhunfqbn.supabase.co`
- Corretto: `https://yzhonmuhywdiqaxxbnsj.supabase.co`

Questo significa che ogni upload di fattura fallisce perche punta a un progetto Supabase diverso.

### Problema 2: Funzione non registrata in config.toml

`process-invoice` non e presente in `supabase/config.toml`, quindi potrebbe non essere deployata o avere JWT verification attiva (che blocca le chiamate senza token).

### Cosa faro

**1. Aggiornare `supabase/config.toml`**
- Aggiungere `[functions.process-invoice]` con `verify_jwt = false`

**2. Correggere gli URL in `src/pages/Fatture.tsx`**
- Sostituire l'URL hardcoded con `import.meta.env.VITE_SUPABASE_URL` (linee 113-114 e 301-302)
- Questo garantisce che punti sempre al progetto corretto

**3. Deployare la edge function**
- Deploy di `process-invoice` per assicurarsi che sia attiva

### Risultato

Dopo queste modifiche:
- Upload di PDF/immagini fatture funzionera con estrazione AI (Gemini 2.5 Flash)
- Upload CSV funzionera con parsing automatico
- Il riprocessamento fatture funzionera
- I dati estratti (numero fattura, fornitore, importo, data) verranno salvati nel database
