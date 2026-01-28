

## Piano: Correggere il flusso OAuth Enable Banking

### Problema
Dopo l'autenticazione con la banca tramite Enable Banking, l'utente viene reindirizzato alla pagina di login invece di vedere il conto collegato. Questo succede per tre motivi:

1. **Race condition**: Il `ProtectedRoute` verifica la sessione prima che venga ripristinata dal localStorage dopo il full page reload
2. **User ID mancante**: L'edge function non associa i conti all'utente autenticato
3. **RLS Policy**: I conti senza `user_id` non sono visibili all'utente per via delle policy RLS

### Soluzione

#### 1. Modificare ProtectedRoute per gestire il callback OAuth
**File: `src/components/auth/ProtectedRoute.tsx`**

Aggiungere logica per riconoscere quando l'URL contiene un `code` parameter (callback OAuth) e permettere l'accesso temporaneo mentre la sessione viene ripristinata:

```tsx
// Riconoscere callback Enable Banking
const urlParams = new URLSearchParams(window.location.search);
const hasOAuthCode = urlParams.has("code");

// Se c'è un code OAuth, aspettare che loading finisca prima di reindirizzare
if (loading) {
  return <LoadingSpinner />;
}

// Permettere accesso temporaneo se c'è callback OAuth anche senza user
if (!user && !isDemoMode && !hasOAuthCode) {
  return <Navigate to="/auth" replace />;
}
```

#### 2. Passare user_id all'edge function
**File: `src/hooks/useEnableBanking.ts`**

Modificare `callEnableBankingFunction` per includere esplicitamente l'user_id nella chiamata:

```tsx
const callEnableBankingFunction = useCallback(
  async (action: string, params: Record<string, unknown> = {}) => {
    // Ottieni la sessione corrente
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    const { data, error } = await supabase.functions.invoke("enable-banking", {
      body: { action, user_id: userId, ...params },
    });
    // ...
  },
  []
);
```

#### 3. Salvare user_id nell'edge function
**File: `supabase/functions/enable-banking/index.ts`**

Modificare la funzione `completeSession` per:
- Estrarre l'user_id dal JWT dell'utente (header Authorization)
- Salvarlo nel campo `user_id` della tabella `bank_accounts`

```typescript
// Nel main handler, estrarre user_id dall'Authorization header
const authHeader = req.headers.get("Authorization");
let userId: string | null = null;

if (authHeader?.startsWith("Bearer ")) {
  const token = authHeader.replace("Bearer ", "");
  const { data: { user } } = await supabase.auth.getUser(token);
  userId = user?.id ?? null;
}

// Passare userId a completeSession
const result = await completeSession(code, userId);

// In completeSession, usare userId
const accountData = {
  user_id: userId, // Aggiungere questa riga
  plaid_account_id: account.uid,
  // ... resto dei campi
};
```

#### 4. Rimuovere gestione duplicata del callback
**File: `src/pages/ContiBancari.tsx`**

Rimuovere l'useEffect che gestisce il `code` parameter, dato che viene già gestito da `ConnectBankModal.tsx`:

```tsx
// RIMUOVERE questo useEffect
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const authCode = urlParams.get("code");
  
  if (authCode) {
    // ... questa logica duplicata va rimossa
  }
}, []);

// MANTENERE solo:
useEffect(() => {
  fetchAccounts();
}, [fetchAccounts]);
```

### Risultato Atteso
1. Dopo l'autenticazione con la banca, l'utente torna su `/conti-bancari` senza essere reindirizzato a `/auth`
2. Il modal mostra lo stato "Collegamento in corso..." e poi "Connessione riuscita!"
3. I conti vengono salvati con il `user_id` corretto e sono visibili all'utente
4. Le RLS policies funzionano correttamente per isolare i dati tra utenti

### File da Modificare
1. `src/components/auth/ProtectedRoute.tsx` - Gestire callback OAuth
2. `src/hooks/useEnableBanking.ts` - Passare user_id
3. `supabase/functions/enable-banking/index.ts` - Salvare user_id nei conti
4. `src/pages/ContiBancari.tsx` - Rimuovere gestione duplicata

