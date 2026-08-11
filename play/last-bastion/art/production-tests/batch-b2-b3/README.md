# Regional Boss Production Batches B2–B3

Generated with the built-in image-generation tool on 11 August 2026 after both mechanics contracts
landed. Flat chroma masters and locally extracted alpha masters are retained beside exact runtime
atlases. Combat timing, body positions, collision, pulse radii, safe zones, summon placement, and
buff values remain code-owned.

## Runtime contracts

| Stable ID | Runtime file | Grid | Cell | Frames |
|---|---|---:|---:|---:|
| `the-choir-v1` | `the-choir-spritesheet-v1-192.png` | 4×3 | 192×192 | 12 |
| `the-choir-effects-v1` | `the-choir-effects-v1-128.png` | 4×2 | 128×128 | 8 |
| `the-choir-portrait-v1` | `the-choir-portrait-v1-256.png` | single | 256×256 | 1 |
| `foundry-sovereign-v1` | `foundry-sovereign-spritesheet-v1-192.png` | 4×3 | 192×192 | 12 |
| `foundry-sovereign-effects-v1` | `foundry-sovereign-effects-v1-128.png` | 4×2 | 128×128 | 8 |
| `foundry-sovereign-portrait-v1` | `foundry-sovereign-portrait-v1-256.png` | single | 256×256 | 1 |

Choir rows are linked idle, warned pulse, and merged apex. Its effects are voice collapse, merge,
pulse onset, pulse impact, flood accent, safe-boundary sparks, defeat, and arrival. Sovereign rows
are cooldown, warning, and fabrication. Its effects are warning, shutter opening, drone assembly,
turret assembly, low/max summon buff, Shock hit, and shutdown.

## Final prompt set

- **Choir body:** exact 4×3 single-voice sheet derived from Brain Blob and Bastion Eater references;
  violet neural mass, ivory tuning-fork chitin, cyan synapses, and an amber eye. The game positions
  three instances from the shared-health snapshot rather than baking their triangle into pixels.
- **Choir effects/portrait:** eight isolated harmonic accents and one merged-apex close portrait.
  No baked hazard radius or full-arena overlay.
- **Sovereign body:** exact 4×3 immobile fortress-core sheet derived from Foundry Fabricator and
  Assembly Prime references; cream ceramic armour, charcoal steel, amber forges, cyan vulnerable core.
- **Sovereign effects/portrait:** eight isolated fabrication/buff/Shock/shutdown accents and one
  active-core close portrait. No baked summons, ranges, spawn points, or UI.

All prompts prohibited text, watermarks, shadows, ground planes, UI, and baked gameplay geometry.

## Review

- Gallery: `?mode=gallery&batch=boss-b2-b3`
- Choir: `?scenario=the-choir&loadout=vertical`
- Sovereign: `?scenario=foundry-sovereign&loadout=vertical`
