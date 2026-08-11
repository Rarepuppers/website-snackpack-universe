# Last Bastion — document index

Seventeen `.md` files live in this folder and several are historical. This index says which
to trust. **Read this before acting on any plan doc.**

Last reviewed: 11 August 2026.

---

## Live — trust these

| File | What it is |
|---|---|
| `last-bastion-improvement-and-steam-plan-2026-08-07.md` | **The forward plan.** Full review of the current build, the Full HD/4K/ultrawide/Steam Deck display plan, the Steam client plan, the gameplay-depth backlog, new Codex asset batches 68–75, a task-level implementation breakdown (§10) with file targets, line ranges, and acceptance criteria, and §11 on HUD readouts and run pacing (shield bar, overheal, armour display, wave timer, game speed). Does not restate the asset queue — it references it. |
| `last-bastion-content-design-plan-2026-08-07.md` | **The content plan.** Review of every content system with measured counts, plus proposed monsters, elites, bosses, weapons, objectives, rewards, items, and stats, and Codex asset batches 76-84. |
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
- Several docs quote content counts inline. Counted from the catalogues on **11 August 2026**:
  **34 weapons** (31 draftable / 1 earned unique / 1 hero-bound / 1 transformation-only), **47 items**,
  **14 relics**, **12 artifacts**, **20 upgrades**, **16 level stat cards**,
  **12 powerups**, **38 enemy catalogue types** (20 regular/treasure, 8 summons/props,
  **7 mini-bosses**, **3 bosses**) plus **7 elite identities**,
  **4 interactable objective fixtures across 4 objective modes** (hold/interact, Escort, Deny, Collect),
  **20 player stats**, **29 world objects**.
  Run `npm run content:audit` from `dev/` for the generated live inventory; it reads the catalogues
  and fails when an enemy entry is not classified. Full breakdown, including the damage-type
  distribution, is in `last-bastion-content-design-plan-2026-08-07.md` §1. Weapons went 29 -> 34,
  upgrades 12 -> 20, stat cards 15 -> 16 and player stats 19 -> 20 during the 7-8 August content
  passes; the design plan's own table carries strikethroughs showing both figures.

## Rule of thumb

`dev/src/game/` is the source of truth for *what the game does*. The docs are the source of truth
for *why*. When a plan doc and the code disagree, the code is right and the doc needs a banner.
