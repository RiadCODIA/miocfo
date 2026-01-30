
## Problema: Redirect Enable Banking non funziona con dominio custom

### Cosa sta succedendo
Quando inizi il collegamento bancario dal tuo dominio custom, il sistema invia a Enable Banking un redirect URL fisso (`https://insight-buddy-09.lovable.app/conti-bancari`). Dopo l'autenticazione in banca:

1. La banca ti reindirizza verso `insight-buddy-09.lovable.app` (non il tuo dominio)
2. Ma tu eri loggato sul tuo dominio custom → la sessione Supabase non è condivisa tra domini diversi
3. Oppure la banca blocca il redirect perché il tuo dominio custom non è nella loro whitelist

### Soluzione
Aggiornare l'applicazione per usare **dinamicamente l'URL corrente** come redirect, e registrare il tuo dominio custom nel dashboard Enable Banking.

---

## Modifiche tecniche richieste

### 1. Modificare `ConnectBankModal.tsx` per usare l'URL dinamico

**File:** `src/components/conti-bancari/ConnectBankModal.tsx`

Il codice attuale usa un URL hardcoded:
```typescript
const PUBLISHED_URL = "https://insight-buddy-09.lovable.app";
return `${PUBLISHED_URL}/conti-bancari`;
```

Modifica per usare l'origin corrente:
```typescript
const getRedirectUri = useCallback(() => {
  // Usa l'URL corrente (supporta dominio custom, preview e published)
  return `${window.location.origin}/conti-bancari`;
}, []);
```

### 2. Azione manuale richiesta: Registrare il dominio custom in Enable Banking

Devi accedere al **dashboard Enable Banking** e aggiungere il tuo dominio custom alla whitelist dei redirect URL:

1. Vai su [Enable Banking Dashboard](https://enablebanking.com/)
2. Accedi con le credenziali della tua applicazione
3. Trova la sezione **Redirect URLs** o **Allowed Origins**
4. Aggiungi: `https://TUODOMINIO.COM/conti-bancari` (sostituisci con il tuo dominio reale)
5. Salva le modifiche

**Nota:** Senza questa registrazione, Enable Banking bloccherà i redirect verso il tuo dominio custom.

---

## Riepilogo file coinvolti

| File | Modifica |
|------|----------|
| `src/components/conti-bancari/ConnectBankModal.tsx` | Usare `window.location.origin` invece di URL hardcoded |

## Cosa dovrai fare tu

1. Dopo che applico la modifica, **registra il tuo dominio custom** nel dashboard Enable Banking
2. Testa il flusso dal tuo dominio custom
3. Se la banca ti reindirizza correttamente al tuo dominio, il flusso dovrebbe completarsi

---

## Risultato atteso

Dopo le modifiche:
- Inizi il collegamento dal tuo dominio custom
- La banca ti reindirizza al tuo dominio custom (con `?code=...`)
- L'app riceve il codice e salva il conto collegato
