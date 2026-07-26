# Object Batch O11 — Architectural Transitions

Three 2×2 atlas families for architectural room dressing:

- `vertical-transitions-v1`: stairs, ladder frame, elevator threshold, ramp side module.
- `railings-guardrails-v1`: handrail, corner guardrail, mesh barrier, detachable rail section.
- `airlock-frames-v1`: open airlock arch, bulkhead frame, service jamb, pressure-door surround.

Each family retains the generated chroma source, extracted alpha, restored-color master, 384px-per-cell preflight, and 256px/128px runtime derivatives. The normalizer validates transparent corners and non-empty atlas cells, then copies runtime files into `game-assets/`.

These are decorative and art-gated. Walkability, collision, transitions, interaction, hazards, rewards, telegraphs, and placement remain code-owned.
