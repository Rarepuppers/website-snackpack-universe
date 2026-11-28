// Snack Drop renderer: draws the 2D physics plane in 3D with Three.js.
// Every model is code-built for the prototype. Blender GLBs replace them in
// phase 2 through the same per-tier template, so nothing else has to change.
import * as THREE from "./vendor/three.module.min.js";
import { model, hasModel } from "./assets.js";

const SD = window.SnackDrop;
const { CRATE, TIERS } = SD;

// Main colour per tier, also used by the HUD ladder and the merge crumbs.
export const TIER_COLORS = ["#c98a4b", "#e6c27a", "#8a5a33", "#f4c430", "#f29bb8", "#7cc46a", "#d9893a", "#e8553f", "#f5d6e0", "#a8642e", "#f2c14e"];

const mats = new Map();
function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!mats.has(key)) mats.set(key, new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.75, metalness: 0 }, opts)));
  return mats.get(key);
}
function mesh(geo, m, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(geo, m);
  o.position.set(x, y, z);
  o.castShadow = true; o.receiveShadow = true;
  return o;
}
// A disc whose flat face looks at the camera.
function disc(r, depth, m, segs = 40) {
  const o = mesh(new THREE.CylinderGeometry(r, r, depth, segs), m);
  o.rotation.x = Math.PI / 2;
  return o;
}
function rounded(w, h, d, r, m) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const geo = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2, curveSegments: 6 });
  geo.translate(0, 0, -d / 2);
  return mesh(geo, m);
}
// Small seeded scatter so every copy of a snack looks the same.
function scatter(count, seed, fn) {
  const r = SD.rng(seed);
  for (let i = 0; i < count; i++) fn(r(), r(), r(), i);
}

// Code-built looks per container (PLAN 4a). Authored models replace them:
// assets/models/containers/container_<id>.glb and backdrops/backdrop_<id>.glb.
const LOOKS = {
  pantry:    { bg: "#f6e3c8", wall: "#f3dcc0", tile: "#e6c9a6", counter: "#9c6b43", side: "#c8955c", cap: "#a7743f", boards: ["#a7743f", "#c8955c"], floor: "#a7743f", rough: 0.85 },
  toybox:    { bg: "#f1e4f4", wall: "#efe1f3", tile: "#dcc7e6", counter: "#8fb8de", side: "#e98080", cap: "#4f8fd6", boards: ["#f6d55c", "#7cc6e8"], floor: "#4f8fd6", rough: 0.55, fillet: "#f6d55c" },
  icecooler: { bg: "#dcf0f8", wall: "#d9eef7", tile: "#bcdcea", counter: "#e7cf9f", side: "#f4f8fb", cap: "#5ab0e6", boards: ["#dff1fb", "#c9e7f7"], floor: "#bfe3f5", rough: 0.25 },
  market:    { bg: "#dcebe7", wall: "#d7eae6", tile: "#b9d6d0", counter: "#8a6a4a", side: "#b98a57", cap: "#8d6438", boards: ["#b98a57", "#a37445"], floor: "#8d6438", rough: 0.95, slats: true }
};

const BUILD = {
  crumb(t) {
    const g = new THREE.Group();
    const geo = new THREE.IcosahedronGeometry(t.r * 1.02, 1);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const k = 0.86 + 0.18 * Math.abs(Math.sin(i * 12.9898) * 43758.5453 % 1); p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k); }
    geo.computeVertexNormals();
    g.add(mesh(geo, mat(TIER_COLORS[0], { flatShading: true })));
    return g;
  },
  cracker(t) {
    const g = new THREE.Group();
    g.add(rounded(t.w - 0.08, t.h - 0.08, 0.22, 0.06, mat(TIER_COLORS[1])));
    const dot = new THREE.CylinderGeometry(0.035, 0.035, 0.02, 8);
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
      const d = mesh(dot, mat("#b48a45"), i * 0.19, j * 0.19, 0.16); d.rotation.x = Math.PI / 2; g.add(d);
    }
    return g;
  },
  cookie(t) {
    const g = new THREE.Group();
    g.add(disc(t.r, 0.3, mat("#b9824e")));
    const chip = new THREE.DodecahedronGeometry(0.075, 0);
    scatter(9, 11, (a, b, c) => {
      const ang = a * Math.PI * 2, rad = Math.sqrt(b) * t.r * 0.78;
      g.add(mesh(chip, mat("#3b2416"), Math.cos(ang) * rad, Math.sin(ang) * rad, 0.16));
    });
    return g;
  },
  cheese(t) {
    const g = new THREE.Group();
    const s = new THREE.Shape();
    s.moveTo(t.points[0].x, t.points[0].y); s.lineTo(t.points[1].x, t.points[1].y); s.lineTo(t.points[2].x, t.points[2].y); s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.9, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2 });
    geo.translate(0, 0, -0.45);
    g.add(mesh(geo, mat(TIER_COLORS[3], { roughness: 0.55 })));
    [[-0.15, -0.05, 0.13], [0.22, -0.2, 0.09], [-0.28, 0.32, 0.08], [0.05, -0.28, 0.06]].forEach(([x, y, r]) => {
      const hole = mesh(new THREE.CircleGeometry(r, 18), mat("#c99a12"), x, y, 0.495); hole.castShadow = false; g.add(hole);
    });
    return g;
  },
  donut(t) {
    const g = new THREE.Group();
    const R = t.r * 0.66, tube = t.r * 0.34;
    g.add(mesh(new THREE.TorusGeometry(R, tube, 18, 40), mat("#d79a55")));
    const icing = mesh(new THREE.TorusGeometry(R, tube * 0.9, 16, 40), mat(TIER_COLORS[4], { roughness: 0.4 }), 0, 0, tube * 0.32);
    icing.scale.z = 0.75; g.add(icing);
    const bit = new THREE.BoxGeometry(0.1, 0.03, 0.03);
    const colours = ["#ffffff", "#5ec4e8", "#ffd84d", "#7cd37c", "#ff7a7a"];
    scatter(26, 5, (a, b, c, i) => {
      const ang = a * Math.PI * 2, rad = R + (b - 0.5) * tube * 1.2;
      const m = mesh(bit, mat(colours[i % colours.length]), Math.cos(ang) * rad, Math.sin(ang) * rad, tube * 0.95);
      m.rotation.z = c * Math.PI; g.add(m);
    });
    return g;
  },
  sandwich(t) {
    const g = new THREE.Group(), w = t.w - 0.06, h = t.h;
    const layer = (y, hh, color, inset = 0, r = 0.08) => { const o = rounded(w - inset, hh, 1.0, r, mat(color)); o.position.y = y; g.add(o); };
    layer(-h / 2 + 0.18, 0.32, "#e9c48a", 0, 0.12);
    layer(-h / 2 + 0.4, 0.1, "#7cc46a", -0.12, 0.04);
    layer(-h / 2 + 0.52, 0.12, "#e8553f", 0.1, 0.05);
    layer(-h / 2 + 0.64, 0.08, "#ffd84d", -0.08, 0.03);
    layer(h / 2 - 0.25, 0.42, "#e9c48a", 0, 0.16);
    return g;
  },
  pie(t) {
    const g = new THREE.Group();
    g.add(disc(t.r, 0.7, mat("#d9893a")));
    const fill = disc(t.r * 0.86, 0.06, mat("#8e2f3b")); fill.position.z = 0.34; g.add(fill);
    const rim = mesh(new THREE.TorusGeometry(t.r * 0.9, 0.1, 10, 40), mat("#e8a453"), 0, 0, 0.36); g.add(rim);
    for (let i = -2; i <= 2; i++) {
      const len = 2 * Math.sqrt(Math.max(0, (t.r * 0.86) ** 2 - (i * 0.32) ** 2));
      g.add(mesh(new THREE.BoxGeometry(0.13, len, 0.06), mat("#efb565"), i * 0.32, 0, 0.4));
      g.add(mesh(new THREE.BoxGeometry(len, 0.13, 0.06), mat("#efb565"), 0, i * 0.32, 0.43));
    }
    return g;
  },
  pizza(t) {
    const g = new THREE.Group();
    g.add(disc(t.r, 0.24, mat("#e2a85c")));
    const sauce = disc(t.r * 0.86, 0.04, mat("#c8361f")); sauce.position.z = 0.13; g.add(sauce);
    const cheese = disc(t.r * 0.8, 0.04, mat("#f7d77a", { roughness: 0.5 })); cheese.position.z = 0.15; g.add(cheese);
    g.add(mesh(new THREE.TorusGeometry(t.r * 0.92, 0.1, 10, 44), mat("#d6904a"), 0, 0, 0.1));
    const pep = new THREE.CylinderGeometry(0.16, 0.16, 0.04, 16);
    scatter(9, 3, (a, b) => {
      const ang = a * Math.PI * 2, rad = 0.2 + b * t.r * 0.55;
      const m = mesh(pep, mat("#a8261c"), Math.cos(ang) * rad, Math.sin(ang) * rad, 0.18); m.rotation.x = Math.PI / 2; g.add(m);
    });
    return g;
  },
  cake(t) {
    const g = new THREE.Group(), w = t.w - 0.06, h = t.h;
    const tier = (y, hh, color, inset = 0) => { const o = rounded(w - inset, hh, 1.3, 0.08, mat(color)); o.position.y = y; g.add(o); };
    tier(-h / 2 + 0.3, 0.6, "#f3d9a4");
    tier(-h / 2 + 0.66, 0.12, "#ffffff", -0.04);
    tier(-h / 2 + 1.0, 0.56, "#f3d9a4");
    tier(h / 2 - 0.2, 0.36, TIER_COLORS[8], -0.06);
    g.add(mesh(new THREE.SphereGeometry(0.18, 16, 12), mat("#d1192e", { roughness: 0.3 }), 0, h / 2 + 0.06, 0));
    return g;
  },
  burger(t) {
    const g = new THREE.Group(), r = t.r;
    const top = mesh(new THREE.SphereGeometry(r * 0.98, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat("#c9813e"), 0, 0.1, 0);
    top.scale.set(1, 0.92, 0.7); g.add(top);
    const seed = new THREE.SphereGeometry(0.06, 8, 6);
    scatter(16, 9, (a, b) => {
      const ang = a * Math.PI * 0.8 + Math.PI * 0.1, lift = 0.25 + b * 0.6;
      const s = mesh(seed, mat("#fff3d6"), Math.cos(ang) * r * 0.85 * Math.cos(lift), 0.1 + Math.sin(ang) * 0.92 * r * 0.9 * Math.sin(lift + 0.6), r * 0.6);
      s.scale.set(1.3, 0.7, 0.7); g.add(s);
    });
    const slab = (y, hh, rr, color) => { const o = mesh(new THREE.CylinderGeometry(rr, rr, hh, 36), mat(color), 0, y, 0); o.scale.z = 0.7; g.add(o); };
    slab(0.0, 0.14, r * 0.99, "#7cc46a");
    slab(-0.22, 0.12, r * 0.97, "#ffc93c");
    slab(-0.48, 0.42, r * 0.95, "#5a3520");
    slab(-1.0, 0.6, r * 0.9, "#c9813e");
    return g;
  },
  hamper(t) {
    const g = new THREE.Group(), w = t.w - 0.08, h = t.h - 0.1;
    g.add(rounded(w, h * 0.78, 1.5, 0.14, mat("#b07a3c")));
    g.children[0].position.y = -h * 0.11;
    for (let i = 0; i < 5; i++) g.add(mesh(new THREE.BoxGeometry(w + 0.02, 0.05, 1.56), mat("#8a5a2b"), 0, -h / 2 + 0.2 + i * 0.32, 0));
    g.add(mesh(new THREE.BoxGeometry(0.22, h * 0.8, 1.6), mat("#f2c14e", { metalness: 0.5, roughness: 0.3 }), 0, -h * 0.1, 0));
    const handle = mesh(new THREE.TorusGeometry(w * 0.36, 0.07, 10, 30, Math.PI), mat("#8a5a2b"), 0, h * 0.28, 0); g.add(handle);
    const bow = new THREE.TorusGeometry(0.22, 0.08, 10, 20);
    g.add(mesh(bow, mat("#f2c14e", { metalness: 0.5, roughness: 0.3 }), -0.24, h * 0.3, 0.76));
    g.add(mesh(bow, mat("#f2c14e", { metalness: 0.5, roughness: 0.3 }), 0.24, h * 0.3, 0.76));
    return g;
  }
};

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance", stencil: false });
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#f6e3c8");
    this.camera = new THREE.PerspectiveCamera(30, 1, 1, 200);
    this.fromModel = TIERS.map(() => false);
    this.templates = TIERS.map((t, i) => this.buildTemplate(i));
    this.meshes = new Map();
    this.pops = new Map();
    this.squash = new Map();   // id -> seconds since it landed
    this.wasLanded = new Set();
    this.prev = new Map();     // id -> position before the last physics step, for smooth drawing
    this.alpha = 1;
    this.shake = 0;
    this.push = { amount: 0, target: 0, x: 0, y: 0 };  // camera push toward a point
    this.reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.ghostMat = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.3, depthWrite: false });
    this.ghosts = TIERS.map((t, i) => this.buildGhost(i));
    this.buildScene();
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  buildScene() {
    const s = this.scene, H = CRATE.half, Wl = CRATE.wall, ht = CRATE.height;
    s.add(new THREE.HemisphereLight("#fff4e0", "#8a6a4a", 1.4));
    const sun = new THREE.DirectionalLight("#fff1dc", 2.2);
    sun.position.set(-6, 16, 14); sun.target.position.set(0, 4, 0);
    sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 14, bottom: -3, near: 1, far: 50 });
    sun.shadow.bias = -0.0008;
    s.add(sun, sun.target);

    const depth = 2.0;
    this.containerId = "";
    this.setContainer("pantry");

    // The line snacks must stay under.
    this.line = mesh(new THREE.BoxGeometry(2 * H, 0.06, 0.06), new THREE.MeshBasicMaterial({ color: "#ee6b5f", transparent: true, opacity: 0.45 }), 0, SD.CONTAINERS[this.containerId].line, depth / 2);
    this.line.castShadow = false; s.add(this.line);
    const dash = new THREE.BoxGeometry(0.3, 0.07, 0.07);
    this.dashes = [];
    for (let x = -H + 0.3; x < H; x += 0.6) { const d = mesh(dash, this.line.material, x, SD.CONTAINERS[this.containerId].line, -depth / 2 + 0.05); d.castShadow = false; s.add(d); this.dashes.push(d); }

    // The aiming guide and the snack held over the crate.
    this.guide = mesh(new THREE.PlaneGeometry(0.06, 1), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.55 }), 0, 0, 0.02);
    this.guide.castShadow = false; s.add(this.guide);
    this.held = new THREE.Group(); s.add(this.held);
    this.ghost = new THREE.Group(); this.ghost.renderOrder = 2; s.add(this.ghost);
    this.ghostTier = -1;

    // Crumbs: one instanced mesh reused round-robin, so a big chain makes no new objects.
    this.CRUMBS = 240;
    this.crumbMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), new THREE.MeshStandardMaterial({ roughness: 0.7 }), this.CRUMBS);
    this.crumbMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.crumbMesh.frustumCulled = false; this.crumbMesh.castShadow = false;
    this.crumbData = Array.from({ length: this.CRUMBS }, () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, spin: 0, rot: 0 }));
    this.crumbNext = 0;
    this.tmpM = new THREE.Matrix4(); this.tmpQ = new THREE.Quaternion(); this.tmpE = new THREE.Euler(); this.tmpV = new THREE.Vector3(); this.tmpS = new THREE.Vector3(); this.tmpC = new THREE.Color();
    const zero = new THREE.Matrix4().makeScale(0, 0, 0);
    for (let i = 0; i < this.CRUMBS; i++) { this.crumbMesh.setMatrixAt(i, zero); this.crumbMesh.setColorAt(i, this.tmpC.set("#ffffff")); }
    s.add(this.crumbMesh);

    // The danger ring: a ring around the snack that is over the line, which empties as its time runs out.
    this.ringSteps = 40;
    this.ringGeos = Array.from({ length: this.ringSteps + 1 }, (_, i) => new THREE.RingGeometry(0.86, 1, 48, 1, Math.PI / 2, Math.max(0.001, (i / this.ringSteps) * Math.PI * 2)));
    this.ring = new THREE.Mesh(this.ringGeos[this.ringSteps], new THREE.MeshBasicMaterial({ color: "#ee6b5f", transparent: true, opacity: 0.9, depthTest: false }));
    this.ring.renderOrder = 3; this.ring.visible = false; s.add(this.ring);

    // Target markers while a tool is armed: a soft ring round every snack it can act on.
    this.armed = null;  // a Set of snack ids, or null
    const markGeo = new THREE.RingGeometry(0.9, 1, 40), markMat = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.85, depthTest: false });
    this.marks = Array.from({ length: 48 }, () => { const m = new THREE.Mesh(markGeo, markMat); m.renderOrder = 3; m.visible = false; s.add(m); return m; });
    this.markMat = markMat;
    this.nextShow = new THREE.Group(); s.add(this.nextShow);
    this.heldTier = -1; this.nextTier = -1;
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // Fit the crate plus the space above it for the held snack and the next one.
    const needW = 2 * CRATE.half + 3.4, needH = CRATE.height + 4.6;
    const vfov = (this.camera.fov * Math.PI) / 180;
    const distH = needH / 2 / Math.tan(vfov / 2);
    const distW = needW / 2 / (Math.tan(vfov / 2) * this.camera.aspect);
    this.dist = Math.max(distH, distW);
    this.focusY = CRATE.height / 2 + 1.1;
    this.camera.updateProjectionMatrix();
  }

  // Screen point to the game plane (x and y). Used to pick a snack for a tool.
  worldPoint(clientX, clientY) {
    const r = this.canvas.getBoundingClientRect();
    const v = new THREE.Vector3(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1, 0.5).unproject(this.camera);
    const dir = v.sub(this.camera.position).normalize();
    const t = -this.camera.position.z / dir.z;
    return { x: this.camera.position.x + dir.x * t, y: this.camera.position.y + dir.y * t };
  }

  // Screen point to the game plane's x. Used for aiming.
  worldX(clientX, clientY) {
    const r = this.canvas.getBoundingClientRect();
    const v = new THREE.Vector3(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1, 0.5).unproject(this.camera);
    const dir = v.sub(this.camera.position).normalize();
    const t = -this.camera.position.z / dir.z;
    return this.camera.position.x + dir.x * t;
  }

  setHeld(group, tier) {
    group.clear();
    if (tier >= 0) group.add(this.templates[tier].clone());
  }

  // Called by the game on every event so effects line up with the physics.
  onEvent(ev) {
    if (ev.type === "spatula") this.burst(ev.x, ev.y, "#fff3d6", 14);
    if (ev.type === "levelup") { this.burst(ev.x, ev.y, "#ffd54a", 22); if (ev.newId) this.pops.set(ev.newId, 0); }
    if (ev.type === "swap") { this.heldTier = this.nextTier = this.ghostTier = -1; this.swapPop = 0; }
    if (ev.type === "merge" || ev.type === "packed") {
      this.burst(ev.x, ev.y, TIER_COLORS[Math.min(ev.tier, TIER_COLORS.length - 1)], 10 + ev.tier * 3);
      if (ev.tier >= 6) this.shake = Math.min(0.35, 0.08 + ev.tier * 0.02);
      if (ev.id) this.pops.set(ev.id, 0);
    }
  }

  burst(x, y, color, n) {
    this.tmpC.set(color);
    for (let i = 0; i < n; i++) {
      const k = this.crumbNext; this.crumbNext = (k + 1) % this.CRUMBS;
      const c = this.crumbData[k], a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 4;
      c.x = x; c.y = y; c.vx = Math.cos(a) * sp; c.vy = Math.sin(a) * sp + 2;
      c.life = c.max = 0.6 + Math.random() * 0.3; c.spin = Math.random() * 8; c.rot = 0;
      this.crumbMesh.setColorAt(k, this.tmpC);
    }
    this.crumbMesh.instanceColor.needsUpdate = true;
  }

  // Builds the code-built container and backdrop for a container id, or the
  // authored models when they have loaded. Called on start and when a game
  // in another container begins.
  setContainer(id) {
    if (!LOOKS[id]) id = "pantry";
    if (id === this.containerId) return;
    this.containerId = id;
    const s = this.scene, H = CRATE.half, Wl = CRATE.wall, ht = CRATE.height, depth = 2.0, L = LOOKS[id];
    for (const o of [this.kitchenGroup, this.crateGroup, this.crateModel, this.kitchenModel]) if (o) s.remove(o);
    this.crateModel = this.kitchenModel = null;
    s.background = new THREE.Color(L.bg);
    const K = this.kitchenGroup = new THREE.Group(), C = this.crateGroup = new THREE.Group();
    s.add(K, C);
    // Back wall with soft tiles, and a counter top (y = -0.6).
    const wall = mesh(new THREE.PlaneGeometry(60, 40), mat(L.wall, { roughness: 0.95 }), 0, 8, -3.2); wall.castShadow = false; K.add(wall);
    for (let i = -8; i <= 8; i++) { const l = mesh(new THREE.PlaneGeometry(0.04, 40), mat(L.tile), i * 1.6, 8, -3.19); l.castShadow = false; K.add(l); }
    for (let j = 0; j < 12; j++) { const l = mesh(new THREE.PlaneGeometry(60, 0.04), mat(L.tile), 0, -1 + j * 1.6, -3.19); l.castShadow = false; K.add(l); }
    K.add(mesh(new THREE.BoxGeometry(40, 1, 8), mat(L.counter, { roughness: 0.6 }), 0, -Wl * 2 - 0.5, 0));

    // The container: back boards, sides, floor. The front stays open.
    const side = mat(L.side, { roughness: L.rough });
    // The caps are the code-built "trim": they glow during Fever. Their own
    // material (not the shared cache) so the glow touches nothing else.
    const cap = new THREE.MeshStandardMaterial({ color: L.cap, roughness: L.rough });
    this.trimMats = [cap];
    C.add(mesh(new THREE.BoxGeometry(2 * H + 2 * Wl, 2 * Wl, depth + 0.4), mat(L.floor, { roughness: L.rough }), 0, -Wl, 0));
    if (L.slats) {
      // Rough market crate: narrow slats with dark gaps between them.
      C.add(mesh(new THREE.PlaneGeometry(2 * H, ht), mat("#3a2414"), 0, ht / 2, -depth / 2 - 0.17));
      for (let i = 0; i < 8; i++) C.add(mesh(new THREE.BoxGeometry(2 * H, ht / 8 - 0.22, 0.14), mat(L.boards[i % 2], { roughness: L.rough }), 0, (i + 0.5) * ht / 8, -depth / 2 - 0.08));
    } else {
      for (let i = 0; i < 6; i++) C.add(mesh(new THREE.BoxGeometry(2 * H, ht / 6 - 0.06, 0.16), mat(L.boards[i % 2], { roughness: L.rough }), 0, (i + 0.5) * ht / 6, -depth / 2 - 0.08));
    }
    [-1, 1].forEach((sd) => {
      C.add(mesh(new THREE.BoxGeometry(2 * Wl, ht + 2 * Wl, depth + 0.4), side, sd * (H + Wl), ht / 2, 0));
      C.add(mesh(new THREE.BoxGeometry(2 * Wl + 0.1, 0.18, depth + 0.5), cap, sd * (H + Wl), ht + Wl + 0.05, 0));
    });
    const box = SD.CONTAINERS[id];
    if (box.fillet) {
      // Rounded inside corners: a square with a quarter circle cut out, matching the physics.
      const R = box.fillet, sh = new THREE.Shape();
      sh.moveTo(0, 0); sh.lineTo(R, 0); sh.absarc(R, R, R, -Math.PI / 2, -Math.PI, true); sh.lineTo(0, 0);
      const geo = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false, curveSegments: 12 });
      geo.translate(0, 0, -depth / 2);
      [-1, 1].forEach((sd) => { const f = mesh(geo, mat(L.fillet, { roughness: L.rough, side: THREE.DoubleSide }), sd * H, 0, 0); f.scale.x = -sd; C.add(f); });
    }
    // The line sits where this container's rules put it.
    if (this.line) { this.line.position.y = box.line; for (const d of this.dashes) d.position.y = box.line; }
    this.refreshAssets();
  }

  // A tier's template: the authored model when it has loaded, otherwise the code-built one.
  buildTemplate(i) {
    const t = TIERS[i], authored = model("snacks/snack_" + t.id);
    this.fromModel[i] = !!authored;
    const m = authored || BUILD[t.id](t);
    m.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return m;
  }
  buildGhost(i) {
    const m = this.templates[i].clone();
    m.traverse((o) => { if (o.isMesh) { o.material = this.ghostMat; o.castShadow = false; o.receiveShadow = false; } });
    return m;
  }

  // Called whenever more assets have loaded: swaps in any authored model that
  // arrived. Snacks on screen rebuild on the next frame in the same places.
  refreshAssets() {
    let changed = false;
    TIERS.forEach((t, i) => {
      if (this.fromModel[i] || !hasModel("snacks/snack_" + t.id)) return;
      this.templates[i] = this.buildTemplate(i); this.ghosts[i] = this.buildGhost(i); changed = true;
      for (const [id, m] of this.meshes) if (m.userData.tier === i) { this.scene.remove(m); this.meshes.delete(id); }
    });
    if (changed) this.heldTier = this.nextTier = this.ghostTier = -1;
    const swap = (name, group, key) => {
      if (this[key] || !hasModel(name)) return;
      const m = model(name);
      m.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      this[key] = m; group.visible = false; this.scene.add(m);
      if (key === "crateModel") {
        // An authored container's Fever glow is its material named "trim".
        const trims = [];
        m.traverse((o) => { if (o.isMesh && o.material && o.material.name === "trim") { o.material = o.material.clone(); trims.push(o.material); } });
        if (trims.length) this.trimMats = trims;
      }
    };
    swap("containers/container_" + this.containerId, this.crateGroup, "crateModel");
    swap("backdrops/backdrop_" + this.containerId, this.kitchenGroup, "kitchenModel");
  }

  // Called by the game loop before each physics step: remembers where every
  // snack was, so draw() can blend between steps on 90 and 120 Hz screens.
  beforeStep(g) {
    for (const s of g.snacks) {
      const p = s.body.getPosition();
      let o = this.prev.get(s.id);
      if (!o) { o = { x: 0, y: 0, a: 0 }; this.prev.set(s.id, o); }
      o.x = p.x; o.y = p.y; o.a = s.body.getAngle();
    }
  }

  // A short camera move toward a point (big merges, game over).
  pushTo(x, y, amount) {
    if (this.reduced) return;
    this.push.x = x; this.push.y = y; this.push.target = amount;
  }
  release() { this.push.target = 0; }

  // Screen position of a point on the game plane, for the score pop-ups.
  toScreen(x, y) {
    const v = this.tmpV.set(x, y, 0.8).project(this.camera), r = this.canvas.getBoundingClientRect();
    return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height };
  }

  draw(g, dt, showHeld) {
    // Snacks: one clone of the tier's template per body.
    const seen = new Set();
    for (const s of g.snacks) {
      seen.add(s.id);
      let m = this.meshes.get(s.id);
      if (!m) { m = this.templates[s.tier].clone(); m.userData.tier = s.tier; this.scene.add(m); this.meshes.set(s.id, m); }
      const p = s.body.getPosition(), ang = s.body.getAngle(), o = this.prev.get(s.id), al = this.alpha;
      if (o) { m.position.set(o.x + (p.x - o.x) * al, o.y + (p.y - o.y) * al, 0); m.rotation.z = o.a + (ang - o.a) * al; }
      else { m.position.set(p.x, p.y, 0); m.rotation.z = ang; }
      // Squash on landing: wider and flatter, then a small wobble back.
      if (s.landed && !this.wasLanded.has(s.id)) { this.wasLanded.add(s.id); if (!this.pops.has(s.id)) this.squash.set(s.id, 0); }
      if (this.squash.has(s.id)) {
        const t = this.squash.get(s.id) + dt, d = 0.26;
        if (t >= d) { this.squash.delete(s.id); m.scale.setScalar(1); }
        else { const k = Math.sin((t / d) * Math.PI * 2.5) * (1 - t / d) * 0.14; m.scale.set(1 + k, 1 - k, 1); this.squash.set(s.id, t); }
      }
      if (this.pops.has(s.id)) {
        const t = this.pops.get(s.id) + dt;
        const k = t > 0.22 ? 1 : 0.7 + 0.3 * Math.sin((t / 0.22) * Math.PI * 0.5) + 0.12 * Math.sin((t / 0.22) * Math.PI);
        m.scale.setScalar(k);
        if (t > 0.22) this.pops.delete(s.id); else this.pops.set(s.id, t);
      }
    }
    for (const [id, m] of this.meshes) if (!seen.has(id)) { this.scene.remove(m); this.meshes.delete(id); this.prev.delete(id); this.squash.delete(id); this.wasLanded.delete(id); }

    // Held snack, guide line, next snack.
    if (this.heldTier !== g.current) { this.heldTier = g.current; this.setHeld(this.held, g.current); }
    if (this.nextTier !== g.next) { this.nextTier = g.next; this.setHeld(this.nextShow, g.next); }
    const ready = showHeld && g.canDrop() && !this.armed;
    this.held.visible = showHeld && g.status === "playing" && !this.armed;
    // Armed tool: mark every snack it can act on; hide the held snack and guide.
    let mi = 0;
    if (this.armed) {
      this.markMat.opacity = 0.55 + 0.35 * Math.sin(performance.now() / 160);
      for (const sn of g.snacks) {
        if (!this.armed.has(sn.id) || mi >= this.marks.length) continue;
        const m = this.meshes.get(sn.id), mk = this.marks[mi++], t = TIERS[sn.tier];
        if (!m) continue;
        mk.position.set(m.position.x, m.position.y, 1.2); mk.scale.setScalar(Math.max(t.halfW, t.halfH) + 0.18); mk.visible = true;
      }
    }
    for (; mi < this.marks.length; mi++) this.marks[mi].visible = false;
    this.held.position.set(g.aim, CRATE.dropY + (ready ? 0 : 0.4), 0);
    let k = ready ? 1 : 0.85;
    if (this.swapPop != null) { this.swapPop += dt; k *= this.swapPop < 0.2 ? 0.7 + 1.5 * this.swapPop : 1; if (this.swapPop >= 0.2) this.swapPop = null; }
    this.held.scale.setScalar(k);
    let floor = 0;
    for (const s of g.snacks) {
      const box = s.fixture.getAABB(0), t = TIERS[g.current];
      if (box.upperBound.x > g.aim - t.halfW && box.lowerBound.x < g.aim + t.halfW && box.upperBound.y < CRATE.dropY - 0.5) floor = Math.max(floor, box.upperBound.y);
    }
    const top = CRATE.dropY - TIERS[g.current].halfH;
    this.guide.visible = ready;
    this.guide.scale.y = Math.max(0.01, top - floor);
    this.guide.position.set(g.aim, (top + floor) / 2, 0.9);
    // Landing ghost: the held snack at its real size where it first meets the pile.
    if (this.ghostTier !== g.current) { this.ghostTier = g.current; this.ghost.clear(); this.ghost.add(this.ghosts[g.current]); }
    this.ghost.visible = ready && top - floor > TIERS[g.current].halfH * 2.2;
    this.ghost.position.set(g.aim, floor + TIERS[g.current].halfH, 0);
    this.ghostMat.opacity = 0.22 + 0.06 * Math.sin(performance.now() / 260);
    const ns = 0.55 / Math.max(0.55, TIERS[g.next].halfW);
    this.nextShow.scale.setScalar(ns);
    this.nextShow.position.set(0, CRATE.height + 2.9, 0);
    this.nextShow.rotation.y = Math.sin(performance.now() / 700) * 0.45;
    this.nextShow.visible = g.status === "playing" && !(g.rules && g.rules.hideNext);
    // The line sits where this game's rules put it (Pro is lower).
    if (this.line.position.y !== g.line) { this.line.position.y = g.line; for (const d of this.dashes) d.position.y = g.line; }
    // Fever: the trim glows warm gold and pulses.
    const fv = g.fever > 0 ? Math.min(1, g.fever / 1.2) * (0.65 + 0.35 * Math.sin(performance.now() / 120)) : 0;
    if (fv !== this.lastFever) {
      this.lastFever = fv;
      for (const m of this.trimMats || []) { m.emissive.set("#ffb020"); m.emissiveIntensity = fv * 1.6; }
    }

    // The line glows as a snack sits over it.
    const pulse = g.danger > 0 ? 0.5 + 0.5 * Math.sin(performance.now() / 90) : 0;
    this.line.material.opacity = 0.35 + 0.65 * Math.max(g.danger, pulse * g.danger);

    // Danger ring on the snack that is over the line the longest.
    let worst = null;
    for (const s of g.snacks) if (s.over > 0 && (!worst || s.over > worst.over)) worst = s;
    if (worst && g.status === "playing") {
      const left = Math.max(0, 1 - worst.over / g.overLimit), m = this.meshes.get(worst.id), t = TIERS[worst.tier];
      this.ring.geometry = this.ringGeos[Math.round(left * this.ringSteps)];
      this.ring.visible = true;
      if (m) this.ring.position.set(m.position.x, m.position.y, 1.2);
      this.ring.scale.setScalar(Math.max(t.halfW, t.halfH) + 0.35);
    } else this.ring.visible = false;

    // Crumbs from merges. Fading crumbs shrink, because instances share one material.
    let live = false;
    for (let i = 0; i < this.CRUMBS; i++) {
      const c = this.crumbData[i];
      if (c.life <= 0) continue;
      live = true;
      c.life -= dt; c.vy -= 14 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.rot += c.spin * dt;
      const k = c.life > 0 ? Math.min(1, c.life / c.max * 1.6) : 0;
      this.tmpQ.setFromEuler(this.tmpE.set(c.rot, c.rot, 0));
      this.tmpM.compose(this.tmpV.set(c.x, c.y, 0.8), this.tmpQ, this.tmpS.set(k, k, k));
      this.crumbMesh.setMatrixAt(i, this.tmpM);
    }
    if (live || this.crumbsWereLive) this.crumbMesh.instanceMatrix.needsUpdate = true;
    this.crumbsWereLive = live;

    // Camera, slightly above, with a small shake on big merges.
    this.shake = Math.max(0, this.shake - dt);
    const amp = this.reduced ? 0 : this.shake;
    const sx = amp ? (Math.random() - 0.5) * amp : 0, sy = amp ? (Math.random() - 0.5) * amp : 0;
    const P = this.push;
    P.amount += (P.target - P.amount) * Math.min(1, dt * 5);
    const fx = P.x * P.amount, fy = this.focusY + (P.y - this.focusY) * P.amount, d = this.dist * (1 - 0.35 * P.amount);
    this.camera.position.set(fx + sx, fy + d * 0.17 + sy, d);
    this.camera.lookAt(fx, fy, 0);
    this.renderer.render(this.scene, this.camera);
  }

  // Remove everything from the last game.
  reset() {
    for (const m of this.meshes.values()) this.scene.remove(m);
    this.meshes.clear(); this.pops.clear(); this.prev.clear(); this.squash.clear(); this.wasLanded.clear();
    for (const c of this.crumbData) c.life = 0;
    this.push.amount = this.push.target = 0; this.shake = 0;
    this.heldTier = this.nextTier = -1;
  }
}
