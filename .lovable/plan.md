
## Add "Paese" and "Tipo di conto" filters to Enable Banking bank selection

Currently the Enable Banking bank selection screen only shows a search bar ("Cerca banca"). The user wants two additional filters:

1. **Paese (Country)** -- a dropdown to select which country's banks to load (currently hardcoded to "IT")
2. **Tipo di conto (Account type)** -- a selector for personal vs business accounts (maps to the existing `psu_type` parameter: "personal" or "business")

### Changes

**File: `src/components/conti-bancari/ConnectBankModal.tsx`**

- Add two new state variables: `selectedCountry` (default "IT") and `psuType` (default "personal")
- Add a row with two `Select` dropdowns above the search bar in the Enable Banking bank selection section:
  - **Paese**: Italy (IT), Germany (DE), France (FR), Spain (ES), Netherlands (NL), etc. -- common European countries supported by Enable Banking PSD2
  - **Tipo di conto**: Personale / Aziendale
- When country changes, re-fetch the ASPSP list via `getASPSPs(selectedCountry)`
- Pass `psuType` to `handleSelectBank` which already forwards it to `startAuth`
- Reset `selectedCountry`, `psuType` in `handleClose` and `handleRetry`

### Technical details

- Use the existing `@/components/ui/select` (Radix Select) for both dropdowns
- The `getASPSPs` function already accepts a `country` parameter
- The `startAuth` function already accepts a `psuType` parameter (defaults to "personal")
- The ASPSP list will reload via useEffect when country changes
- Country list will include the main Enable Banking supported countries: IT, DE, FR, ES, NL, AT, BE, PT, FI, IE
