# C12 card policy synchronization

The requested Rummy 500 drift is already fixed at website main 217eddf. Running the production generator with --write leaves Rummy unchanged. The full policy guard instead found Killer Sudoku missing the canonical optional-note validation, peer-note clearing and bounded-undo constant. Regenerated that block from the unchanged native production engine; reviewed the only diff (46 insertions, 2 deletions).

Validation: verify-card-policies.cjs and check-game-logic.js pass against this branch. Focused browser rendered 81 cells, added a pencil note and used Undo without runtime errors. Mutation MAX_UNDO_HISTORY 120 -> 121 failed `killer-sudoku browser policy drift`; restored. Volume 1 verify now includes both Rummy 500 and Killer Sudoku generator checks.

Branch codex/brain-games-card-policy is deliberately local for Claude to push, per the handover. No production deployment or live-page claim. This repository is C:/snackpack-universe/.codex-work/brain-games-website; the screenshot branch is a separate worktree at ../brain-games-website-assets.
