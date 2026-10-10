# Canonical perk tiles v3 — Batch K

Generated with the built-in image-generation workflow on 11 October 2026. The strict style reference for all three calls was `../batch-i/canonical-perk-tiles-v2-alpha-master.png`. Each untouched generated output is retained as `*-v1-chroma-master.png`; the source is a single isolated icon on uniform magenta. No generated frame was used.

Shared request: Last Bastion perk icon master for 4K/Steam retention. Match the Batch I crisp painterly pixel-cluster edges, weathered ivory/bronze/gunmetal bevels, top-left warm key light and deep lower-right shadow. One bold centered icon, legible at 38×38, with restrained threat-tier accent and a silhouette that works in grayscale. Uniform `#FF00FF` chroma; no badge frame, panel, floor shadow, text, numbers, letters, locks, UI, or watermark.

1. **Vanguard, frame 7, Threat Tier 0:** A forward-pointing spearhead with two nested advance chevrons and a compact banner. Restrained teal `#68e4e8` on the spearhead edge.
2. **Logistician, frame 8, Threat Tier 1:** Three robust supply crates in a triangular stack; one bold geometric plus emblem on the front crate, clearly distinct from Quartermaster's 3×3 inventory grid. Restrained amber `#ffc061` on a crate latch.
3. **Recon Specialist, frame 9, Threat Tier 2:** A military observation scope/reticle over a folded tactical map grid with two outer columns, distinct from Pathfinder's branching route nodes. Restrained orange `#ff9a52` on the outer column edges.

`normalize_canonical_perks_v3.py` applies Batch I's magenta extraction and 128px crop/fit rule. It uses the high-resolution Batch I frame as a literal metal surround and paints only the inset navy field before placing each new icon. It writes individual framed chroma and alpha tile masters and `canonical-perk-tile-atlas-v3-128.png`. Runtime frames 0–6 are copied as pixels from the v2 atlas; frame 7 was reserved/transparent in v2. The v3 atlas has a 4×3 layout and transparent frames 10–11.

The raw chroma, framed chroma, and framed alpha masters are retained for later 4K/Steam work. The 128px atlas is only the web runtime derivative.
