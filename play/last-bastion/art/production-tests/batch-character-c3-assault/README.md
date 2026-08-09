# Character Batch C3 — Assault

Production staging for the first post-MVP hero package. Assault's mechanics are
implemented, but the hero remains roster-locked until this directory contains
and passes review for the complete C3 contract:

- [x] Full-height, text-free 1024×1536 select portrait.
- [x] Four-direction gameplay sheet: south, north, east, west columns; idle,
  move, and evade rows matching the Marine runtime contract.
- [x] Equipment/helmet overlay with identical frame order and pivots.
- [x] Unlocked roster tile.
- [ ] Hero-specific damage, evade, and death audio masters plus OGG/MP3 runtime
  derivatives.

`assault-select-portrait-v1-1024x1536.png` is the identity anchor for every
remaining visual. Do not redesign the armour, helmet, visor, asymmetric right
shoulder, accent palette, or Marauder AR between assets.

The portrait is exposed only by the explicit `?flow=character-select&c3=assault`
QA route. The normal Character Select still presents Assault as locked. C3 is an
atomic deployment gate: partial presentation must not make Assault look playable
before the full visual-and-audio package and acceptance pass exist.
