// Snack Drop renderer: draws the 2D physics plane in 3D with Three.js.
// Authored Blender GLBs and code-built fallbacks share the per-tier templates.
import * as THREE from "./vendor/three.module.min.js";
import { hasModel, model } from "./assets.js";

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

function withShadows(group) {
  group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return group;
}

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
    this.fallbacks = TIERS.map((t) => withShadows(BUILD[t.id](t)));
    this.templates = this.fallbacks.slice();
    this.meshes = new Map();
    this.pops = new Map();
    this.crumbs = [];
    this.shake = 0;
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

    this.kitchenGroup = new THREE.Group();
    this.crateGroup = new THREE.Group();
    s.add(this.kitchenGroup, this.crateGroup);

    // Kitchen wall with soft tiles, and a counter top.
    const wall = mesh(new THREE.PlaneGeometry(60, 40), mat("#f3dcc0", { roughness: 0.95 }), 0, 8, -3.2); wall.castShadow = false; this.kitchenGroup.add(wall);
    for (let i = -8; i <= 8; i++) { const l = mesh(new THREE.PlaneGeometry(0.04, 40), mat("#e6c9a6"), i * 1.6, 8, -3.19); l.castShadow = false; this.kitchenGroup.add(l); }
    for (let j = 0; j < 12; j++) { const l = mesh(new THREE.PlaneGeometry(60, 0.04), mat("#e6c9a6"), 0, -1 + j * 1.6, -3.19); l.castShadow = false; this.kitchenGroup.add(l); }
    const counter = mesh(new THREE.BoxGeometry(40, 1, 8), mat("#9c6b43", { roughness: 0.6 }), 0, -Wl * 2 - 0.5, 0); this.kitchenGroup.add(counter);

    // The crate: back boards, sides, floor. The front stays open.
    const wood = mat("#c8955c", { roughness: 0.85 }), dark = mat("#a7743f", { roughness: 0.85 });
    const depth = 2.0;
    this.crateGroup.add(mesh(new THREE.BoxGeometry(2 * H + 2 * Wl, 2 * Wl, depth + 0.4), dark, 0, -Wl, 0));
    for (let i = 0; i < 6; i++) {
      const board = mesh(new THREE.BoxGeometry(2 * H, ht / 6 - 0.06, 0.16), i % 2 ? wood : dark, 0, (i + 0.5) * ht / 6, -depth / 2 - 0.08);
      this.crateGroup.add(board);
    }
    [-1, 1].forEach((side) => {
      this.crateGroup.add(mesh(new THREE.BoxGeometry(2 * Wl, ht + 2 * Wl, depth + 0.4), wood, side * (H + Wl), ht / 2, 0));
      const cap = mesh(new THREE.BoxGeometry(2 * Wl + 0.1, 0.18, depth + 0.5), dark, side * (H + Wl), ht + Wl + 0.05, 0); this.crateGroup.add(cap);
    });

    // The line snacks must stay under.
    this.line = mesh(new THREE.BoxGeometry(2 * H, 0.06, 0.06), new THREE.MeshBasicMaterial({ color: "#ee6b5f", transparent: true, opacity: 0.45 }), 0, CRATE.line, depth / 2);
    this.line.castShadow = false; s.add(this.line);
    const dash = new THREE.BoxGeometry(0.3, 0.07, 0.07);
    this.dashes = [];
    for (let x = -H + 0.3; x < H; x += 0.6) { const d = mesh(dash, this.line.material, x, CRATE.line, -depth / 2 + 0.05); d.castShadow = false; s.add(d); this.dashes.push(d); }

    // The aiming guide and the snack held over the crate.
    this.guide = mesh(new THREE.PlaneGeometry(0.06, 1), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.55 }), 0, 0, 0.02);
    this.guide.castShadow = false; s.add(this.guide);
    this.held = new THREE.Group(); s.add(this.held);
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
    if (this.gallery) this.drawGallery();
  }

  refreshTemplates() {
    let changed = false;
    TIERS.forEach((t, i) => {
      const name = "snacks/snack_" + t.id;
      if (this.templates[i] === this.fallbacks[i] && hasModel(name)) {
        this.templates[i] = withShadows(model(name));
        changed = true;
      }
    });
    if (changed) {
      for (const m of this.meshes.values()) this.scene.remove(m);
      this.meshes.clear();
      this.heldTier = this.nextTier = -1;
      if (this.gallery) this.populateGallery();
    }
    for (const [key, name] of [["crate", "crates/crate_wood"], ["kitchen", "kitchens/kitchen_farmhouse"]]) {
      if (this[key + "Model"] || !hasModel(name)) continue;
      const stage = withShadows(model(name));
      this[key + "Model"] = stage;
      this[key + "Group"].visible = false;
      this.scene.add(stage);
    }
    if (this.gallery) {
      const anchor = this.kitchenModel?.getObjectByName("anchor_floor_r");
      const name = "cameos/cameo_corgi-on-the-cob";
      if (anchor && !this.gallery.corgi && hasModel(name)) {
        this.gallery.corgi = withShadows(model(name));
        anchor.getWorldPosition(this.gallery.corgi.position);
        this.scene.add(this.gallery.corgi);
      }
      this.drawGallery();
    }
  }

  startGallery() {
    this.line.visible = this.guide.visible = this.held.visible = this.nextShow.visible = false;
    for (const d of this.dashes) d.visible = false;
    const objects = new THREE.Group();
    this.scene.add(objects);
    this.gallery = {
      objects, camera: new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100),
      outline: new THREE.LineBasicMaterial({ color: "#38232c", transparent: true, opacity: 0.88, depthTest: false }),
    };
    // Extend the crate floor for the proof display and add the upper row's shelf.
    const wood = mat("#a7743f", { roughness: 0.85 });
    this.scene.add(mesh(new THREE.BoxGeometry(10.1, 0.16, 2.3), wood, -1.2, -0.08, 2));
    this.scene.add(mesh(new THREE.BoxGeometry(11.4, 0.16, 2.3), wood, 0, 3.02, 2));
    this.populateGallery();
    this.drawGallery();
  }

  populateGallery() {
    const { objects, outline } = this.gallery;
    objects.traverse((o) => { if (o.isLine) o.geometry.dispose(); });
    objects.clear();
    for (const [row, tiers] of [TIERS.slice(0, 7), TIERS.slice(7)].entries()) {
      const gap = 0.26;
      const width = tiers.reduce((sum, t) => sum + 2 * (t.r || t.w / 2), gap * (tiers.length - 1));
      let x = -width / 2 - (row === 0 ? 1 : 0);
      for (const t of tiers) {
        const minX = t.points ? Math.min(...t.points.map((p) => p.x)) : -t.halfW;
        const minY = t.points ? Math.min(...t.points.map((p) => p.y)) : -t.halfH;
        const snack = this.templates[t.tier].clone();
        snack.position.set(x - minX, row * 3.1 - minY, 2.19);
        objects.add(snack);
        let points = t.points;
        if (t.shape === "circle") {
          points = Array.from({ length: 80 }, (_, i) => {
            const a = i / 80 * Math.PI * 2;
            return { x: t.r * Math.cos(a), y: t.r * Math.sin(a) };
          });
        } else if (t.shape === "box") {
          points = [[-t.halfW, -t.halfH], [t.halfW, -t.halfH], [t.halfW, t.halfH], [-t.halfW, t.halfH]].map(([x, y]) => ({ x, y }));
        }
        const geo = new THREE.BufferGeometry().setFromPoints(points.map(({ x, y }) => new THREE.Vector3(x, y, 0)));
        const line = new THREE.LineLoop(geo, outline);
        line.position.copy(snack.position);
        line.renderOrder = 1;
        objects.add(line);
        x += (t.r ? 2 * t.r : t.w) + gap;
      }
    }
  }

  drawGallery() {
    const { camera } = this.gallery;
    const aspect = this.camera.aspect;
    const h = Math.max(15.6, 12.5 / aspect), w = h * aspect;
    Object.assign(camera, { left: -w / 2, right: w / 2, top: h / 2, bottom: -h / 2 });
    camera.position.set(0, 6.4, 24);
    camera.lookAt(0, 6.4, 0);
    camera.updateProjectionMatrix();
    this.renderer.render(this.scene, camera);
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
    if (ev.type === "merge" || ev.type === "packed") {
      this.burst(ev.x, ev.y, TIER_COLORS[Math.min(ev.tier, TIER_COLORS.length - 1)], 10 + ev.tier * 3);
      if (ev.tier >= 6) this.shake = Math.min(0.35, 0.08 + ev.tier * 0.02);
      if (ev.id) this.pops.set(ev.id, 0);
    }
  }

  burst(x, y, color, n) {
    const geo = this.crumbGeo || (this.crumbGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12));
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, transparent: true }));
      const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 4;
      m.position.set(x, y, 0.8);
      m.userData = { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp + 2, life: 0.6 + Math.random() * 0.3, spin: Math.random() * 8 };
      this.scene.add(m); this.crumbs.push(m);
    }
  }

  draw(g, dt, showHeld) {
    // Snacks: one clone of the tier's template per body.
    const seen = new Set();
    for (const s of g.snacks) {
      seen.add(s.id);
      let m = this.meshes.get(s.id);
      if (!m) { m = this.templates[s.tier].clone(); this.scene.add(m); this.meshes.set(s.id, m); }
      const p = s.body.getPosition();
      m.position.set(p.x, p.y, 0);
      m.rotation.z = s.body.getAngle();
      if (this.pops.has(s.id)) {
        const t = this.pops.get(s.id) + dt;
        const k = t > 0.22 ? 1 : 0.7 + 0.3 * Math.sin((t / 0.22) * Math.PI * 0.5) + 0.12 * Math.sin((t / 0.22) * Math.PI);
        m.scale.setScalar(k);
        if (t > 0.22) this.pops.delete(s.id); else this.pops.set(s.id, t);
      }
    }
    for (const [id, m] of this.meshes) if (!seen.has(id)) { this.scene.remove(m); this.meshes.delete(id); }

    // Held snack, guide line, next snack.
    if (this.heldTier !== g.current) { this.heldTier = g.current; this.setHeld(this.held, g.current); }
    if (this.nextTier !== g.next) { this.nextTier = g.next; this.setHeld(this.nextShow, g.next); }
    const ready = showHeld && g.canDrop();
    this.held.visible = showHeld && g.status === "playing";
    this.held.position.set(g.aim, CRATE.dropY + (ready ? 0 : 0.4), 0);
    this.held.scale.setScalar(ready ? 1 : 0.85);
    let floor = 0;
    for (const s of g.snacks) {
      const box = s.fixture.getAABB(0), t = TIERS[g.current];
      if (box.upperBound.x > g.aim - t.halfW && box.lowerBound.x < g.aim + t.halfW && box.upperBound.y < CRATE.dropY - 0.5) floor = Math.max(floor, box.upperBound.y);
    }
    const top = CRATE.dropY - TIERS[g.current].halfH;
    this.guide.visible = ready;
    this.guide.scale.y = Math.max(0.01, top - floor);
    this.guide.position.set(g.aim, (top + floor) / 2, 0.9);
    const ns = 0.55 / Math.max(0.55, TIERS[g.next].halfW);
    this.nextShow.scale.setScalar(ns);
    this.nextShow.position.set(0, CRATE.height + 2.9, 0);
    this.nextShow.rotation.y = Math.sin(performance.now() / 700) * 0.45;
    this.nextShow.visible = g.status === "playing";

    // The line glows as a snack sits over it.
    const pulse = g.danger > 0 ? 0.5 + 0.5 * Math.sin(performance.now() / 90) : 0;
    this.line.material.opacity = 0.35 + 0.65 * Math.max(g.danger, pulse * g.danger);

    // Crumbs from merges.
    for (let i = this.crumbs.length - 1; i >= 0; i--) {
      const c = this.crumbs[i], u = c.userData;
      u.life -= dt; u.vy -= 14 * dt;
      c.position.x += u.vx * dt; c.position.y += u.vy * dt;
      c.rotation.x += u.spin * dt; c.rotation.y += u.spin * dt;
      c.material.opacity = Math.max(0, u.life / 0.6);
      if (u.life <= 0) { this.scene.remove(c); c.material.dispose(); this.crumbs.splice(i, 1); }
    }

    // Camera, slightly above, with a small shake on big merges.
    this.shake = Math.max(0, this.shake - dt);
    const sx = this.shake ? (Math.random() - 0.5) * this.shake : 0, sy = this.shake ? (Math.random() - 0.5) * this.shake : 0;
    this.camera.position.set(sx, this.focusY + this.dist * 0.17 + sy, this.dist);
    this.camera.lookAt(0, this.focusY, 0);
    this.renderer.render(this.scene, this.camera);
  }

  // Remove everything from the last game.
  reset() {
    for (const m of this.meshes.values()) this.scene.remove(m);
    this.meshes.clear(); this.pops.clear();
    for (const c of this.crumbs) this.scene.remove(c);
    this.crumbs = [];
    this.heldTier = this.nextTier = -1;
  }
}
