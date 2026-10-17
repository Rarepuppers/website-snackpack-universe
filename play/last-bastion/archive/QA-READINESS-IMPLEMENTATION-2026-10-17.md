# QA readiness implementation — 17 October 2026

Completed queue from `6d4ede7a`, after Mark accepted the recommendations and optional work.
Current prepared identity: `web-2026.10.17-qa-readiness`; worker `2026-10-17-qa-readiness`.
Schema stays 16, simulation compatibility 3. No production package, push or deployment ran.

## Delivered

- **QA-01 / `4675b9ab`:** opt-in `qasession=1` DOM controls in combat. Start/stop/reset, bounded
  individual session intervals, true retained-sample percentiles, explicit overflow/pause/hidden
  boundaries, active/excluded/unobserved duration and hitch totals. No sorting on the per-frame
  collection path; expensive percentile sorting happens only on export. Existing 600-frame rolling
  telemetry is separately labelled. In-place restart stops collection; scene shutdown removes it.
- Reports reuse current run provenance and contain only selected context, no save contents or
  identifiers. Start/latest/end display/settings and observed texture/context snapshots are explicit
  evidence limits. No automatic report transmission or per-frame storage. Download has selectable
  JSON fallback; absent QA parameter means no panel/timer/collector.
- **QA-02 / `f7506ea2`:** existing staging flow stamps commit, relevant dirty inputs, runtime identity
  and staged hashes. Windows post-package flow compares actual runtime to staging, writes hashes
  for packaged bytes/executable and checks them. The read-only checker detects changed/missing/
  extra files and unexpected identity. Metadata excludes itself from its own hash set. It rejects
  known local credential/save files and unsupported symlinks. Automatic integration is Windows-only.
- [Operator instructions](../QA-READINESS.md), updated acceptance worksheet, release notes and
  handoff. These tools are complete; do not generate further prep tasks to fill the external gates.

## Verification

Fresh `verify:last-bastion` passed all required lanes in 82.4 seconds: 1,781 unit tests / 312 files,
31 browser checks, 31 desktop-host tests, smoke/offline, image/boundary/content/text audits,
typecheck and 25 matching published outputs. The report names pre-commit `6d4ede7a` with a dirty
tree because implementation was verified before its two focused commits; no runtime changes
followed the successful verifier. Existing chunk/shared-script warnings remain non-fatal.

The new browser case exercises actual production controls: keyboard Start, gameplay pause/resume,
Stop, download, deliberately unavailable download with selectable fallback, stable stopped report,
Reset, unchanged save on the lab route, and absent panel on a normal route. Unit tests cover
overflow, invalid input, reset and boundary accounting. Package fixtures exercise real staging in
a disposable Git checkout plus changed/missing/extra runtime and executable bytes and identity.
No fake fixture executable was launched.

Evidence is retained in `playtest-evidence/2026-10-17-qa-readiness/`. The fresh portfolio run passed
all 19 guards; its complete result is retained there. No unchanged full check was rerun after that
success. Other sessions subsequently advanced site commits; scope review found no Last Bastion
source/output changes, only the shared arcade cache bump from v23 to v25. That change is preserved;
the captured verifier describes its execution checkpoint rather than claiming a later full rerun.

## Still open

The accepted evidence gates remain: Runs 1–5, LB-04/LB-07 and floor/loadout motion decisions,
physical audio/controller, fresh owner-built package, named GPU/scaling/monitor acceptance,
real Steam access and explicitly authorized deployment/dashboard measurement. Session reports
cover one combat document, not a whole expedition, and do not establish a hardware verdict.
Practice, accessible shell, art/audio changes and encounter variety remain conditional on those
existing gates. No new observed defect or content expansion was invented during preparation.
