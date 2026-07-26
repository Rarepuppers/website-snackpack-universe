# Production Audio Batch S3 — Shared Feedback

Deterministic mono 48 kHz/24-bit WAV preflight masters for flesh, armour, shield, brittle/reinforced cover, pickup/XP, level-up, chest/shop confirmation, player damage, and boss/reward stingers. Frequent feedback has matched variants; positional and progression mix behavior remains code/mixer-owned.

FFmpeg is unavailable in this environment, so OGG/MP3 runtime derivatives are intentionally pending external encoding and mastering.

Format/peak/edge/RMS screening is recorded in `../s23-master-audit.json` and can be refreshed with `npm.cmd run audio:audit:s23` from `dev/`. After encoding, use `npm.cmd run audio:audit:s23 -- --require-derivatives` to require all 48 OGG/MP3 derivatives. RMS is only a screening value; final LUFS and in-game mix review still require an approved listening pass.

When FFmpeg is available, run `powershell -File dev/scripts/encode-production-audio-s23.ps1 -FfmpegPath <path-to-ffmpeg.exe>` from the Last Bastion project root. The script writes per-batch runtime derivatives under `dev/src/game/audio/runtime/` and copies the same files into `game-assets/`.
