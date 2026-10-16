# Asset inventory baseline — 16 October 2026

`asset-inventory.json` is regenerated with:

```powershell
node play/last-bastion/dev/scripts/inventory-production-assets.mjs
```

It currently covers 213 GameAssetManifest definitions: logical/source-frame sizes, pivots, source
paths, byte sizes, hashes, PNG dimensions and static references. It is generated from actual calls
and refuses unknown call formats rather than silently dropping definitions. It does not claim all
source candidates, separate shell manifests or runtime reachability have been reviewed.

## Confirmed consumer traces

| Family | Current trace and disposition |
|---|---|
| Standard floor | `GameAssetManifest` → `CombatAssetManifest.combatAssetsForSession` → `ArenaRenderer.renderAuthoredFloor`; reuse baseline, compare pilot. |
| Floor pilot | Same path with `bastionFloorPilot` opt-in; two separate candidates plus scuff. Normal themes exclude them. |
| Marine helmet | Manifest → selected Marine session → `PrototypeScene` → `MarineHelmetRegistration`; reuse corrected registration until motion identifies failed frames. |
| World objects | `WorldObjectCatalog` art IDs → selected combat session → `ArenaRenderer.renderAuthoredObstacles`; earlier “catalogue used only by tests” notes are obsolete. |
| Persistent floor hazards | `ArenaRenderer.renderHazards` currently draws shape/hatch cues in code. O2 source atlases exist but their existence alone does not mean this consumer uses them. |
| H1 held weapons | `weaponCatalog.ts` enables the held pool. Do not commission a “release the held pool” task from historical H1 notes. Trace individual sprite/effect consumers before replacing art. |

## Remaining inventory implementation

- Extend generated coverage to the separate shell/portrait manifest and unmapped source candidates.
- Complete per-family loader/render/encounter traces and explicit reuse/repair/replace decisions.
- Add per-frame alpha bounds and explicit body/helmet/muzzle anchor metadata where applicable.
- Register release-ready optimized derivatives and budgets for approved new assets.

Static references are navigation aids, not runtime evidence. Runtime PNG/WebP files are not
necessarily original source masters. Retain provenance and source paths separately.
