# Batch AK gates

Reusable entrance/gate identities for the eight boss arenas: Colosseum, Crucible, Reactor, Hive, Void, Foundry, Military, and Siege.

The atlas is 4×2 with stable cell order. Retained transparent source and 384px per-cell preflight derivative remain here; runtime 256/192/128px derivatives are copied to `game-assets/`.

These are visual entrance silhouettes only. Door state, interaction, collision, room adjacency, objective ownership, and warnings remain code-owned. Do not promote until the complete arena passes seam, density, Full HD/4K, and 45–90-second fight review.

`normalize_batch_ak_gates.py` rebuilds the master, runtime derivatives, and contact sheet deterministically.
