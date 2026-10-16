# Bastion floor pilot — 16 October 2026

Two original floor sources and one transparent scuff decal, generated with the built-in image tool.
Exact prompts, dimensions, hashes and transparency requests are in `generation-record.json`.
Sources are retained untouched. The tool returned 1254×1254 images despite the preferred 1024 size.
No upscaled derivative is presented as an authored high-resolution master.

## Runtime contract

- Floor A and B: one frame each, source 1254×1254, logical material repeat 256×256.
- Scuff: one frame, source 1254×1254, logical size 64×64, transparent background preserved.
- `GameAssetManifest.ts` records source slicing separately from logical size. Vite copies sources
  into `game-assets/`; original filenames remain stable. This pilot deliberately uses exact source
  PNGs; optimized release derivatives are still an implementation task before default adoption.
- The floor material repeats over four collision tiles using a single tile sprite. Collision,
  obstacles, boundaries, movement, arena size and hazard geometry are unchanged.
- Scuffs reuse deterministic decal placement at low alpha. Variants are compared separately;
  this is not yet an edge-compatible mixed-tile kit.
- Normal theme selection does not include either pilot. Combat loads only the requested variant
  and scuff; it does not preload both pilot floors for normal play.

## Review routes

Use `/play/last-bastion/?screen=game&theme=bastion-standard&seed=61061&floorpilot=a`
or replace `a` with `b`. Omit `floorpilot` for the production baseline.
Full HD/4K captures are in `../../../playtest-evidence/2026-10-16-screens-auto/`
(relative path from the game root is `playtest-evidence/2026-10-16-screens-auto/`).

## Acceptance status

In-context captures show broader, quieter panels than the original dense square grid, with player,
enemies and projectiles visible. Repetition is still noticeable; these remain candidates. Native
motion, dense-combat readability, edge continuity and hardware GPU cost have not been signed off.
The normal floor is not replaced. Do not expand to eight tiles/four decals until the pilot earns it.
At 1254² RGBA, each decoded source is about 6 MiB before engine allocations; the repeating
material may require an additional power-of-two backing texture. Profile and create appropriately
sized runtime derivatives before default adoption. PNG file size is not GPU-memory usage.
