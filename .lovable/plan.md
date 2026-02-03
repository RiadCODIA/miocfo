

# Fix: Permettere il Caricamento della Lista Banche in Demo Mode

## Obiettivo

Consentire agli utenti in Demo Mode di visualizzare la lista delle banche disponibili (scopo dimostrativo), bloccando però le azioni che richiedono autenticazione reale (collegamento, sincronizzazione).

## Problema Identificato

Il hook `useEnableBanking.ts` blocca **tutte** le chiamate all'Edge Function se non c'è una sessione valida, incluse le azioni pubbliche (`get_aspsps`, `create_session`) che l'Edge Function permette senza autenticazione.

## Soluzione Proposta

### 1. Modificare `useEnableBanking.ts`

Aggiornare la funzione `callEnableBankingFunction` per distinguere tra:
- **Azioni pubbliche** (`get_aspsps`, `create_session`): non richiedono token, permettono l'esperienza demo
- **Azioni protette** (`get_accounts`, `sync_account`, ecc.): richiedono autenticazione reale

```typescript
const callEnableBankingFunction = useCallback(
  async (action: string, params: Record<string, unknown> = {}) => {
    const publicActions = ["get_aspsps", "create_session"];
    const { data: { session } } = await supabase.auth.getSession();

    // Solo azioni protette richiedono sessione
    if (!publicActions.includes(action) && !session?.access_token) {
      throw new Error("Autenticazione richiesta. Effettua il login per utilizzare i conti bancari.");
    }

    // Usa token se disponibile, altrimenti anon key per azioni pubbliche
    const authToken = session?.access_token || anonKey;
    // ... resto della chiamata
  },
  []
);
```

### 2. Aggiornare `ConnectBankModal.tsx`

Mostrare un avviso chiaro agli utenti Demo quando tentano di procedere al collegamento:

```tsx
// Prima di handleProceed, verificare isDemoMode
const { isDemoMode } = useAuth();

const handleProceed = async () => {
  if (isDemoMode) {
    toast({
      title: "Modalità Demo",
      description: "Per collegare un conto bancario reale, effettua il login con email e password.",
      variant: "destructive",
    });
    return;
  }
  // ... resto della logica
};
```

## File da Modificare

| File | Modifica |
|------|----------|
| `src/hooks/useEnableBanking.ts` | Permettere azioni pubbliche senza sessione |
| `src/components/conti-bancari/ConnectBankModal.tsx` | Aggiungere controllo Demo mode e messaggio |

## Risultato Atteso

- **Utenti Demo**: Possono esplorare la lista banche ma vedono un messaggio chiaro quando tentano di collegare
- **Utenti Autenticati**: Flusso completo di collegamento funzionante
- **UX migliorata**: L'app mostra le funzionalità disponibili anche in modalità demo

## Nota Importante

Il collegamento bancario **richiede un account reale** perché:
1. Enable Banking associa i conti a un `user_id` specifico
2. I dati (saldi, transazioni) vengono salvati nel database sotto quel profilo
3. Il consenso PSD2 è personale e legato all'utente

