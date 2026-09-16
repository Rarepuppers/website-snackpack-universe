/**
 * geometry-table.mjs -- print the playfield coordinates as a Markdown table,
 * straight from table.js.
 *
 * The coordinate tables in docs/pinball/01-design.md and 05-codex-art-brief.md
 * are generated with this, rather than retyped. Retyping is how the docs and
 * the code drift, and Codex paints against the docs.
 *
 * Usage: node tools/pinball/geometry-table.mjs
 */

import {
  W, H, BALL_R, FIELD_LEFT, FIELD_RIGHT, ARCH_C, ARCH_R,
  LANE_LEFT, LANE_CX, LANE_TOP, BALL_REST,
  FLIPPERS, BUMPERS, SAUCERS, SPINNER, DROP_TARGETS, ROLLOVERS,
  RAMPS, KICKBACK, WALLS,
} from '../../play/pinball/table.js';

const n = (v) => Math.round(v * 10) / 10;
const tip = (f) => ({
  x: f.pivot.x + Math.cos(f.restAngle) * f.length,
  y: f.pivot.y + Math.sin(f.restAngle) * f.length,
});

const L = tip(FLIPPERS.left);
const R = tip(FLIPPERS.right);
const clearGap = (R.x - L.x) - (FLIPPERS.left.tipR + FLIPPERS.right.tipR);

const wallsById = {};
for (const w of WALLS) if (w.id) wallsById[w.id] = w;
const seg = (id) => {
  const w = wallsById[id];
  return w ? `${n(w.a.x)},${n(w.a.y)} to ${n(w.b.x)},${n(w.b.y)}` : '(none)';
};

const out = [];
out.push('| Region | Extent |');
out.push('|---|---|');
out.push(`| Cabinet | ${W} x ${H}, ball radius ${BALL_R} |`);
out.push(`| Main playfield | x ${FIELD_LEFT} to ${FIELD_RIGHT} (centre ${(FIELD_LEFT + FIELD_RIGHT) / 2}) |`);
out.push(`| Top arch | centre ${ARCH_C.x},${ARCH_C.y}, radius ${ARCH_R}, collided from inside |`);
out.push(`| Plunger lane | x ${LANE_LEFT} to ${W}, centre ${LANE_CX}, open at y ${LANE_TOP} |`);
out.push(`| Plunger face | y 1030; ball rests at ${BALL_REST.x},${BALL_REST.y} |`);
out.push('');
out.push('| Feature | Position |');
out.push('|---|---|');
out.push(`| Left flipper pivot | ${FLIPPERS.left.pivot.x}, ${FLIPPERS.left.pivot.y} (length ${FLIPPERS.left.length}, base r ${FLIPPERS.left.baseR}, tip r ${FLIPPERS.left.tipR}) |`);
out.push(`| Right flipper pivot | ${FLIPPERS.right.pivot.x}, ${FLIPPERS.right.pivot.y} |`);
out.push(`| Flipper tips at rest | ${n(L.x)},${n(L.y)} and ${n(R.x)},${n(R.y)} |`);
out.push(`| **Drain gap (clear, edge to edge)** | **${n(clearGap)}** against a ${BALL_R * 2}-unit ball |`);
for (const b of BUMPERS) out.push(`| Pop bumper \`${b.id}\` | ${b.x}, ${b.y} (r ${b.r}) |`);
for (const s of SAUCERS) out.push(`| Saucer \`${s.id}\` | ${s.x}, ${s.y} (r ${s.r}) |`);
out.push(`| Spinner | ${SPINNER.x}, ${SPINNER.y} (half-span ${SPINNER.halfSpan}) |`);
out.push(`| Drop targets | ${DROP_TARGETS.map((t) => `${t.x},${t.y}`).join(' / ')} |`);
out.push(`| Rollover lanes | ${ROLLOVERS.map((r) => `${r.x},${r.y}`).join(' / ')} (r ${ROLLOVERS[0].r}) |`);
for (const r of RAMPS) {
  if (!r.path) continue;
  out.push(`| Ramp \`${r.id}\` | entry ${r.entry.x},${r.entry.y} (r ${r.entry.r}) -> exit ${r.exit.x},${r.exit.y}, min speed ${r.minSpeed} |`);
}
out.push(`| Kickback | ${KICKBACK.x}, ${KICKBACK.y} (r ${KICKBACK.r}) |`);
out.push(`| Left slingshot face | ${seg('sling-left')} |`);
out.push(`| Right slingshot face | ${seg('sling-right')} |`);
out.push(`| Left outlane divider | ${seg('guide-outlane-left')} |`);
out.push(`| Right outlane divider | ${seg('guide-outlane-right')} |`);
out.push(`| Left inlane rail | ${seg('rail-inlane-left')} |`);
out.push(`| Right inlane rail | ${seg('rail-inlane-right')} |`);
out.push(`| Rubber posts | ${WALLS.filter((w) => w.type === 'circle').map((w) => `${w.c.x},${w.c.y}`).join(' / ')} (r 11) |`);

console.log(out.join('\n'));
