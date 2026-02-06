
# Replace Logo with New mioCFO Design

## Summary
Replace the current placeholder logo file with the new mioCFO logo image provided by the user.

## Changes Required

### 1. Copy New Logo to Project Assets
Copy the uploaded image to replace the existing logo file:
- Source: `user-uploads://image-2.png`
- Destination: `src/assets/miocfo-logo.png`

### 2. Icon Version for Collapsed Sidebar
The codebase also uses `miocfo-logo-icon.png` for the collapsed sidebar state. I'll use the same logo for now - you can provide a separate icon-only version (just the "CO" symbol) later if desired.

## Files Affected

| File | Change |
|------|--------|
| src/assets/miocfo-logo.png | Replace with new logo |
| src/assets/miocfo-logo-icon.png | Replace with new logo (same file for now) |

## No Code Changes Required
The import statements already reference these filenames, so only the image files need to be replaced.

## Where the Logo Appears
- Landing page header (LandingHeader.tsx)
- Landing page footer (LandingFooter.tsx)
- Auth page (Auth.tsx)
- App sidebar (Sidebar.tsx)
