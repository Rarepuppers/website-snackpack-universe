# Dedicated power-up identity batch

Six authored 128 px tiles replace reused Batch C reward frames for the later
power-up set. Frame order is a runtime contract:

| Frame | Power-up |
| ---: | --- |
| 0 | Siege Loader |
| 1 | Phase Jacket |
| 2 | Hunter Optics |
| 3 | Last Stand Stimulant |
| 4 | EMP Charge |
| 5 | Butcher's Serum |

The retained `*-source-v1.png` files are the built-in ImageGen outputs. The
normalizer removes only edge-connected near-black pixels, writes cleaned 512 px
masters, and builds PNG plus lossless WebP runtime atlases.

Run from this directory:

```powershell
python normalize_powerup_identity_batch.py
```

## Prompt set

Shared prompt:

> Use case: stylized-concept. Asset type: Last Bastion power-up inventory and
> world-pickup tile. Use the visible production tiles only as style and framing
> references. Create exactly one square tile in the same chunky hand-painted
> sci-fi game-icon language: dark charcoal recessed panel, clipped worn-metal
> corner brackets, tiny cyan lower-center indicator, crisp high-contrast
> silhouette, aged metal and selective effect glow. Center one object with safe
> padding and make it readable at 128 px. No text, numbers, letters, logo,
> watermark, character, hands, or multiple tiles.

Per-frame subject additions:

- **Siege Loader:** drum-fed powered breech-loader module, toothed feed wheel,
  hydraulic ram and amber-orange energy; must not read as a firearm.
- **Phase Jacket:** sleeveless armored field jacket with raised collar, dark
  segmented plates, cyan-violet phase layer and chest emitter.
- **Hunter Optics:** detachable asymmetrical binocular sight with one large
  red-orange targeting lens, small cyan rangefinder and mounting clamp.
- **Last Stand Stimulant:** heavy military auto-injector with thumb trigger,
  needle shroud and two red-orange ampoules.
- **EMP Charge:** squat circular deployable pulse device with six copper
  induction fins, central cyan capacitor and contained electrical arcs.
- **Butcher's Serum:** reinforced upright canister, protective cage, dark
  crimson fluid, organic strands and heavy injection coupling; no gore.
