# Object Batch O20 — Engineering, Life Support, Exterior Service

Three 2×2 source atlases for utility and exterior dressing: engineering-control (pressure console, valve manifold, diagnostic pedestal, control cabinet), life-support (air filtration, reclamation tank, atmospheric sensor, oxygen cradle), and exterior-service (access hatch, ladder, tether anchor, maintenance beacon).

Each family retains chroma and alpha sources, then produces restored masters plus deterministic 384, 256, and 128 derivatives. The normalizer validates alpha corners and all four atlas cells, builds a contact sheet, and copies runtime derivatives into `game-assets`.

Decorative, art-gated candidates only; interaction, collision, hazards, rewards, and placement remain code-owned.
