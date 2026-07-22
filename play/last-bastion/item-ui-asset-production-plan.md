# Item, equipment, and effect asset plan

**Audit date:** 23 July 2026  
**Goal:** one honest, Steam-ready visual language for every item the live game can actually award, equip, activate, or display.

## Current coverage

| Family | Live mechanics | Existing production assets | Decision |
| --- | --- | --- | --- |
| Weapons | Eight live weapons, typed rack, four-slot stash, three tiers, merge/discard/placement | Eight canonical 128 px Batch I weapon tiles; rack/stash/tier/merge/discard surfaces; held weapon bodies; per-family effects of varying age | **Content-complete for the current roster.** Rebind all compact HUD surfaces to the canonical Batch I atlas. Refresh older effects on touch; do not regenerate all weapon tiles. |
| Pre-run perks | Seven selectable perks | Seven canonical 128 px perk tiles plus one reserved transparent atlas cell | **Complete for MVP.** Expand only when new perk mechanics pass build-diversity review. |
| Shop offers | Repair, armour retrofit, upgrade calibration, Uranium kit, weapon requisition, sold/locked | Six 128 px offer tiles, Scrap HUD states, shop terminal panel, buy/sell/merge glyphs | **Complete for the live shop.** Future services receive art only after their rules exist. |
| Hotkeys/actions | Evade, ultimate, Uranium kit, reserved fourth action, slow-weapon cadence strip | Canonical eight-frame 128 px hotkey atlas plus older 64 px action motifs | **Sufficient.** Key labels, controller glyphs, cooldowns, charges, selection, and disabled states stay code-owned. |
| Powerups | Overcharge, Aegis, Adrenaline, Magnet Pulse, medkit, Uranium-Core Rounds | Four Batch C pickup/HUD pairs, Batch A medkit, dedicated Uranium action/status tile | **Mechanically covered but visually fragmented.** This is the first item-art family worth consolidating. |
| Consumables | One activatable kit: Uranium-Core Rounds | Dedicated action/status art and ready/empty hotkey states | **No general consumable inventory exists.** Do not imply one with unused item art. |
| Armour | Numeric armour, shield, upgrade, and shop retrofit only | Armour/status motifs inside upgrade/shop UI | **No wearable armour system or armour slots.** Do not generate helmets, chest pieces, gloves, boots, or rarity sets yet. |
| Ammunition | Infinite weapon cadence; Uranium is a timed kit | Uranium case/status art | **Traditional ammo is intentionally absent.** Ordnance Caches preserve the military fantasy without magazines or ammo bookkeeping. |
| Equipment | Weapon rack and stash only | Complete slot-class/tier UI | **No non-weapon equipment inventory.** Mechanics must precede slot or item generation. |
| Relics / Artifacts / Shrines | Designed, but not fully live reward/equip loops | Procedural placeholders; Event Horizon preflight family | **Deferred.** Do not bulk-generate the concept catalog. |
| Transformations | Six inert catalogs and safe decision lab | Code-native presentation only | **Behavior-first.** Generate path art only after the Cybernetic pilot and comprehension gate. |

## Immediate corrections that need no new image generation

1. **Completed 23 July 2026:** replaced the four legacy 64 px cadence icons and missing-icon fallbacks in `CombatHud` with the existing canonical Batch I 128 px weapon frames. One tested mapping now serves compact cadence and placement surfaces for all eight live weapons.
2. Keep the 128 px tile as the single source for Codex, shop, loadout, perk, hotkey, consumable, status, and HUD presentation. Never create separate low-resolution icon art.
3. Correct the design document language that still says “four powerups maximum”: the live type now contains six entries because medkit and Uranium share the pickup/status contract without behaving like the four original timed world powers.
4. Keep rarity, tier, bindings, quantities, cooldown shadows, radial timers, comparison arrows, legality, selection, charge pips, and affordability code-rendered.

## Authorized future asset batches

### Item Batch P1 — live powerup consolidation

Generate only after the six-item frame map and world/HUD state contract are locked.

- Six canonical 128 px tiles: Overcharge, Aegis, Adrenaline, Magnet Pulse, Medkit, Uranium-Core Rounds.
- Six world-pickup cells at 96 px logical size, each with idle and pickup-burst accents where animation materially improves recognition.
- Six status motifs derived from the same masters; the code still draws timer rings, duration, urgency, stacks, and disabled states.
- One restrained shared pickup pulse and one expiration warning family. Do not recolour the whole character or projectile field.
- Acceptance at 128/96/64/48/36 px, grayscale, common colour-vision simulations, a 75% radial cooldown shadow, native/Full HD/4K, and maximum-density combat.

### Item Batch P2 — legacy live-weapon VFX renewal

Refresh only the older/shared families, not the newer dedicated atlases:

1. Bastion Service Rifle: muzzle/onset, projectile accent, flesh/armour/cover/shield impacts, recovery/vent accent.
2. Scattergun: dedicated muzzle cone, pellet travel accent, surface-specific impacts, shell/eject accent.
3. Arc Carbine: dedicated coil onset, target impact, chain origin/endpoints, overload/recovery. Chain paths and target geometry remain code-owned.

Every weapon family must read through onset → travel → result → recovery. Damage areas, hitboxes, telegraphs, timings, targeting, and status buildup remain code-owned. Patrol Blade, Bolt Carbine, Bulwark Rotary Cannon, Grenade Tube, and Injector Carbine already have dedicated later-generation families and are migration-on-touch only.

### Item Batch P3 — transformation identity tiles

Blocked until the Cybernetic placeholder behavior pilot and irreversible-choice comprehension review pass.

- Six path medallions and 18 paired-choice tiles at the canonical 128 px contract.
- Separate commitment, path-closed, purge, stabilized, and rank overlays; no words, numbers, or warnings baked into art.
- Cybernetic chamber/site states and modular hero overlay first. The other five families follow one behavior gate at a time.
- Transformation combat effects must reinforce the boon without hiding the scar or existing enemy telegraphs.

### Item Batch P4 — relic/artifact/equipment families

Not authorized. Promotion requires a live acquisition loop, exact equip limits, stacking rules, save contract, comparison UI, drop eligibility, and at least one representative build test. If conventional equipment is later approved, begin with at most four mechanically distinct slots rather than a large armour-loot grid.

## Recommended mechanical expansion

- **Weapons:** deepen the eight live identities before widening the roster. A later behavior-first set may cover precision rail/sniper, flame/plasma area denial, cryogenic control, toxic launcher, drone/support, and one psionic or void Unique. Avoid another ordinary automatic rifle.
- **Perks:** seven pre-run perks are enough for the current MVP. Target 10–12 only after telemetry proves missing archetypes; transformation choices remain a separate, run-locking system.
- **Powerups:** six is enough for readability testing. Later candidates should create a clear tactical window: shield recharge, cooldown purge, temporary pierce, repair drone. Reject minor timed `+5%` effects.
- **Consumables:** keep one ready kit until activation timing is proven. If expanded, cap carried kits and make each compete for the same action slot.
- **Ammo:** retain infinite cadence. Special ammunition is a temporary kit or Ordnance Cache effect, never conventional pickup bookkeeping unless the whole combat economy is intentionally redesigned.
- **Equipment:** do not add wearable loot merely to fill UI slots. A future system needs role-changing rules, not flat incremental armour pieces.

## Production order

1. Finish Object Batch O2 hazards and transitions, then O3 interactables, because those are already the accepted environment sequence.
2. **Completed:** consolidate existing canonical weapon-tile usage in code; generate nothing.
3. Complete the transformation decision/comprehension gate and Cybernetic placeholder pilot.
4. Produce Item Batch P1 powerups if maximum-density readability shows the current mixed atlas is insufficient.
5. Renew Service Rifle, Scattergun, and Arc Carbine VFX as Item Batch P2.
6. Produce transformation tiles/effects only after each family passes behavior review.
7. Keep relic, artifact, armour, ammo, and broader equipment art deferred until their live systems exist.
