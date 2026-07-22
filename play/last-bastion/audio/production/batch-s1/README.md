# Production Audio Batch S1

Task 67 S1 replaces the eight implemented weapon synth families. The complete generated family is bound through OGG with MP3 decode fallback; the existing event-addressed synth remains the fallback while assets load or when both formats fail.

The deterministic source recipe is `dev/scripts/generate-production-audio-s1.mjs`. Pass `--ffmpeg=<path>` (or set `FFMPEG_PATH`) to rebuild the 24 masters and both runtime formats. Fixed seeds keep revisions reviewable and reproducible.

## Delivery contract

- Retain mono 48 kHz / 24-bit WAV masters with no baked reverb, limiter pumping, music, shell-floor ambience, or stereo-only information.
- Derive runtime OGG and MP3 files from the approved masters using the exact stems in `ProductionAudioCatalog.ts`.
- Leave at least 3 ms clean headroom at each edge of one-shots. The Bulwark loop alone must be sample-accurate and seamless; its start and end must also work when the burst is cancelled early.
- Normalize the family as a mix, not each file independently: ≤ -1 dBTP, no hard clipping, and no single routine weapon should mask player-hit, boss-warning, shield-break, or reward cues.
- Keep variants mechanically interchangeable. A variant may change texture but cannot imply different damage, tier, cadence, range, or reload state.
- Export dry assets. Arena/environment treatment belongs to a future mixer bus, not the source files.

## Required files

- Bastion Service Rifle: `service-rifle-fire-a|b|c` (70–130 ms).
- Scattergun: `scattergun-fire-a|b|c` (180–320 ms).
- Arc Carbine: `arc-carbine-fire-a|b|c` (100–180 ms).
- Patrol Blade: `patrol-blade-swing-a|b|c` (120–240 ms).
- Bolt Carbine: `bolt-carbine-fire-a|b|c` (130–220 ms).
- Injector Carbine: `injector-carbine-fire-a|b|c` (90–160 ms).
- Grenade Tube: `grenade-tube-launch-a|b|c` (160–280 ms).
- Bulwark Rotary Cannon: `bulwark-rotary-start` (160–260 ms), `bulwark-rotary-loop` (350–650 ms, seamless), and `bulwark-rotary-end` (180–320 ms).

## Acceptance sequence

1. Validate sample rate, bit depth, channels, duration, true peak, unique stems, and the rotary loop seam automatically.
2. Review isolated A/B/C variants, then a 60-second stationary-fire route for every weapon.
3. Review maximum-density combat at 960×540, Full HD, and 4K with player-hit and boss-warning cues active.
4. Confirm rapid fire obeys the catalogued retrigger/voice limits without flanging, machine-gun buildup, clipping, or missing critical warnings.
5. Bind approved OGG/MP3 derivatives into the production sample player. Keep synth fallback for unavailable or failed decodes.

The validator also rejects audio-identical masters, hot three-millisecond edges, and missing or malformed OGG/MP3 derivatives. Pass `--masters-only` while authoring before encoding.

Place candidate masters in `masters/` and run `npm run audio:validate:s1` from `dev/`. The validator fails on missing or unexpected WAVs, malformed RIFF data, non-PCM encoding, wrong channel/rate/depth, out-of-envelope duration, peaks above −1 dBFS, or a Bulwark loop seam discontinuity above −42 dBFS. Use `node scripts/validate-production-audio.mjs --allow-missing` only to audit an intentionally incomplete delivery; it never marks missing files as accepted.
