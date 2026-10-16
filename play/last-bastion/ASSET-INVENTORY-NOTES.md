# Asset inventory baseline — 16 October 2026

`asset-inventory.json` is regenerated with:

```powershell
node play/last-bastion/dev/scripts/inventory-production-assets.mjs
```

It now covers 227 unique game, shell, portrait, backdrop and UI-chrome definitions: logical/source-frame sizes, pivots, source
paths, byte sizes, hashes, PNG dimensions and static references. It is generated from actual calls
and refuses unknown call formats rather than silently dropping definitions. It also lists 1,328 unmapped art files without classifying them as unused or safe to delete.
Shared shell/game definitions are deduplicated. Static references do not prove runtime reachability.

## Confirmed consumer traces

| Family | Current trace and disposition |
|---|---|
| Standard floor | `GameAssetManifest` → `CombatAssetManifest.combatAssetsForSession` → `ArenaRenderer.renderAuthoredFloor`; reuse baseline, compare pilot. |
| Floor pilot | Same path with `bastionFloorPilot` opt-in; two separate candidates plus scuff. Normal themes exclude them. |
| Marine helmet | Manifest → selected Marine session → `PrototypeScene` → `MarineHelmetRegistration`; reuse corrected registration until motion identifies failed frames. |
| World objects | `WorldObjectCatalog` art IDs → selected combat session → `ArenaRenderer.renderAuthoredObstacles`; earlier “catalogue used only by tests” notes are obsolete. |
| Persistent floor hazards | `ArenaRenderer.renderHazards` currently draws shape/hatch cues in code. O2 source atlases exist but their existence alone does not mean this consumer uses them. |
| H1 held weapons | `weaponCatalog.ts` enables the held pool. Do not commission a “release the held pool” task from historical H1 notes. Trace individual sprite/effect consumers before replacing art. |

## Geometry and dispositions

`dev/scripts/audit-asset-geometry.py` (Python with Pillow) reads all 227 definitions and records
per-frame alpha bounds, source dimensions and estimated decoded RGBA bytes in `asset-geometry.json`.
It rejects out-of-bounds slicing. It never edits artwork. Manifest pivots remain authoritative;
Marine body/helmet pose registration stays in `MarineHelmetRegistration.ts`, and weapon attachment
metadata stays with the existing weapon render consumers. No generic anchor is substituted.

- Game actors, body/helmet frames, pickups, world objects and H1 weapons: reuse current runtime
  assets. No specific failed frame has been established that justifies regeneration in this patch.
- Shell/portraits/backdrops/chrome: reuse; inventory includes their separate declarations.
- Floor: retain existing default; new eight-tile/four-decal kit and optimized A/B pilots are review-only.
- Effects: reuse all six existing visual families; reduce pooled impact opacity and respect Reduced
  Flash. Persistent hazard geometry and tells remain code-native. No new effects mechanics.
- Unmapped artwork: retain as candidates/masters/derivatives. Unmapped is not equivalent to unused.

This closes manifest and filesystem coverage, not a scene-by-scene reachability proof for every
historical source. Individual replacement decisions still require a named failing consumer/frame.
