# Keeping Up with the Joneses promotional captures

These are authentic gameplay captures from the live release build at
`https://keepingup.snackpackuniverse.com/`, not concept art. They were taken by
`scripts/capture-keeping-up.mjs`, which drives the real game through onboarding
into Week 1 on fixed seed `20260830` (the engine is deterministic, so the same
seed reproduces the same board).

- `keeping-up-gameplay-desktop.*`: 1440 x 900, desktop layout, Week 1 board.
- `keeping-up-gameplay-mobile.*`: 768 x 1024, responsive compact layout.
- WebP is the preferred delivery format. The PNG fallback is palette-quantised
  to 256 colours, because the city groundplate is photographic and a full-colour
  PNG costs ~7x the WebP for a file only pre-WebP browsers ever fetch.

Refresh with `node scripts/capture-keeping-up.mjs` when the HUD, the city
groundplate or the product claims change materially. Keep promotional text in
HTML rather than baking it into the image.
