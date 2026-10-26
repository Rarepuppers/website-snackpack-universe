# Local QA and package provenance

Prepared local release: `web-2026.10.27-stash-persistence`; schema 17, simulation compatibility 3.
These tools prepare evidence. They do not complete human, hardware, Steam or release acceptance.

## Session reports

On the local web server or assigned desktop package, open a combat review URL with `qasession=1`.
For a fixed baseline example:

```
?screen=game&theme=bastion-standard&seed=61061&qasession=1
```

For a density sample add `&scenario=density-capacity`. Choose the intended resolution, scaling,
quality and input before Start QA; warm up first. Use a separate QA profile. Do not reload a real
in-progress encounter merely to append the parameter. Menu/map navigation does not carry this
parameter automatically; this first slice measures one combat document, not a whole expedition.

1. Select **Start QA**. After returning focus to the canvas, play the intended session.
2. Exercise pause/resume and focus loss as required. Pause, hidden, decision and boundary intervals
   are excluded; the first resumed interval is conservatively excluded too.
3. Select **Stop QA**, then **Export QA**. Save `last-bastion-qa-session.json`. The report also stays
   in a selectable text box if downloading is unavailable. Export before leaving/reloading the page.
4. **Reset QA** clears only in-memory QA evidence. A new Start also starts fresh. An in-place
   attempt restart stops collection with an explicit reason; it does not combine two attempts.

The report contains start/latest/end context: shared run provenance, hero/weapons, selected quality
settings, CSS/backing dimensions, DPR, presentation and observed texture/context recovery data.
Hardware/driver/Windows scaling are explicitly unknown; add those to the acceptance worksheet.
Texture bytes are decoded estimates, not measured GPU memory. Frame intervals are browser timings.
Settings/display snapshots are not a continuous trace of every change.

The existing live pacing view covers the most recent 600 active frames. Session p95/p99 are derived
from individual active intervals, with 120,000 samples retained (about 33 minutes at 60 fps).
If that cap is exceeded, the report exposes dropped count and labels percentiles as retained-prefix
only; active duration, maximum and hitch totals still cover the session. Unobserved wall time is
separate. Do not describe an overflowed prefix or the rolling view as a full-session percentile.

The controls are opt-in, local and removable on scene shutdown. They send no report or additional
analytics, store no per-frame/save data, and do not write progression. Normal game behavior on a
chosen route still applies; use diagnostic routes for hardware evidence, earned runs for gameplay
acceptance. No whole-game accessibility or controller support for the QA panel is claimed.

## Package provenance: assigned build owner

Claude remains the production packaging owner. From `desktop/`, the existing `npm run package:win`
now stamps the staged web build, packages it, writes `release/win-unpacked/qa-package-manifest.json`
and checks consistency. Renderer boot is a separate `npm run smoke:package:win` result.

The staged stamp records source commit, relevant uncommitted inputs, build/simulation identity and
runtime file hashes. The package manifest records package time and SHA-256/size for every ordinary
packaged file, including the executable, resources, native libraries and stamp. Each metadata file
excludes only itself from its own hash set. Packaged runtime must match staged hashes before a
manifest can be written; a mixed bundle cannot be accepted merely by retaining its version string.

To inspect a prepared Windows package without rebuilding or launching it:

```powershell
npm run check:package -- release/win-unpacked web-2026.10.25-decision-labels
```

This runs the compiled checker already produced by the build owner. If `dist/PackageProvenance.js`
is absent, ask the owner for the current tool/package; the checker does not compile automatically.
It reports changed, missing, extra or wrong-build files and leaves them untouched. File hashes
establish consistency with the manifest, not a signature or an independent signing attestation.
An older package without this manifest is unrecorded, not freshly verified.

Return the manifest, its source/dirty status, executable hash, smoke log and visible acceptance
results. Never include saves, credentials or `steam_appid.txt` in the package. The writer rejects
these local files and unsupported symlinks. Automatic post-package manifest/check integration is
currently Windows-only; Linux/macOS packaging must not be described as provenance-accepted by it.

No executable was built or launched while implementing these tools. Unit fixtures contain inert
fake executable bytes; real packaged/hardware/Steam acceptance remains external.
