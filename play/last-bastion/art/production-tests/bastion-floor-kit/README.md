# Bastion floor kit — 16 October 2026

Eight generated floor variants and four transparent decals, retained with exact prompts and hashes.
The floor source is 1774×887; the decal source is 1254×1254. These are generation outputs, not 4K masters.
The tool interpreted the shared edge band as a broad border; the runtime therefore has a visible
modular panel grid. Keep this opt-in until motion and dense-combat review accept the treatment.

## Runtime pipeline

Run `powershell -File play/last-bastion/dev/scripts/prepare-floor-runtime.ps1` from the site root.
ImageMagick box downsampling creates a 1024×512 floor atlas (4×2, 256px cells) and 512×512
transparent decal atlas (2×2, 256px cells). Originals are untouched. The same script creates
512px pilot floors and a 256px pilot scuff. No derivative is labelled a new detailed master.

`floorpilot=kit&theme=bastion-standard&screen=game&seed=61061` loads the kit through the real
combat manifest. A deterministic integer hash selects weighted frames, favouring quieter plates.
Each floor cell spans four collision tiles; partial edge cells are cropped. World geometry is
unchanged. Decals retain deterministic placement and low alpha below hazards. Normal gameplay
continues to use the existing floor, and does not fetch this kit or the A/B pilot textures.

Floor and decals cost approximately 2 MiB and 1 MiB decoded RGBA before engine overhead.
The kit does not need the pilot TileSprite power-of-two backing texture. Download bytes and
per-frame alpha bounds are recorded in the inventory and geometry reports.

## Review evidence

Full HD/4K captures: `playtest-evidence/2026-10-16-screens-auto/floor-kit-affinity-*.png`.
Static captures show legible actors, pickups and HUD. Hardware pacing, colour-vision modes,
dense motion and final art acceptance remain open; the kit is not the default floor.
