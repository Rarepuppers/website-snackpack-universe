# Emberfall world-theme art preflight (Batch H)

Batch H is a Steam-quality environment preflight for the Emberfall world theme. It is presentation-only and held from default theme assignment until creator review confirms actor, projectile, and telegraph readability.

The same Batch H contract now has a Toxic Bloom variant under `toxic-bloom/`, preserving all tile, boundary, obstacle, and decal frame counts and collision footprints.

Void Approach is retained under `void-approach/` with the same contracts and restrained indigo/cyan anomaly palette.

Arctic Relay is retained under `arctic-relay/` with the same contracts and frost-crusted alloy, pale cyan ice, and blue relay-light palette.

## Runtime contracts

- `emberfall-floor-v1`: 3 × 2 64 px floor atlas; six variants matching Batch A tile footprints.
- `emberfall-boundary-v1`: 4 × 2 64 px boundary atlas; eight connection pieces with the Batch A collision silhouettes.
- `emberfall-obstacles-v1`: 2 × 2 96 px obstacle re-dress; four unchanged collision footprints.
- `emberfall-decals-v1`: 3 × 2 64 px low-contrast underlay decals; six soot, crack, glow, weld, ash, and seam accents.

The art does not change collision, tile adjacency, draw order, theme assignment, obstruction, damage, or telegraph contrast thresholds. Those remain code-owned. Review at `?mode=gallery&batch=h`.

## Source retention and rebuild

The four `*-chroma.png` files preserve the built-in image-generation outputs. Transparent masters are retained beside them, and `normalize_emberfall.py` performs deterministic magenta extraction, despill-safe alpha creation, per-cell subject cropping, and nearest-neighbour normalization. Only fixed runtime atlases are loaded by the manifest.

Creator review should compare Emberfall, Toxic Bloom, Void Approach, and Arctic Relay against Batch A in grayscale, verify wall/junction readability at gameplay zoom, and confirm the decals stay subordinate to enemies, pickups, projectiles, and telegraphs.
