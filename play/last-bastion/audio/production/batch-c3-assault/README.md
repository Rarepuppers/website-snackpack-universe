# Character Batch C3 — Assault audio

Deterministic, dry source candidates for Assault's hero-specific suit language:

- `assault-damage.wav` — short armour strike plus hard plate resonance.
- `assault-evade.wav` — rising servo/air burst for the aggressive roll.
- `assault-death.wav` — relay trip, armour drop, and falling suit power tone.

All masters are mono 48 kHz/24-bit PCM WAV, have no voice-over or borrowed
samples, and keep timing independent from gameplay code. Regenerate with
`generate_assault_cues.py`.

Runtime OGG Vorbis and MP3 derivatives are not yet present because this managed
workspace has no FFmpeg or alternate encoders. Do not rename WAV files or claim
the C3 audio gate is complete. Once FFmpeg is available, encode both formats,
run peak/LUFS screening, listen in context, wire hero-aware cue selection, and
only then mark Assault deployable.

