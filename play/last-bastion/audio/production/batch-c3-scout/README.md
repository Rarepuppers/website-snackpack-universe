# Character Batch C3 — Scout audio

Deterministic, dry source candidates for Scout's lightweight reconnaissance-suit language:

- `scout-damage.wav` — light plate snap and brief optical-sensor glitch.
- `scout-evade.wav` — compressed fabric rush, fast servo sweep, and ranging ping.
- `scout-death.wav` — cascading sensor faults and restrained lightweight suit shutdown.

All masters are mono 48 kHz/24-bit PCM WAV, use no voice-over or borrowed samples, and keep timing independent
from gameplay code. Regenerate with `generate_scout_cues.py`.

Runtime OGG Vorbis and MP3 derivatives are retained in `dev/src/game/audio/runtime/batch-c3-scout/` and mirrored
to `game-assets/`. Regenerate with `dev/scripts/encode-production-audio-c3-scout.ps1`, then run
`dev/scripts/audit-production-audio-c3-scout.ps1`.

The assets are wired only for Scout feedback with shared and oscillator fallbacks intact. Automated screening and
contextual human listening were accepted on 9 August 2026; Scout deployment and its Armory clearance are released.
