# Last Bastion performance reports

Run the advisory browser measurement from `play/last-bastion/dev`:

```powershell
npm run performance:measure
```

Pass `-- --output ..\performance-reports\<name>.json` to retain a comparable report. The runner disables the browser cache and service worker, uses a 1920x1080 Chromium viewport, and records cold title, final-boss, 12-weapon stress, and three map/combat/shop/debrief lifecycle cycles. It captures time to a route-specific ready signal, transfer bytes grouped by asset role, largest resources, rolling frame p95/p99, frames at least 50/100 ms, estimated decoded texture bytes, and JavaScript heap.

These reports are evidence, not release pass/fail gates. Agree budgets on the intended low- and mid-range target machines before enforcing limits. Texture bytes use width x height x 4 and omit driver overhead. Repeated full-page lifecycle cycles can reveal browser-process retention but do not replace an extended in-engine soak. Audio cue survival and perceived input responsiveness still require the existing listening and hardware gates.
