# Card Deck UI Assets

Canonical reusable playing-card artwork for SnackPack card games.

Run from the repo root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/generate-card-deck-assets.ps1
```

Exports:

- `suits/*.png` - transparent suit sprites.
- `backs/*.png` - card backs for free and Pro-ready themes.
- `faces/classic/*.png` - full classic card-face PNGs.
- App copies under `apps/*/assets/game-ui/card-decks/`.
- `deck-registry.json` - the canonical free/pro deck registry.
- `manifest.json` - generated dimensions, pack listings, and deferred wiring notes.

Recommended deck structure:

- Free baseline: one readable classic face deck plus two or three polished free backs.
- Pro baseline: several premium card backs first, because these are low-risk to expose in existing card-back pickers.
- Later Pro upgrade: alternate full face decks only after the games share a common card-face renderer.
- Keep procedural text/card rendering available for compact layouts, accessibility scaling, and existing theme choices.

Generated free backs:

- Felt Green
- Classic Navy
- SnackPack Gold

Generated Pro backs:

- Royal Plum
- Midnight Neon
- Marble Rose
- Emerald Arcade
- Obsidian Star

Deferred final wiring task:

- Wire every card game in Brain Games Vol 1, Vol 2, Vol 3, and the website to the shared deck registry.
- Keep shared assets canonical in `shared-assets/game-ui/card-decks` and sync/copy outward.
- Audit each game for the correct surface: full face PNGs for large cards, suit sprites for compact cards, PNG backs for stock/facedown piles and card-back pickers.
