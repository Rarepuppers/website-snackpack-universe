// Snack Haul 3D view. The physics stay on a 2D plane (x, y); this file draws that
// plane in true 3D with a side-on camera. Models are built from code, so nothing
// here needs a download. Codex GLB models can replace the build*() functions later.
import * as THREE from "./vendor/three.module.min.js";

const SH = window.SnackHaul;

// ════ Region looks ════════════════════════════════════════════════
const THEMES = [
  { id: "bakery", skyTop: "#5fb4ea", skyMid: "#bfe3f2", skyLow: "#ffe6bd", fog: "#f3dfc0", fogFar: 330, sun: "#fff1d6", sunI: 2.9, hemi: ["#d5ecff", "#8c7a4e", 1.25],
    grass: ["#79b048", "#67a03f", "#8fc057", "#a4c95e"], road: "#c49a68", rut: "#a57e50", edge: "#dfbd86", far: ["#7fa768", "#93b57c"], peak: ["#8fa8a0", "#b3c4bb"], dust: "#d9bd8f", exposure: 1.02 },
  { id: "dunes", skyTop: "#3fa6e6", skyMid: "#a7dcf2", skyLow: "#fbeec4", fog: "#f6e6bd", fogFar: 360, sun: "#fff4dc", sunI: 3.2, hemi: ["#dcefff", "#b99a5c", 1.3],
    grass: ["#ecd08c", "#e4c47c", "#f2dc9e", "#dcb86e"], road: "#d8b070", rut: "#bd955a", edge: "#efd79a", far: ["#e6c988", "#efd9a0"], peak: ["#d9b98a", "#ead2a8"], dust: "#ecd5a0", exposure: 1.0 },
  { id: "harbour", skyTop: "#38b6d8", skyMid: "#a9e2ea", skyLow: "#fff1c9", fog: "#e9f1df", fogFar: 340, sun: "#fff0cf", sunI: 3.0, hemi: ["#d8f3ff", "#a08a5a", 1.3],
    grass: ["#e9c98a", "#dfbd7c", "#f1d79c", "#cfd28a"], road: "#8a5f3c", rut: "#74502f", edge: "#b98a58", far: ["#7fc3b8", "#9fd3c4"], peak: ["#7fb0b8", "#a8ccd0"], dust: "#e6d2a2", exposure: 1.02 },
  { id: "frost", skyTop: "#27406f", skyMid: "#6f92c4", skyLow: "#f3c9b4", fog: "#c3d3ea", fogFar: 280, sun: "#ffdcc0", sunI: 2.5, hemi: ["#bfd8ff", "#7d8fb0", 1.45],
    grass: ["#f4f9ff", "#e6f0fc", "#dbe8f8", "#ffffff"], road: "#8fb2d8", rut: "#7096c4", edge: "#c3d8ee", far: ["#dfeafa", "#c9daf0"], peak: ["#b8cbe6", "#f2f7ff"], dust: "#f2f7ff", exposure: 1.0 },
  { id: "chilli", skyTop: "#3c1f4f", skyMid: "#b5463f", skyLow: "#ffb15e", fog: "#d98a60", fogFar: 280, sun: "#ffd2a0", sunI: 2.9, hemi: ["#ffd0b8", "#6a4238", 1.35],
    grass: ["#5f403c", "#6a4842", "#755248", "#553834"], road: "#e0a56c", rut: "#c48a54", edge: "#f5c88e", far: ["#5a3238", "#6a3c3e"], peak: ["#5a2a3a", "#7a3540"], dust: "#c98a68", exposure: 1.05 },
  { id: "market", skyTop: "#0e1433", skyMid: "#2c2f66", skyLow: "#5b4a8a", fog: "#3a3566", fogFar: 260, sun: "#cfd8ff", sunI: 1.7, hemi: ["#8f9be0", "#3a3350", 1.5],
    grass: ["#2b3350", "#313a5a", "#262d48", "#374066"], road: "#c9b899", rut: "#b3a283", edge: "#e2d4b8", far: ["#252b47", "#2d3454"], peak: ["#1d2240", "#2a3058"], dust: "#bdb09a", exposure: 1.1, night: true }
];

// ════ Small helpers ═══════════════════════════════════════════════
const col = (c) => new THREE.Color(c);
function m(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
}
function sat(v) { return Math.max(0, Math.min(1, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }

function noiseFn(seed) {
  const hash = (x, y) => {
    let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + seed;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    return lerp(lerp(hash(xi, yi), hash(xi + 1, yi), u), lerp(hash(xi, yi + 1), hash(xi + 1, yi + 1), u), v) * 2 - 1;
  };
}

// Merges many coloured shapes into one geometry: one draw call for a whole model.
class Kit {
  constructor() { this.pos = []; this.nor = []; this.colors = []; }
  add(geo, color, matrix, flat) {
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    if (matrix) g.applyMatrix4(matrix);
    if (flat) g.computeVertexNormals();
    const p = g.attributes.position.array, n = g.attributes.normal.array, c = col(color);
    for (let i = 0; i < p.length; i += 3) {
      this.pos.push(p[i], p[i + 1], p[i + 2]);
      this.nor.push(n[i], n[i + 1], n[i + 2]);
      this.colors.push(c.r, c.g, c.b);
    }
    g.dispose();
    return this;
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(this.colors, 3));
    return g;
  }
}

const BOX = new THREE.BoxGeometry(1, 1, 1);
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cyl = (r1, r2, h, s = 10) => new THREE.CylinderGeometry(r1, r2, h, s);
const blob = (r, d = 1) => new THREE.IcosahedronGeometry(r, d);

function roundedSlab(w, h, d, r = 0.08, seg = 3) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  r = Math.min(r, w / 2 - 0.001, h / 2 - 0.001);
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(s, { depth: d - 0.08, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 2, curveSegments: seg });
  g.translate(0, 0, -(d - 0.08) / 2);
  return g;
}
// Extrudes an outline drawn in side view (x forward, y up) across the truck's width.
function sideShape(points, d) {
  const s = new THREE.Shape();
  points.forEach((p, i) => (i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1])));
  const g = new THREE.ExtrudeGeometry(s, { depth: d - 0.1, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 2, curveSegments: 4 });
  g.translate(0, 0, -(d - 0.1) / 2);
  return g;
}

function canvasTex(w, h, paint) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  paint(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// ════ Trucks ══════════════════════════════════════════════════════
const PAINT = { tuktuk: ["#3fb7a6", "#fff3d6"], monster: ["#7a3fb8", "#f4c21f"], pickup: ["#d8452e", "#f2e2c4"], van: ["#f2ead8", "#e7a23c"], buggy: ["#f4c21f", "#2d2d33"], hauler: ["#2f6fb8", "#f2f2ee"] };

function doorDecal(text, color) {
  return canvasTex(256, 128, (x, w, h) => {
    x.clearRect(0, 0, w, h);
    x.fillStyle = color;
    x.beginPath(); x.roundRect(14, 22, w - 28, h - 44, 20); x.fill();
    x.fillStyle = "#fff"; x.font = "800 31px sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText(text, w / 2, h / 2 + 2);
  });
}

function buildTruck(spec, rail, quality) {
  const D = SH.dimsFor(spec), width = spec.id === "hauler" ? 1.95 : 1.8, root = new THREE.Group();
  const [paint, trim] = PAINT[spec.id];
  const body = new Kit(), metal = new Kit(), dark = new Kit(), glass = new Kit();
  const half = width / 2, bedTop = D.bedHeight;

  // Chassis and bed floor
  dark.add(roundedSlab(D.bedHalf * 2 + 0.1, 0.2, width - 0.2, 0.06), "#2a2a2e", m(0, -0.2, 0));
  body.add(roundedSlab(D.bedHalf * 2, 0.2, width, 0.06), trim === "#2d2d33" ? paint : "#6b4a30", m(0, 0.03, 0));
  for (let i = 0; i < 6; i++) {
    const z = -half + 0.15 + (i * (width - 0.3)) / 5;
    dark.add(box(D.bedHalf * 1.9, 0.012, 0.02), "#4a3322", m(-0.02, bedTop + 0.01, z));
  }

  // Rails: bars, not panels, so the load stays in view from the side.
  const left = -D.bedHalf + 0.04, right = D.bedRight + 0.08, posts = spec.perRow + 1;
  [-1, 1].forEach((side) => {
    const z = side * (half - 0.05);
    for (let i = 0; i < posts; i++) {
      const x = lerp(left, right, i / (posts - 1));
      metal.add(box(0.07, rail + 0.04, 0.07), trim, m(x, bedTop + rail / 2, z));
    }
    const bars = rail > 0.5 ? 3 : 2;
    for (let b = 1; b <= bars; b++) metal.add(box(right - left, 0.045, 0.05), trim, m((left + right) / 2, bedTop + (rail * b) / bars, z));
  });
  for (let i = 0; i < 4; i++) metal.add(box(0.05, rail + 0.04, 0.09), trim, m(-D.bedHalf + 0.03, bedTop + rail / 2, -half + 0.2 + i * ((width - 0.4) / 3)));
  metal.add(box(0.05, 0.05, width - 0.1), trim, m(-D.bedHalf + 0.03, bedTop + rail, 0));

  // Cab
  const cx = D.cabX, back = cx - D.cabHalfX, nose = D.bedHalf + (spec.id === "hauler" ? 0.2 : 0.32);
  let window3 = null;
  if (spec.id === "buggy") {
    // Open tube frame with a low nose.
    body.add(sideShape([[back - 0.05, 0.05], [nose, 0.05], [nose, 0.32], [cx + 0.35, 0.5], [back - 0.05, 0.5]], width - 0.25), paint);
    const tube = (a, b, z) => {
      const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
      metal.add(cyl(0.045, 0.045, len, 6), "#2d2d33", m((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z, 0, 0, Math.atan2(dy, dx) - Math.PI / 2));
    };
    [-0.72, 0.72].forEach((z) => {
      tube([back, 0.5], [back + 0.02, 1.32], z);
      tube([back + 0.02, 1.32], [cx + 0.25, 1.32], z);
      tube([cx + 0.25, 1.32], [cx + 0.68, 0.5], z);
    });
    [back + 0.02, cx + 0.25].forEach((x) => metal.add(cyl(0.045, 0.045, 1.44, 6), "#2d2d33", m(x, 1.32, 0, Math.PI / 2)));
    dark.add(roundedSlab(0.46, 0.14, 1.1, 0.05), "#26262a", m(cx - 0.1, 0.56, 0));
    dark.add(roundedSlab(0.12, 0.52, 1.1, 0.05), "#26262a", m(back + 0.08, 0.8, 0));
    metal.add(box(0.5, 0.05, 1.2), "#ff6a3c", m(cx + 0.1, 1.36, 0));
  } else if (spec.id === "van") {
    body.add(sideShape([[back - 0.02, 0.05], [nose, 0.05], [nose, 0.42], [nose - 0.32, 0.5], [nose - 0.72, 1.3], [back - 0.02, 1.34]], width), paint);
    window3 = [[back + 0.28, 0.72], [nose - 0.5, 0.72], [nose - 0.78, 1.2], [back + 0.28, 1.22]];
    body.add(box(nose - back - 0.1, 0.13, width + 0.015), trim, m((nose + back) / 2 - 0.02, 0.46, 0));
    metal.add(box(0.9, 0.08, 0.1), "#c9c9c4", m(cx - 0.1, 1.4, 0.55));
    metal.add(box(0.9, 0.08, 0.1), "#c9c9c4", m(cx - 0.1, 1.4, -0.55));
  } else if (spec.id === "hauler") {
    body.add(sideShape([[back - 0.02, 0.05], [nose, 0.05], [nose, 1.02], [nose - 0.34, 1.62], [back - 0.02, 1.68]], width), paint);
    window3 = [[back + 0.42, 0.98], [nose - 0.06, 0.98], [nose - 0.38, 1.52], [back + 0.42, 1.56]];
    body.add(box(nose - back - 0.1, 0.1, width + 0.015), trim, m((nose + back) / 2, 0.62, 0));
    [-0.8, 0.8].forEach((z) => {
      metal.add(cyl(0.06, 0.06, 1.3, 8), "#c9c9c4", m(back - 0.08, 1.05, z));
      metal.add(cyl(0.075, 0.075, 0.1, 8), "#2a2a2e", m(back - 0.08, 1.72, z));
    });
    body.add(sideShape([[back + 0.1, 1.68], [nose - 0.5, 1.68], [nose - 0.7, 1.92], [back + 0.3, 1.92]], width - 0.2), trim);
  } else {
    body.add(sideShape([[back - 0.02, 0.05], [nose, 0.05], [nose, 0.5], [nose - 0.1, 0.62], [cx + 0.62, 0.72], [cx + 0.26, 1.26], [back + 0.04, 1.28], [back - 0.02, 1.2]], width), paint);
    window3 = [[back + 0.14, 0.76], [cx + 0.5, 0.76], [cx + 0.2, 1.18], [back + 0.14, 1.18]];
    body.add(box(nose - back - 0.2, 0.06, width + 0.015), trim, m((nose + back) / 2, 0.3, 0));
    // Rust, because it has earned it.
    [[-0.6, 0.0, 0.14], [0.5, 0.28, 0.1], [cx + 0.7, 0.42, 0.08]].forEach(([x, y, s]) => {
      dark.add(blob(s, 0), "#7a4322", m(x, y, half + 0.012, 0, 0, 0, 1, 0.6, 0.06));
    });
  }

  if (window3) {
    const pane = sideShape(window3, width + 0.03);
    glass.add(pane, "#1e3448");
    dark.add(box(0.03, 0.46, width + 0.05), "#28282c", m(window3[0][0] + 0.3, 0.98 + (spec.id === "hauler" ? 0.3 : 0), 0));
  }
  if (spec.id !== "buggy") {
    // Lights, grille, bumpers and mirrors
    dark.add(box(0.05, 0.26, width * 0.62), "#1c1c20", m(nose + 0.03, spec.id === "hauler" ? 0.6 : 0.3, 0));
    for (let i = 0; i < 5; i++) metal.add(box(0.03, 0.02, width * 0.6), "#c9c9c4", m(nose + 0.055, (spec.id === "hauler" ? 0.5 : 0.21) + i * 0.045, 0));
    [-0.68, 0.68].forEach((z) => {
      const y = spec.id === "hauler" ? 0.92 : 0.44;
      const lamp = new THREE.Mesh(cyl(0.11, 0.11, 0.05, 12), new THREE.MeshStandardMaterial({ color: "#fff6d8", emissive: "#ffdf9c", emissiveIntensity: 1.6 }));
      lamp.applyMatrix4(m(nose + 0.03, y, z, 0, 0, Math.PI / 2));
      root.add(lamp);
    });
    metal.add(roundedSlab(0.1, 0.13, width + 0.14, 0.04), "#c9c9c4", m(nose + 0.09, 0.09, 0));
    metal.add(box(0.05, 0.1, 0.16), "#2a2a2e", m(cx + 0.18, spec.id === "hauler" ? 1.4 : 1.0, half + 0.1));
    metal.add(box(0.05, 0.1, 0.16), "#2a2a2e", m(cx + 0.18, spec.id === "hauler" ? 1.4 : 1.0, -half - 0.1));
    metal.add(box(0.09, 0.03, 0.03), "#c9c9c4", m(back + 0.32, 0.62, half + 0.015));
  }
  metal.add(roundedSlab(0.1, 0.12, width + 0.1, 0.04), "#3a3a3e", m(-D.bedHalf - 0.05, -0.12, 0));
  [-0.72, 0.72].forEach((z) => {
    const lamp = new THREE.Mesh(BOX, new THREE.MeshStandardMaterial({ color: "#c22", emissive: "#ff2a1a", emissiveIntensity: 0.9 }));
    lamp.applyMatrix4(m(-D.bedHalf - 0.03, 0.03, z, 0, 0, 0, 0.05, 0.14, 0.22));
    lamp.userData.brake = true;
    root.add(lamp);
  });
  [D.rearX, D.frontX].forEach((x) => {
    [-1, 1].forEach((side) => dark.add(cyl(D.wheelR + 0.05, D.wheelR + 0.05, 0.16, 16), "#17171a", m(x, D.axleY + 0.3, side * (half - 0.3), Math.PI / 2, 0, 0, 1, 1, 1)));
  });

  // The driver: the Corgi from the SnackPack cast.
  const drv = new Kit(), dx = spec.id === "buggy" ? cx + 0.02 : cx - 0.05, dy = spec.id === "hauler" ? 1.22 : spec.id === "buggy" ? 0.98 : 0.94;
  drv.add(blob(0.2, 2), "#e8a050", m(dx, dy, 0.35));
  drv.add(blob(0.13, 2), "#fff3e0", m(dx + 0.15, dy - 0.05, 0.35));
  drv.add(blob(0.05, 1), "#2a1a12", m(dx + 0.26, dy - 0.02, 0.35));
  drv.add(new THREE.ConeGeometry(0.075, 0.2, 8), "#d88a3a", m(dx - 0.08, dy + 0.22, 0.26));
  drv.add(new THREE.ConeGeometry(0.075, 0.2, 8), "#d88a3a", m(dx - 0.08, dy + 0.22, 0.44));
  drv.add(blob(0.035, 1), "#1a1a1e", m(dx + 0.14, dy + 0.06, 0.53));
  const driver = new THREE.Mesh(drv.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 }));
  root.add(driver);

  const add = (kit, mat) => {
    const mesh = new THREE.Mesh(kit.build(), mat);
    mesh.castShadow = quality.shadows;
    root.add(mesh);
    return mesh;
  };
  add(body, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.34, metalness: 0.28 }));
  add(metal, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.38, metalness: 0.7 }));
  add(dark, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 }));
  if (glass.pos.length) {
    const pane = add(glass, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.08, metalness: 0.5, transparent: true, opacity: 0.62 }));
    pane.renderOrder = 2;
  }
  if (spec.id !== "buggy") {
    const decal = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.33), new THREE.MeshStandardMaterial({ map: doorDecal("SNACK HAUL", spec.id === "van" ? "#c9742a" : "#2d2118"), transparent: true, roughness: 0.5 }));
    decal.position.set(back + 0.56, spec.id === "hauler" ? 0.42 : 0.44, half + 0.02);
    root.add(decal);
  }

  // Wheels turn as a pair, driven by the physics wheel.
  const wheelGeo = wheelModel(D.wheelR, spec.id === "buggy");
  const wheelMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.74, metalness: 0.12 });
  const wheels = [0, 1].map(() => {
    const g = new THREE.Group();
    [-1, 1].forEach((side) => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.position.z = side * (half - 0.08);
      w.castShadow = quality.shadows;
      if (side < 0) w.rotation.y = Math.PI;
      g.add(w);
    });
    return g;
  });
  return { root, wheels, brakes: root.children.filter((c) => c.userData.brake), driver };
}

function wheelModel(r, chunky) {
  const k = new Kit(), w = chunky ? 0.44 : 0.32;
  const profile = [[0.001, -w / 2], [r * 0.62, -w / 2], [r * 0.88, -w / 2], [r * 0.98, -w * 0.32], [r, 0], [r * 0.98, w * 0.32], [r * 0.88, w / 2], [r * 0.62, w / 2], [0.001, w / 2]]
    .map((p) => new THREE.Vector2(p[0], p[1]));
  k.add(new THREE.LatheGeometry(profile, 18), "#242225", m(0, 0, 0, Math.PI / 2));
  const lugs = chunky ? 14 : 10;
  for (let i = 0; i < lugs; i++) {
    const a = (i / lugs) * Math.PI * 2;
    k.add(box(0.1, 0.05, w + 0.02), "#1b1a1c", m(Math.cos(a) * r, Math.sin(a) * r, 0, 0, 0, a + Math.PI / 2));
  }
  k.add(cyl(r * 0.56, r * 0.56, 0.04, 16), "#d5d0c6", m(0, 0, w / 2 + 0.01, Math.PI / 2));
  k.add(cyl(r * 0.2, r * 0.26, 0.09, 10), "#8f8a80", m(0, 0, w / 2 + 0.05, Math.PI / 2));
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    k.add(cyl(0.03, 0.03, 0.06, 6), "#55524c", m(Math.cos(a) * r * 0.38, Math.sin(a) * r * 0.38, w / 2 + 0.03, Math.PI / 2));
  }
  return k.build();
}

// ════ Cargo ═══════════════════════════════════════════════════════
const texCache = {};
function crateTexture() {
  return (texCache.crate ||= canvasTex(256, 256, (x, w, h) => {
    x.fillStyle = "#eab765"; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 5; i++) {
      x.fillStyle = i % 2 ? "#e0a955" : "#f2c477"; x.fillRect(0, (i * h) / 5, w, h / 5 - 3);
      x.fillStyle = "#a06c30"; x.fillRect(0, ((i + 1) * h) / 5 - 3, w, 3);
    }
    x.strokeStyle = "#b5752c"; x.lineWidth = 26; x.strokeRect(13, 13, w - 26, h - 26);
    x.beginPath(); x.moveTo(20, 20); x.lineTo(w - 20, h - 20); x.stroke();
    x.fillStyle = "#3a2412"; [[22, 22], [w - 22, 22], [22, h - 22], [w - 22, h - 22]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 6, 0, 7); x.fill(); });
  }));
}

function buildCargo(type, quality) {
  const group = new THREE.Group(), S = SH.DIM.crate - 0.02, zs = [-0.29, 0.29];
  const shadow = (mesh) => { mesh.castShadow = quality.shadows; return mesh; };
  if (type === "crate") {
    const mat = (texCache.crateMat ||= new THREE.MeshStandardMaterial({ map: crateTexture(), roughness: 0.78 }));
    zs.forEach((z) => { const c = shadow(new THREE.Mesh(box(S, S, S), mat)); c.position.z = z; group.add(c); });
  } else if (type === "eggs") {
    const k = new Kit();
    zs.forEach((z) => {
      k.add(box(S, S * 0.34, S), "#b98a50", m(0, -S * 0.31, z));
      [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, 0]].forEach(([a, b]) => k.add(blob(0.1, 2), "#fff3dc", m(a * 0.12, -0.04, z + b * 0.12, 0, 0, 0, 1, 1.3, 1)));
      [[0, 0.6, 0.12], [1, 0.3, -0.1]].forEach(([, , o]) => k.add(blob(0.09, 2), "#f4dfb8", m(o, 0.11, z + o, 0, 0, 0, 1, 1.3, 1)));
    });
    group.add(shadow(new THREE.Mesh(k.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55 }))));
  } else if (type === "milk") {
    const k = new Kit();
    zs.forEach((z) => {
      k.add(box(S, S * 0.5, S), "#4e7fb5", m(0, -S * 0.25, z));
      [[-0.12, -0.12], [0.12, -0.12], [-0.12, 0.12], [0.12, 0.12]].forEach(([a, b]) => {
        k.add(cyl(0.09, 0.1, 0.3, 10), "#fbfdff", m(a, 0.02, z + b));
        k.add(cyl(0.05, 0.08, 0.1, 10), "#fbfdff", m(a, 0.19, z + b));
        k.add(cyl(0.055, 0.055, 0.03, 10), "#3f8fd8", m(a, 0.24, z + b));
      });
    });
    group.add(shadow(new THREE.Mesh(k.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35 }))));
  } else if (type === "melon") {
    const k = new Kit();
    zs.forEach((z) => {
      k.add(new THREE.SphereGeometry(0.25, 14, 10), "#3f9a4a", m(0, 0, z, 0, 0, Math.PI / 2, 1, 1.12, 1));
      for (let i = 0; i < 6; i++) k.add(new THREE.TorusGeometry(0.252, 0.018, 4, 14, Math.PI), "#1f5f2e", m(0, 0, z, (i * Math.PI) / 6, 0, Math.PI / 2, 1, 1.12, 1));
    });
    group.add(shadow(new THREE.Mesh(k.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4 }))));
  } else if (type === "cake") {
    const k = new Kit(), H = SH.cargoSize("cake").h - 0.02;
    zs.forEach((z) => {
      k.add(roundedSlab(0.48, H, 0.48, 0.05), "#ffd3e2", m(0, 0, z));
      k.add(box(0.5, 0.07, 0.5), "#e0457b", m(0, 0.02, z));
      k.add(box(0.07, H + 0.01, 0.5), "#e0457b", m(0, 0, z));
      k.add(blob(0.07, 1), "#d81e3c", m(0, H / 2 + 0.05, z));
    });
    group.add(shadow(new THREE.Mesh(k.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5 }))));
  } else if (type === "popcorn") {
    const k = new Kit();
    zs.forEach((z) => {
      for (let i = 0; i < 5; i++) k.add(box(S / 5 + 0.002, S * 0.8, S), i % 2 ? "#ffffff" : "#e23b3b", m(-S / 2 + (i + 0.5) * (S / 5), -S * 0.1, z));
      [[-0.12, 0.05], [0.1, -0.08], [0, 0.12], [0.14, 0.1], [-0.1, -0.12]].forEach(([a, b]) => k.add(blob(0.09, 1), "#fff2b8", m(a, S * 0.33, z + b)));
    });
    group.add(shadow(new THREE.Mesh(k.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 }))));
  } else if (type === "icecream") {
    const k = new Kit();
    zs.forEach((z) => {
      k.add(cyl(0.25, 0.22, S * 0.8, 14), "#9fe3c8", m(0, -S * 0.1, z));
      k.add(cyl(0.262, 0.262, 0.06, 14), "#f6fffb", m(0, S * 0.3, z));
      k.add(blob(0.13, 2), "#ffb3cf", m(0, S * 0.42, z));
    });
    group.add(shadow(new THREE.Mesh(k.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4 }))));
  } else {
    const mat = new THREE.MeshPhysicalMaterial({ color: "#ff5f94", roughness: 0.18, transmission: quality.level > 1 ? 0 : 0, transparent: true, opacity: 0.82, emissive: "#a51e50", emissiveIntensity: 0.25 });
    zs.forEach((z) => { const c = shadow(new THREE.Mesh(roundedSlab(S, S, S, 0.12), mat)); c.position.z = z; group.add(c); });
    group.userData.wobble = true;
  }
  return group;
}

// ════ Scatter kits ════════════════════════════════════════════════
function propKit(kind, theme) {
  const k = new Kit();
  switch (kind) {
    case "oak": {
      k.add(cyl(0.22, 0.32, 2.2, 7), "#6d4a2c", m(0, 1.1, 0), true);
      k.add(blob(1.5), theme.leaf[0], m(0, 3.0, 0), true);
      k.add(blob(1.1), theme.leaf[1], m(0.9, 2.5, 0.3), true);
      k.add(blob(1.05), theme.leaf[2], m(-0.8, 2.6, -0.2), true);
      break;
    }
    case "pine": {
      k.add(cyl(0.16, 0.26, 1.2, 6), "#5a3f2a", m(0, 0.6, 0), true);
      [[1.7, 2.1, 1.7], [1.35, 1.9, 2.9], [0.95, 1.6, 3.9]].forEach(([r, h, y], i) => {
        k.add(new THREE.ConeGeometry(r, h, 8), theme.leaf[i % 2], m(0, y, 0, 0, i), true);
      });
      if (theme.snowTrees) {
        k.add(new THREE.ConeGeometry(0.7, 0.9, 8), "#ffffff", m(0, 4.35, 0), true);
        k.add(new THREE.ConeGeometry(1.0, 0.5, 8), "#f4f9ff", m(0, 3.3, 0), true);
      }
      break;
    }
    case "bush": k.add(blob(0.8), theme.leaf[0], m(0, 0.5, 0, 0, 0, 0, 1, 0.75, 1), true); k.add(blob(0.55), theme.leaf[1], m(0.6, 0.35, 0.2), true); break;
    case "rock": k.add(new THREE.DodecahedronGeometry(1, 0), theme.rock, m(0, 0.4, 0, 0.4, 0.8, 0, 1.3, 0.8, 1), true); break;
    case "cactus": {
      k.add(cyl(0.3, 0.34, 3, 8), "#4f9462", m(0, 1.5, 0), true);
      k.add(cyl(0.18, 0.18, 1, 8), "#4f9462", m(0.62, 1.7, 0, 0, 0, Math.PI / 2), true);
      k.add(cyl(0.18, 0.18, 0.9, 8), "#58a06c", m(1.1, 2.1, 0), true);
      k.add(cyl(0.16, 0.16, 0.7, 8), "#4f9462", m(-0.5, 2.1, 0, 0, 0, Math.PI / 2), true);
      k.add(cyl(0.16, 0.16, 0.8, 8), "#58a06c", m(-0.85, 2.45, 0), true);
      break;
    }
    case "hay": {
      k.add(cyl(0.85, 0.85, 1.3, 14), "#e4bf5e", m(0, 0.85, 0, Math.PI / 2), true);
      k.add(cyl(0.5, 0.5, 1.34, 14), "#c99f42", m(0, 0.85, 0, Math.PI / 2), true);
      break;
    }
    case "cottage": {
      k.add(box(4, 2.6, 3.4), "#f5e8cf", m(0, 1.3, 0));
      k.add(sideShape([[-2.4, 0], [2.4, 0], [0, 1.9]], 3.9), "#c8542f", m(0, 2.6, 0), true);
      k.add(box(0.8, 1.5, 0.1), "#7a4a2a", m(-0.8, 0.75, 1.72));
      k.add(box(0.95, 0.85, 0.1), "#9cd2ec", m(0.9, 1.4, 1.72));
      k.add(box(0.5, 1.5, 0.5), "#a44a30", m(1.2, 3.8, 0));
      break;
    }
    case "barn": {
      k.add(box(5.4, 3.2, 3.8), "#b5402f", m(0, 1.6, 0));
      k.add(sideShape([[-3.0, 0], [3.0, 0], [2.1, 1.5], [0, 2.2], [-2.1, 1.5]], 4.3), "#efe7d4", m(0, 3.2, 0), true);
      k.add(box(1.8, 2.3, 0.1), "#f4ead6", m(0, 1.15, 1.93));
      k.add(box(1.5, 2.0, 0.12), "#8e2f22", m(0, 1.05, 1.95));
      break;
    }
    case "cabin": {
      k.add(box(3.6, 2.2, 3), "#7a5234", m(0, 1.1, 0));
      k.add(sideShape([[-2.2, 0], [2.2, 0], [0, 1.6]], 3.5), "#f6faff", m(0, 2.2, 0), true);
      k.add(box(0.8, 0.8, 0.1), "#ffcf72", m(0.8, 1.2, 1.52));
      k.add(box(0.7, 1.4, 0.1), "#4f3220", m(-0.8, 0.7, 1.52));
      break;
    }
    case "crag": {
      k.add(new THREE.ConeGeometry(1.8, 5.4, 5), theme.rock, m(0, 2.5, 0, 0, 0.6), true);
      k.add(new THREE.ConeGeometry(1.2, 3.4, 5), "#6a3026", m(1.6, 1.5, 0.4, 0, 1.4), true);
      break;
    }
    case "chilliPlant": {
      k.add(blob(0.75), "#3f7a3a", m(0, 0.6, 0, 0, 0, 0, 1, 0.8, 1), true);
      for (let i = 0; i < 6; i++) {
        const a = i * 1.05;
        k.add(new THREE.ConeGeometry(0.1, 0.42, 6), "#e8301f", m(Math.cos(a) * 0.62, 0.44 + (i % 3) * 0.14, Math.sin(a) * 0.62, Math.PI, 0, 0.3));
      }
      break;
    }
    case "palm": {
      for (let i = 0; i < 4; i++) k.add(cyl(0.16, 0.2, 1.5, 6), "#8a6a44", m(i * 0.18, 0.75 + i * 1.4, 0, 0, 0, -0.12), true);
      for (let i = 0; i < 7; i++) { const a = (i / 7) * 6.283; k.add(new THREE.ConeGeometry(0.42, 2.6, 4), theme.leaf[i % 2], m(0.7 + Math.cos(a) * 1.1, 5.7, Math.sin(a) * 1.1, Math.sin(a) * 1.25, 0, -Math.cos(a) * 1.25, 1, 1, 0.35), true); }
      break;
    }
    case "hut": {
      k.add(box(2.2, 2.2, 2.2), "#fff4dc", m(0, 1.1, 0));
      for (let i = 0; i < 5; i++) k.add(box(0.22, 2.2, 2.22), "#3fa7c9", m(-0.88 + i * 0.44, 1.1, 0));
      k.add(sideShape([[-1.4, 0], [1.4, 0], [0, 1.1]], 2.5), "#e0483c", m(0, 2.2, 0), true);
      break;
    }
    case "lamp": {
      k.add(cyl(0.07, 0.1, 4, 6), "#2a2a36", m(0, 2, 0), true);
      k.add(box(0.9, 0.07, 0.07), "#2a2a36", m(0.4, 4, 0));
      k.add(blob(0.34, 1), "#ffc857", m(0.8, 3.62, 0, 0, 0, 0, 1, 1.25, 1));
      break;
    }
    case "townhouse": {
      k.add(box(3.4, 7, 3.4), "#4a4670", m(0, 3.5, 0));
      k.add(sideShape([[-2.0, 0], [2.0, 0], [0, 1.7]], 3.8), "#2a2644", m(0, 7, 0), true);
      for (let r = 0; r < 3; r++) for (let c2 = 0; c2 < 2; c2++) k.add(box(0.8, 1.0, 0.1), (r + c2) % 3 ? "#ffd27a" : "#3a3760", m(-0.8 + c2 * 1.6, 1.6 + r * 2.1, 1.72));
      break;
    }
    case "stall": {
      k.add(box(2.6, 1.0, 1.4), "#7a5234", m(0, 0.5, 0));
      [-1.2, 1.2].forEach((x) => k.add(box(0.1, 2.4, 0.1), "#4a3322", m(x, 1.2, 0.6)));
      for (let i = 0; i < 6; i++) k.add(box(0.47, 0.1, 1.9), i % 2 ? "#fff6e6" : "#e0483c", m(-1.18 + i * 0.47, 2.45, 0.2, 0.25));
      [[-0.7, "#ff8a3c"], [0, "#ffd34d"], [0.7, "#e0457b"]].forEach(([x, c2]) => k.add(blob(0.3, 1), c2, m(x, 1.15, 0.2, 0, 0, 0, 1, 0.7, 1)));
      break;
    }
    case "fence": {
      k.add(box(0.13, 1.0, 0.13), theme.fence, m(-1.5, 0.5, 0));
      k.add(box(3.05, 0.1, 0.06), theme.fence, m(0, 0.72, 0));
      k.add(box(3.05, 0.1, 0.06), theme.fence, m(0, 0.38, 0));
      break;
    }
    case "log": {
      k.add(cyl(1, 1, 1, 10), "#7a5534", m(0, 0, 0, Math.PI / 2));
      k.add(cyl(0.82, 0.82, 1.015, 10), "#c9a374", m(0, 0, 0, Math.PI / 2));
      break;
    }
  }
  return k.build();
}

const SCENERY = {
  bakery: { leaf: ["#5f9e3f", "#78b24a", "#e0a23f"], rock: "#a79c8e", fence: "#efe6d6", fills: [["oak", 24], ["bush", 10], ["rock", 5]], front: ["bush", "rock"], landmarks: ["cottage"], fencing: true },
  dunes: { leaf: ["#8caf54", "#a3bd5c", "#c9bb62"], rock: "#c9a877", fence: "#c7a26e", fills: [["cactus", 12], ["hay", 7], ["rock", 7], ["bush", 5]], front: ["rock", "bush"], landmarks: ["barn"], fencing: true },
  frost: { leaf: ["#3f6f6b", "#528782"], rock: "#a9bfd8", fence: "#7a5234", fills: [["pine", 30], ["rock", 7]], front: ["rock", "pine"], landmarks: ["cabin"], snowTrees: true, fencing: false },
  chilli: { leaf: ["#3f7a3a", "#4f8a44"], rock: "#6b372c", fence: "#3a2422", fills: [["crag", 16], ["rock", 12], ["chilliPlant", 7]], front: ["rock", "chilliPlant"], landmarks: [], fencing: false },
  harbour: { leaf: ["#3f9a5a", "#5fb46a"], rock: "#6f7780", fence: "#f4ead6", fills: [["palm", 14], ["hut", 4], ["rock", 6], ["bush", 5]], front: ["rock", "bush"], landmarks: ["cottage"], fencing: true },
  market: { leaf: ["#2f5a4a", "#3a6a56"], rock: "#4a4d66", fence: "#3a3550", fills: [["lamp", 10], ["stall", 6], ["townhouse", 9], ["bush", 4]], front: ["bush", "rock"], landmarks: [], fencing: false }
};

// ════ The world ═══════════════════════════════════════════════════
const QUALITY = {
  high: { level: 2, name: "high", dpr: 2, shadows: true, shadowSize: 2048, density: 1, particles: 220 },
  medium: { level: 1, name: "medium", dpr: 1.5, shadows: true, shadowSize: 1024, density: 0.7, particles: 140 },
  low: { level: 0, name: "low", dpr: 1, shadows: false, shadowSize: 512, density: 0.4, particles: 70 }
};

export class World3D {
  constructor(canvas, qualityName) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance", stencil: false });
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, 1, 1, 900);
    this.quality = QUALITY[qualityName] || QUALITY.high;
    this.autoQuality = !QUALITY[qualityName];
    this.width = 1; this.height = 1; this.showView = "home";
    this.camX = 0; this.camY = 0; this.shake = 0; this.time = 0;
    this.fpsTime = 0; this.fpsFrames = 0;
    this.applyQuality();
    this.onQualityChange = null;
  }

  applyQuality() {
    const q = this.quality;
    this.renderer.setPixelRatio(Math.min(q.dpr, window.devicePixelRatio || 1));
    this.renderer.shadowMap.enabled = q.shadows;
    this.renderer.setSize(this.width, this.height, false);
  }
  setQuality(name) {
    this.autoQuality = !QUALITY[name];
    this.quality = QUALITY[name] || QUALITY.high;
    this.applyQuality();
    this.lastBuild && this.rebuild();
  }
  resize(w, h) {
    this.width = Math.max(1, w); this.height = Math.max(1, h);
    this.renderer.setSize(this.width, this.height, false);
    this.camera.aspect = this.width / this.height;
    // Keep roughly the same stretch of road in view on any screen shape.
    const span = this.camera.aspect > 1.4 ? 17.5 : this.camera.aspect > 0.9 ? 15.5 : 12;
    this.dist = span / (2 * Math.tan((this.camera.fov * Math.PI) / 360) * this.camera.aspect);
    this.camera.updateProjectionMatrix();
  }
  rebuild() {
    const b = this.lastBuild;
    if (b.game) this.buildRoute(b.game);
    else this.showcase(b.truck, b.region, b.rail);
  }

  clear() {
    this.scene.traverse((o) => {
      if (o.isInstancedMesh) o.dispose();
      if (o.geometry && o.geometry !== BOX) o.geometry.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((mat) => { if (mat.map && !Object.values(texCache).includes(mat.map)) mat.map.dispose(); if (mat !== texCache.crateMat) mat.dispose(); });
    });
    this.scene.clear();
    this.cargo = []; this.truckModel = null; this.coinMesh = null; this.canMesh = null; this.weather = null;
  }

  // ─── Sky, light, ground and scenery for one region ──────────────
  setStage(terrain, regionIndex, seed) {
    this.clear();
    const theme = THEMES[regionIndex], scenery = SCENERY[theme.id], q = this.quality;
    this.theme = theme;
    this.renderer.toneMappingExposure = theme.exposure;
    this.scene.background = canvasTex(32, 512, (x, w, h) => {
      const g = x.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, theme.skyTop); g.addColorStop(0.5, theme.skyMid); g.addColorStop(0.82, theme.skyLow); g.addColorStop(1, theme.skyLow);
      x.fillStyle = g; x.fillRect(0, 0, w, h);
    });
    this.scene.fog = new THREE.Fog(theme.fog, 70, theme.fogFar);
    this.scene.add(new THREE.HemisphereLight(theme.hemi[0], theme.hemi[1], theme.hemi[2]));
    const sun = new THREE.DirectionalLight(theme.sun, theme.sunI);
    sun.castShadow = q.shadows;
    sun.shadow.mapSize.set(q.shadowSize, q.shadowSize);
    Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 22, bottom: -16, near: 1, far: 90 });
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
    this.scene.add(sun, sun.target);
    this.sun = sun;

    const noise = noiseFn(SH.hash(seed));
    const pts = terrain.pts, S = SH.SAMPLE, last = pts[pts.length - 1];
    const base = (x) => (x <= 0 ? pts[0].y : x >= last.x ? last.y : SH.heightAt(terrain, x));
    const hillRise = theme.id === "dunes" || theme.id === "harbour" || theme.id === "market" ? 0.1 : theme.id === "frost" ? 0.2 : theme.id === "chilli" ? 0.22 : 0.13;
    const surface = (x, z) => {
      const b = base(x), az = Math.abs(z);
      if (az <= 2.7) return b;
      const t = az - 2.7;
      if (z > 0) return b - Math.min(t, 16) * 0.3 - Math.max(0, t - 16) * 0.5 + noise(x * 0.22, z * 0.3) * Math.min(t * 0.09, 0.45);
      const w = Math.min(t * 0.9, 26);
      const sm = (base(x - w) + base(x - w / 2) + b + base(x + w / 2) + base(x + w)) / 5;
      return lerp(b, sm, sat(t / 12)) + t * hillRise + noise(x * 0.035, z * 0.035 + 3) * Math.min(t * 0.3, 9) + noise(x * 0.14, z * 0.14) * Math.min(t * 0.05, 1.1);
    };
    this.surface = surface;

    // Ground: one flat-shaded sheet, with the road as a band through it.
    const zs = [64, 38, 20, 10, 6.5, 3.6, 2.9, 2.45, 1.25, 0.45, -0.45, -1.25, -2.45, -2.9, -3.7, -6, -10, -16, -26, -42, -70, -115, -170];
    const x0 = -60, x1 = terrain.total + 70, cols = Math.ceil((x1 - x0) / S);
    const pos = [], colors = [];
    const c = new THREE.Color(), grass = theme.grass.map(col), road = col(theme.road), rut = col(theme.rut), edge = col(theme.edge), far = theme.far.map(col);
    const colourFor = (x, zm) => {
      const az = Math.abs(zm), n = noise(x * 0.09, zm * 0.09);
      if (az < 2.45) {
        c.copy(az > 0.45 && az < 1.25 ? rut : road);
        c.offsetHSL(0, 0, n * 0.022 + Math.sin(x * 2.3) * 0.006);
      } else if (az < 2.9) c.copy(edge).offsetHSL(0, 0, n * 0.03);
      else {
        const pick = grass[Math.abs(Math.floor(n * 7 + x * 0.4 + zm * 0.3)) % grass.length];
        c.copy(pick).offsetHSL(0, 0, n * 0.03);
        if (zm < -16) c.lerp(far[n > 0 ? 0 : 1], sat((-zm - 16) / 40));
      }
      return c;
    };
    for (let i = 0; i < cols; i++) {
      const xa = x0 + i * S, xb = xa + S;
      for (let r = 0; r < zs.length - 1; r++) {
        const za = zs[r], zb = zs[r + 1];
        const a = [xa, surface(xa, za), za], b = [xb, surface(xb, za), za], d = [xa, surface(xa, zb), zb], e = [xb, surface(xb, zb), zb];
        const paint = colourFor(xa + S / 2, (za + zb) / 2);
        pos.push(...a, ...b, ...e, ...a, ...e, ...d);
        for (let v = 0; v < 6; v++) colors.push(paint.r, paint.g, paint.b);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: true }));
    ground.receiveShadow = q.shadows;
    this.scene.add(ground);

    // Far mountains, soft with distance.
    const mountains = new Kit(), r = SH.rng(SH.hash(seed + "peaks"));
    for (let x = x0 - 200; x < x1 + 200; x += 46 + r() * 40) {
      const h = 34 + r() * 46, w = 42 + r() * 40, geoM = new THREE.ConeGeometry(w, h, 7);
      mountains.add(geoM, theme.peak[r() > 0.5 ? 1 : 0], m(x, h / 2 - 6, -210 - r() * 60, 0, r() * 3), true);
      if (theme.id === "frost" || theme.id === "bakery") mountains.add(new THREE.ConeGeometry(w * 0.32, h * 0.32, 7), "#ffffff", m(x, h * 0.84 - 6, -209 - 0, 0, r() * 3), true);
    }
    const peaks = new THREE.Mesh(mountains.build(), new THREE.MeshLambertMaterial({ vertexColors: true }));
    this.scene.add(peaks);

    // Clouds
    const cloud = new Kit();
    [[0, 0, 5], [4.5, -0.6, 3.6], [-4.5, -0.8, 3.4], [2, 1.5, 3.2]].forEach(([x, y, s]) => cloud.add(blob(s, 1), "#ffffff", m(x, y, 0, 0, 0, 0, 1, 0.62, 1)));
    const clouds = new THREE.InstancedMesh(cloud.build(), new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, transparent: true, opacity: theme.id === "chilli" ? 0.28 : theme.night ? 0.12 : 0.85 }), 16);
    this.cloudData = [];
    for (let i = 0; i < 16; i++) this.cloudData.push({ x: x0 + r() * (x1 - x0), y: 42 + r() * 32, z: -170 - r() * 40, s: 1 + r() * 1.6 });
    clouds.frustumCulled = false;
    this.cloudMesh = clouds;
    this.scene.add(clouds);

    // Scatter: instanced, so a whole forest is a handful of draw calls.
    const kitTheme = Object.assign({}, scenery, { snowTrees: scenery.snowTrees });
    const place = (kind, list, shadows) => {
      if (!list.length) return;
      const mesh = new THREE.InstancedMesh(propKit(kind, kitTheme), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }), list.length);
      list.forEach((t, i) => mesh.setMatrixAt(i, t));
      mesh.castShadow = shadows && q.shadows;
      mesh.receiveShadow = false;
      mesh.frustumCulled = false;
      this.scene.add(mesh);
    };
    const span = x1 - x0;
    scenery.fills.forEach(([kind, per100]) => {
      const list = [], n = Math.round((span / 100) * per100 * q.density);
      for (let i = 0; i < n; i++) {
        const x = x0 + r() * span, z = -5.5 - Math.pow(r(), 1.5) * 66, s = 0.8 + r() * 0.8;
        list.push(m(x, surface(x, z) - 0.08, z, 0, r() * 6.3, 0, s));
      }
      place(kind, list, true);
    });
    scenery.front.forEach((kind) => {
      const list = [], n = Math.round((span / 100) * 5 * q.density);
      for (let i = 0; i < n; i++) {
        const x = x0 + r() * span, z = 4.2 + r() * 4.5, s = kind === "pine" ? 0.55 + r() * 0.3 : 0.4 + r() * 0.5;
        list.push(m(x, surface(x, z) - 0.05, z, 0, r() * 6.3, 0, s));
      }
      place(kind, list, true);
    });
    scenery.landmarks.forEach((kind) => {
      const list = [];
      for (let x = 34 + r() * 30; x < terrain.total + 30; x += 60 + r() * 50) {
        const z = -13 - r() * 14;
        list.push(m(x, surface(x, z) - 0.2, z, 0, (r() - 0.5) * 0.7, 0, 1 + r() * 0.3));
      }
      place(kind, list, true);
    });
    if (scenery.fencing) {
      const list = [];
      for (let x = x0; x < x1; x += 3) {
        if (noise(x * 0.02, 9) < -0.2) continue;
        const y0 = surface(x, -3.4), y1 = surface(x + 3, -3.4);
        list.push(m(x + 1.5, (y0 + y1) / 2, -3.4, 0, 0, Math.atan2(y1 - y0, 3)));
      }
      place("fence", list, false);
    }
    if (theme.id === "chilli") {
      const lava = new Kit();
      for (let x = x0; x < x1; x += 22 + r() * 34) {
        const z = -8 - r() * 26;
        lava.add(new THREE.CircleGeometry(2 + r() * 3, 8), r() > 0.5 ? "#ff7a1f" : "#ffb02e", m(x, surface(x, z) + 0.28, z, -Math.PI / 2, 0, 0, 1, 0.7, 1));
      }
      this.scene.add(new THREE.Mesh(lava.build(), new THREE.MeshBasicMaterial({ vertexColors: true, fog: false })));
    }
    this.buildParticles(theme);
    this.buildWeather(theme);
  }

  // ─── Pooled effects ─────────────────────────────────────────────
  buildParticles(theme) {
    const n = this.quality.particles;
    const mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true }), n);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    this.fx = { mesh, list: [], next: 0, dummy: new THREE.Object3D(), dustColor: col(theme.dust) };
    for (let i = 0; i < n; i++) {
      this.fx.list.push({ life: 0, max: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, s: 0, g: 0 });
      mesh.setMatrixAt(i, new THREE.Matrix4().makeScale(0, 0, 0));
      mesh.setColorAt(i, this.fx.dustColor);
    }
    this.scene.add(mesh);
  }
  puff(x, y, z, vx, vy, vz, size, life, color, gravity = 0) {
    const fx = this.fx;
    if (!fx) return;
    const i = fx.next; fx.next = (i + 1) % fx.list.length;
    Object.assign(fx.list[i], { life, max: life, x, y, z, vx, vy, vz, s: size, g: gravity });
    fx.mesh.setColorAt(i, color || fx.dustColor);
    fx.mesh.instanceColor.needsUpdate = true;
  }
  stepParticles(dt) {
    const fx = this.fx;
    if (!fx) return;
    fx.list.forEach((p, i) => {
      if (p.life <= 0) {
        if (p.s) { p.s = 0; fx.dummy.scale.setScalar(0); fx.dummy.updateMatrix(); fx.mesh.setMatrixAt(i, fx.dummy.matrix); }
        return;
      }
      p.life -= dt; p.vy -= p.g * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      const t = sat(p.life / p.max);
      fx.dummy.position.set(p.x, p.y, p.z);
      fx.dummy.rotation.set(p.life * 3, p.life * 2, 0);
      fx.dummy.scale.setScalar(p.s * (0.35 + (p.g ? t : Math.sin(t * Math.PI)) * 0.8));
      fx.dummy.updateMatrix();
      fx.mesh.setMatrixAt(i, fx.dummy.matrix);
    });
    fx.mesh.instanceMatrix.needsUpdate = true;
  }
  buildWeather(theme) {
    if (theme.id !== "frost" && theme.id !== "chilli" && theme.id !== "market") return;
    const n = this.quality.level === 0 ? 120 : 340, p = new Float32Array(n * 3);
    for (let i = 0; i < n * 3; i += 3) { p[i] = Math.random() * 70 - 35; p[i + 1] = Math.random() * 34; p[i + 2] = Math.random() * 34 - 18; }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: theme.id === "frost" ? "#ffffff" : theme.id === "market" ? "#ffe9a8" : "#ffb45a", size: theme.id === "frost" ? 0.2 : 0.13, transparent: true, opacity: 0.9, fog: false }));
    pts.frustumCulled = false;
    this.scene.add(pts);
    this.weather = { pts, dir: theme.id === "frost" ? -1 : 1, speed: theme.id === "frost" ? 3.2 : 2 };
  }

  // ─── Route items ────────────────────────────────────────────────
  buildRoute(game) {
    this.lastBuild = { game };
    const t = game.terrain;
    this.setStage(t, game.regionIndex, game.delivery.id);
    const scene = this.scene, q = this.quality, theme = this.theme;

    const model = buildTruck(game.spec, game.rail, q);
    scene.add(model.root); model.wheels.forEach((w) => scene.add(w));
    this.truckModel = model;
    this.cargo = game.cargo.map((c) => { const g = buildCargo(c.type, q); scene.add(g); return { info: c, group: g, age: 0, wob: 0 }; });

    // Coins
    const coin = new Kit();
    coin.add(cyl(0.34, 0.34, 0.08, 18), "#f6bb35", m(0, 0, 0, Math.PI / 2));
    coin.add(cyl(0.24, 0.24, 0.1, 18), "#ffd86a", m(0, 0, 0, Math.PI / 2));
    coin.add(box(0.07, 0.24, 0.12), "#e29a1e", m(0, 0, 0));
    this.coinMesh = new THREE.InstancedMesh(coin.build(), new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.35, roughness: 0.3, emissive: "#c98a10", emissiveIntensity: 0.75 }), Math.max(1, game.coins.length));
    this.coinMesh.frustumCulled = false;
    this.coinMesh.castShadow = q.shadows;
    scene.add(this.coinMesh);

    // Fuel cans
    const can = new Kit();
    can.add(roundedSlab(0.6, 0.8, 0.42, 0.08), "#e0402e");
    can.add(box(0.28, 0.08, 0.1), "#2a2a2e", m(-0.05, 0.47, 0));
    can.add(cyl(0.06, 0.08, 0.24, 8), "#f2c04a", m(0.2, 0.5, 0, 0, 0, -0.5));
    can.add(box(0.32, 0.32, 0.45), "#f6efe0", m(0, 0, 0));
    this.canMesh = new THREE.InstancedMesh(can.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0.2, emissive: "#3a0c04", emissiveIntensity: 0.6 }), Math.max(1, game.cans.length));
    this.canMesh.frustumCulled = false;
    this.canMesh.castShadow = q.shadows;
    scene.add(this.canMesh);

    // Road hazards: a physics bump is drawn as a log across the road.
    const logList = game.rocks.filter((rock) => rock.kind !== "bump");
    if (logList.length) {
      const logGeo = propKit("log", SCENERY[theme.id]);
      const logs = new THREE.InstancedMesh(logGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }), logList.length);
      logList.forEach((rock, i) => logs.setMatrixAt(i, m(rock.x, rock.y, 0, 0, 0, 0, rock.r, rock.r, 4.6)));
      logs.castShadow = q.shadows; logs.frustumCulled = false;
      scene.add(logs);
    }

    this.buildFeatures(game);

    // Unloading zone and depot
    const zoneLen = t.zoneEnd - t.zoneStart, zy = SH.heightAt(t, t.zoneStart);
    const arrows = canvasTex(512, 128, (x, w, h) => {
      x.clearRect(0, 0, w, h);
      x.fillStyle = "rgba(255,206,74,0.42)"; x.fillRect(0, 0, w, h);
      x.fillStyle = "#fff5d0";
      for (let i = 0; i < 6; i++) {
        const ox = 20 + i * 84;
        x.beginPath(); x.moveTo(ox, 20); x.lineTo(ox + 42, h / 2); x.lineTo(ox, h - 20); x.lineTo(ox + 18, h - 20); x.lineTo(ox + 60, h / 2); x.lineTo(ox + 18, 20); x.closePath(); x.fill();
      }
    });
    const zone = new THREE.Mesh(new THREE.PlaneGeometry(zoneLen, 4.6), new THREE.MeshBasicMaterial({ map: arrows, transparent: true, depthWrite: false, fog: false }));
    zone.rotation.x = -Math.PI / 2;
    zone.position.set(t.zoneStart + zoneLen / 2, zy + 0.03, 0);
    scene.add(zone);
    this.zoneMesh = zone;

    const depot = new Kit(), dx = t.total + 7;
    depot.add(box(12, 6.4, 10), "#efe2c6", m(dx, zy + 3.2, 0));
    depot.add(box(12.6, 0.5, 10.6), "#b5482f", m(dx, zy + 6.6, 0));
    depot.add(box(0.9, 5.4, 7), "#463225", m(dx - 6, zy + 2.7, 0));
    for (let i = 0; i < 8; i++) depot.add(box(1.9, 0.18, 1.2), i % 2 ? "#e0483c" : "#fff6e6", m(dx - 7.1, zy + 4.8 + 0, -4.2 + i * 1.2, 0, 0, 0.5));
    depot.add(box(0.26, 11, 0.26), "#d8d2c6", m(t.zoneStart, zy + 5.5, -3.2));
    depot.add(box(0.26, 11, 0.26), "#d8d2c6", m(t.zoneStart, zy + 5.5, 3.2));
    depot.add(box(0.5, 1, 6.6), "#e0483c", m(t.zoneStart, zy + 10.6, 0));
    this.scene.add(new THREE.Mesh(depot.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75 })));
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.1), new THREE.MeshBasicMaterial({ map: canvasTex(512, 96, (x, w, h) => {
      x.fillStyle = "#e0483c"; x.fillRect(0, 0, w, h);
      x.fillStyle = "#fff"; x.font = "800 62px sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("UNLOAD HERE", w / 2, h / 2 + 4);
    }) }));
    sign.position.set(t.zoneStart, zy + 10.6, 3.3);
    scene.add(sign);

    const p = game.truck.getPosition();
    this.camX = p.x + 2; this.camY = p.y; this.shake = 0; this.zoomOut = 0;
    this.syncActors(game, 0);
    this.updateCamera(game, 1);
  }

  // ─── Road features: bridges, fords, ice, wind, bumps, ramps, pickup stops ─
  buildFeatures(game) {
    const t = game.terrain, kit = new Kit(), glow = new Kit(), S = SH.SAMPLE;
    // A strip that hugs the road between two points along it.
    const strip = (target, x0, x1, color, lift, width) => {
      for (let x = x0; x < x1 - 0.01; x += S / 2) {
        const xb = Math.min(x1, x + S / 2), ya = SH.heightAt(t, x) + lift, yb = SH.heightAt(t, xb) + lift;
        const len = Math.hypot(xb - x, yb - ya);
        target.add(box(len + 0.02, 0.03, width), color, m((x + xb) / 2, (ya + yb) / 2, 0, 0, 0, Math.atan2(yb - ya, xb - x)));
      }
    };
    const post = (x, h, color, z) => kit.add(box(0.16, h, 0.16), color, m(x, SH.heightAt(t, x) + h / 2, z));
    (t.features || []).forEach((f) => {
      if (f.type === "slick") {
        strip(glow, f.x0, f.x1, this.theme.night ? "#7fd0ff" : "#c8f0ff", 0.035, 4.7);
        [f.x0, f.x1].forEach((x) => { post(x, 2.2, "#2f7fd0", -3.0); kit.add(blob(0.3, 0), "#9fe0ff", m(x, SH.heightAt(t, x) + 2.4, -3.0)); });
      } else if (f.type === "ford") {
        strip(glow, f.x0, f.x1, "#3fb6d8", 0.3, 9);
      } else if (f.type === "bridge") {
        for (let x = f.x0; x < f.x1; x += 0.75) kit.add(box(0.66, 0.1, 5), Math.round(x / 0.75) % 2 ? "#a9773f" : "#8f6233", m(x + 0.375, SH.heightAt(t, x + 0.375) + 0.03, 0, 0, 0, 0));
        [f.x0, f.x1].forEach((x) => [-2.6, 2.6].forEach((z) => post(x, 2.4, "#6d4a2c", z)));
          } else if (f.type === "wind") {
        [f.x0, f.x1].forEach((x) => { post(x, 4, "#f2f2ee", -3.2); for (let i = 0; i < 4; i++) kit.add(box(0.45, 0.42 - i * 0.07, 0.42 - i * 0.07), i % 2 ? "#ffffff" : "#ff7a2f", m(x - 0.3 - i * 0.45, SH.heightAt(t, x) + 3.8 - i * 0.06, -3.2)); });
      } else if (f.type === "ramp") {
        for (let i = 0; i < 3; i++) kit.add(box(0.5, 0.06, 4.4), i % 2 ? "#2a2a2e" : "#ffcf3a", m(f.x0 + 1.5 + i * 1.3, SH.heightAt(t, f.x0 + 1.5 + i * 1.3) + 0.04, 0, 0, 0, 0.12 + i * 0.1));
      } else if (f.type === "pickup") {
        strip(glow, f.x0, f.x1, "#6fe08f", 0.04, 4.7);
        const cx = (f.x0 + f.x1) / 2, y = SH.heightAt(t, cx);
        kit.add(box(6, 3.2, 3), "#efe2c6", m(cx, y + 1.6, -6.5));
        kit.add(box(6.6, 0.4, 3.6), "#3f9a5a", m(cx, y + 3.4, -6.5));
        kit.add(box(0.3, 5.5, 0.3), "#d8d2c6", m(cx, y + 2.75, -3.4));
        kit.add(box(0.3, 0.3, 4.2), "#d8d2c6", m(cx, y + 5.5, -1.4));
        [-1, 0, 1].forEach((i) => kit.add(box(0.6, 0.6, 0.6), "#eab765", m(cx + i * 0.9, y + 0.3, -4.4)));
      }
    });
    game.rocks.filter((rock) => rock.kind === "bump").forEach((rock, i) => kit.add(cyl(rock.r, rock.r, 4.7, 8), i % 2 ? "#2a2a2e" : "#ffcf3a", m(rock.x, rock.y, 0, Math.PI / 2)));
    if (kit.pos.length) {
      const mesh = new THREE.Mesh(kit.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 }));
      mesh.castShadow = this.quality.shadows;
      this.scene.add(mesh);
    }
    if (glow.pos.length) this.scene.add(new THREE.Mesh(glow.build(), new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.5, depthWrite: false })));
    if (this.theme.night) {
      // Headlights: one warm light riding ahead of the truck.
      this.headlight = new THREE.PointLight("#ffe2a8", 60, 26, 1.6);
      this.scene.add(this.headlight);
    } else this.headlight = null;
  }

  // ─── Menu showcase: the truck parked in its region ──────────────
  showcase(truckId, regionIndex, rail) {
    this.lastBuild = { truck: truckId, region: regionIndex, rail };
    const id = "show-" + regionIndex;
    const key = id + truckId + rail + this.quality.name;
    if (this.showKey === key && this.showcasing) return;
    this.showKey = key;
    const d = { id, region: regionIndex, index: 0, len: 60, heat: 0.2, load: [] };
    const pts = [];
    for (let x = 0; x <= 110; x += SH.SAMPLE) pts.push({ x, y: Math.sin(x * 0.04) * 0.5 * Math.min(1, x / 30) });
    this.setStage({ pts, total: 110 }, regionIndex, id);
    const spec = SH.truckSpec(truckId), model = buildTruck(spec, rail, this.quality), D = SH.dimsFor(spec);
    const ground = SH.heightAt({ pts }, 50);
    const y = ground + spec.wheelR - D.axleY;
    model.root.position.set(50, y, 0);
    this.scene.add(model.root);
    model.wheels.forEach((w, i) => { w.position.set(50 + (i ? D.frontX : D.rearX), y + D.axleY, 0); this.scene.add(w); });
    const kinds = SH.REGIONS[regionIndex].kinds || ["cake", "popcorn"];
    const load = ["crate", kinds[0], "crate", kinds[1]];
    const stacked = spec.perRow;
    load.forEach((type, i) => {
      const g = buildCargo(type, this.quality);
      g.position.set(50 + D.bedRight - D.crate * ((i % stacked) + 0.55), y + D.bedHeight + SH.cargoSize(type).h / 2 + (i >= stacked ? D.crate : 0) + 0.01, 0);
      this.scene.add(g);
    });
    this.truckModel = model;
    this.showcasing = true;
    this.showPos = new THREE.Vector3(50, y, 0);
    d.load = null;
  }
  frameShowcase(dt) {
    this.time += dt;
    // The truck sits clear of whatever the menu covers.
    const p = this.showPos, a = 0.5 + Math.sin(this.time * 0.22) * 0.34, wide = this.camera.aspect > 1.2, panel = this.showView === "panel";
    const dist = wide ? (panel ? 15.5 : 11.5) : panel ? 19 : 21;
    const lookX = wide ? (panel ? 6.4 : -1.9) : 0, lookY = wide ? 0.5 : panel ? -3.6 : -1.1;
    this.camera.position.set(p.x + Math.sin(a) * dist + lookX * 0.8, p.y + 2.3, Math.cos(a) * dist);
    this.camera.lookAt(p.x + lookX, p.y + lookY, 0);
    this.sun.position.set(p.x - 16, p.y + 26, 20);
    this.sun.target.position.copy(p);
    this.animateSky(dt);
    this.stepParticles(dt);
    this.renderer.render(this.scene, this.camera);
  }

  // ─── Per-frame ──────────────────────────────────────────────────
  syncActors(game, dt) {
    const model = this.truckModel, truck = game.truck, p = truck.getPosition();
    model.root.position.set(p.x, p.y, 0);
    model.root.rotation.z = truck.getAngle();
    game.wheels.forEach((w, i) => {
      const wp = w.getPosition(), g = model.wheels[i];
      g.position.set(wp.x, wp.y, 0);
      g.rotation.z = w.getAngle();
    });
    model.brakes.forEach((b) => { b.material.emissiveIntensity = game.brakeOn ? 3.4 : 0.8; });
    if (this.headlight) this.headlight.position.set(p.x + 5, p.y + 2.2, 1.5);

    this.cargo.forEach((c) => {
      const b = c.info.body, cp = b.getPosition();
      c.group.position.set(cp.x, cp.y, 0);
      c.group.rotation.z = b.getAngle();
      if (c.group.userData.wobble) {
        c.wob += dt * 9;
        const v = b.getLinearVelocity().length();
        const s = 1 + Math.sin(c.wob) * Math.min(0.09, 0.02 + v * 0.008);
        c.group.scale.set(1 / s, s, 1 / s);
      }
      if (c.info.lost || c.info.broken) {
        c.age += dt;
        if (c.age > 2.4) c.group.scale.setScalar(Math.max(0.001, 1 - (c.age - 2.4) / 0.5));
      }
    });

    const hide = new THREE.Matrix4().makeScale(0, 0, 0), spin = this.time * 3.2;
    if (this.coinMesh) {
      game.coins.forEach((c, i) => {
        this.coinMesh.setMatrixAt(i, c.taken ? hide : m(c.x, c.y + Math.sin(spin + c.x) * 0.08, 0, 0, spin + c.x * 0.3));
      });
      this.coinMesh.instanceMatrix.needsUpdate = true;
    }
    if (this.canMesh) {
      game.cans.forEach((c, i) => {
        this.canMesh.setMatrixAt(i, c.taken ? hide : m(c.x, c.y + Math.sin(spin * 0.7) * 0.12, 0, 0, spin * 0.5, 0.12));
      });
      this.canMesh.instanceMatrix.needsUpdate = true;
    }
  }

  animateSky(dt) {
    if (this.cloudMesh) {
      const d = new THREE.Object3D();
      this.cloudData.forEach((c, i) => {
        c.x += dt * 0.8;
        d.position.set(c.x, c.y, c.z); d.scale.setScalar(c.s); d.updateMatrix();
        this.cloudMesh.setMatrixAt(i, d.matrix);
      });
      this.cloudMesh.instanceMatrix.needsUpdate = true;
    }
    if (this.weather) {
      const w = this.weather, arr = w.pts.geometry.attributes.position, a = arr.array;
      for (let i = 0; i < a.length; i += 3) {
        a[i + 1] += w.dir * w.speed * dt;
        a[i] += Math.sin(this.time + i) * dt * 0.7 - dt * 1.4;
        if (a[i + 1] < 0) a[i + 1] += 34;
        if (a[i + 1] > 34) a[i + 1] -= 34;
        if (a[i] < -35) a[i] += 70;
      }
      arr.needsUpdate = true;
      const tx = this.camera.position.x;
      w.pts.position.set(tx, this.camera.position.y - 17, 0);
    }
  }

  updateCamera(game, blend) {
    const p = game.truck.getPosition(), v = game.truck.getLinearVelocity();
    const speed = v.length();
    const tx = p.x + 1.4 + v.x * 0.24, ty = p.y + 0.9;
    this.camX += (tx - this.camX) * blend;
    this.camY += (ty - this.camY) * Math.min(1, blend * 1.4);
    this.zoomOut += (speed * 0.42 - this.zoomOut) * blend * 0.5;
    const dist = this.dist + this.zoomOut;
    const sx = this.shake ? (Math.random() - 0.5) * this.shake : 0, sy = this.shake ? (Math.random() - 0.5) * this.shake : 0;
    this.camera.position.set(this.camX - 2.6 + sx, this.camY + 2.3 + sy, dist);
    this.camera.lookAt(this.camX, this.camY + 0.15, 0);
  }

  // Turns game events into effects.
  react(ev) {
    const z = () => (Math.random() - 0.5) * 1.8;
    if (ev.type === "pickup") {
      ev.items.forEach((c) => { const g = buildCargo(c.type, this.quality); this.scene.add(g); this.cargo.push({ info: c, group: g, age: 0, wob: 0 }); });
      const green = col("#6fe08f");
      for (let i = 0; i < 18; i++) this.puff(ev.x + (Math.random() - 0.5) * 3, ev.y + 1.5, z(), (Math.random() - 0.5) * 2, 2 + Math.random() * 2, z(), 0.1, 0.7, green, 5);
    } else if (ev.type === "splash") {
      const water = col("#bfeaff");
      for (let i = 0; i < 9; i++) this.puff(ev.x + (Math.random() - 0.5) * 2, ev.y + 0.3, z(), (Math.random() - 0.5) * 4, 2 + Math.random() * 3, z(), 0.1, 0.5, water, 10);
    } else if (ev.type === "ruined") {
      const icing = col("#ffd3e2");
      for (let i = 0; i < 12; i++) this.puff(ev.x, ev.y, z() * 0.4, (Math.random() - 0.5) * 4, 2 + Math.random() * 2, z(), 0.09, 0.7, icing, 10);
    } else if (ev.type === "land") {
      this.shake = Math.min(0.5, this.reduceMotion ? 0 : ev.air * 0.32);
      const n = Math.min(14, 5 + ev.air * 10);
      for (let i = 0; i < n; i++) this.puff(ev.x + (Math.random() - 0.5) * 3, ev.y - 0.3, z(), (Math.random() - 0.5) * 3, 1 + Math.random() * 1.6, z(), 0.26, 0.7);
    } else if (ev.type === "coin") {
      const gold = col("#ffd34d");
      for (let i = 0; i < 6; i++) this.puff(ev.x, ev.y, 0, (Math.random() - 0.5) * 4, 2 + Math.random() * 3, z(), 0.08, 0.45, gold, 8);
    } else if (ev.type === "fuel") {
      const green = col("#6fe08f");
      for (let i = 0; i < 14; i++) this.puff(ev.x, ev.y, 0, (Math.random() - 0.5) * 3, 2 + Math.random() * 4, z(), 0.1, 0.6, green, 5);
    } else if (ev.type === "broken") {
      const yolk = col("#ffc62e"), shell = col("#fff3dc");
      for (let i = 0; i < 16; i++) this.puff(ev.x, ev.y, z() * 0.4, (Math.random() - 0.5) * 5, 2 + Math.random() * 3, z(), 0.08, 0.7, i % 2 ? yolk : shell, 11);
    } else if (ev.type === "lost") {
      for (let i = 0; i < 7; i++) this.puff(ev.x, ev.y, z(), (Math.random() - 0.5) * 2, 1 + Math.random(), z(), 0.2, 0.6);
    } else if (ev.type === "done") {
      const list = ["#ff6b5a", "#ffd34d", "#6fd08f", "#6fb7ff"].map(col), p = ev.at;
      if (p) for (let i = 0; i < 40; i++) this.puff(p.x + (Math.random() - 0.5) * 7, p.y + 5 + Math.random() * 4, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 3, Math.random() * 2, 0, 0.14, 1.9, list[i % 4], 3);
    }
  }

  frameGame(game, dt) {
    this.showcasing = false;
    this.time += dt;
    this.syncActors(game, dt);
    this.updateCamera(game, 1 - Math.exp(-dt * 4.2));
    this.shake = Math.max(0, this.shake - dt * 1.2);

    const p = game.truck.getPosition(), angle = game.truck.getAngle();
    this.sun.position.set(p.x - 16, p.y + 26, 20);
    this.sun.target.position.set(p.x + 3, p.y, 0);

    // Wheelspin dust, and exhaust while the engine works.
    const moving = game.status === "driving";
    if (moving && game.slipRear > 2 && Math.random() < 0.6) {
      const w = game.wheels[0].getPosition();
      this.puff(w.x - 0.3, w.y - game.dim.wheelR + 0.1, (Math.random() - 0.5) * 2, -1.5 - Math.random() * 2, 0.7 + Math.random(), 0, 0.2 + Math.random() * 0.12, 0.65);
    }
    if (moving && game.gasOn && Math.random() < 0.28) {
      const c = Math.cos(angle), s = Math.sin(angle), bx = -game.dim.bedHalf - 0.1;
      this.puff(p.x + c * bx, p.y + s * bx - 0.1, 0.5, -1 - Math.random(), 0.5, 0, 0.1, 0.5, this.smoke ||= col("#8d8a86"));
    }
    if (this.zoneMesh) this.zoneMesh.material.opacity = 0.72 + Math.sin(this.time * 4) * 0.25;
    this.animateSky(dt);
    this.stepParticles(dt);
    this.renderer.render(this.scene, this.camera);
    this.watchFrameRate(dt);
  }

  // Steps quality down if the phone cannot hold a steady frame rate.
  watchFrameRate(dt) {
    if (!this.autoQuality) return;
    this.fpsTime += dt; this.fpsFrames += 1;
    if (this.fpsTime < 3) return;
    const fps = this.fpsFrames / this.fpsTime;
    this.fpsTime = 0; this.fpsFrames = 0;
    if (fps >= 34) return;
    const next = this.quality === QUALITY.high ? QUALITY.medium : this.quality === QUALITY.medium ? QUALITY.low : null;
    if (!next) return;
    this.quality = next;
    this.applyQuality();
    if (!next.shadows) {
      this.sun.castShadow = false;
      this.scene.traverse((o) => { if (o.material) o.material.needsUpdate = true; });
    }
    this.onQualityChange && this.onQualityChange(next.name);
  }

  stats() {
    const i = this.renderer.info;
    return { calls: i.render.calls, triangles: i.render.triangles, geometries: i.memory.geometries, quality: this.quality.name };
  }
}
