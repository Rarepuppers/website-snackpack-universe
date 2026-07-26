# Object Batch O29 — Thermal Climate, Learning Education, Personal Quarters

Three 2×2 atlases for the Last Bastion object library. 384px masters are review/4K-preflight references; 256px and 128px derivatives are copied into `game-assets/` for runtime wiring.

## Families

- **Thermal / Climate Control:** heat exchanger, circulation unit, coolant manifold, thermal blanket rack.
- **Learning / Education:** classroom workbench, lesson projector, science demonstration bench, abstract map board.
- **Personal / Quarters:** bunk alcove, locker bank, fold-down writing desk, bedside utility shelf.

Runtime PNGs are transparent RGBA and contain no labels, prompts, collision, hazards, targets, telegraphs, rewards, or gameplay values. Keep decorative until code-owned contracts exist.

## QA

Extraction used border auto-key, soft matte, despill, thresholds 12/220. `normalize_object_batch_o29.py` validates all cells, emits derivatives, and builds the contact sheet; reruns must preserve master hashes.
