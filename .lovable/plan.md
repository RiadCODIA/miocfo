

## Piano: Correggere il Flusso Enable Banking - Redirect al Login

### Problema Identificato

Ci sono due problemi principali che causano il redirect alla pagina di login dopo la connessione bancaria:

1. **URL di Redirect Non Consentito**: Quando l'utente e sulla URL di preview (`id-preview--xxx.lovable.app`), l'app invia questa URL a Enable Banking come redirect_uri. Ma solo la URL pubblicata (`insight-buddy-09.lovable.app/conti-bancari`) e whitelisted nel dashboard di Enable Banking. Questo causa l'errore `REDIRECT_URI_NOT_ALLOWED`.

2. **Race Condition nella Sessione**: Anche quando il flusso funziona (dalla URL pubblicata), quando l'utente torna dalla banca:
   - La pagina fa un full reload
   - Supabase deve ripristinare la sessione dal localStorage
   - Il `ProtectedRoute` potrebbe controllare `user` prima che la sessione sia ripristinata
   - Se `user` e `null` durante questo momento, l'utente viene reindirizzato a `/auth`

### Soluzione

#### 1. Forzare l'uso della URL Pubblicata per Enable Banking
**File: `src/components/conti-bancari/ConnectBankModal.tsx`**

Modificare `getRedirectUri()` per usare sempre la URL pubblicata, non la URL corrente:

```tsx
const getRedirectUri = useCallback(() => {
  // Enable Banking richiede che il redirect_url sia pre-whitelisted.
  // Usiamo sempre la URL pubblicata per garantire compatibilita.
  const PUBLISHED_URL = "https://insight-buddy-09.lovable.app";
  return `${PUBLISHED_URL}/conti-bancari`;
}, []);
```

#### 2. Migliorare il ProtectedRoute per OAuth Callback
**File: `src/components/auth/ProtectedRoute.tsx`**

Il problema attuale e che `hasOAuthCode` viene verificato DOPO `loading`, ma potrebbe comunque fallire se la sessione non e ancora pronta. Migliorare la logica:

```tsx
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, isDemoMode } = useAuth();
  const location = useLocation();

  // Check if this is an OAuth callback (Enable Banking returns with ?code=)
  const urlParams = new URLSearchParams(location.search);
  const hasOAuthCode = urlParams.has("code");

  // Durante il loading, mostra sempre lo spinner
  // Questo e critico per i callback OAuth dove la sessione sta venendo ripristinata
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">
            {hasOAuthCode ? "Collegamento banca in corso..." : "Caricamento..."}
          </p>
        </div>
      </div>
    );
  }

  // Se c'e un OAuth code, permettere l'accesso anche senza user
  // Il ConnectBankModal gestiira il code e completera la sessione
  if (!user && !isDemoMode && !hasOAuthCode) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
```

#### 3. Gestire il Callback OAuth nel ConnectBankModal con Retry
**File: `src/components/conti-bancari/ConnectBankModal.tsx`**

Migliorare la gestione del callback per aspettare che la sessione sia disponibile:

```tsx
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const authCode = urlParams.get("code");

  if (authCode) {
    // Remove params from URL immediately
    window.history.replaceState({}, document.title, window.location.pathname);

    // Complete the session with the authorization code
    setStep("connecting");
    onOpenChange(true);

    // Funzione per completare con retry
    const completeWithRetry = async (retries = 3) => {
      try {
        const accounts = await completeSession(authCode);
        setConnectedAccounts(accounts);
        setStep("success");
      } catch (error) {
        console.error("Failed to complete session:", error);
        
        // Se l'errore e dovuto alla sessione non pronta, riprova
        if (retries > 0 && error instanceof Error && 
            (error.message.includes("session") || error.message.includes("auth"))) {
          console.log(`Retrying in 1 second... (${retries} retries left)`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return completeWithRetry(retries - 1);
        }
        
        setErrorMessage(error instanceof Error ? error.message : "Errore nel collegamento");
        setStep("error");
      }
    };

    completeWithRetry();
  }
}, [completeSession, onOpenChange]);
```

### Riepilogo Modifiche

| File | Modifica |
|------|----------|
| `ConnectBankModal.tsx` | Usare URL pubblicata fissa per redirect_uri |
| `ConnectBankModal.tsx` | Aggiungere retry logic per callback OAuth |
| `ProtectedRoute.tsx` | Mostrare messaggio specifico durante callback OAuth |

### Risultato Atteso

1. Il redirect_uri sara sempre `https://insight-buddy-09.lovable.app/conti-bancari` (whitelisted)
2. Dopo l'autenticazione bancaria, l'utente tornera alla URL pubblicata
3. Il modal mostrera "Collegamento banca in corso..." mentre la sessione viene ripristinata
4. I conti verranno salvati con l'user_id corretto
5. L'utente vedra i suoi conti collegati senza essere reindirizzato al login

### Nota Importante per l'Utente

Dopo questa modifica, il flusso Enable Banking funzionera solo dalla **URL pubblicata** (`insight-buddy-09.lovable.app`). Se testi dalla preview, sarai comunque reindirizzato alla URL pubblicata dopo l'autenticazione bancaria.

