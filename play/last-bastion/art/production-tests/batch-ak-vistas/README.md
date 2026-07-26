# Batch AK vistas

Non-playable atmospheric backdrop plates for the eight boss-arena identities: Colosseum, Reactor, Hive, Foundry, Military, Void, Stargate, and Bastion operations deck.

The atlas is 4×2 with a 4:3 cell ratio. Retained transparent source and 512×384 per-cell 4K-preflight derivative remain here; runtime 256×192 and 128×96 derivatives are copied to `game-assets/`.

Vistas sit behind or beyond the playable floor. They do not own collision, cover, targets, hazards, warnings, room state, or gameplay values. Keep the lower half subdued in composition so combat remains readable.

`normalize_batch_ak_vistas.py` rebuilds the master, runtime derivatives, and contact sheet deterministically.
