# Object Batch O26 — Fabrication Safety, Habitat Commons, Communications Infrastructure

Three 2×2 source atlases generated for the Last Bastion object library. The 384px masters are the review/4K-preflight references; 256px and 128px derivatives are copied into `game-assets/` for runtime wiring.

## Families

- **Fabrication / Safety:** safety barrier post, face shield station, spill-containment tray, lockout-tagout cabinet (blank face).
- **Habitat / Commons:** communal table, drink dispenser (blank panel), abstract wall art panel, folding privacy screen.
- **Communications / Infrastructure:** antenna junction cabinet, signal cable distribution box, relay mast base, fiber splice case.

The atlas green is extraction-only. Runtime PNGs are transparent RGBA and contain no baked labels, interaction prompts, collision, hazards, targets, telegraphs, rewards, or gameplay values. Treat every prop as decorative until code-owned placement and interaction contracts exist.

## QA

`remove_chroma_key.py` was run with border auto-key, soft matte, despill, and threshold 12/220. `normalize_object_batch_o26.py` restores transparent corners, validates all four cells, emits 384/256/128 derivatives, and builds the contact sheet. Re-running the script must preserve the master hashes.
