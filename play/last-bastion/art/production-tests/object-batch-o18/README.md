# Object Batch O18 — Habitation, Recreation, Communications

Three 2×2 source atlases for room dressing: habitation (bunk, trunk, hydration dispenser, sleep-pod screen), recreation-common (mess table, blank board, lounge chair, hydroponic planter), and communications (radio console, relay mast base, intercom, repeater case).

Each family retains chroma and alpha sources, then produces restored masters plus deterministic 384, 256, and 128 derivatives. The normalizer validates alpha corners and all four atlas cells, builds a contact sheet, and copies runtime derivatives into `game-assets`.

Decorative, art-gated candidates only; interaction, collision, hazards, rewards, and placement remain code-owned.
