# Last Bastion art bible

## Status

**Version:** 0.2

**Status:** In progress

**Visual anchor:** `art/concepts/marine-art-direction-v1.png`

This document records the reusable rules derived from the approved Marine concept. The representative pipeline now uses a 96 × 96 logical cell and four facings; final animation frame counts remain provisional until motion is playtested inside the Phaser prototype.

## Visual identity

Last Bastion uses colourful modern pixel art with a tense but adventurous science-fiction tone.

- Practical, constructed equipment rather than superhero or fantasy silhouettes
- Crisp pixel clusters and controlled detail
- Strong silhouettes at actual gameplay scale
- Selective highlights and emissive accents
- Premium effects that never hide hazards or enemy attacks
- Original shapes without recognisable franchise iconography

## Approved Marine direction

- Deep navy and charcoal base armour
- Small ivory armour panels
- Teal/cyan equipment lights
- Restrained safety-orange accents
- Warm amber visor
- Compact, slightly chunky proportions
- Practical backpack, ammunition, boots, and utility shapes
- A weapon silhouette clearly separated from the body

## Camera and directions

- Gameplay uses a high three-quarter view close to top-down.
- Movement is calculated in any direction.
- The first production test uses four visual facings: north, south, east, and west, stored in the sheet as south, north, east, west.
- East and west may share mirrored frames unless asymmetrical equipment makes mirroring visibly incorrect.
- Eight visual directions are added only if the four-direction test looks too abrupt during diagonal movement or dodge.
- Weapons rotate independently and therefore do not require the body to face the aiming direction.

## Modular character layers

The production character is assembled from independent layers:

1. Ground shadow and temporary state effects
2. Base body and baked-in boots
3. Helmet or hat overlay
4. Back equipment where required
5. Weapon ring, depth-sorted around the body
6. Front effects, damage flashes, and temporary shields

The equipment model is the source of truth for both gameplay and the dynamic loadout preview.

### Base body

Each hero needs a separate base-body sprite set because proportions, clothing, and hero identity differ. Heroes share animation names, timing conventions, collision rules, and attachment-point formats rather than sharing identical pixels.

### Helmet and hat overlays

- Headgear is drawn independently from the body.
- Every head item must support every production facing and required animation frame.
- Helmet frames align to a named head anchor exported with the body animation.
- Large hats may exceed the standard cell bounds but must not obscure hazards or the weapon ring.
- Hair and default head appearance belong to the base body or default head layer.

### Boots

Boots remain baked into the base body. A future footwear item may change statistics without changing the sprite. This avoids multiplying overlays across every movement and dodge frame for little in-game readability.

### Weapons

- Each equipped weapon has its own sprite, pivot, scale, muzzle point, and optional effect anchors.
- Weapons occupy calculated anchors around the hero rather than being painted into body frames.
- The renderer supports zero to twelve weapon records.
- The first gameplay test uses one weapon; the next readability test uses two to four.
- High counts may expand into a larger or staggered ring.
- Runtime depth sorting places weapons behind or in front of the body based on their current anchor position.
- Recoil and attack motion belong to the weapon, not the hero body.

## Required animation states

### Prototype body states

- `idle`
- `move`
- `dodge`
- `hit`
- `defeat`

### Run and sprint

The prototype uses one `move` animation across normal movement speeds. A separate `sprint` animation is created only if sprint becomes a distinct state with a different speed, stamina rule, silhouette, or tactical purpose.

Playing the move animation faster is sufficient for small temporary speed changes.

### Dodge, roll, slide, and dash

Dodge requires a separate animation because the silhouette must communicate its start, protected window, direction, and recovery.

All heroes use the same dodge input and shared action contract, but may use different presentation and later different profiles:

- Marine: compact combat roll
- Medic: controlled combat slide
- Scout: fast dash or short displacement effect
- Heavy heroes: braced shoulder rush

An `EvasiveMoveProfile` defines presentation, duration in seconds, distance in metres, invulnerability duration in seconds, travel curve, and future cooldown or charge rules. Hero-specific profiles may add diversity, but every evasive move must remain readable and fair.

The first Marine values are provisional:

| Secondary stat | Initial value |
| --- | ---: |
| Duration | 0.55 seconds |
| Distance | 4 metres |
| Invulnerability | 0.25 seconds |

These values exist to test the data path and animation timing. Playtesting owns final balance.

The prototype also uses a universal 0.75-second post-move recovery. It is displayed through a readiness bar but does not belong to the hero's three secondary stats.

The helmet overlay must include matching dodge frames. Weapons may briefly tighten toward the body, trail behind, or hide during the most compressed roll frames, but must return to their anchors predictably.

## Provisional animation economy

These values must be tested rather than treated as final:

| State | Initial target | Notes |
| --- | ---: | --- |
| Idle | 2–4 frames per facing | Breathing and equipment-light movement only |
| Move | 6 frames per facing | Reusable at several playback rates |
| Dodge | 6–8 frames per facing | Timing must match the gameplay profile |
| Hit | 1–2 frames per facing | Prefer tint/flash where possible |
| Defeat | 6–10 frames | May use one shared orientation if readable |

## Readability families

- Player: navy/ivory base with teal and orange identification accents
- Standard aliens: organic greens, violets, coral, or sickly yellow separated from player teal
- Enemy attacks: warm red/orange or high-contrast toxic colour depending on damage family
- Safe pickups: bright cyan, gold, or white with consistent shapes
- Slime hazards: saturated lime or chartreuse with a clear animated decay edge
- Interactive technology: cyan when available, amber when changing, red when hostile or disabled

Final colours require an arena-background test before approval.

## Enemy state-authored sheets

Enemy animation frames should correspond to simulation truth whenever a state affects player decisions.

- Egg Cluster frames are selected from hatch progress: dormant, pulsing, cracked, and ruptured.
- Brain Blob frames map directly to drift, wind-up, lunge, and recovery phases.
- Yellow warning light is reserved for an attack that has not yet become dangerous.
- Hot coral-pink identifies the Brain Blob's active lunge rather than its preparation.
- Directional attack sprites are authored facing east and rotated at runtime when full directional sheets add little value.
- Ambient gait cycles may use stable per-entity offsets, but gameplay telegraphs must never drift away from simulation timing.

## Export requirements

Each production asset should have:

- Stable lowercase ID
- Source concept or reference
- Intended gameplay size
- Pivot point
- Attachment points where applicable
- Direction and animation name
- Frame number
- Explicit nearest-neighbour scaling
- No baked text, UI labels, or contradictory background scenery

### Steam-portable quality floor

- Retain every approved transparent source master at least four times the logical runtime cell where generation resolution permits; runtime atlases are derivatives, never the only surviving art.
- Use nearest-neighbour sampling for sprites and atlas normalization. Never upscale a small runtime PNG and treat it as a new source master.
- Evaluate silhouette and animation at logical gameplay size, then inspect the retained master for extraction damage, inconsistent outlines, cell bleed, and chroma fringe.
- Dynamic text remains live UI rendered at high text-texture resolution. Do not bake language into HUD art.
- HUD frames must be designed for their real aspect ratio or assembled from scalable corners/edges. Do not stretch a square or 2:1 panel into a wide level-up card.
- Steam/desktop builds should support at least 1080p output without changing world-unit, pivot, frame, attachment, or UI-layout contracts. Higher display resolution improves presentation but must not change gameplay scale.
- AI-generated masters remain project-bound with prompt summary, chroma source, transparent extraction, runtime derivative, frame order, and normalization script so individual assets can be repainted later without breaking code.

Provisional filename pattern:

```text
<hero>_<layer>_<state>_<direction>_<frame>.png
<weapon>_<state>_<direction>_<frame>.png
```

Sprite sheets may replace individual files after the prototype proves the required frames.

## Production Asset Batch A contracts

The first environment-and-presentation batch is locked to six centered, nearest-neighbour atlases:

| Stable ID | Grid | Logical cell | Frame count |
| --- | ---: | ---: | ---: |
| `arena-floor-v1` | 3×2 | 64×64 | 6 |
| `arena-boundary-v1` | 4×2 | 64×64 | 8 |
| `arena-obstacle-v1` | 4×2 | 96×96 | 8 |
| `combat-effects-v1` | 5×4 | 64×64 | 20 |
| `pickups-v1` | 4×1 | 64×64 | 4 |
| `hud-panels-v1` | 3×2 | 256×128 | 6 |

HUD art contains frames and empty surfaces only; all language, numbers, meters, and state labels remain runtime UI. Effect frames encode simulation events rather than running as decorative clocks. Obstacles keep intact and damaged frames paired by column even though destruction gameplay is deferred.

## Production Asset Batch B contracts

The vertical-slice combat roster uses seven stable, text-free assets:

| Stable ID | Grid | Logical cell | Frame count |
| --- | ---: | ---: | ---: |
| `scattergun-v1` | image | 64×32 | 1 |
| `arc-carbine-v1` | image | 64×32 | 1 |
| `slime-spitter-v1` | 4×3 | 64×64 | 12 |
| `carapace-scuttler-v1` | 4×4 | 96×96 | 16 |
| `siege-crusher-v1` | 4×3 | 128×128 | 12 |
| `batch-b-effects-v1` | 5×4 | 64×64 | 20 |
| `siege-crusher-portrait-v1` | image | 128×128 | 1 |

Directional columns remain south, north, east, west. State rows are simulation-authored: Spitter positioning/wind-up/recovery, Carapace pursuit/wind-up/charge/recovery, and Crusher stalk/charge/sweep. The two east-facing weapon images rotate at runtime and are never painted into the hero body. Slime and Crusher effect frames encode actual projectile, target, hazard, armour, sweep, shockwave, and defeat events. The Crusher portrait is presentation-only and may not replace the runtime body sheet.

## Production Asset Batch C contracts

| Stable ID | Grid | Logical cell | Frame count |
| --- | ---: | ---: | ---: |
| `blast-mite-v1` | 4×3 | 64×64 | 12 |
| `warp-flanker-v1` | 4×3 | 96×96 | 12 |
| `batch-c-rewards-v1` | 4×4 | 64×64 | 16 |
| `batch-c-effects-v1` | 5×4 | 64×64 | 20 |

Blast Mite rows are chase, armed, and detonation; Warp Flanker rows are stalk, dissolve, and materialise. Both retain the south/north/east/west column order. Reward and effect frames map to implemented decisions, pickups, buffs, statuses, fence state, ultimate events, and the two new enemies. Relic, Artifact, Shrine, and Supply Drop art is not part of the locked subset because those consuming systems do not yet exist.

## Production Asset Batch D4 contracts

| Stable ID | Grid | Logical cell | Frame count |
| --- | ---: | ---: | ---: |
| `razor-scuttler-v1` | 4×4 | 96×96 | 16 |
| `razor-scuttler-effects-v1` | 4×2 | 64×64 | 8 |

Razor body columns remain south, north, east, west; rows are pursuit, compressed wind-up, committed dash, and exhausted/crash recovery. Effects are lane-warning accent, launch, trail, Marine impact, cover crash, miss skid, recovery stagger, and defeat. The lane accent is supporting art only: exact warning length, dash direction, collision, distance, and hit test remain live geometry.

The first production-test sheets use a four-column by three-row grid with 96 × 96 logical cells. Body and headgear layers must use identical canvas dimensions, cell order, pivots, and frame indices so equipment can toggle without moving or replacing the body.

## Task 36 Aurum and 128 px tile contracts

| Stable ID | Grid | Logical cell | Frame count |
| --- | ---: | ---: | ---: |
| `aurum-hoarder-v1` | 4×3 | 96×96 | 12 |
| `aurum-hoarder-effects-v1` | 4×2 | 64×64 | 8 |
| `aurum-tiles-v1` | 4×2 | 128×128 | 8 |

Hoarder columns are south, north, east, west; rows are intact forage, armour-broken forage, and flee. Effects map directly to arrival, armour break, Scrap secured, flee activation/trail, edge escape, defeat, and supply-cache drop. The tile family is the first implementation of the 128 px runtime / 512 px retained-source contract. Tile language, numbers, bindings, cooldown shadows, selection, prices, and lock behavior remain live UI.

## Production Scrap Shop UI Batch N2

| Stable ID | Grid | Logical cell | Frame count |
| --- | ---: | ---: | ---: |
| `scrap-shop-offer-tiles-v1` | 3×2 | 128×128 | 6 |
| `scrap-shop-hud-v1` | 2×2 | 128×128 | 4 |
| `scrap-shop-panel-v1` | single image | 1024×576 | 1 |

Offer frames are Field Repair, Uranium-Core Kit, Armour Retrofit, Upgrade Calibration, Weapon Requisition, and Sold/Locked. HUD frames are neutral Scrap, secured pulse, spent transfer, and banked cassette. The terminal panel deliberately keeps its centre empty so prices, descriptions, affordability, selection, quantity, key labels, and localization remain code-owned. Retained chroma sources, transparent masters, exact prompts, frame maps, and deterministic normalization live under `art/production-tests/batch-n2/`.

## Production Asset Batch J contracts

| Stable ID | Grid | Logical cell | Frame count |
| --- | ---: | ---: | ---: |
| `swarm-scuttler-v1` | 4×2 | 64×64 | 8 |
| `razorlord-v1` | 4×4 | 96×96 | 16 |
| `blightspitter-v1` | 4×3 | 96×96 | 12 |
| `quillback-matriarch-v1` | 4×4 | 128×128 | 16 |
| `telegraph-large-v1` | 4×2 | 128×128 | 8 |
| `telegraph-small-v1` | 4×3 | 64×64 | 12 |
| `telegraph-danger-fill-v1` | 4×1 | 64×64 | 4 |

Swarm rows are sprint and attack/recoil. Razorlord rows are pursuit, wind-up, committed dash, and recovery. Blightspitter rows are positioning, wind-up, and recovery. Matriarch rows are positioning, crown charge, launch, and recovery. Body columns are animation beats for east-facing art rotated or mirrored by runtime direction; no frame controls collision.

Large telegraph frames are four ground-slam stages followed by four 120-degree sweep stages. Small frames are four rain reticles, three radial pulses, one edge warning, three beam widths, and one impact burst. Danger fills are supporting hatch variants only. Runtime code remains the sole authority for shape, radius, direction, timing, hit tests, warning caps, and off-screen placement; decals sit below the code geometry and must never replace it.

## Approval still required

- Whether the tested 96 × 96 logical cell remains final after gameplay-scale review
- Four-direction versus eight-direction final decision
- Final shared palette
- Helmet anchor behaviour during the Marine roll
- Weapon-ring radius at one, four, six, and twelve weapons
- Whether dialogue portraits exist separately from the dynamic loadout preview
