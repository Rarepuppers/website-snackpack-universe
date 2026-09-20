/**
 * render.js -- canvas renderer.
 *
 * Three layers, per docs/pinball/04-presentation.md:
 *   1. playfield  -- static geometry, cached to an offscreen canvas
 *   2. dynamic    -- balls, flippers, targets, particles
 *   3. light      -- additive glow, drawn at half resolution and upscaled
 *
 * The playfield layer draws the optional canonical Galley bitmap first, then
 * the real table.js geometry above it. A failed or incomplete image load keeps
 * the original flat navy surface, so physics and readability never depend on
 * a decorative asset.
 *
 * Everything draws in logical units under one root transform. Nothing here
 * knows about pixels, which is what lets the Skia port at P8 reuse the draw
 * order unchanged.
 *
 * ONE DEVIATION FROM 04-presentation.md: the DMD is an HTML element, not a
 * canvas dot grid. It has to render arbitrary strings and change constantly,
 * and as markup it is readable by a screen reader and selectable -- a canvas
 * dot grid is invisible to both. The dot-matrix look comes from CSS.
 */

import {
  W, H, BALL_R, WALLS, BUMPERS, SPINNER, ROLLOVERS, RAMPS, KICKBACK, SAUCERS,
  DROP_TARGETS,
} from './table.js';

const INK = {
  cloth: '#1d2230',
  wall: '#5a6478',
  metal: '#8c97ad',
  rubber: '#d8695a',
  sling: '#e0785f',
  bumper: '#f0a35c',
  bumperCore: '#c9793f',
  target: '#7fd0c0',
  targetDown: '#2c3547',
  saucer: '#2a3145',
  lit: '#ffd479',
  ball: '#e8edf7',
  ballDark: '#8e97a8',
  flipper: '#cf7f52',
  flipperHeld: '#f2b35e',
};

/** Where each lit shot's lamp sits, for the glow layer. */
const SHOT_LAMPS = {
  'orbit-left': { x: 190, y: 470 },
  'ramp-right': { x: 296, y: 470 },
  saucer: { x: 243, y: 395 },
  lock: { x: 408, y: 330 },
  bank: { x: 111, y: 597 },
  'spinner-lit': { x: 94, y: 545 },
};

const MAX_PARTICLES = 120;

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let scale = 1;
  let trails = [];
  let particles = [];
  let shake = 0;
  let shakeX = 0;
  let shakeY = 0;
  let clock = 0;

  // Layer 1 is redrawn only on resize; layer 3 is half-resolution.
  const field = document.createElement('canvas');
  const fieldCtx = field.getContext('2d');
  const light = document.createElement('canvas');
  const lightCtx = light.getContext('2d');
  const playfield = new Image();
  let playfieldReady = false;

  playfield.decoding = 'async';
  playfield.onload = () => {
    playfieldReady = true;
    if (field.width > 0 && field.height > 0) drawField();
  };
  playfield.onerror = () => {
    playfieldReady = false;
    if (field.width > 0 && field.height > 0) drawField();
  };
  // `?art=off` is the deterministic development comparison: it captures the
  // same live geometry over the procedural fallback without moving a single
  // rule-bearing coordinate.
  if (new URLSearchParams(window.location.search).get('art') !== 'off') {
    const playfieldTier = (window.devicePixelRatio || 1) > 2
      ? 'playfield-galley@3x.webp'
      : 'playfield-galley.webp';
    playfield.src = new URL(`../shared-assets/game-ui/pinball/playfields/${playfieldTier}`, import.meta.url).href;
  }

  const reducedMotion = () => {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch (err) { return false; }
  };

  // -------------------------------------------------------------------------
  function resize() {
    const stage = canvas.parentElement;
    // Capped at 3, not 2. Beyond 3 the fill cost of the dynamic and light
    // layers grows faster than anything a display can show. At 3 the table is
    // noticeably crisper on a modern phone, and it is the tier the Codex art
    // ships at -- a 2 cap would have meant the 3x playfield never rendered.
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const availW = stage.clientWidth;
    let availH = stage.clientHeight;

    // A degenerate measurement must never be written to the canvas: a 0x0
    // backing store renders nothing and there is no error to notice. If the
    // stage reports no height, derive it from the width; if it has no width
    // either, leave the last good size alone and wait for the next resize.
    if (availW <= 0) return;
    if (availH <= 0) availH = availW * (H / W);

    const cssW = Math.min(availW, availH * (W / H));
    const cssH = cssW * (H / W);
    canvas.style.width = `${Math.round(cssW)}px`;
    canvas.style.height = `${Math.round(cssH)}px`;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    scale = canvas.width / W;

    field.width = canvas.width;
    field.height = canvas.height;
    light.width = Math.max(1, Math.round(canvas.width / 2));
    light.height = Math.max(1, Math.round(canvas.height / 2));

    drawField();
  }

  // -- Layer 1: static playfield, cached ------------------------------------
  function drawField() {
    const c = fieldCtx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, field.width, field.height);
    c.scale(scale, scale);

    if (playfieldReady) {
      c.drawImage(playfield, 0, 0, W, H);
    } else {
      c.fillStyle = INK.cloth;
      c.fillRect(0, 0, W, H);
    }

    // Ramp beds, drawn under everything so a captured ball reads as elevated.
    c.strokeStyle = 'rgba(120,140,190,0.20)';
    c.lineWidth = 24;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    for (const r of RAMPS) {
      if (!r.path) continue;
      c.beginPath();
      c.moveTo(r.path[0].x, r.path[0].y);
      for (const p of r.path.slice(1)) c.lineTo(p.x, p.y);
      c.stroke();
    }

    c.lineCap = 'round';
    for (const s of WALLS) {
      c.beginPath();
      if (s.type === 'segment') {
        c.moveTo(s.a.x, s.a.y);
        c.lineTo(s.b.x, s.b.y);
        c.strokeStyle = s.kind === 'sling' ? INK.sling : INK.wall;
        c.lineWidth = s.kind === 'sling' ? 7 : 4;
        c.stroke();
      } else if (s.type === 'arc') {
        c.arc(s.c.x, s.c.y, s.r, s.a0, s.a1);
        c.strokeStyle = INK.wall;
        c.lineWidth = 4;
        c.stroke();
      } else if (s.type === 'circle') {
        c.arc(s.c.x, s.c.y, s.r, 0, Math.PI * 2);
        c.fillStyle = INK.rubber;
        c.fill();
      }
    }

    // Unlit lamp inserts. Code lights them on layer 3.
    for (const key of Object.keys(SHOT_LAMPS)) {
      const p = SHOT_LAMPS[key];
      c.beginPath();
      c.arc(p.x, p.y, 13, 0, Math.PI * 2);
      c.fillStyle = 'rgba(255,212,121,0.10)';
      c.fill();
      c.strokeStyle = 'rgba(255,212,121,0.22)';
      c.lineWidth = 2;
      c.stroke();
    }

    for (const r of ROLLOVERS) {
      c.beginPath();
      c.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      c.strokeStyle = 'rgba(255,212,121,0.30)';
      c.lineWidth = 2;
      c.stroke();
    }

    c.beginPath();
    c.moveTo(SPINNER.x, SPINNER.y - SPINNER.halfSpan);
    c.lineTo(SPINNER.x, SPINNER.y + SPINNER.halfSpan);
    c.strokeStyle = INK.metal;
    c.lineWidth = 3;
    c.stroke();

    c.beginPath();
    c.arc(KICKBACK.x, KICKBACK.y, KICKBACK.r, 0, Math.PI * 2);
    c.strokeStyle = 'rgba(224,120,95,0.40)';
    c.lineWidth = 2;
    c.stroke();

    // Bumper skirts belong to the static table; the caps animate.
    for (const b of BUMPERS) {
      c.beginPath();
      c.arc(b.x, b.y, b.r + 4, 0, Math.PI * 2);
      c.fillStyle = 'rgba(240,163,92,0.16)';
      c.fill();
    }
  }

  // -- Particles ------------------------------------------------------------
  function burst(x, y, count, colour, speed) {
    if (reducedMotion()) return;
    for (let i = 0; i < count && particles.length < MAX_PARTICLES; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.4 + Math.random() * 0.8);
      particles.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 0.28 + Math.random() * 0.22,
        age: 0,
        colour,
      });
    }
  }

  function stepParticles(dt) {
    if (!particles.length) return;
    for (const p of particles) {
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 900 * dt;
      p.vx *= 0.96;
    }
    particles = particles.filter((p) => p.age < p.life);
  }

  function drawParticles() {
    for (const p of particles) {
      const a = 1 - p.age / p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.4 * a + 0.6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.colour},${(a * 0.9).toFixed(3)})`;
      ctx.fill();
    }
  }

  function kick(strength) {
    if (reducedMotion()) return;
    shake = Math.max(shake, strength);
  }

  // -- Layer 2 pieces -------------------------------------------------------
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

  function drawBumpers(flashes) {
    for (const b of BUMPERS) {
      const flash = flashes.get(b.id) || 0;
      const pop = flash > 0 ? 1 + flash * 0.5 : 1;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * pop, 0, Math.PI * 2);
      ctx.fillStyle = INK.bumper;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * 0.55 * pop, 0, Math.PI * 2);
      ctx.fillStyle = flash > 0 ? '#fff6e0' : INK.bumperCore;
      ctx.fill();
    }
  }

  function drawFlipper(f) {
    const tipX = f.pivot.x + Math.cos(f.angle) * f.length;
    const tipY = f.pivot.y + Math.sin(f.angle) * f.length;
    const nx = -Math.sin(f.angle);
    const ny = Math.cos(f.angle);
    ctx.fillStyle = f.held ? INK.flipperHeld : INK.flipper;
    ctx.beginPath();
    ctx.moveTo(f.pivot.x + nx * f.baseR, f.pivot.y + ny * f.baseR);
    ctx.lineTo(tipX + nx * f.tipR, tipY + ny * f.tipR);
    ctx.lineTo(tipX - nx * f.tipR, tipY - ny * f.tipR);
    ctx.lineTo(f.pivot.x - nx * f.baseR, f.pivot.y - ny * f.baseR);
    ctx.closePath();
    ctx.fill();
    for (const [cx, cy, r] of [[f.pivot.x, f.pivot.y, f.baseR], [tipX, tipY, f.tipR]]) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(f.pivot.x, f.pivot.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = INK.metal;
    ctx.fill();
  }

  function drawBall(ball, trail) {
    const inRamp = !!ball.inRamp;
    const r = inRamp ? BALL_R * 1.12 : BALL_R;

    // Trail: alpha-faded copies along the recent path. Cheap, and the single
    // biggest thing that makes a fast ball read as fast rather than teleport.
    for (let i = 0; i < trail.length; i += 1) {
      const p = trail[i];
      const a = ((i + 1) / (trail.length + 1)) * 0.26;
      ctx.beginPath();
      ctx.arc(p.x, p.y, BALL_R * (0.55 + 0.45 * (i / trail.length)), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(210,222,245,${a.toFixed(3)})`;
      ctx.fill();
    }

    // Shadow. Longer on a ramp, which is what sells the ramp as elevated.
    ctx.beginPath();
    ctx.arc(ball.x + (inRamp ? 7 : 3), ball.y + (inRamp ? 9 : 4), r, 0, Math.PI * 2);
    ctx.fillStyle = inRamp ? 'rgba(0,0,0,0.42)' : 'rgba(0,0,0,0.35)';
    ctx.fill();

    const g = ctx.createRadialGradient(
      ball.x - r * 0.35, ball.y - r * 0.4, r * 0.12,
      ball.x, ball.y, r,
    );
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.45, INK.ball);
    g.addColorStop(1, INK.ballDark);
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();

    // Rim light opposite the highlight, so the sphere reads at small sizes.
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, r - 1, Math.PI * 0.15, Math.PI * 0.85);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // -- Layer 3: additive light ---------------------------------------------
  function drawLight(world, flashes, litShots) {
    const c = lightCtx;
    const s = scale / 2;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, light.width, light.height);
    c.scale(s, s);
    c.globalCompositeOperation = 'lighter';

    const glow = (x, y, radius, rgb, strength) => {
      const g = c.createRadialGradient(x, y, 0, x, y, radius);
      g.addColorStop(0, `rgba(${rgb},${strength.toFixed(3)})`);
      g.addColorStop(1, `rgba(${rgb},0)`);
      c.fillStyle = g;
      c.beginPath();
      c.arc(x, y, radius, 0, Math.PI * 2);
      c.fill();
    };

    // Lit shots pulse at 2 Hz. Reduced motion holds them steady rather than
    // removing them -- the glow is information, not decoration.
    const pulse = reducedMotion() ? 0.8 : 0.6 + 0.4 * Math.abs(Math.sin(clock * Math.PI * 2));
    for (const shot of litShots) {
      const lamp = SHOT_LAMPS[shot];
      if (lamp) glow(lamp.x, lamp.y, 46, '255,205,110', 0.5 * pulse);
    }

    for (const [id, amount] of flashes) {
      const b = BUMPERS.find((x) => x.id === id);
      if (b) glow(b.x, b.y, 78, '255,226,170', Math.min(1, amount * 7));
    }

    for (const ball of world.balls) {
      if (!ball.alive) continue;
      glow(ball.x, ball.y, 34, '190,215,255', 0.30);
    }

    c.globalCompositeOperation = 'source-over';
  }

  // -- Public ---------------------------------------------------------------
  function draw(world, flashes, litShots, dt) {
    const step = dt || 0;
    clock += step;
    stepParticles(step);

    if (shake > 0) {
      shake = Math.max(0, shake - step * 42);
      shakeX = (Math.random() - 0.5) * shake;
      shakeY = (Math.random() - 0.5) * shake;
    } else {
      shakeX = 0;
      shakeY = 0;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let ox = shakeX;
    let oy = shakeY;
    if (world.nudge && world.nudge.t > 0 && !reducedMotion()) {
      const k = world.nudge.t / 0.12;
      ox += world.nudge.x * 7 * k;
      oy += world.nudge.y * 7 * k;
    }

    // Layer 1, already rasterised at device scale.
    ctx.drawImage(field, ox * scale, oy * scale);

    // Layer 2 in logical units.
    ctx.setTransform(scale, 0, 0, scale, ox * scale, oy * scale);
    drawSaucers(world);
    drawDropTargets(world);
    drawBumpers(flashes);
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

    drawParticles();

    if (world.phase === 'ready' && world.plunger.power > 0) {
      const h = 70 * world.plunger.power;
      ctx.fillStyle = INK.lit;
      ctx.fillRect(W - 26, 1026 - h, 18, h);
    }

    // Layer 3, upscaled from half resolution.
    drawLight(world, flashes, litShots || []);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(light, ox * scale, oy * scale, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
  }

  resize();
  return {
    resize,
    draw,
    burst,
    kick,
    get particleCount() { return particles.length; },
  };
}
