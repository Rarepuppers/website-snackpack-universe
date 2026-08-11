# Elite Batch E1

Generated with the built-in image-generation tool on 11 August 2026, using each ordinary-family
sprite sheet as an edit-layout reference. Flat magenta masters are retained beside the alpha masters;
runtime PNG sheets were resized to the exact inherited frame contracts and encoded losslessly to WebP.

## Final prompt set

- **Ironhide Abomination:** preserve the Abomination's exact 4x3 poses, facing, placement, camera,
  proportions, and padding; add asymmetrical rust-bronze shoulder, forearm, torso, jaw, and knuckle
  plating plus separated pale adaptive nodes; retain visible corrupted flesh.
- **Splitcaller Weaver:** preserve the Nest Weaver's exact 4x8 contract; divide the brood into two
  raised halves with a central fissure, forked crown silhouette, and violet seams; retain machine-insect
  legs and dark armour.
- **Voltaic Warden:** preserve the Arc Warden's exact 4x8 contract; add symmetric cyan/amber Tesla
  prongs, a forked ceramic conductor crown, wider transformer shoulders, and paired emissive rails.
- **Elemental upgrade tiles:** one 2x2 industrial-brass UI atlas: Incendiary Rounds as three cartridges
  in a flame helix, Cryo Coating as a frozen cartridge, Chain Lightning as three linked nodes, and
  Corrosive Rounds as an acid-eaten cartridge and shield. No text; one stable silhouette per cell.
- **Dash/puddle effects:** one 4x2 isolated atlas: Razorlord launch, streak, impact, recovery followed
  by Blightspitter impact, puddle onset, active bubbles, and dissipation. No baked timing or radius.

All prompts required the established gritty painted sprite style, isolated cells, no text or baked
telegraphs, and a perfectly uniform `#ff00ff` background for local alpha removal. Runtime geometry,
damage, collision, and warning lanes remain code-owned.

## Runtime contracts

| Asset | Cell | Grid | Frames |
|---|---:|---:|---:|
| `ironhide-abomination-spritesheet-v1-128` | 128x128 | 4x3 | 12 |
| `splitcaller-weaver-spritesheet-v1-192` | 192x192 | 4x8 | 32 |
| `voltaic-warden-spritesheet-v1-128` | 128x128 | 4x8 | 32 |
| `elemental-upgrade-tile-atlas-v1-128` | 128x128 | 2x2 | 4 |
| `elite-dash-puddle-effects-v1-128` | 128x128 | 4x2 | 8 |

`normalize_atlases.py` also exports the four upgrade cells to the static Codex's stable
`game-assets/tiles/upg-<id>-v1.png` contract. Both assets were generated in built-in image-generation
mode from the canonical perk-tile and enemy-effect references; chroma and alpha masters are retained.
