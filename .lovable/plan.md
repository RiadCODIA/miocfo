

## Piano: Correggere il tipo di PSU per conti aziendali

### Problema Identificato
La sincronizzazione fallisce con `ASPSP_ERROR` perché stiamo inviando `psu_type: "personal"` a Enable Banking, ma stai collegando un **conto aziendale**. Alcune banche (come BCC di Cherasco) richiedono che il parametro `psu_type` corrisponda correttamente al tipo di conto.

Dalla documentazione Enable Banking API (`POST /auth`):
```json
{
  "psu_type": "business"  // oppure "personal"
}
```

### Soluzione Proposta
Aggiungere la possibilità di selezionare il tipo di conto (personale/aziendale) nel modal di connessione, e passare il valore corretto a Enable Banking.

---

## Modifiche Tecniche

### 1. Modal di Connessione: Aggiungere selezione tipo conto
**File:** `src/components/conti-bancari/ConnectBankModal.tsx`

Aggiungere un selector per il tipo di conto (Privato / Aziendale) nella schermata di selezione banca, prima del pulsante "Continua":

```typescript
// Nuovo stato
const [psuType, setPsuType] = useState<"personal" | "business">("business"); // Default business

// Nuova UI - Radio buttons o Select
<div className="space-y-2">
  <Label>Tipo di conto</Label>
  <Select value={psuType} onValueChange={(v) => setPsuType(v as "personal" | "business")}>
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="personal">Conto Privato</SelectItem>
      <SelectItem value="business">Conto Aziendale</SelectItem>
    </SelectContent>
  </Select>
</div>
```

Passare `psuType` alla funzione `createSession`.

---

### 2. Hook Enable Banking: Passare psu_type
**File:** `src/hooks/useEnableBanking.ts`

Modificare `createSession` per accettare e passare il parametro `psu_type`:

```typescript
const createSession = useCallback(
  async (
    redirectUri: string,
    aspspCountry?: string,
    aspspName?: string,
    psuType?: "personal" | "business"  // Nuovo parametro
  ): Promise<{ session_id: string; authorization_url: string }> => {
    // ...
    const data = await callEnableBankingFunction("create_session", {
      redirect_uri: redirectUri,
      aspsp_country: aspspCountry,
      aspsp_name: aspspName,
      psu_type: psuType || "personal",  // Passa il tipo
    });
    return data;
  },
  [callEnableBankingFunction]
);
```

---

### 3. Edge Function: Usare psu_type dinamico
**File:** `supabase/functions/enable-banking/index.ts`

**A. Aggiornare l'interfaccia request:**
```typescript
interface EnableBankingRequest {
  action: string;
  // ... altri campi
  psu_type?: "personal" | "business";
}
```

**B. Modificare la funzione `createSession`:**
```typescript
async function createSession(
  redirectUri: string,
  aspspCountry: string,
  aspspName: string,
  psuType: string = "personal"  // Nuovo parametro con default
): Promise<{ session_id: string; authorization_url: string }> {
  const authData = {
    access: {
      valid_until: validUntil,
    },
    aspsp: {
      country: aspspCountry,
      name: aspspName,
    },
    state: crypto.randomUUID(),
    redirect_url: redirectUri,
    psu_type: psuType,  // Usa il valore passato invece di hardcodato "personal"
  };
  // ...
}
```

**C. Aggiornare il case switch:**
```typescript
case "create_session":
  // ...
  result = await createSession(
    body.redirect_uri, 
    body.aspsp_country, 
    body.aspsp_name, 
    body.psu_type || "personal"  // Passa psu_type
  );
  break;
```

---

## Riepilogo File da Modificare

| File | Modifica |
|------|----------|
| `src/components/conti-bancari/ConnectBankModal.tsx` | Aggiungere selector tipo conto (Privato/Aziendale) |
| `src/hooks/useEnableBanking.ts` | Passare `psu_type` a `create_session` |
| `supabase/functions/enable-banking/index.ts` | Usare `psu_type` dinamico invece di "personal" hardcodato |

---

## Test dopo la modifica
1. Elimina il conto BCC di Cherasco esistente
2. Clicca "Collega nuovo conto"
3. Seleziona Italia > BCC di Cherasco
4. **Seleziona "Conto Aziendale"** nel nuovo selector
5. Completa il flusso di autorizzazione
6. Verifica se la sincronizzazione ora funziona

---

## Nota
Se dopo questa modifica l'errore persiste, il problema è effettivamente lato banca (BCC di Cherasco potrebbe avere problemi temporanei con la loro implementazione PSD2). In quel caso, l'unica opzione è:
- Riprovare più tardi
- Contattare Enable Banking per verificare lo stato dell'integrazione con BCC di Cherasco
- Provare con un'altra banca per verificare che l'integrazione funzioni

