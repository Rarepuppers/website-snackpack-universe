# Live audio controls — 22 October 2026

Authorized continuation of AUDIO-02 after the audit. Based on `328cc8d3` with pre-existing
unrelated website/About/privacy/social changes excluded. Prepared identity
`web-2026.10.22-audio-controls`; service worker `2026-10-22-audio-controls`.
[CURRENT-PLAN](../CURRENT-PLAN.md) remains the only active queue.

## Delivered

- Every production sample, rotary start/loop/end and synthesized cue now routes through one
  scene-owned output GainNode. Master × SFX and Sound changes update it with a 10ms ramp,
  affecting active voices as well as future cues. No inactive bus controls were exposed.
- Zero/mute stops voices after that short transition, cancels the rotary end timer and prevents
  fresh cues at zero. Unmute restores configured gain without restarting old sounds.
- In-place retry stops the prior attempt's voices and clears frame/retrigger bookkeeping while
  retaining decoded buffers/context. A generation guard prevents late ended callbacks from
  decrementing the next attempt's voice counts.
- Scene shutdown disposes its player once: abort pending downloads, stop/disconnect sources and
  gains, cancel timers, clear decoded buffers and close the context. Scene recreation gets a fresh
  player; late decoded results cannot repopulate a disposed instance.
- Normal rotary release keeps its existing end sample and lets the short loop fade finish before
  disconnecting. Production samples, cue identities, family admission limits and synth fallback
  remain. Pause still allows short existing tails to finish; no new pause-silence policy is claimed.
- Save schema 16 and simulation compatibility 3 unchanged. Rebuilt local browser output only;
  no art, mode, balance, floor default, production executable, push/deploy or Steam operation.

## Verification and limitations

Seven new tests exercise the production WebAudioSynth with instrumented Web Audio nodes:
loaded samples, fallback, live volume, zero/mute, rotary end/cancellation, idempotent disposal,
aborted fetch signal, lazy allocation, retry and delayed-callback isolation. They test actual
production methods rather than a duplicate mixer algorithm.

One real-browser case uses the existing combat settings UI to change master zero/restore and
Sound off/on, then retries an encounter. It observes real AudioContext output automation and
source stop calls. It does not replace audio with a mock. The paused graph's `AudioParam.value`
readback can remain stale after sources stop, so the case checks the actual scheduled ramp target;
it is graph/control validation, not a waveform or audible-output measurement. Earlier attempts
also used zero-duration key presses that the frame-polled game could miss; final input holds
cross a frame like existing input tests. Failed attempts remain in the evidence folder.

See [final verification evidence](../playtest-evidence/2026-10-22-audio-controls/README.md) for
full suite and portfolio results, actual report provenance and retained diagnostic logs.
Finalization on 23 October confirms the completed root portfolio run passes all 20 guards.

## Still open

Mark/tester listens on speakers/headphones: mute and zero during rotary/damage/reward, restore
volume, vary SFX/master, pause/blur/resume, retry and exit; note clicks, stale tails or lost cues.
The 10ms transition and immediate retry/exit stopping require that listening acceptance.
Actual screen reader/controller, observed Runs 1–5, floor/hero/rack/map acceptance, named hardware,
Claude's specifically assigned executable, real Steam access and dashboard gates remain open.
No further content/art/accessibility slice is implied by completing this bounded fix.
