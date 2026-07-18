# Production Asset Batch K: status-effect overlays

Batch K replaces the one-shot Batch C status emblems with persistent, body-scale animation overlays. The simulation still owns buildup, application, duration, stacking, immunity, tint, and damage.

## Runtime contract

- Asset id: `status-overlays-v1`
- Runtime file: `status-effect-overlay-atlas-v1-48.png`
- Grid: 4 columns x 4 rows, 48 x 48 px per cell
- Pivot: centre `(0.5, 0.5)`
- Frames 0-3: Blaze, 90 ms asymmetric flicker
- Frames 4-7: Overload, 72 ms strobe; frame 6 is the dark beat
- Frames 8-11: Corrode, 260 ms bubble/drip loop
- Frames 12-14: Freeze, 420 ms near-static shimmer
- Frame 15: transparent reserved fallback

The renderer creates one layer per active enemy status, scales the same frames for elites and bosses, and keeps body tint as a complementary code-driven read. The overlay is presentation-only and does not alter hitboxes or telegraphs.

## Source retention and rebuild

Each `*-chroma.png` file is the untouched generated source. Each matching transparent strip is the full-resolution edit master. `normalize_status_overlays.py` uses one shared crop per strip so animation size changes survive normalization, then writes the deterministic runtime atlas with nearest-neighbour sampling.

Background extraction used the bundled chroma-key helper with corner sampling, a soft matte, and spill cleanup. Do not ship the chroma sources.

## Review

- Atlas gallery: `?mode=gallery&batch=k`
- Live behavior: any typed-damage scenario that crosses the status buildup threshold
- Placeholder comparison: `?art=placeholder`

Creator review should check 30+ enemy crowd readability, attack-tell visibility, reduced-flash comfort for Overload, grayscale rhythm separation, and elite/boss scaling before final style lock.
