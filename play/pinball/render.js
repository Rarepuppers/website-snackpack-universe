/**
 * render.js -- canvas renderer.
 *
 * P2 draws the table from table.js geometry in flat colours: no art, no
 * lighting, no DMD. That is deliberate. The grey-box exists to prove the
 * table PLAYS, and to freeze the coordinates Codex paints against -- if the
 * art arrives first, every geometry change repaints it.
 *
 * Structure is already the three layers from docs/pinball/04-presentation.md
 * (playfield / dynamic / light) so P6 fills them in rather than restructuring.
 * Everything draws in logical units under one root transform; nothing here
 * knows about pixels, which is also what lets the Skia port reuse the draw
 * order unchanged.
 */

import {
  W, H, BALL_R, WALLS, BUMPERS, DROP_TARGETS, SPINNER, SAUCERS,
  ROLLOVERS, RAMPS, KICKBACK, ARCH_C, ARCH_R,
} from './table.js';

const INK = {
  cloth: '#1d2230',
  clothEdge: '#161a25',
  wall: '#5a6478',
  metal: '#8c97ad',
  rubber: '#d8695a',
  sling: '#e0785f',
  bumper: '#f0a35c',
  lane: '#39435c',
  target: '#7fd0c0',
  targetDown: '#39435c',
  saucer: '#2a3145',
  lit: '#ffd479',
  ball: '#e8edf7',
  ballDark: '#8e97a8',
  ramp: '#46527040',
  text: '#cfd7e6',
};

/** Flipper capsule radius at parameter s along its length. */
const flipRadius = (f, s) => f.baseR + (f.tipR - f.baseR) * s;

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let scale = 1;
  let trails = [];

  function resize() {
    const stage = canvas.parentElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const availW = stage.clientWidth;
    let availH = stage.clientHeight;

    // A degenerate measurement must never be written to the canvas: a 0x0
    // backing store renders nothing and there is no error to notice. If the
    // stage reports no height, derive it from the width; if it has no width
    // either, leave the last good size alone and wait for the next resize.
    if (availW <= 0) return;
    if (availH <= 0) availH = availW * (H / W);

    // Fit the 500x1040 table inside the stage, preserving aspect.
    const cssW = Math.min(availW, availH * (W / H));
    const cssH = cssW * (H / W);
    canvas.style.width = `${Math.round(cssW)}px`;
    canvas.style.height = `${Math.round(cssH)}px`;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    scale = canvas.width / W;
  }

  // -- Layer 1: the static playfield -------------------------------------
  function drawPlayfield() {
    ctx.fillStyle = INK.cloth;
    ctx.fillRect(0, 0, W, H);

    // Arch and outer boundary.
    ctx.strokeStyle = INK.wall;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    for (const s of WALLS) {
      ctx.beginPath();
      if (s.type === 'segment') {
        ctx.moveTo(s.a.x, s.a.y);
        ctx.lineTo(s.b.x, s.b.y);
        ctx.strokeStyle = s.kind === 'sling' ? INK.sling : INK.wall;
        ctx.lineWidth = s.kind === 'sling' ? 6 : 4;
        ctx.stroke();
      } else if (s.type === 'arc') {
        ctx.arc(s.c.x, s.c.y, s.r, s.a0, s.a1);
        ctx.strokeStyle = INK.wall;
        ctx.lineWidth = 4;
        ctx.stroke();
      } else if (s.type === 'circle') {
        ctx.arc(s.c.x, s.c.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = INK.rubber;
        ctx.fill();
      }
    }

    // Ramp paths, drawn faintly so the grey-box shows where a captured ball goes.
    ctx.strokeStyle = 'rgba(120,140,190,0.22)';
    ctx.lineWidth = 22;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const r of RAMPS) {
      if (!r.path) continue;
      ctx.beginPath();
      ctx.moveTo(r.path[0].x, r.path[0].y);
      for (const p of r.path.slice(1)) ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }

    // Ramp entrances.
    ctx.lineWidth = 2;
    for (const r of RAMPS) {
      if (!r.path) continue;
      ctx.beginPath();
      ctx.arc(r.entry.x, r.entry.y, r.entry.r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(160,200,255,0.5)';
      ctx.stroke();
    }

    // Rollover lanes.
    for (const r of ROLLOVERS) {
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,212,121,0.35)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Spinner.
    ctx.beginPath();
    ctx.moveTo(SPINNER.x, SPINNER.y - SPINNER.halfSpan);
    ctx.lineTo(SPINNER.x, SPINNER.y + SPINNER.halfSpan);
    ctx.strokeStyle = INK.metal;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Kickback port.
    ctx.beginPath();
    ctx.arc(KICKBACK.x, KICKBACK.y, KICKBACK.r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(224,120,95,0.45)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // -- Layer 2: everything that moves ------------------------------------
  function drawSaucers(world) {
    for (const s of world.saucers) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = INK.saucer;
      ctx.fill();
      ctx.strokeStyle = s.ball ? INK.lit : INK.metal;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  function drawDropTargets(world) {
    for (const t of world.dropTargets) {
      const half = t.w / 2;
      const dx = Math.cos(t.angle) * half;
      const dy = Math.sin(t.angle) * half;
      ctx.beginPath();
      ctx.moveTo(t.x - dx, t.y - dy);
      ctx.lineTo(t.x + dx, t.y + dy);
      ctx.strokeStyle = t.up ? INK.target : INK.targetDown;
      ctx.lineWidth = t.up ? 9 : 4;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }

  function drawBumpers(world, flashes) {
    for (const b of BUMPERS) {
      const flash = flashes.get(b.id) || 0;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = INK.bumper;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = flash > 0 ? '#fff6e0' : '#c9793f';
      ctx.fill();
    }
  }

  function drawFlipper(f) {
    const tipX = f.pivot.x + Math.cos(f.angle) * f.length;
    const tipY = f.pivot.y + Math.sin(f.angle) * f.length;
    // A capsule: thick round line from base radius to tip radius. Canvas has
    // no tapered stroke, so draw the two end circles plus the connecting quad.
    const nx = -Math.sin(f.angle);
    const ny = Math.cos(f.angle);
    ctx.beginPath();
    ctx.moveTo(f.pivot.x + nx * f.baseR, f.pivot.y + ny * f.baseR);
    ctx.lineTo(tipX + nx * f.tipR, tipY + ny * f.tipR);
    ctx.lineTo(tipX - nx * f.tipR, tipY - ny * f.tipR);
    ctx.lineTo(f.pivot.x - nx * f.baseR, f.pivot.y - ny * f.baseR);
    ctx.closePath();
    ctx.fillStyle = f.held ? '#f2b35e' : '#cf7f52';
    ctx.fill();
    for (const [cx, cy, r] of [[f.pivot.x, f.pivot.y, f.baseR], [tipX, tipY, f.tipR]]) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Pivot pin.
    ctx.beginPath();
    ctx.arc(f.pivot.x, f.pivot.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = INK.metal;
    ctx.fill();
  }

  function drawBall(ball, trail) {
    // Trail: a few alpha-faded copies. Cheap, and the single biggest thing
    // that makes a fast ball read as fast rather than teleporting.
    for (let i = 0; i < trail.length; i += 1) {
      const p = trail[i];
      const a = ((i + 1) / (trail.length + 1)) * 0.28;
      ctx.beginPath();
      ctx.arc(p.x, p.y, BALL_R * (0.6 + 0.4 * (i / trail.length)), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(210,222,245,${a})`;
      ctx.fill();
    }

    // Shadow.
    ctx.beginPath();
    ctx.arc(ball.x + 3, ball.y + 4, BALL_R, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fill();

    // Body.
    const g = ctx.createRadialGradient(
      ball.x - BALL_R * 0.35, ball.y - BALL_R * 0.4, BALL_R * 0.15,
      ball.x, ball.y, BALL_R,
    );
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.45, INK.ball);
    g.addColorStop(1, INK.ballDark);
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
  }

  // -- Public ------------------------------------------------------------
  function draw(world, flashes) {
    const dpr = scale;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);

    // Nudge shake: shift the whole table, not the DOM node.
    if (world.nudge && world.nudge.t > 0) {
      const k = world.nudge.t / 0.12;
      ctx.translate(world.nudge.x * 7 * k, world.nudge.y * 7 * k);
    }

    drawPlayfield();
    drawSaucers(world);
    drawDropTargets(world);
    drawBumpers(world, flashes);
    drawFlipper(world.flippers.left);
    drawFlipper(world.flippers.right);

    const alive = world.balls.filter((b) => b.alive);
    if (trails.length !== alive.length) trails = alive.map(() => []);
    alive.forEach((b, i) => {
      const t = trails[i] || (trails[i] = []);
      t.push({ x: b.x, y: b.y });
      if (t.length > 5) t.shift();
      drawBall(b, t);
    });

    // Plunger charge indicator, in the lane.
    if (world.phase === 'ready' && world.plunger.power > 0) {
      const h = 70 * world.plunger.power;
      ctx.fillStyle = INK.lit;
      ctx.fillRect(W - 26, 1026 - h, 18, h);
    }

    ctx.restore();
  }

  resize();
  return { resize, draw, get scale() { return scale; } };
}
