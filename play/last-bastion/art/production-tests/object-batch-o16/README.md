# Object Batch O16 — Medical, Emergency, Security

Three 2×2 source atlases for room dressing: medical-response (field med station, folded stretcher, trauma cabinet, first-aid case), emergency-support (suppression rack, shower/eyewash, floodlight, rope reel), and security-support (scanner gate, camera box, barricade post, turnstile frame).

Each family retains the generated chroma source and extracted alpha, then produces a restored 4K-oriented master plus deterministic 384, 256, and 128 derivatives. `normalize_object_batch_o16.py` validates alpha corners and all four atlas cells, builds the contact sheet, and copies runtime derivatives into `game-assets`.

These are decorative, art-gated candidates only. Interaction, collision, hazards, rewards, targets, and placement remain code-owned.
