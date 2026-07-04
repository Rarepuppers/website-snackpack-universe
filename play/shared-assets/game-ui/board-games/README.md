# Board Game UI Assets

Canonical board-game UI artwork for SnackPack web games and mobile Brain Games apps.

Run from the repo root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/generate-board-game-assets.ps1
```

The generator writes:

- `shared-assets/game-ui/board-games/board-game-icons.png` - canonical CSS sprite sheet.
- `shared-assets/game-ui/board-games/png/*.png` - individual transparent PNG exports.
- `website-snackpack-universe/play/sprites/board-game-icons.png` - website runtime sprite.
- `apps/*/assets/game-ui/board-games/*.png` - React Native `require(...)` exports.

Treat this folder as the source of truth. Do not edit the generated app or website copies directly.
