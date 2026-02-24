

# Fix: Invisible Toast Notifications (Post-Previous Fix)

## Problem

When the Radix `<Toaster />` was removed in the previous fix to resolve the white screen freeze, **15 files still use the old Radix toast system** (`useToast`/`toast` from `@/hooks/use-toast`). Since no Radix `<Toaster />` renders anymore, all those notifications are now **invisible** -- including critical ones like login error messages on the Auth page.

## Affected Files (13 files to migrate)

1. `src/pages/Auth.tsx` -- Login/signup error and success messages
2. `src/pages/Fatture.tsx` -- Invoice-related notifications
3. `src/pages/Collegamenti.tsx` -- Integration connection messages
4. `src/pages/AIAssistant.tsx` -- AI assistant feedback
5. `src/components/conti-bancari/UploadStatementModal.tsx` -- File upload feedback
6. `src/components/conti-bancari/ConnectBankModal.tsx` -- Bank connection messages
7. `src/components/fatture/CassettoFiscaleModal.tsx` -- Fiscal drawer messages
8. `src/components/fatture/InvoiceUploadZone.tsx` -- Invoice upload feedback
9. `src/components/scadenzario/DeadlineList.tsx` -- Deadline action feedback
10. `src/components/scadenzario/DeadlineModal.tsx` -- Deadline create/edit feedback
11. `src/components/area-economica/ContoEconomicoTab.tsx` -- Economic analysis feedback
12. `src/hooks/useBankingIntegration.ts` -- Banking integration feedback
13. `src/hooks/useEnableBanking.ts` -- Enable banking feedback

Two files are toast system infrastructure and don't need migration:
- `src/components/ui/use-toast.ts` (re-export file)
- `src/components/ui/toaster.tsx` (unused Radix renderer)

## Migration Pattern

The Radix toast API uses an object-based call:
```typescript
// OLD (Radix) - no longer renders
const { toast } = useToast();
toast({ title: "Error", description: "Something failed", variant: "destructive" });
```

The Sonner API uses a simpler function call:
```typescript
// NEW (Sonner) - renders correctly
import { toast } from "sonner";
toast.error("Something failed");
toast.success("Done!");
toast("Info message", { description: "Details here" });
```

## Migration Rules

For each file:
1. Replace `import { useToast } from "@/hooks/use-toast"` with `import { toast } from "sonner"`
2. Remove the `const { toast } = useToast()` line
3. Convert each toast call:
   - `variant: "destructive"` becomes `toast.error(title, { description })`
   - Success messages become `toast.success(title, { description })`
   - Info/default messages become `toast(title, { description })`

## Additional Fix

The `/piani` link in `LandingFooter.tsx` was already verified -- it doesn't contain a `/piani` link, so no change needed there.

## Technical Details

No new dependencies needed. Sonner is already installed and the `<Sonner />` component is already rendered in `App.tsx`. This is purely a find-and-replace migration across 13 files, converting from one toast API to another.

