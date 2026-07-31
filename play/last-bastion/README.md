# Last Bastion — document index

Fifteen `.md` files live in this folder and several are historical. This index says which
to trust. **Read this before acting on any plan doc.**

Last reviewed: 31 July 2026.

---

## Live — trust these

| File | What it is |
|---|---|
| `asset-next-production-review-2026-07-26.md` | **The asset queue.** The single authority on what art/audio Codex produces next, in priority order, plus the quality floors. The 31 July addendum adds UI chrome, music, ambience, UI audio, and the locked/mystery/playable character batches. |
| `last-bastion-art-bible.md` | Asset pipeline: naming, pivots, frame order, source-master retention, Steam/4K rules. Still current. Its open-approvals list is partly stale — see *Known stale points* below. |
| `last-bastion-codex.html` | Player-facing encyclopedia, and **code-enforced**: `content/codexDrift.test.ts` fails the build if a shipped weapon, upgrade, relic, artifact, or enemy is missing an entry. Not optional documentation. |
| `last-bastion-log.md` | Append-only running history. The record of what happened and why. |
| `wave_balance.md` | Balance reference and tuning tables. |

## Design reference — durable, but predates recent content

| File | What it is |
|---|---|
| `last-bastion-game.md` | Original game design: pillars, progression, systems intent. |
| `last-bastion-content.md` | Original content design: enemies, relics, artifacts, events. |
| `last-bastion-model.md` | Systems/simulation model notes. |

These describe *intent*, not current state. Where they disagree with `dev/src/game/`, the code wins.

## Completed plans — historical, kept for rationale

Each of these carries a **STATUS** banner at the top recording what shipped. They are retained
rather than deleted because source comments cite them by filename (grep `world-object-production-plan`
or `last-bastion-shop-economy-plan` in `dev/src/game/`) and because the *reasoning* behind a
decision outlives the plan for it.

| File | State |
|---|---|
| `last-bastion-shop-economy-plan.md` | All five phases shipped. |
| `weapon-release-and-content-expansion-plan.md` | Superseded — its content proposals shipped on 31 July, and its headline counts are now wrong. |
| `last-bastion-content-debt-plan.md` | Track A complete; most of the backlog now shipped. |
| `world-object-production-plan.md` | Placement, hazards, interaction verb, and both designed objects shipped. Its density gates are still the live contract. |
| `transformation-path-production-plan.md` | Steps 1–4 shipped; step 5 onward genuinely open. Still the plan of record for transformations. |
| `item-ui-asset-production-plan.md` | Mechanics premises stale; its art gates are still real. Superseded as a queue by the asset review. |
| `environment-production-plan.md`, `environment-prompts.md` | Environment art generation, largely delivered. |

---

## Known stale points to fix when next touched

- `last-bastion-art-bible.md` open-approvals asks about **"weapon-ring radius at 1/4/6/12 weapons."** The rack is still 4 slots but the pool is now 28 draftable weapons, so that question needs restating before ring chrome is designed.
- Several docs quote content counts inline. As of 31 July 2026 the real numbers are:
  **29 weapons** (28 draftable + 1 earned unique), **47 items**, **14 relics**, **12 artifacts**,
  **12 consumables** (11 in the wave rotation, medkit chest-only), **29 world objects**.
  Prefer counting the catalogue over quoting a doc.

## Rule of thumb

`dev/src/game/` is the source of truth for *what the game does*. The docs are the source of truth
for *why*. When a plan doc and the code disagree, the code is right and the doc needs a banner.
