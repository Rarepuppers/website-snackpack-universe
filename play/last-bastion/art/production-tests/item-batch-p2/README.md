# Item Batch P2 — legacy weapon VFX renewal

Production candidate VFX atlas for the three original live weapons whose effects predate the newer dedicated families: Bastion Service Rifle, Scattergun, and Arc Carbine.

## Atlas contract

- One 4-column × 3-row atlas: onset/muzzle, travel/projectile, result/impact, recovery/signature proc.
- Rows: Bastion Service Rifle, Scattergun, Arc Carbine.
- Retained transparent master and 384px 4K-preflight derivative remain here; 128/96/64px runtime derivatives are copied to `game-assets/`.
- Distinct cues: rifle tracer and normal/critical/cover response; Scattergun cone, pellet fan, material impacts, shell recovery; Arc bolt, chain origin/endpoints, and overload pulse.

## Acceptance gate

Candidate art only. Code continues to own targeting, tracer duration, pellet count, chain selection, endpoint geometry, hitboxes, damage, status buildup, telegraphs, and timings. Review at 128/96/64px, grayscale, colour-vision simulations, and maximum-density combat before replacing any existing effect binding.

## Steam target

The source and 384px derivative are canonical. Do not upscale runtime files for HD/4K showcases; repaint close-up treatments at source resolution.

`normalize_item_batch_p2.py` rebuilds all transparent derivatives deterministically.
