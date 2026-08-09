# Character Batch C3 — Assault audio

Deterministic, dry source candidates for Assault's hero-specific suit language:

- `assault-damage.wav` — short armour strike plus hard plate resonance.
- `assault-evade.wav` — rising servo/air burst for the aggressive roll.
- `assault-death.wav` — relay trip, armour drop, and falling suit power tone.

All masters are mono 48 kHz/24-bit PCM WAV, have no voice-over or borrowed
samples, and keep timing independent from gameplay code. Regenerate with
`generate_assault_cues.py`.

Runtime OGG Vorbis and MP3 derivatives are retained in
`dev/src/game/audio/runtime/batch-c3-assault/` and mirrored to `game-assets/`.
Regenerate them with `dev/scripts/encode-production-audio-c3-assault.ps1`, then
run `dev/scripts/audit-production-audio-c3-assault.ps1`. The committed audit
checks all six files, codec metadata, 48 kHz mono delivery, duration, and a
-1 dBFS true-peak ceiling. EBU integrated loudness is intentionally `null` for
cues too short for a meaningful gated measurement.

Assault-aware runtime selection is wired for damage, evade, and death while
shared cues and oscillator fallbacks remain intact. Mark accepted the three
cues in context on 9 Aug 2026; `ASSAULT_DEPLOYMENT_RELEASED` is now `true` and
deployment is earned through the 18-mark Assault Clearance Armory node.
