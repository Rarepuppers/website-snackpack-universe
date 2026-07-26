# Object Batch O10 — Fabrication + Maintenance

Three 2×2 atlas families for standard-room dressing:

- `transport-fabrication-v1`: service cart, pallet lifter, fabrication spool rack, parts trolley.
- `maintenance-fabrication-v1`: parked welding station, sealed hopper, fabrication molds, coolant drum.
- `hazard-neutral-v1`: sealed waste drum, empty containment tray, emergency shower, filter canister.

Each family retains the generated chroma source, extracted alpha, restored-color master, 384px-per-cell preflight, and 256px/128px runtime derivatives. The normalizer validates transparent corners and non-empty atlas cells, then copies runtime files into `game-assets/`.

These are decorative and art-gated. Interaction, collision, hazards, rewards, telegraphs, and placement remain code-owned.
