# Object Batch O30 — Construction Staging, Geology Survey, Quiet Recreation

Three 2×2 atlases for the Last Bastion object library. 384px masters are review/4K-preflight references; 256px and 128px derivatives are copied into `game-assets/` for runtime wiring.

## Families

- **Construction / Staging:** scaffold tower, material lift platform, construction-panel rack, tool-and-fastener cart.
- **Geology / Survey:** core-sample drill rig, rock sorting table, seismic sensor tripod, mineral specimen cabinet.
- **Quiet / Recreation:** analog game table, inactive music console, reading nook bench, tabletop craft station.

Runtime PNGs are transparent RGBA and contain no labels, prompts, collision, hazards, targets, telegraphs, rewards, or gameplay values. Keep decorative until code-owned contracts exist.

## QA

Extraction used border auto-key, soft matte, despill, thresholds 12/220. `normalize_object_batch_o30.py` validates all cells, emits derivatives, and builds the contact sheet; reruns must preserve master hashes.
