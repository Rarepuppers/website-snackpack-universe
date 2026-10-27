# Transformation offer correction — 27 October 2026

Prepared local identity: `web-2026.10.27-transformation-offers`. Schema 17 and simulation
compatibility 3 remain unchanged. No new effects, damage types, ranks, assets or tuning.

## Confirmed exposure and correction

`eligibleEvents` admits Cybernetics Bay from column 3. Its former `graft-implant` choice
charged four maximum health and granted Targeting Suite. `TransformationRunModifiers`
resolves its projectile speed/spread boon but ignores its Shock-buildup scar: players do
not receive that status. The one-time event cost does not make the displayed scar true.
The implant offer is removed; Shield Lattice's weapon trade and Leave remain. Event ID,
minimum column and event-pool order are unchanged, so existing seeds still select the bay.

Acidic Secretions' Fire-damage scar is also inert, but no production event grants that
choice. TransformationDecisionScene is explicitly an in-memory review route that never
writes a save. Combat preview overrides are not normal earned grants. Both catalogue IDs
remain readable, and saved histories/modifiers are unchanged. We do not claim legacy
builds now pay those unsupported costs. No replacement penalty was invented or balanced.

Regenerative Glands also had stale text promising a four-second damage-free delay. Its
production consumer adds to the shared ten-second passive healing tick without that delay.
Catalogue summary/rule now describe the existing behavior; regeneration is not retuned.

## Authoring → runtime map

Production event grants after this patch (fixed and random outcomes both checked):

| Choice | Boon consumer in CombatSimulation | Scar consumer |
| --- | --- | --- |
| Regenerative Glands | updateRegeneration, shared passive tick | updateShieldRecharge multiplier |
| Dense Tissue | maximum-health resolution | movement-speed resolution |
| Reactive Blood | retaliation on health damage, cooldown/radius limits | healing multiplier |
| Feeding Tendrils | nearby-kill healing, range/window cap | conventional healing multiplier |
| Shield Lattice | defence maxShield | healing multiplier |
| Rift Step | evasive distance | maximum-health resolution |
| Heavy Gunner | heavy-weapon damage multiplier | movement-speed resolution |
| Zealous Fervor | weapon fire interval | defence armour |
| Martyr's Resolve | retaliation on health damage | healing multiplier |

Other catalogue choices are retained for inspection, legacy saves and review previews;
this patch does not broaden production exposure. ResolveTransformationModifiers applies
boons/scars only after commitment. Existing combat integration tests exercise the effects;
the new production-offer contract walks every authored event outcome and rejects grants
whose boon or scar metrics are outside the supported resolver set. Legacy Targeting Suite
rank-III speed/spread behavior is explicitly retained by regression.

## Verification and limits

Full verifier PASS in 191.7 seconds: 1,805 unit tests, 59 browser checks and 31 desktop-host
tests, plus static/build/smoke/offline. All 23 portfolio guards pass. Results are recorded
beside this file. Initial full verification caught one
obsolete event test that still expected the removed implant choice; it was updated to
assert the supported weapon trade and absence of that offer before rerunning.
No observed runs, human difficulty judgement, listening, hardware or Steam acceptance.
No packaging, deployment or push. Removing an offer narrows variety; future restoration
requires a supported, reviewed cost, not merely approval to bypass content evidence gates.
