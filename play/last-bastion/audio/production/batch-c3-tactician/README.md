# Character Batch C3 — Tactician audio

Deterministic, dry source candidates for Tactician's command-suit language:

- `tactician-damage.wav` — damped armour strike and broken sensor chirp.
- `tactician-evade.wav` — directional servo sweep and targeting-array confirmation.
- `tactician-death.wav` — command-link fragments and restrained suit shutdown.

All masters are mono 48 kHz/24-bit PCM WAV, use no voice-over or borrowed samples, and keep timing independent
from gameplay code. Regenerate with `generate_tactician_cues.py`.

Runtime OGG Vorbis and MP3 derivatives are retained in
`dev/src/game/audio/runtime/batch-c3-tactician/` and mirrored to `game-assets/`. Regenerate with
`dev/scripts/encode-production-audio-c3-tactician.ps1`, then run
`dev/scripts/audit-production-audio-c3-tactician.ps1`.

The assets are wired only for Tactician feedback with shared and oscillator fallbacks intact. Mark accepted all
three cues in context on 9 Aug 2026; the reviewed deployment flag is enabled and Tactician is earned through the
22-mark Tactician Clearance node after Shock Doctrine.
