// Snack Haul 3D view. The physics stay on a 2D plane (x, y); this file draws that
// plane in true 3D with a side-on camera. Models are built from code, so nothing
// here needs a download. An authored GLB from assets.js replaces a code-built
// model wherever one has been delivered; rails are always drawn here.
import * as THREE from "./vendor/three.module.min.js";
import { model, instanceGeometry, instanceGlow, hasModel, texture } from "./assets.js";

const SH = window.SnackHaul;
// buildRoute keeps the truck in a local called "model", so it reaches the loader by this name.
const authoredModel = model;

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
    grass: ["#2b3350", "#313a5a", "#262d48", "#374066"], road: "#c9b899", rut: "#b3a283", edge: "#e2d4b8", far: ["#252b47", "#2d3454"], peak: ["#1d2240", "#2a3058"], dust: "#bdb09a", exposure: 1.1, night: true },
  { id: "northpole", skyTop: "#0d1a3a", skyMid: "#26356b", skyLow: "#2c3f7a", fog: "#3a4e79", fogFar: 275,
    sun: "#c9daff", sunI: 1.9, hemi: ["#b5ceff", "#504860", 1.55], grass: ["#eef4fb", "#e3ebf8", "#c9d8ec", "#e9f1fd"],
    road: "#b9c9de", rut: "#a8bcd6", edge: "#dce9fa", far: ["#adbfdf", "#b9cae6"], peak: ["#778bb9", "#93a9d2"],
    dust: "#eff6ff", exposure: 1.10, night: true }
];

// ════ Small helpers ═══════════════════════════════════════════════
const col = (c) => new THREE.Color(c);
// Times of day for the Back Roads and the Extra Mile: changes laid over the
// Bakery Hills theme. "dusk" darkens as the drive goes on; "night" is lit by
// headlights and lit windows. The painted sky only fits morning and midday.
const LIGHTS = {
  dawn: { skyTop: "#6f8fc4", skyMid: "#e9b7c2", skyLow: "#ffd9a8", fog: "#e8cdbf", sun: "#ffc9a0", sunI: 2.1, hemi: ["#c9d3f0", "#7d6a52", 1.1], exposure: 0.98, painted: false },
  morning: {},
  midday: { skyTop: "#3f9fe8", sunI: 3.3, exposure: 1.04 },
  golden: { skyTop: "#5a8fd0", skyMid: "#f2c98a", skyLow: "#ffb870", fog: "#f0c58e", sun: "#ffbf73", sunI: 2.7, hemi: ["#f6dcc0", "#7a5c3a", 1.15], painted: false },
  dusk: { skyTop: "#2b2f6a", skyMid: "#b0607a", skyLow: "#ff9e6a", fog: "#9a6a7a", fogFar: 280, sun: "#ff9f70", sunI: 1.9, hemi: ["#a7a6dc", "#4a3a40", 1.3], exposure: 1.06, night: true, fall: true, painted: false },
  night: { skyTop: "#0b1230", skyMid: "#1f2a5a", skyLow: "#38406e", fog: "#2a3058", fogFar: 260, sun: "#b8c8ff", sunI: 1.35, hemi: ["#8494d8", "#2a2a3a", 1.4], exposure: 1.1, night: true, painted: false }
};
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
const PAINT = { sleigh: ["#d6342c", "#f2c14e"], tuktuk: ["#3fb7a6", "#fff3d6"], monster: ["#7a3fb8", "#f4c21f"], pickup: ["#d8452e", "#f2e2c4"], van: ["#f2ead8", "#e7a23c"], buggy: ["#f4c21f", "#2d2d33"], hauler: ["#2f6fb8", "#f2f2ee"] };

// Body widths the asset plan gives Codex. Code-built trucks keep their own.
const AUTHORED_WIDTH = { pickup: 1.8, tuktuk: 1.6, van: 1.8, buggy: 1.8, hauler: 1.95, monster: 2.0 };

function doorDecal(text, color) {
  return canvasTex(256, 128, (x, w, h) => {
    x.clearRect(0, 0, w, h);
    x.fillStyle = color;
    x.beginPath(); x.roundRect(14, 22, w - 28, h - 44, 20); x.fill();
    x.fillStyle = "#fff"; x.font = "800 31px sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText(text, w / 2, h / 2 + 2);
  });
}

const GHOST_Z = -2.2;
function kitMesh(kit, shadows, glowing = false) {
  const material = glowing ? new THREE.MeshBasicMaterial({ vertexColors: true }) :
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .75 });
  const mesh = new THREE.Mesh(kit.build(), material);
  mesh.castShadow = shadows;
  return mesh;
}

function sleighFallback(spec, look) {
  const root = new THREE.Group(), kit = new Kit(), paint = look.paint || PAINT.sleigh;
  const d = SH.dimsFor(spec), bottom = d.axleY-d.wheelR;
  kit.add(roundedSlab(3.55,.25,1.52,.06),paint[0],m(-.07,.01,0));
  for (const z of [-.80,.80]) {
    kit.add(sideShape([[-1.82,.62],[-1.58,.37],[-.40,.29],[.24,.31],[.72,.48],[1.34,1.07],[1.60,1.23],
      [1.91,.92],[1.94,.45],[1.63,.12],[.68,-.08],[-1.41,-.07]],.10),paint[0],m(0,0,z));
    kit.add(sideShape([[-1.86,bottom+.19],[-1.65,bottom],[1.37,bottom],[1.83,bottom+.13],
      [2.13,bottom+.48],[2.18,.23],[2.06,.54],[1.73,.54],[1.70,.44],[1.96,.38],[2.03,.19],
      [1.97,bottom+.43],[1.72,bottom+.23],[1.33,bottom+.09],[-1.60,bottom+.09]],.15),
      paint[1],m(0,0,z));
    for (const x of [-1.10,.91]) kit.add(box(.15,.6,.13),paint[1],m(x,-.39,z,0,0,-.23));
  }
  kit.add(roundedSlab(.3,.95,1.38,.08),paint[0],m(1.63,.58,0));
  kit.add(roundedSlab(.53,.17,1.12,.04),"#65332b",m(.86,.42,0));
  kit.add(cyl(.055,.065,.62,8),paint[1],m(1.90,.65,.65));
  const lantern = kitMesh(new Kit().add(box(.18,.25,.18),"#ffc857",m(1.90,1.06,.65)),false,true);
  root.add(kitMesh(kit,false),lantern);
  for (const [name,x,y,z] of [["seat",.94,.85,.29],["topper",1.5,1.2,0],["exhaust",-1.8,.12,0],["headlight",1.9,1.06,.65]]) {
    const mark = new THREE.Group();
    mark.name = name; mark.position.set(x,y,z); root.add(mark);
  }
  return root;
}

function hitchTeam(spec, quality) {
  const authored = model("trucks/reindeer_team");
  const team = authored || new THREE.Group();
  if (!authored) {
    const bar = new Kit();
    bar.add(box(.08,.07,1.24),"#805138",m(.06,0,0));
    team.add(kitMesh(bar,quality.shadows));
    [-.45,.45].forEach((z,i) => {
      const deer = new THREE.Group(), kit = new Kit(), brown = "#ae754a";
      deer.name = i ? "deer_b" : "deer_a";
      deer.position.set(.68,-.29,z);
      kit.add(blob(.26,1),brown,m(0,.04,0,0,0,0,1.37,1,.75));
      kit.add(blob(.17,1),brown,m(.37,.31,0,0,0,0,.8,1.25,.84));
      kit.add(blob(.14,1),brown,m(.45,.49,0)).add(blob(.09,1),"#f3d2a6",m(.58,.47,0));
      kit.add(blob(.042,1),"#3c252d",m(.67,.48,0));
      kit.add(cyl(.13,.12,.055,10),"#d6342c",m(.37,.22,0));
      for (const width of [-.11,.11]) {
        kit.add(box(.028,.27,.028),"#f4dfbd",m(.39,.65,width,0,0,.3));
        kit.add(box(.025,.12,.025),"#f4dfbd",m(.43,.68,width,0,0,-.5));
        for (const x of [-.23,.23]) kit.add(roundedSlab(.085,.41,.09,.015),brown,m(x,-.31,width))
          .add(box(.10,.10,.11),"#532e2a",m(x,-.535,width));
      }
      deer.add(kitMesh(kit,quality.shadows),kitMesh(new Kit().add(blob(.05,1),"#f2c14e",m(.43,.17,.12)),false,true));
      team.add(deer);
    });
  }
  team.position.set(spec.hitchX,spec.hitchY,0);
  team.traverse((o) => { if (o.isMesh) o.castShadow=quality.shadows; });
  return team;
}

function paceTeam(truck, speed, dt, reduceMotion) {
  if (!truck.team || reduceMotion) return;
  truck.gait += Math.abs(speed)*dt*3.4;
  truck.deer.forEach((deer,i) => {
    deer.rotation.z = Math.sin(truck.gait + i*Math.PI)*Math.min(.15,Math.abs(speed)*.025);
  });
}

function winterTopper(id) {
  const shape=new Kit();
  if (id==="santa_hat") {
    shape.add(cyl(.22,.26,.13,12),"#fff6ec",m(0,.07,0));
    shape.add(cyl(.055,.20,.32,10),"#d6342c",m(-.065,.27,0,0,0,.32));
    shape.add(blob(.083,1),"#fff6ec",m(-.13,.44,0));
  } else if (id==="antlers") {
    shape.add(cyl(.13,.15,.08,12),"#694538",m(0,.045,0));
    for (const z of [-.16,.16]) {
      shape.add(box(.051,.32,.057),"#e2bc87",m(0,.23,z,.24*Math.sign(z),0,.19));
      shape.add(box(.052,.16,.052),"#e2bc87",m(-.07,.30,z,0,0,-.56));
    }
  } else if (id==="moonpie") {
    // Code-built Moon Pie (Night Baker reward) until an authored topper arrives.
    shape.add(cyl(.24,.24,.07,16),"#c98c4a",m(0,.035,0));
    shape.add(cyl(.22,.22,.06,16),"#f6efe2",m(0,.10,0));
    shape.add(cyl(.24,.24,.07,16),"#5a3622",m(0,.165,0));
    shape.add(blob(.05,1),"#f2d36b",m(.08,.215,.06));
  } else if (id==="star") {
    const star=Array.from({length:10},(_,i)=> {
      const angle=i*Math.PI/5, r=i%2?.112:.24;
      return [-Math.sin(angle)*r,.26+Math.cos(angle)*r];
    });
    shape.add(sideShape(star,.075),"#f2c14e");
  } else return null;
  return kitMesh(shape,false,id==="star");
}

function buildTruck(spec, rail, quality, look = {}, driving = false) {
  const asset = "trucks/truck_" + spec.id;
  const authored = (driving ? model(asset + "_lod1") : null)
    || model(asset) || (spec.runners ? sleighFallback(spec, look) : null);
  const D = SH.dimsFor(spec), width = authored ? AUTHORED_WIDTH[spec.id] || 1.8 : spec.id === "hauler" ? 1.95 : 1.8, root = new THREE.Group();
  // look.paint is an earned paint job: [body colour, trim colour].
  const [paint, trim] = look.paint || PAINT[spec.id];
  const body = new Kit(), metal = new Kit(), dark = new Kit(), glass = new Kit(), rails = new Kit(), brakes = [];
  const rearRail = new Kit();
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
      rails.add(box(0.07, rail + 0.04, 0.07), trim, m(x, bedTop + rail / 2, z));
    }
    const bars = rail > 0.5 ? 3 : 2;
    for (let b = 1; b <= bars; b++) rails.add(box(right - left, 0.045, 0.05), trim, m((left + right) / 2, bedTop + (rail * b) / bars, z));
  });
  const gateX = -D.bedHalf + 0.03;
  for (let i = 0; i < 4; i++) rearRail.add(box(0.05, rail + 0.04, 0.09), trim, m(0, rail / 2, -half + 0.2 + i * ((width - 0.4) / 3)));
  rearRail.add(box(0.05, 0.05, width - 0.1), trim, m(0, rail, 0));

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
      if (!authored) root.add(lamp);
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
    if (!authored) { root.add(lamp); brakes.push(lamp); }
  });
  [D.rearX, D.frontX].forEach((x) => {
    [-1, 1].forEach((side) => dark.add(cyl(D.wheelR + 0.05, D.wheelR + 0.05, 0.16, 16), "#17171a", m(x, D.axleY + 0.3, side * (half - 0.3), Math.PI / 2, 0, 0, 1, 1, 1)));
  });

  // The authored truck, when Codex has delivered one. The game recolours its
  // "paint" and "trim" materials and brightens anything under "lights_brake".
  let seat = null;
  if (authored) {
    authored.traverse((o) => {
      if (o.name === "up_engine" || o.name === "up_suspension") o.visible = ((look.upgrades || {})[o.name.slice(3)] || 0) >= 3;
      if (!o.isMesh) return;
      o.castShadow = quality.shadows;
      const name = o.material.name;
      let lit = false;
      for (let up = o; up && !lit; up = up.parent) lit = up.name === "lights_brake";
      if (name === "paint" || name === "trim" || lit) { o.material = o.material.clone(); o.material.name = name; }
      if (name === "paint") o.material.color.set(paint);
      else if (name === "trim") o.material.color.set(trim);
      if (lit) brakes.push(o);
      if (o.material.transparent) o.renderOrder = 2;
    });
    const mark = authored.getObjectByName("seat");
    if (mark) seat = mark.getWorldPosition(new THREE.Vector3());
    root.add(authored);
    // A roof ornament sits on the truck's "topper" marker.
    const roof = authored.getObjectByName("topper"), hat = look.topper ? model("toppers/topper_" + look.topper) || winterTopper(look.topper) : null;
    if (roof && hat) {
      hat.position.copy(roof.getWorldPosition(new THREE.Vector3()));
      hat.traverse((o) => { if (o.isMesh) o.castShadow = quality.shadows; });
      root.add(hat);
    }
  }

  // The driver: the Corgi from the SnackPack cast.
  const dx = spec.id === "buggy" ? cx + 0.02 : cx - 0.05, dy = spec.id === "hauler" ? 1.22 : spec.id === "buggy" ? 0.98 : 0.94;
  let driver = model("driver/" + (look.driver || "corgi") + "_driver") || model("driver/corgi_driver");
  if (driver) driver.position.copy(seat || new THREE.Vector3(dx, dy, 0.35));
  else {
    const drv = new Kit();
    drv.add(blob(0.2, 2), "#e8a050", m(dx, dy, 0.35));
    drv.add(blob(0.13, 2), "#fff3e0", m(dx + 0.15, dy - 0.05, 0.35));
    drv.add(blob(0.05, 1), "#2a1a12", m(dx + 0.26, dy - 0.02, 0.35));
    drv.add(new THREE.ConeGeometry(0.075, 0.2, 8), "#d88a3a", m(dx - 0.08, dy + 0.22, 0.26));
    drv.add(new THREE.ConeGeometry(0.075, 0.2, 8), "#d88a3a", m(dx - 0.08, dy + 0.22, 0.44));
    drv.add(blob(0.035, 1), "#1a1a1e", m(dx + 0.14, dy + 0.06, 0.53));
    driver = new THREE.Mesh(drv.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 }));
    if (seat) driver.position.set(seat.x - dx, seat.y - dy, seat.z - 0.35);
  }
  root.add(driver);

  const add = (kit, mat) => {
    const mesh = new THREE.Mesh(kit.build(), mat);
    mesh.castShadow = quality.shadows;
    root.add(mesh);
    return mesh;
  };
  const metalMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.38, metalness: 0.7 });
  add(rails, metalMat);
  const tailgate = add(rearRail, metalMat);
  tailgate.position.set(gateX, bedTop, 0);
  const authoredGate = authored?.getObjectByName("tailgate");
  if (authoredGate) tailgate.attach(authoredGate);
  if (!authored) {
    add(body, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.34, metalness: 0.28 }));
    add(metal, metalMat);
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
  }

  // Wheels turn as a pair, driven by the physics wheel. An authored tuk-tuk has
  // one front wheel on the centre line; physics still treats it as an axle.
  const wheelName = "wheels/wheel_" + spec.id, wheelGlb = hasModel(wheelName);
  const wheelGeo = wheelGlb ? null : wheelModel(D.wheelR, spec.id === "buggy");
  const wheelMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.74, metalness: 0.12 });
  const team = spec.runners ? hitchTeam(spec, quality) : null;
  if (team) root.add(team);
  const wheels = [0, 1].map((axle) => {
    const g = new THREE.Group(), single = authored && spec.id === "tuktuk" && axle === 1;
    (spec.runners ? [] : single ? [0] : [-1, 1]).forEach((side) => {
      const w = wheelGlb ? model(wheelName) : new THREE.Mesh(wheelGeo, wheelMat);
      w.position.z = side * (half - 0.08);
      w.traverse((o) => { if (o.isMesh) o.castShadow = quality.shadows; });
      if (side < 0) w.rotation.y = Math.PI;
      g.add(w);
    });
    return g;
  });
  return { root, wheels, brakes, driver, team, tailgate, gait: 0, deer: team ? ["deer_a","deer_b"].map((id)=>team.getObjectByName(id)).filter(Boolean) : [] };
}

function syncTailgate(scene, model, game, z, reduceMotion) {
  const fall = game.tailgateFall;
  if (!fall) return;
  const gate = model.tailgate, t = Math.max(0, game.clock - fall.at);
  gate.visible = !reduceMotion && t < 0.9;
  if (!gate.visible) return;
  if (gate.parent !== scene) scene.add(gate);
  gate.position.set(fall.x + (fall.vx - 2.4) * t, fall.y + fall.vy * t - 5 * t * t, z);
  gate.rotation.z = fall.angle + 4.6 * t;
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

// Fills a cargo group with two authored units side by side. False if not delivered.
const CARGO_Z = [-0.29, 0.29];
function fillCargo(group, name, quality) {
  if (!hasModel(name)) return false;
  group.clear();
  CARGO_Z.forEach((z) => {
    const unit = model(name);
    unit.position.z = z;
    unit.traverse((o) => { if (o.isMesh) o.castShadow = quality.shadows; });
    group.add(unit);
  });
  return true;
}
const DAMAGED = { eggs: "_broken", cake: "_ruined", icecream: "_melted", present: "_crushed", pudding: "_ruined" };

function buildCargo(type, quality, id = 0) {
  const group = new THREE.Group(), S = SH.DIM.crate - 0.02, zs = [-0.29, 0.29];
  const shadow = (mesh) => { mesh.castShadow = quality.shadows; return mesh; };
  group.userData.type = type;
  const wrap = ["red","green","blue"][id%3];
  if (fillCargo(group, "cargo/cargo_" + (type === "present" ? "present_" + wrap : type), quality)) {
    if (type === "jelly") group.userData.wobble = true;
    return group;
  }
  if (type === "present" || type === "sack" || type === "pudding") {
    const kit = new Kit(), [paper,ribbon] = { red:["#d6342c","#f2c14e"], green:["#2e7d4f","#d6342c"], blue:["#497bc8","#eef4fb"] }[wrap];
    zs.forEach((z) => {
      if (type === "present") {
        kit.add(roundedSlab(S,S*.78,S,.026),paper,m(0,-.047,z));
        kit.add(box(.083,S*.82,S+.013),ribbon,m(0,-.047,z));
        kit.add(box(S+.012,S*.82,.083),ribbon,m(0,-.047,z));
        for (const x of [-.055,.055]) kit.add(blob(.071,1),ribbon,m(x,.177,z,0,0,x*5,1,.47,.58));
      } else if (type === "sack") {
        kit.add(blob(.25,2),"#b38252",m(0,-.032,z,0,0,0,1.05,.86,1.02));
        kit.add(cyl(.10,.067,.13,9),"#b89469",m(0,.19,z));
        kit.add(cyl(.078,.088,.027,9),"#6d4634",m(0,.15,z));
      } else {
        kit.add(cyl(.25,.23,.065,16),"#f1e3cf",m(0,-.264,z));
        kit.add(blob(.232,2),"#835441",m(0,-.066,z,0,0,0,1,.82,1));
        kit.add(blob(.197,1),"#f5e5ce",m(0,.063,z,0,0,0,1,.47,1));
        kit.add(blob(.048,1),"#2e7d4f",m(0,.158,z,0,0,0,1.4,.45,.72));
        kit.add(blob(.03,1),"#d6342c",m(0,.175,z));
        const dome=shadow(new THREE.Mesh(new THREE.SphereGeometry(.25,14,8,0,Math.PI*2,0,Math.PI*.55),
          new THREE.MeshStandardMaterial({color:"#c7def3",transparent:true,opacity:.23,depthWrite:false,roughness:.17})));
        dome.position.set(0,-.076,z); dome.scale.y=1.15; dome.renderOrder=2; group.add(dome);
      }
    });
    group.add(kitMesh(kit,quality.shadows));
  } else if (type === "crate") {
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
  } else if (type === "baguette") {
    // Code-built stand-ins for the 1.1 cargo until Codex's models arrive.
    // Drawn 0.3 m longer than its body, reaching back past the rail.
    const k = new Kit(), L = SH.cargoSize("baguette").w + 0.3, off = -0.15;
    [-0.2, 0.2].forEach((z) => {
      k.add(cyl(0.075, 0.075, L - 0.1, 10), "#d79a4a", m(off, 0, z, 0, 0, Math.PI / 2));
      [-1, 1].forEach((e) => k.add(blob(0.075, 1), "#c98a3c", m(off + e * (L / 2 - 0.05), 0, z, 0, 0, 0, 1, 1, 1)));
      for (let i = -2; i <= 2; i++) k.add(box(0.05, 0.02, 0.1), "#f1d2a0", m(off + i * 0.18, 0.07, z, 0, 0.5));
    });
    group.add(shadow(new THREE.Mesh(k.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75 }))));
  } else if (type === "cheese") {
    const k = new Kit();
    zs.forEach((z) => {
      k.add(cyl(0.27, 0.27, 0.34, 18), "#f2c64d", m(0, 0, z, Math.PI / 2));
      k.add(cyl(0.272, 0.272, 0.03, 18), "#d8a531", m(0, 0, z + 0.155, Math.PI / 2));
      k.add(cyl(0.272, 0.272, 0.03, 18), "#d8a531", m(0, 0, z - 0.155, Math.PI / 2));
    });
    group.add(shadow(new THREE.Mesh(k.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55 }))));
  } else if (type === "pizza") {
    const k = new Kit(), H = SH.cargoSize("pizza").h - 0.01;
    zs.forEach((z) => {
      k.add(box(0.6, H, 0.6), "#f3ead8", m(0, 0, z));
      k.add(box(0.3, 0.005, 0.3), "#d6342c", m(0, H / 2 + 0.003, z));
    });
    group.add(shadow(new THREE.Mesh(k.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 }))));
  } else if (type === "soda") {
    const k = new Kit();
    zs.forEach((z) => {
      k.add(box(S, S * 0.45, S), "#e8452c", m(0, -S * 0.27, z));
      [[-0.12, -0.12], [0.12, -0.12], [-0.12, 0.12], [0.12, 0.12]].forEach(([a, b], i) => {
        k.add(cyl(0.07, 0.08, 0.3, 10), ["#7fd0a0", "#ff9f4a", "#8fc8ff", "#ffd24a"][i], m(a, 0.03, z + b));
        k.add(cyl(0.035, 0.06, 0.1, 10), "#dfe8ef", m(a, 0.2, z + b));
      });
    });
    group.add(shadow(new THREE.Mesh(k.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.3 }))));
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
// Runs fn now if the texture's image has arrived, or when it does.
function whenReady(tex, fn) {
  if (tex.image) fn();
  else { const before = tex.userData.onReady; tex.userData.onReady = () => { before && before(); fn(); }; }
}

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

// Scenery kinds and the authored files that replace them.
const PROP_FILES = { chilliPlant: "chilli_plant", hut: "beach_hut", lamp: "lantern_post", stall: "market_stall" };
// Kinds propKit() can draw. Any other kind appears only once its model is delivered.
const CODE_KINDS = new Set(["oak", "bush", "rock", "fence", "cottage", "cactus", "hay", "barn", "pine", "cabin", "crag", "chilliPlant", "palm", "hut", "lamp", "townhouse", "stall", "log"]);
function usable(kind, region) { return CODE_KINDS.has(kind) || hasModel(propFile(kind, region)); }
// The North Pole swaps in the Winter Haul set (W2) wherever a model exists.
const NORTHPOLE_FILES = { pine: "winter/pine_snow", rock: "winter/ice_rock", fence: "winter/fence_candy", snowman: "winter/snowman", igloo: "winter/igloo",
  lamp_garland: "winter/lamp_garland", present_pile: "winter/present_pile", big_tree: "winter/big_tree", house_b: "winter/house_b", house_c: "winter/house_c" };
function propFile(kind, region) {
  if (region === "northpole" && NORTHPOLE_FILES[kind] && hasModel(NORTHPOLE_FILES[kind])) return NORTHPOLE_FILES[kind];
  return "props/" + (kind === "rock" ? "rock_" + region : PROP_FILES[kind] || kind);
}

const SCENERY = {
  northpole: { leaf: ["#2a6955", "#4e7f6d"], rock: "#afbfda", fence: "#eaf3ff", fills: [["pine", 24], ["rock", 7], ["snowman", 1], ["present_pile", 1], ["lamp_garland", 1]],
    front: ["rock", "pine"], landmarks: ["big_tree", "house_b", "house_c", "igloo"], fallbackLandmarks: ["cabin"], snowTrees: true, fencing: false },
  bakery: { leaf: ["#5f9e3f", "#78b24a", "#e0a23f"], rock: "#a79c8e", fence: "#efe6d6", fills: [["oak", 24], ["bush", 10], ["rock", 5]], front: ["bush", "rock"], landmarks: ["cottage", "windmill"], fencing: true },
  dunes: { leaf: ["#8caf54", "#a3bd5c", "#c9bb62"], rock: "#c9a877", fence: "#c7a26e", fills: [["cactus", 12], ["hay", 7], ["rock", 7], ["bush", 5]], front: ["rock", "bush"], landmarks: ["barn", "silo"], fencing: true },
  frost: { leaf: ["#3f6f6b", "#528782"], rock: "#a9bfd8", fence: "#7a5234", fills: [["pine", 30], ["rock", 7]], front: ["rock", "pine"], landmarks: ["cabin", "ski_lodge"], snowTrees: true, fencing: false },
  chilli: { leaf: ["#3f7a3a", "#4f8a44"], rock: "#6b372c", fence: "#3a2422", fills: [["crag", 16], ["rock", 12], ["chilliPlant", 7]], front: ["rock", "chilliPlant"], landmarks: ["chilli_stall", "chilli_shrine"], fencing: false },
  harbour: { leaf: ["#3f9a5a", "#5fb46a"], rock: "#6f7780", fence: "#f4ead6", fills: [["palm", 14], ["hut", 4], ["rock", 6], ["bush", 5], ["boat", 2]], front: ["rock", "bush"], landmarks: ["cottage", "honey_shop", "lighthouse"], fencing: true },
  market: { leaf: ["#2f5a4a", "#3a6a56"], rock: "#4a4d66", fence: "#3a3550", fills: [["lamp", 10], ["stall", 6], ["townhouse", 9], ["bush", 4], ["crate_stack", 4], ["planter", 4]], front: ["bush", "rock"], landmarks: ["clock_tower"], fencing: false }
};

// ════ The world ═══════════════════════════════════════════════════
const QUALITY = {
  high: { level: 2, name: "high", dpr: 2, shadows: true, shadowSize: 2048, density: 1, particles: 220 },
  medium: { level: 1, name: "medium", dpr: 1.5, shadows: true, shadowSize: 1024, density: 0.7, particles: 140 },
  low: { level: 0, name: "low", dpr: 1, shadows: false, shadowSize: 512, density: 0.4, particles: 70 }
};

function winterBuilding(workshop, shadows) {
  const root = new THREE.Group(), walls = new Kit(), lights = new Kit();
  const width = workshop ? 13.5 : 4.5, height = workshop ? 4 : 2.9, depth = workshop ? 5.5 : 3.4;
  walls.add(roundedSlab(width,height,depth,.08),workshop ? "#ad3335" : "#b77b59",m(0,height/2,0));
  const roof = [[-width*.53,height],[width*.53,height],[0,height+(workshop?2.1:1.2)]];
  walls.add(sideShape(roof, depth+.28),"#a2433d");
  walls.add(sideShape(roof.map(([x,y])=>[x*1.025,y+.15]), depth+.48),"#eef4fb");
  const z = depth/2+.05;
  walls.add(roundedSlab(workshop?2.8:.87,height*.76,.12,.035),workshop?"#7e3e34":"#2e7d4f",m(0,height*.38,z));
  for (const side of [-1,1]) lights.add(box(width*.14,height*.24,.07),"#ffc857",m(side*width*.31,height*.59,z+.08));
  if (workshop) lights.add(box(2.3,2.5,.08),"#f7af51",m(0,1.42,z+.09));
  else {
    walls.add(box(1.5,.15,.82),"#e3edf8",m(0,.075,z+.32));
    walls.add(box(.97,.035,.55),"#785246",m(0,.165,z+.40));
    walls.add(new THREE.TorusGeometry(.21,.059,6,12),"#2e7d4f",m(0,1.55,z+.09));
  }
  root.add(kitMesh(walls,shadows),kitMesh(lights,false,true));
  return root;
}

export class World3D {
  // autoStart: the tier Auto starts on (from the phone, or where Auto settled last time).
  constructor(canvas, qualityName, autoStart) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance", stencil: false });
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, 1, 1, 900);
    this.look = { driver: "corgi", topper: "", upgrades: {} };
    this.autoQuality = !QUALITY[qualityName];
    this.quality = QUALITY[qualityName] || QUALITY[autoStart] || QUALITY.high;
    // Auto steps up at most once a session, between runs, after a minute of smooth
    // driving; a tier that then drops straight back becomes the ceiling.
    this.autoCeiling = null; this.fastTime = 0; this.driveTime = 0; this.triedUp = false; this.upReady = false; this.upAt = null;
    this.onCeiling = null;
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
  setQuality(name, autoStart) {
    this.autoQuality = !QUALITY[name];
    this.quality = QUALITY[name] || QUALITY[autoStart] || QUALITY.high;
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
    // The sky gradient is a canvas texture of its own; the painted sky is cached.
    const bg = this.scene.background;
    if (bg && bg.isTexture && bg.isCanvasTexture) bg.dispose();
    this.scene.traverse((o) => {
      if (o.isInstancedMesh) o.dispose();
      if (o.geometry && o.geometry !== BOX) o.geometry.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((mat) => { if (mat.map && !Object.values(texCache).includes(mat.map)) mat.map.dispose(); if (mat !== texCache.crateMat) mat.dispose(); });
    });
    this.scene.clear();
    this.sideActors = null;
    this.cargo = []; this.rope = null; this.truckModel = null; this.ghostModel = null; this.coinMesh = null; this.canMesh = null; this.weather = null;
  }

  // ─── Sky, light, ground and scenery for one region ──────────────
  setStage(terrain, regionIndex, seed, snowy = false, blizzard = false, light = null) {
    this.clear();
    const lit = light && LIGHTS[light] ? { ...THEMES[regionIndex], ...LIGHTS[light], light } : null;
    const baseTheme = lit || THEMES[regionIndex], scenery = SCENERY[baseTheme.id], q = this.quality;
    const theme = snowy && baseTheme.id === "bakery" ? { ...baseTheme, snowy:true, grass:THEMES[3].grass,
      far:THEMES[3].far, edge:"#d5e5f2", dust:"#eef4fb" } : baseTheme;
    this.theme = theme;
    this.renderer.toneMappingExposure = theme.exposure;
    this.scene.background = canvasTex(32, 512, (x, w, h) => {
      const g = x.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, theme.skyTop); g.addColorStop(0.5, theme.skyMid); g.addColorStop(0.82, theme.skyLow); g.addColorStop(1, theme.skyLow);
      x.fillStyle = g; x.fillRect(0, 0, w, h);
    });
    // The painted sky replaces the gradient once its image is in.
    const skyArt = theme.painted === false ? null : texture("art/sky_" + theme.id + ".webp");
    if (skyArt) whenReady(skyArt, () => { if (this.theme === theme) this.scene.background = skyArt; });
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
    // The painted ridge line tiles along the whole route and replaces the cones.
    const ridgeArt = texture("art/ridge_" + theme.id + ".webp");
    if (ridgeArt) whenReady(ridgeArt, () => {
      if (this.theme !== theme || !peaks.parent) return;
      const wide = x1 - x0 + 700, tall = 120;
      ridgeArt.wrapS = THREE.RepeatWrapping; ridgeArt.repeat.set(Math.round(wide / (tall * 4)), 1); ridgeArt.needsUpdate = true;
      const ridge = new THREE.Mesh(new THREE.PlaneGeometry(wide, tall), new THREE.MeshBasicMaterial({ map: ridgeArt, transparent: true, fog: false, depthWrite: false }));
      ridge.position.set((x0 + x1) / 2, tall / 2 - 24, -240);
      ridge.renderOrder = -1;
      this.scene.remove(peaks);
      this.scene.add(ridge);
    });

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
      const file = propFile(kind, theme.id);
      const mesh = new THREE.InstancedMesh(instanceGeometry(file) || propKit(kind, kitTheme), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }), list.length);
      list.forEach((t, i) => mesh.setMatrixAt(i, t));
      // Lanterns and lit windows are drawn unlit, so they shine at night.
      const lit = instanceGlow(file);
      if (lit) {
        const glowMesh = new THREE.InstancedMesh(lit, new THREE.MeshBasicMaterial({ vertexColors: true }), list.length);
        glowMesh.material.color.setScalar(theme.night ? 1.7 : 1);
        list.forEach((t, i) => glowMesh.setMatrixAt(i, t));
        glowMesh.frustumCulled = false;
        this.scene.add(glowMesh);
      }
      mesh.castShadow = shadows && q.shadows;
      mesh.receiveShadow = false;
      mesh.frustumCulled = false;
      this.scene.add(mesh);
    };
    const span = x1 - x0;
    // The menu keeps the ground around the parked truck clear, so no rock or
    // building sits in front of it or right behind its cab.
    const keep = this.keepClear, blocked = (x, z) => !!keep && x > keep.x0 && x < keep.x1 && z > keep.z;
    // Buildings stand on the lowest corner of their footprint, so none floats over
    // a slope, and a spot steeper than 0.35 is skipped.
    const BUILT = new Set(["big_tree", "house_b", "house_c", "igloo", "cottage", "hut", "townhouse", "stall", "barn", "silo", "cabin", "ski_lodge", "honey_shop", "lighthouse", "clock_tower", "windmill", "chilli_stall", "chilli_shrine", "crate_stack", "planter", "boat"]);
    const footing = (kind, x, z, s, sink) => {
      if (!BUILT.has(kind)) return surface(x, z) - sink;
      const f = (kind === "clock_tower" || kind === "lighthouse" || kind === "windmill" || kind === "barn" ? 2.4 : 1.6) * s;
      const ys = [surface(x - f, z - f), surface(x + f, z - f), surface(x - f, z + f), surface(x + f, z + f), surface(x, z)];
      const lo = Math.min(...ys), hi = Math.max(...ys);
      return hi - lo > 0.35 * 2 * f ? null : lo - 0.05;
    };
    scenery.fills.forEach(([kind, per100]) => {
      if (!usable(kind, theme.id)) return;
      const list = [], n = Math.round((span / 100) * per100 * q.density);
      for (let i = 0; i < n; i++) {
        const x = x0 + r() * span, z = -5.5 - Math.pow(r(), 1.5) * 66, s = 0.8 + r() * 0.8, turn = r() * 6.3, y = footing(kind, x, z, s, 0.08);
        if (y != null && !blocked(x, z)) list.push(m(x, y, z, 0, turn, 0, s));
      }
      place(kind, list, true);
    });
    scenery.front.forEach((kind) => {
      const list = [], n = Math.round((span / 100) * 5 * q.density);
      for (let i = 0; i < n; i++) {
        const x = x0 + r() * span, z = 4.2 + r() * 4.5, s = kind === "pine" ? 0.55 + r() * 0.3 : 0.4 + r() * 0.5, turn = r() * 6.3;
        // Front rocks sit between the camera and the road, so they stay small.
        if (!blocked(x, z)) list.push(m(x, surface(x, z) - 0.05, z, 0, turn, 0, kind === "rock" ? s * 0.6 : s));
      }
      place(kind, list, true);
    });
    let landmarks = scenery.landmarks.filter((kind) => usable(kind, theme.id));
    if (!landmarks.length && scenery.fallbackLandmarks) landmarks = scenery.fallbackLandmarks;
    landmarks.forEach((kind, nth, all) => {
      const list = [];
      for (let x = 34 + r() * 30 + nth * 45; x < terrain.total + 30; x += (60 + r() * 50) * all.length) {
        const z = -13 - r() * 14, turn = (r() - 0.5) * 0.7, s = 1 + r() * 0.3, y = footing(kind, x, z, s, 0.2);
        if (y != null && !blocked(x, z)) list.push(m(x, y, z, 0, turn, 0, s));
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
    this.buildWeather(theme, blizzard);
  }

  // ─── Pooled effects ─────────────────────────────────────────────
  buildParticles(theme) {
    const n = this.quality.particles;
    // Soft round puffs facing the camera: smoke, dust and sparkles, all one draw call.
    const soft = texCache.soft || (texCache.soft = canvasTex(64, 64, (x, w, h) => {
      const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.45, "rgba(255,255,255,.75)"); g.addColorStop(1, "rgba(255,255,255,0)");
      x.fillStyle = g; x.fillRect(0, 0, w, h);
    }));
    const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshLambertMaterial({ map: soft, transparent: true, depthWrite: false }), n);
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
      fx.dummy.rotation.set(0, 0, p.life * 2);
      fx.dummy.scale.setScalar(p.s * (0.35 + (p.g ? t : Math.sin(t * Math.PI)) * 0.8));
      fx.dummy.updateMatrix();
      fx.mesh.setMatrixAt(i, fx.dummy.matrix);
    });
    fx.mesh.instanceMatrix.needsUpdate = true;
  }
  buildWeather(theme, blizzard) {
    const snow = theme.id === "frost" || theme.id === "northpole" || theme.snowy;
    if (!snow && theme.id !== "chilli" && theme.id !== "market") return;
    const n = (this.quality.level === 0 ? 120 : 340) * (blizzard ? 1.5 : 1), p = new Float32Array(n * 3);
    for (let i = 0; i < n * 3; i += 3) { p[i] = Math.random() * 70 - 35; p[i + 1] = Math.random() * 34; p[i + 2] = Math.random() * 34 - 18; }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: snow ? "#ffffff" : theme.id === "market" ? "#ffe9a8" : "#ffb45a", size: snow ? 0.17 : 0.13, transparent: true, opacity: 0.9, fog: false }));
    pts.frustumCulled = false;
    this.scene.add(pts);
    this.weather = { pts, dir: snow ? -1 : 1, speed: snow ? 3.2 : 2 };
  }

  // ─── Route items ────────────────────────────────────────────────
  buildRoute(game) {
    if (this.upReady) this.stepUp();
    this.lastBuild = { game };
    const t = game.terrain;
    this.setStage(t, game.regionIndex, game.delivery.id, game.delivery.snowy || game.delivery.winter, game.delivery.twist === "blizzard", game.delivery.light);
    const scene = this.scene, q = this.quality, theme = this.theme;

    // Your own truck gets the detailed model on High graphics, the lighter one on
    // Medium and Low (Auto steps down on its own when the frame rate drops). Ghosts
    // always use the lighter one.
    const model = buildTruck(game.spec, game.rail, q, this.look, q.level < 2);
    scene.add(model.root); model.wheels.forEach((w) => scene.add(w));
    this.truckModel = model;
    this.buildGhost(q);
    this.cargo = game.cargo.map((c) => { const g = buildCargo(c.type, q, c.id); scene.add(g); return { info: c, group: g, age: 0, wob: 0 }; });

    // Coins
    const coin = new Kit();
    coin.add(cyl(0.34, 0.34, 0.08, 18), "#f6bb35", m(0, 0, 0, Math.PI / 2));
    coin.add(cyl(0.24, 0.24, 0.1, 18), "#ffd86a", m(0, 0, 0, Math.PI / 2));
    coin.add(box(0.07, 0.24, 0.12), "#e29a1e", m(0, 0, 0));
    this.coinMesh = new THREE.InstancedMesh(instanceGeometry("road/coin") || coin.build(), new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.35, roughness: 0.3, emissive: "#c98a10", emissiveIntensity: 0.75 }), Math.max(1, game.coins.length));
    this.coinMesh.frustumCulled = false;
    game.coins.forEach((c) => { c.drawn = c.hidden = false; });
    this.coinMesh.castShadow = q.shadows;
    scene.add(this.coinMesh);

    // Fuel cans
    const can = new Kit();
    can.add(roundedSlab(0.6, 0.8, 0.42, 0.08), "#e0402e");
    can.add(box(0.28, 0.08, 0.1), "#2a2a2e", m(-0.05, 0.47, 0));
    can.add(cyl(0.06, 0.08, 0.24, 8), "#f2c04a", m(0.2, 0.5, 0, 0, 0, -0.5));
    can.add(box(0.32, 0.32, 0.45), "#f6efe0", m(0, 0, 0));
    this.canMesh = new THREE.InstancedMesh(instanceGeometry("road/fuel_can") || can.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0.2, emissive: "#3a0c04", emissiveIntensity: 0.6 }), Math.max(1, game.cans.length));
    this.canMesh.frustumCulled = false;
    this.canMesh.castShadow = q.shadows;
    scene.add(this.canMesh);

    // Road hazards: a physics bump is drawn as a log across the road.
    const logList = game.rocks.filter((rock) => rock.kind !== "bump");
    if (logList.length) {
      const logGeo = instanceGeometry("road/log") || propKit("log", SCENERY[theme.id]);
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
    const place = (name, x, y, z, turn = 0) => {
      const o = authoredModel(name);
      if (!o) return false;
      o.position.set(x, y, z);
      o.rotation.y = turn;
      o.traverse((c) => { if (c.isMesh) c.castShadow = q.shadows; });
      scene.add(o);
      return true;
    };
    if (!place("road/depot", t.total + 4.5, zy, 0)) {
      depot.add(box(12, 6.4, 10), "#efe2c6", m(dx, zy + 3.2, 0));
      depot.add(box(12.6, 0.5, 10.6), "#b5482f", m(dx, zy + 6.6, 0));
      depot.add(box(0.9, 5.4, 7), "#463225", m(dx - 6, zy + 2.7, 0));
      for (let i = 0; i < 8; i++) depot.add(box(1.9, 0.18, 1.2), i % 2 ? "#e0483c" : "#fff6e6", m(dx - 7.1, zy + 4.8 + 0, -4.2 + i * 1.2, 0, 0, 0.5));
    }
    // The candy-cane arch is modelled across X, so it turns to span the road.
    const caneArch = theme.id === "northpole" && place("winter/cane_arch", t.zoneStart, zy, 0, Math.PI / 2);
    if (!caneArch && !place("road/zone_gate", t.zoneStart, zy, 0)) {
      depot.add(box(0.26, 11, 0.26), "#d8d2c6", m(t.zoneStart, zy + 5.5, -3.2));
      depot.add(box(0.26, 11, 0.26), "#d8d2c6", m(t.zoneStart, zy + 5.5, 3.2));
      depot.add(box(0.5, 1, 6.6), "#e0483c", m(t.zoneStart, zy + 10.6, 0));
    }
    const startY = SH.heightAt(t, 5);
    if (theme.id === "northpole") {
      if (!place("winter/workshop", 5, startY, -7.2)) {
        const workshop = winterBuilding(true, q.shadows);
        workshop.position.set(5,startY,-7.2); scene.add(workshop);
      }
    } else place("road/start_shop", 3, SH.heightAt(t, 3), -7.2);
    if (depot.pos.length) this.scene.add(new THREE.Mesh(depot.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75 })));
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.1), new THREE.MeshBasicMaterial({ map: canvasTex(512, 96, (x, w, h) => {
      x.fillStyle = "#e0483c"; x.fillRect(0, 0, w, h);
      x.fillStyle = "#fff"; x.font = "800 62px sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("UNLOAD HERE", w / 2, h / 2 + 4);
    }) }));
    sign.position.set(t.zoneStart, zy + 10.6, 3.3);
    scene.add(sign);
    this.buildSpots(game);

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
    // An authored model standing beside the road. False when it has not been delivered.
    const stand = (name, x, z) => {
      const o = model(name);
      if (!o) return false;
      o.position.set(x, SH.heightAt(t, x), z);
      o.traverse((c) => { if (c.isMesh) c.castShadow = this.quality.shadows; });
      this.scene.add(o);
      return true;
    };
    // Authored pieces repeated along the road share one draw call each.
    const planks = [], posts = [], humps = [];
    const plankGeo = instanceGeometry("road/bridge_plank"), postGeo = instanceGeometry("road/bridge_post"), humpGeo = instanceGeometry("road/speed_bump");
    (t.features || []).forEach((f) => {
      if (f.type === "dropoff") {
        const z = -4.75, y = SH.heightAt(t,f.x);
        // Porches take turns between the three cottages; each sits with its
        // front step at the road's edge, whatever its depth.
        const homes = ["winter/house_a", "winter/house_b", "winter/house_c"].filter((h) => hasModel(h));
        const home = homes.length ? model(homes[Math.round(f.x) % homes.length]) : null;
        if (home) {
          const box3 = new THREE.Box3().setFromObject(home);
          home.position.set(f.x, y, -2.4 - box3.max.z);
          home.traverse((c) => { if (c.isMesh) c.castShadow = this.quality.shadows; });
          this.scene.add(home);
          // A short candy fence either side of the garden (a road-long fence cost 30k triangles).
          [-1, 1].forEach((side) => {
            const x = f.x + side * (box3.max.x + 1.9), span = model("winter/fence_candy");
            if (!span) return;
            span.position.set(x, SH.heightAt(t, x), -3.3);
            this.scene.add(span);
          });
        } else {
          const house = winterBuilding(false,this.quality.shadows);
          house.position.set(f.x,y,z); this.scene.add(house);
        }
        strip(glow, f.x0, f.x1, "#74d5a5", .045, 4.5);
        kit.add(roundedSlab(1.72,.055,3.55,.02),"#815444",m(f.x,y+.06,0));
        kit.add(box(.12,.065,3.9),"#ffc857",m(f.x,y+.08,0));
      } else if (f.type === "drift") {
        const x = (f.x0+f.x1)/2;
        if (!stand("winter/drift",x,0)) kit.add(blob(1,2),"#eef4fb",m(x,SH.heightAt(t,x)-.16,0,0,0,0,3.8,.37,2.2));
      } else if (f.type === "slick") {
        strip(glow, f.x0, f.x1, this.theme.night ? "#7fd0ff" : "#c8f0ff", 0.035, 4.7);
        [f.x0, f.x1].forEach((x) => { if (!stand("road/ice_marker", x, -3.0)) { post(x, 2.2, "#2f7fd0", -3.0); kit.add(blob(0.3, 0), "#9fe0ff", m(x, SH.heightAt(t, x) + 2.4, -3.0)); } });
      } else if (f.type === "ford") {
        strip(glow, f.x0, f.x1, "#3fb6d8", 0.3, 9);
      } else if (f.type === "bridge") {
        if (plankGeo) for (let x = f.x0; x < f.x1 - 0.1; x += 1.5) { const ya = SH.heightAt(t, x), yb = SH.heightAt(t, x + 1.5); planks.push(m(x + 0.75, (ya + yb) / 2 - 0.08, 0, 0, 0, Math.atan2(yb - ya, 1.5), 1, 1, 1.68)); }
        else for (let x = f.x0; x < f.x1; x += 0.75) kit.add(box(0.66, 0.1, 5), Math.round(x / 0.75) % 2 ? "#a9773f" : "#8f6233", m(x + 0.375, SH.heightAt(t, x + 0.375) + 0.03, 0, 0, 0, 0));
        [f.x0, f.x1].forEach((x) => [-2.6, 2.6].forEach((z) => { if (postGeo) posts.push(m(x, SH.heightAt(t, x), z)); else post(x, 2.4, "#6d4a2c", z); }));
          } else if (f.type === "wind") {
        [f.x0, f.x1].forEach((x) => { if (stand("road/wind_sock", x, -3.2)) return; post(x, 4, "#f2f2ee", -3.2); for (let i = 0; i < 4; i++) kit.add(box(0.45, 0.42 - i * 0.07, 0.42 - i * 0.07), i % 2 ? "#ffffff" : "#ff7a2f", m(x - 0.3 - i * 0.45, SH.heightAt(t, x) + 3.8 - i * 0.06, -3.2)); });
      } else if (f.type === "ramp") {
        for (let i = 0; i < 3; i++) kit.add(box(0.5, 0.06, 4.4), i % 2 ? "#2a2a2e" : "#ffcf3a", m(f.x0 + 1.5 + i * 1.3, SH.heightAt(t, f.x0 + 1.5 + i * 1.3) + 0.04, 0, 0, 0, 0.12 + i * 0.1));
      } else if (f.type === "pickup") {
        strip(glow, f.x0, f.x1, "#6fe08f", 0.04, 4.7);
        const cx = (f.x0 + f.x1) / 2, y = SH.heightAt(t, cx);
        if (game.bonusOn) this.stopSign(game.delivery, cx, y);
        // A region's own stall when Codex has made it, else the shared stand, else code-built.
        if (game.bonusOn && stand("road/stall_" + SH.stopKey(game.delivery), cx, -5.8)) return;
        if (stand("road/pickup_stand", cx, -5.8)) return;
        kit.add(box(6, 3.2, 3), "#efe2c6", m(cx, y + 1.6, -6.5));
        kit.add(box(6.6, 0.4, 3.6), "#3f9a5a", m(cx, y + 3.4, -6.5));
        kit.add(box(0.3, 5.5, 0.3), "#d8d2c6", m(cx, y + 2.75, -3.4));
        kit.add(box(0.3, 0.3, 4.2), "#d8d2c6", m(cx, y + 5.5, -1.4));
        [-1, 0, 1].forEach((i) => kit.add(box(0.6, 0.6, 0.6), "#eab765", m(cx + i * 0.9, y + 0.3, -4.4)));
      }
    });
    game.rocks.filter((rock) => rock.kind === "bump").forEach((rock, i) => {
      if (humpGeo) humps.push(m(rock.x, SH.heightAt(t, rock.x), 0, 0, 0, 0, 1, 1.12, 1.6));
      else kit.add(cyl(rock.r, rock.r, 4.7, 8), i % 2 ? "#2a2a2e" : "#ffcf3a", m(rock.x, rock.y, 0, Math.PI / 2));
    });
    [[plankGeo, planks], [postGeo, posts], [humpGeo, humps]].forEach(([geo, list]) => {
      if (!geo || !list.length) return;
      const mesh = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }), list.length);
      list.forEach((matrix, i) => mesh.setMatrixAt(i, matrix));
      mesh.castShadow = this.quality.shadows; mesh.frustumCulled = false;
      this.scene.add(mesh);
    });
    // Long Haul: a flag every 100 metres.
    if (game.delivery.long) for (let x = 108; x < t.zoneStart; x += 100) stand("road/checkpoint_flag", x, -3.3);
    this.buildSideActors(game, kit, post);
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

  // ─── Back Roads features: ducks, hay bales and the seesaw ───────
  // Code-built stand-ins until authored models arrive (Codex brief, Back Roads).
  // Bales and planks follow their physics bodies; ducks follow SH.duckState.
  buildSideActors(game, kit, post) {
    const t = game.terrain, actors = { ducks: [], bales: [], planks: [], sails: [] }, shadows = this.quality.shadows;
    const solid = (geo) => { const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 })); mesh.castShadow = shadows; this.scene.add(mesh); return mesh; };
    (game.crossings || []).filter((f) => f.type === "sails").forEach((f) => {
      // A windmill behind the road whose sails sweep down over it: a blade points
      // straight down in the middle of each closed spell of the gate's clock.
      const cx = (f.x0 + f.x1) / 2, y = SH.heightAt(t, cx), tower = new Kit();
      // The tower stands well back and slim, so it frames the road rather than hiding it.
      tower.add(cyl(1.1, 1.7, 7.5, 8), "#efe3cc", m(cx, y + 3.75, -9));
      tower.add(new THREE.ConeGeometry(1.45, 1.8, 8), "#a8553a", m(cx, y + 8.4, -9));
      tower.add(box(0.3, 0.3, 7.6), "#6b4a2c", m(cx, y + 5.6, -5.3));
      kit.add(box(0.8, 1.3, 0.1), "#7a4a2c", m(cx, y + 0.65, -8));
      this.scene.add(solid(tower.build()));
      const hub = new THREE.Group(), blades = new Kit();
      for (let k = 0; k < 4; k++) {
        const a = k * Math.PI / 2, c = Math.cos(a), sn = Math.sin(a);
        blades.add(box(0.18, 5.2, 0.1), "#6b4a2c", m(c * 0 - sn * 2.6, c * 2.6, 0, 0, 0, a));
        blades.add(box(1.1, 4.2, 0.05), k % 2 ? "#f4efe4" : "#e9dcc4", m(-sn * 3.0 + c * 0.6, c * 3.0 + sn * 0.6, 0.04, 0, 0, a));
      }
      blades.add(blob(0.4, 1), "#6b4a2c");
      hub.add(solid(blades.build()));
      hub.position.set(cx, y + 5.6, -1.5);
      this.scene.add(hub);
      actors.sails.push({ f, hub });
    });
    (game.crossings || []).filter((f) => f.type !== "sails").forEach((f) => {
      // A yellow diamond sign on each side, and a mother duck with five ducklings.
      [f.x0 - 3.5, f.x1 + 3.5].forEach((x) => { post(x, 1.6, "#e8e0cc", -3.1); kit.add(box(0.62, 0.62, 0.06), "#f4c430", m(x, SH.heightAt(t, x) + 1.85, -3.06, 0, 0, Math.PI / 4)); });
      const y = SH.heightAt(t, (f.x0 + f.x1) / 2), list = [];
      for (let k = 0; k < 6; k++) {
        const big = k === 0, d = new Kit(), s = big ? 1 : 0.6;
        d.add(blob(0.32 * s, 1), big ? "#f4f1ea" : "#ffd84a", m(0, 0.3 * s, 0, 0, 0, 0, 1.25, 0.95, 0.9));
        d.add(blob(0.2 * s, 1), big ? "#f4f1ea" : "#ffd84a", m(0, 0.62 * s, 0.22 * s));
        d.add(box(0.12 * s, 0.07 * s, 0.18 * s), "#f08a24", m(0, 0.6 * s, 0.44 * s));
        d.add(blob(0.04 * s, 0), "#1c1a1a", m(0.11 * s, 0.68 * s, 0.33 * s));
        d.add(blob(0.04 * s, 0), "#1c1a1a", m(-0.11 * s, 0.68 * s, 0.33 * s));
        const mesh = solid(d.build());
        list.push({ mesh, k, dx: (f.x1 - f.x0) * (0.15 + 0.14 * k) + f.x0, y });
      }
      actors.ducks.push({ f, list });
    });
    (game.hay || []).forEach((body) => {
      const h = new Kit();
      h.add(box(1.16, 0.64, 1.3), "#e3c25a");
      h.add(box(1.18, 0.05, 1.32), "#b8923a", m(0, 0.12, 0)); h.add(box(1.18, 0.05, 1.32), "#b8923a", m(0, -0.12, 0));
      actors.bales.push({ body, mesh: solid(h.build()) });
    });
    (game.seesaws || []).forEach((body) => {
      const f = body.getUserData().seesaw, half = SH.SEESAW.half, p = new Kit();
      for (let i = 0; i < 9; i++) p.add(box(half * 2 / 9 - 0.04, SH.SEESAW.thick * 2, 3.4), i % 2 ? "#a87a4c" : "#b98a58", m(-half + (i + 0.5) * half * 2 / 9, 0, 0));
      p.add(box(half * 2, 0.08, 0.12), "#6b4a2c", m(0, SH.SEESAW.thick + 0.03, 1.62)); p.add(box(half * 2, 0.08, 0.12), "#6b4a2c", m(0, SH.SEESAW.thick + 0.03, -1.62));
      actors.planks.push({ body, mesh: solid(p.build()) });
      // The mill stream under it, and the hinge posts either side of the road.
      const water = new THREE.Mesh(new THREE.PlaneGeometry(half * 2 + 0.6, 9), new THREE.MeshStandardMaterial({ color: this.theme.night ? "#2d5f8a" : "#4fa6d8", roughness: 0.25, metalness: 0.1, transparent: true, opacity: 0.85 }));
      water.rotation.x = -Math.PI / 2; water.position.set(f.xc, f.level - 1.15, 0); this.scene.add(water);
      const py = body.getPosition().y;
      [-1.9, 1.9].forEach((z) => kit.add(box(0.3, py - (f.level - 1.6) + 0.2, 0.3), "#6b4a2c", m(f.xc, (py + f.level - 1.6) / 2, z)));
    });
    this.sideActors = actors;
  }
  syncSideActors(game) {
    const a = this.sideActors;
    if (!a) return;
    a.bales.forEach((b) => {
      b.mesh.visible = b.body.isActive();
      if (!b.mesh.visible) return;
      const p = this.pose(b.body);
      b.mesh.position.set(p.x, p.y, 0); b.mesh.rotation.z = p.a;
    });
    a.planks.forEach((b) => { const p = this.pose(b.body); b.mesh.position.set(p.x, p.y, 0); b.mesh.rotation.z = p.a; });
    a.sails.forEach(({ f, hub }) => {
      // Blade 0 hangs straight down at the middle of each closed spell.
      const turns = ((game.clock || 0) + (f.phase || 0)) / f.period - f.cross / (2 * f.period);
      hub.rotation.z = Math.PI - turns * Math.PI / 2;
    });
    a.ducks.forEach(({ f, list }) => {
      const st = SH.duckState(f, game.clock || 0), wob = Math.sin(this.time * 14);
      list.forEach((d) => {
        // Waiting on the far verge, crossing towards the camera, then gone into the grass.
        const lag = d.k * 0.08, u = st.active ? Math.max(0, Math.min(1, (st.u - lag) / (1 - 0.5))) : 0;
        const z = st.active ? -3.6 + u * 7.6 : st.warn ? -3.9 : -6.5;
        d.mesh.visible = st.active || st.warn;
        d.mesh.position.set(d.dx, d.y + (st.active ? Math.abs(wob) * 0.05 : 0), z);
        d.mesh.rotation.set(0, st.active ? 0 : Math.PI / 2, wob * 0.12);
      });
    });
  }

  // ─── Menu showcase: the truck parked in its region ──────────────
  showcase(truckId, regionIndex, rail) {
    this.lastBuild = { truck: truckId, region: regionIndex, rail };
    const id = "show-" + regionIndex;
    const key = id + truckId + rail + this.quality.name + JSON.stringify(this.look) + JSON.stringify(this.depot || null) + (this.assetStamp || "");
    if (this.showKey === key && this.showcasing) return;
    this.showKey = key;
    const d = { id, region: regionIndex, index: 0, len: 60, heat: 0.2, load: [] };
    const pts = [];
    for (let x = 0; x <= 110; x += SH.SAMPLE) pts.push({ x, y: Math.sin(x * 0.04) * 0.5 * Math.min(1, x / 30) });
    this.keepClear = { x0: 38, x1: 64, z: -11 };
    this.setStage({ pts, total: 110 }, regionIndex, id, this.depot && this.depot.winter);
    this.keepClear = null;
    const spec = SH.truckSpec(truckId), model = buildTruck(spec, rail, this.quality, this.look), D = SH.dimsFor(spec);
    const ground = SH.heightAt({ pts }, 50);
    const y = ground + spec.wheelR - D.axleY;
    model.root.position.set(50, y, 0);
    this.scene.add(model.root);
    if (this.depot) this.buildYard(this.depot, (x) => SH.heightAt({ pts }, x));
    model.wheels.forEach((w, i) => { w.position.set(50 + (i ? D.frontX : D.rearX), y + D.axleY, 0); this.scene.add(w); });
    const kinds = SH.regionFor(regionIndex).kinds || ["cake", "popcorn"];
    const load = regionIndex === SH.EVENTS[0].region ? ["present","present","present","sack"] : ["crate", kinds[0], "crate", kinds[1]];
    const stacked = spec.perRow;
    load.forEach((type, i) => {
      const g = buildCargo(type, this.quality,i);
      g.position.set(50 + D.bedRight - D.crate * ((i % stacked) + 0.55), y + D.bedHeight + SH.cargoSize(type).h / 2 + (i >= stacked ? D.crate : 0) + 0.01, 0);
      this.scene.add(g);
    });
    this.truckModel = model;
    this.showcasing = true;
    this.showPos = new THREE.Vector3(50, y, 0);
    d.load = null;
  }
  // ─── The player's depot, behind the parked truck on the home screen ─
  // Stage 1 to 5 grows with depot parts from Special Orders; extras are bought
  // with coins. All code-built for now; Codex models can replace them later.
  buildYard(depot, groundAt) {
    const kit = new Kit(), glow = new Kit(), stage = depot.stage || 1, has = new Set(depot.extras || []);
    const at = (x, z, fn) => fn(x, groundAt(x), z);
    // 1: a shed
    at(43, -9, (x, y, z) => {
      kit.add(box(5, 3, 4), "#c9a77a", m(x, y + 1.5, z)).add(box(5.6, 0.3, 4.6), "#7a4a2e", m(x, y + 3.15, z, 0.18));
      kit.add(box(1.4, 2.2, 0.1), "#5a3a26", m(x + 0.8, y + 1.1, z + 2.02));
    });
    if (stage >= 2) {
      at(55.5, -5.5, (x, y, z) => {
        kit.add(box(0.9, 1.8, 0.7), "#d8452e", m(x, y + 0.9, z)).add(box(0.7, 0.5, 0.1), "#f2ead8", m(x, y + 1.35, z + 0.36));
        kit.add(cyl(0.05, 0.05, 1.2, 6), "#222", m(x + 0.5, y + 0.9, z, 0, 0, 0.5));
      });
      at(47.5, -5, (x, y, z) => {
        kit.add(box(0.16, 3.2, 0.16), "#5a3a26", m(x - 1.3, y + 1.6, z)).add(box(0.16, 3.2, 0.16), "#5a3a26", m(x + 1.3, y + 1.6, z));
        kit.add(box(3.2, 0.9, 0.12), "#f4c21f", m(x, y + 2.9, z)).add(box(2.8, 0.25, 0.14), "#d8452e", m(x, y + 2.9, z));
      });
    }
    if (stage >= 3) at(36, -11, (x, y, z) => {
      kit.add(box(7, 4.2, 5), "#e9dcc0", m(x, y + 2.1, z)).add(box(7.4, 0.4, 5.4), "#3c5a7a", m(x, y + 4.4, z));
      kit.add(box(3.4, 3, 0.1), "#4a4a52", m(x, y + 1.5, z + 2.52));
    });
    if (stage >= 4) at(62, -9, (x, y, z) => {
      kit.add(box(0.4, 7, 0.4), "#f2b42c", m(x, y + 3.5, z)).add(box(6, 0.4, 0.4), "#f2b42c", m(x - 2.2, y + 7, z));
      kit.add(box(0.8, 0.8, 0.8), "#2a2a2e", m(x + 0.4, y + 7.3, z)).add(cyl(0.03, 0.03, 3, 4), "#333", m(x - 4.6, y + 5.5, z));
      kit.add(box(1, 1, 1), "#c8955a", m(x - 4.6, y + 3.6, z));
    });
    if (stage >= 5) {
      at(43, -9, (x, y, z) => { glow.add(box(4.2, 0.7, 0.12), "#ff4fa3", m(x, y + 3.9, z + 2.1)); glow.add(box(4.6, 0.12, 0.14), "#ffd23f", m(x, y + 4.35, z + 2.1)); });
      [[57.5, -2.8], [60, -3.4]].forEach(([tx, tz]) => at(tx, tz, (x, y, z) => {
        kit.add(cyl(0.5, 0.5, 0.08, 12), "#fff6e6", m(x, y + 0.75, z)).add(cyl(0.05, 0.05, 0.75, 6), "#444", m(x, y + 0.37, z));
        kit.add(cyl(0.03, 0.03, 2, 4), "#ddd", m(x, y + 1.2, z)).add(cyl(0.02, 1.1, 0.5, 8), "#d8452e", m(x, y + 2.2, z));
      }));
    }
    if (depot.winter) {
      at(43,-9,(x,y,z) => kit.add(roundedSlab(5.76,.27,4.73,.12),"#eef4fb",m(x,y+3.34,z,.18)));
      const winter = new Set(depot.decor || []);
      const decoration = (id,x,z,fallback) => at(x,z,(px,y,pz) => {
        const authored = model("winter/depot_" + id);
        if (authored) { authored.position.set(px,y,pz); this.scene.add(authored); }
        else fallback(px,y,pz);
      });
      if (winter.has("tree")) decoration("tree",55,-7,(x,y,z) => {
        for (let i=0;i<3;i++) kit.add(cyl(.05,1.26-i*.24,1.75,10),i%2?"#3c8264":"#2e7d4f",m(x,y+1.12+i*.79,z));
        glow.add(blob(.20,1),"#f2c14e",m(x,y+3.65,z));
        for (let i=0;i<6;i++) glow.add(blob(.1,1),i%2?"#f2c14e":"#db413b",m(x+Math.cos(i)*.72,y+1.42+i*.20,z+.56));
      });
      if (winter.has("lights")) decoration("lights",43,-6.65,(x,y,z) => {
        for (let i=0;i<11;i++) glow.add(blob(.095,1),["#ffc857","#91ccea","#e66a58"][i%3],m(x-2.6+i*.52,y+3.05-Math.sin(i*Math.PI/10)*.20,z));
      });
      if (winter.has("wreath")) decoration("wreath",43.8,-6.84,(x,y,z) => {
        kit.add(new THREE.TorusGeometry(.39,.105,6,14),"#2e7d4f",m(x,y+2.06,z));
        kit.add(blob(.12,1),"#d6342c",m(x,y+1.69,z+.08,0,0,0,1.5,.75,.58));
      });
      if (winter.has("snowman")) decoration("snowman",48,-5,(x,y,z) => {
        kit.add(blob(.56,2),"#eef4fb",m(x,y+.55,z)).add(blob(.37,2),"#eef4fb",m(x,y+1.26,z));
        kit.add(cyl(.35,.36,.10,12),"#d6342c",m(x,y+1,z));
      });
    }
    // Extras bought with coins.
    const extra = {
      bunting: () => { for (let i = 0; i < 9; i++) at(40.5 + i * 0.6, -6.9, (x, y, z) => kit.add(box(0.35, 0.4, 0.03), ["#d8452e", "#f4c21f", "#5fa8d3"][i % 3], m(x, y + 3.2 - Math.sin(i / 8 * Math.PI) * 0.4, z, 0, 0, Math.PI / 4))); },
      lights: () => { for (let i = 0; i < 10; i++) at(39 + i * 0.9, -6.8, (x, y, z) => glow.add(blob(0.09, 0), "#ffe08a", m(x, y + 3.6 - Math.sin(i / 9 * Math.PI) * 0.5, z))); },
      flowers: () => at(41, -6.9, (x, y, z) => { kit.add(box(2.4, 0.4, 0.5), "#7a4a2e", m(x, y + 0.2, z)); for (let i = 0; i < 6; i++) kit.add(blob(0.18, 0), ["#f07a5a", "#f4c21f", "#d14a6f"][i % 3], m(x - 1 + i * 0.4, y + 0.5, z)); }),
      bench: () => at(52, -6.5, (x, y, z) => kit.add(box(1.8, 0.1, 0.5), "#8a5a36", m(x, y + 0.5, z)).add(box(1.8, 0.5, 0.08), "#8a5a36", m(x, y + 0.8, z - 0.24)).add(box(0.1, 0.5, 0.4), "#333", m(x - 0.8, y + 0.25, z)).add(box(0.1, 0.5, 0.4), "#333", m(x + 0.8, y + 0.25, z))),
      barrels: () => [0, 0.75, 0.38].forEach((dx, i) => at(59 + dx, -6.5 - (i === 2 ? 0.6 : 0), (x, y, z) => kit.add(cyl(0.35, 0.35, 0.9, 10), "#9a5a2e", m(x, y + 0.45, z)))),
      hay: () => [0, 1.3].forEach((dx) => at(33 + dx, -6, (x, y, z) => kit.add(cyl(0.6, 0.6, 1.1, 12), "#e2c46a", m(x, y + 0.6, z, Math.PI / 2)))),
      lamp: () => [45.5, 53.5].forEach((lx) => at(lx, -4.6, (x, y, z) => { kit.add(cyl(0.06, 0.08, 3.2, 6), "#2a2a2e", m(x, y + 1.6, z)); glow.add(blob(0.22, 1), "#ffe8a8", m(x, y + 3.3, z)); })),
      windsock: () => at(66, -6, (x, y, z) => { kit.add(cyl(0.05, 0.05, 4, 6), "#ddd", m(x, y + 2, z)); kit.add(cyl(0.25, 0.12, 1.2, 8), "#f07a2a", m(x - 0.6, y + 3.8, z, 0, 0, Math.PI / 2)); }),
      tower: () => at(30, -13, (x, y, z) => { [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => kit.add(box(0.2, 6, 0.2), "#7a5a3e", m(x + sx, y + 3, z + sz)))); kit.add(cyl(1.5, 1.5, 2.2, 14), "#9ab8c8", m(x, y + 7.1, z)).add(cyl(0.1, 1.7, 0.8, 14), "#6a4a3a", m(x, y + 8.6, z)); }),
      picnic: () => at(64, -3.6, (x, y, z) => kit.add(box(2, 0.1, 0.9), "#b07a4a", m(x, y + 0.75, z)).add(box(2, 0.08, 0.3), "#b07a4a", m(x, y + 0.45, z - 0.7)).add(box(2, 0.08, 0.3), "#b07a4a", m(x, y + 0.45, z + 0.7)).add(box(0.1, 0.75, 1.6), "#7a4a2e", m(x - 0.8, y + 0.37, z)).add(box(0.1, 0.75, 1.6), "#7a4a2e", m(x + 0.8, y + 0.37, z))),
      fountain: () => at(50, -12, (x, y, z) => { kit.add(cyl(1.6, 1.8, 0.6, 16), "#cfc6b6", m(x, y + 0.3, z)).add(cyl(1.35, 1.35, 0.1, 16), "#5fb8e0", m(x, y + 0.58, z)).add(cyl(0.2, 0.3, 1.4, 8), "#cfc6b6", m(x, y + 1.1, z)); }),
      statue: () => at(50, -8.5, (x, y, z) => { kit.add(box(1.4, 1, 1.4), "#cfc6b6", m(x, y + 0.5, z)); kit.add(blob(0.9, 1), "#e0a43a", m(x, y + 1.9, z, 0, 0, 0, 1.4, 0.8, 0.8)); })
    };
    Object.keys(extra).forEach((k) => { if (has.has(k)) extra[k](); });
    if (kit.pos.length) { const mesh = new THREE.Mesh(kit.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 })); mesh.castShadow = this.quality.shadows; mesh.receiveShadow = true; this.scene.add(mesh); }
    if (glow.pos.length) this.scene.add(new THREE.Mesh(glow.build(), new THREE.MeshBasicMaterial({ vertexColors: true })));
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
  // The ghost is a see-through copy of the truck, a little further from the
  // camera, driven by a second physics run that app.js steps alongside.
  buildGhost(q) {
    this.ghostModel = null;
    const gg = this.ghostGame;
    if (!gg) return;
    // Dash Dalloway, the rival, drives an orange-tinted pickup with no driver styling of yours.
    const rival = this.ghostKind === "rival";
    const gm = buildTruck(gg.spec, gg.rail, q, rival ? {} : this.look, true);
    const ghostify = (o) => o.traverse((c) => {
      if (c.isLight) c.visible = false;
      if (!c.isMesh) return;
      c.castShadow = false; c.receiveShadow = false;
      const list = (Array.isArray(c.material) ? c.material : [c.material]).map((mat) => {
        const k = mat.clone(); k.transparent = true; k.opacity = rival ? 0.38 : 0.3; k.depthWrite = false;
        if (rival) { k.color = new THREE.Color("#ff8a2a"); if (k.emissive) k.emissive = new THREE.Color("#5a2200"); }
        return k;
      });
      c.material = Array.isArray(c.material) ? list : list[0];
    });
    [gm.root, ...gm.wheels].forEach((o) => { ghostify(o); this.scene.add(o); });
    // A name tag over the ghost: "Your best 41.2s", or the rival's name.
    if (this.ghostLabel) {
      const text = this.ghostLabel;
      const map = canvasTex(512, 112, (x, w, h) => {
        x.clearRect(0, 0, w, h);
        x.font = "800 52px sans-serif";
        const tw = Math.min(w - 8, x.measureText(text).width + 56);
        x.fillStyle = rival ? "#ff8a2ae0" : "#fff8ebd8";
        x.beginPath(); x.roundRect((w - tw) / 2, 10, tw, h - 20, (h - 20) / 2); x.fill();
        x.fillStyle = rival ? "#fff" : "#2d1b0c"; x.textAlign = "center"; x.textBaseline = "middle";
        x.fillText(text, w / 2, h / 2 + 2, w - 40);
      });
      const tag = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, depthTest: false, depthWrite: false }));
      tag.scale.set(3.4, 0.74, 1);
      tag.renderOrder = 20;
      this.scene.add(tag);
      gm.tag = tag;
    }
    this.ghostModel = gm;
  }

  // Where a body is drawn: between its last two physics steps, by alpha, so motion
  // is even on 90 and 120 Hz screens. Bodies app.js has not snapped draw as they are.
  pose(b) {
    const p = b.getPosition(), a = b.getAngle(), t = this.alpha == null ? 1 : this.alpha;
    if (b.px == null || t >= 1) return { x: p.x, y: p.y, a };
    let da = a - b.pa;
    if (da > Math.PI) da -= Math.PI * 2; else if (da < -Math.PI) da += Math.PI * 2;
    return { x: b.px + (p.x - b.px) * t, y: b.py + (p.y - b.py) * t, a: b.pa + da * t };
  }
  syncActors(game, dt) {
    const gm = this.ghostModel, gg = this.ghostGame;
    if (gm && gg) {
      const gp = this.pose(gg.truck);
      gm.root.position.set(gp.x, gp.y, GHOST_Z);
      gm.root.rotation.z = gp.a;
      syncTailgate(this.scene, gm, gg, GHOST_Z, this.reduceMotion);
      if (gm.tag) gm.tag.position.set(gp.x, gp.y + 2.5, GHOST_Z);
      gg.wheels.forEach((w, i) => { const wp = this.pose(w); gm.wheels[i].position.set(wp.x, wp.y, GHOST_Z); gm.wheels[i].rotation.z = wp.a; });
    }
    const model = this.truckModel, truck = game.truck, p = this.pose(truck);
    model.root.position.set(p.x, p.y, 0);
    model.root.rotation.z = p.a;
    syncTailgate(this.scene, model, game, 0, this.reduceMotion);
    paceTeam(model,game.speed(),dt,this.reduceMotion);
    game.wheels.forEach((w, i) => {
      const wp = this.pose(w), g = model.wheels[i];
      g.position.set(wp.x, wp.y, 0);
      g.rotation.z = wp.a;
    });
    model.brakes.forEach((b) => { b.material.emissiveIntensity = game.brakeOn ? 3.4 : 0.8; });
    if (this.headlight) this.headlight.position.set(p.x + 5, p.y + 2.2, 1.5);
    this.syncSideActors(game);
    // Lantern Lane: the light fades as the drive goes on.
    if (this.theme.fall && this.sun) this.sun.intensity = this.theme.sunI * (1 - 0.6 * Math.min(1, p.x / game.terrain.total));
    if (this.rope) {
      // A sagging rope from the cab roof to the roped load, fading out.
      const r = this.rope, cab = { x: p.x + Math.cos(p.a) * game.dim.cabX - Math.sin(p.a) * 1.2, y: p.y + Math.sin(p.a) * game.dim.cabX + Math.cos(p.a) * 1.2 };
      const end = r.cargo ? r.cargo.group.position : { x: cab.x - 2, y: cab.y };
      const pos = r.line.geometry.attributes.position;
      for (let i = 0; i < 12; i++) { const u = i / 11; pos.setXYZ(i, cab.x + (end.x - cab.x) * u, cab.y + (end.y - cab.y) * u - Math.sin(Math.PI * u) * 0.4 * (r.life / 0.7), 0.3); }
      pos.needsUpdate = true;
      r.life -= dt;
      if (r.life <= 0) { this.scene.remove(r.line); r.line.geometry.dispose(); r.line.material.dispose(); this.rope = null; }
    }

    this.cargo.forEach((c) => {
      c.group.visible = !c.info.delivered;
      if (!c.group.visible) return;
      const b = c.info.body, cp = this.pose(b);
      c.group.position.set(cp.x, cp.y, 0);
      c.group.rotation.z = cp.a;
      if (c.tween) {
        // Ease from where it fell to where it now sits, lifted on an arc.
        c.tween.t = Math.min(1, c.tween.t + dt / 0.35);
        const k = 1 - Math.pow(1 - c.tween.t, 3);
        c.group.position.set(c.tween.x + (cp.x - c.tween.x) * k, c.tween.y + (cp.y - c.tween.y) * k + Math.sin(Math.PI * c.tween.t) * 1.2, 0);
        if (c.tween.t >= 1) c.tween = null;
      }
      if (c.group.userData.wobble) {
        c.wob += dt * 9;
        const v = b.getLinearVelocity().length();
        const s = 1 + Math.sin(c.wob) * Math.min(0.09, 0.02 + v * 0.008);
        c.group.scale.set(1 / s, s, 1 / s);
      }
      if ((c.info.broken || c.info.ruined) && !c.swapped) {
        c.swapped = true;
        const type = c.group.userData.type;
        if (DAMAGED[type]) fillCargo(c.group, "cargo/cargo_" + type + DAMAGED[type], this.quality);
      }
      if (c.info.lost || c.info.broken) {
        c.age += dt;
        if (c.age > 2.4) c.group.scale.setScalar(Math.max(0.001, 1 - (c.age - 2.4) / 0.5));
      }
    });

    const hide = new THREE.Matrix4().makeScale(0, 0, 0), spin = this.time * 3.2;
    if (this.coinMesh) {
      // Only coins near the camera spin; the rest keep the matrix they last had.
      const near = this.camX || p.x, dummy = this.coinDummy || (this.coinDummy = new THREE.Object3D());
      game.coins.forEach((c, i) => {
        if (c.hidden) return;
        if (c.taken) { c.hidden = true; this.coinMesh.setMatrixAt(i, hide); return; }
        if (Math.abs(c.x - near) > 34 && c.drawn) return;
        c.drawn = true;
        dummy.position.set(c.x, c.y + Math.sin(spin + c.x) * 0.08, 0); dummy.rotation.set(0, spin + c.x * 0.3, 0); dummy.updateMatrix();
        this.coinMesh.setMatrixAt(i, dummy.matrix);
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
    const p = this.pose(game.truck), v = game.truck.getLinearVelocity();
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
    if (ev.type === "lasso") {
      // The roped load flies back in a short arc, with a rope from the cab to it.
      const c = this.cargo.find((k) => k.info.id === ev.id);
      if (c) c.tween = { x: ev.x, y: ev.y, t: 0 };
      const rope = new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 12 }, () => new THREE.Vector3())), new THREE.LineBasicMaterial({ color: "#c8955a" }));
      rope.frustumCulled = false;
      this.scene.add(rope);
      this.rope = { line: rope, cargo: c, life: 0.7 };
      return;
    }
    if (ev.type === "pickup") {
      ev.items.forEach((c) => { const g = buildCargo(c.type, this.quality, c.id); this.scene.add(g); this.cargo.push({ info: c, group: g, age: 0, wob: 0 }); });
      const green = col("#6fe08f");
      for (let i = 0; i < 18; i++) this.puff(ev.x + (Math.random() - 0.5) * 3, ev.y + 1.5, z(), (Math.random() - 0.5) * 2, 2 + Math.random() * 2, z(), 0.1, 0.7, green, 5);
    } else if (ev.type === "dropoff") {
      const gold=col("#ffcd54");
      for (let i=0;i<13;i++) this.puff(ev.x,ev.y+.32,-1, (Math.random()-.5)*3,2+Math.random()*2,z(),.11,.65,gold,4);
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

  // Hold for more: a roadside sign naming the stop, readable from the side camera.
  stopSign(d, x, y) {
    const name = SH.stopName(d).toUpperCase();
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.7), new THREE.MeshBasicMaterial({ map: canvasTex(512, 168, (c, w, h) => {
      c.fillStyle = "#2f7d4a"; c.fillRect(0, 0, w, h);
      c.fillStyle = "#fff6e0"; c.fillRect(8, 8, w - 16, 4); c.fillRect(8, h - 12, w - 16, 4);
      c.textAlign = "center"; c.textBaseline = "middle";
      c.font = "800 64px sans-serif"; c.fillText(name, w / 2, 62);
      c.fillStyle = "#ffe08a"; c.font = "700 40px sans-serif"; c.fillText("Stay to load more", w / 2, 126);
    }) }));
    // Before the mat on the far verge, so it is read on the way in and never hides the truck.
    plate.position.set(x - 9.5, y + 3.1, -3.6);
    this.scene.add(plate);
  }

  // Parking Spots: two rings on the depot floor where the front wheel should rest,
  // each with a short marker post on the far side so they read from the side camera.
  buildSpots(game) {
    this.spotMeshes = [];
    if (!game.parkable) return;
    const t = game.terrain;
    t.spots.forEach((sp) => {
      const deep = sp.kind === "deep", tint = deep ? "#ffc93a" : "#5fd6c4", y = SH.heightAt(t, sp.x);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.46, 0.6, 32), new THREE.MeshBasicMaterial({ color: tint, transparent: true, opacity: 0.7, depthWrite: false, fog: false }));
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(sp.x, y + 0.05, 1.0);
      const far = ring.clone(); far.material = ring.material; far.position.z = -1.0;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.3, 8), new THREE.MeshStandardMaterial({ color: "#d8d2c6" }));
      post.position.set(sp.x, y + 0.65, -2.7);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(0.42, 24), new THREE.MeshBasicMaterial({ map: canvasTex(128, 128, (c, w, h) => {
        c.fillStyle = tint; c.beginPath(); c.arc(w / 2, h / 2, w / 2 - 2, 0, Math.PI * 2); c.fill();
        c.fillStyle = "#2a2a2e"; c.font = "900 74px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("P", w / 2, h / 2 + 4);
      }) }));
      disc.position.set(sp.x, y + 1.55, -2.66);
      [ring, far, post, disc].forEach((o) => this.scene.add(o));
      this.spotMeshes.push({ kind: sp.kind, mat: ring.material, base: col(tint), lit: col("#ffffff") });
    });
  }

  frameGame(game, dt) {
    this.showcasing = false;
    this.time += dt;
    this.syncActors(game, dt);
    this.updateCamera(game, 1 - Math.exp(-dt * 4.2));
    this.shake = Math.max(0, this.shake - dt * 1.2);

    const pp = this.pose(game.truck), p = pp, angle = pp.a;
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
      this.puff(p.x + c * bx, p.y + s * bx - 0.1, 0.5, -1 - Math.random(), 0.5, 0, 0.1, 0.5, game.spec.runners ? (this.sparkle ||= col("#ffcd54")) : (this.smoke ||= col("#8d8a86")));
    }
    if (this.zoneMesh) this.zoneMesh.material.opacity = 0.72 + Math.sin(this.time * 4) * 0.25;
    if (this.spotMeshes && this.spotMeshes.length) {
      const on = game.spotAt();
      this.spotMeshes.forEach((sp) => { sp.mat.color.copy(on === sp.kind ? sp.lit : sp.base); sp.mat.opacity = on === sp.kind ? 0.95 : 0.7; });
    }
    this.animateSky(dt);
    this.stepParticles(dt);
    this.renderer.render(this.scene, this.camera);
    this.watchFrameRate(dt);
  }

  // Steps quality down if the phone cannot hold a steady frame rate.
  watchFrameRate(dt) {
    if (!this.autoQuality) return;
    this.driveTime += dt;
    this.fpsTime += dt; this.fpsFrames += 1;
    if (this.fpsTime < 3) return;
    const fps = this.fpsFrames / this.fpsTime, span = this.fpsTime;
    this.fpsTime = 0; this.fpsFrames = 0;
    this.fastTime = fps >= 55 ? this.fastTime + span : 0;
    if (this.fastTime >= 60 && !this.triedUp && this.quality.level < 2 && (this.autoCeiling == null || this.quality.level < this.autoCeiling)) this.upReady = true;
    if (fps >= 34) return;
    this.upReady = false; this.fastTime = 0;
    // A step up that could not hold for 30 s of driving: never try that tier again.
    if (this.upAt != null && this.driveTime - this.upAt < 30) { this.autoCeiling = this.quality.level; this.onCeiling && this.onCeiling(this.autoCeiling); }
    this.upAt = null;
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

  // One tier up, applied as the next road is built, never mid-drive.
  stepUp() {
    this.upReady = false; this.triedUp = true;
    const next = this.quality === QUALITY.low ? QUALITY.medium : this.quality === QUALITY.medium ? QUALITY.high : null;
    if (!next) return;
    this.quality = next; this.upAt = this.driveTime; this.fastTime = 0;
    this.applyQuality();
    this.sun.castShadow = next.shadows;
    this.scene.traverse((o) => { if (o.material) o.material.needsUpdate = true; });
    this.onQualityChange && this.onQualityChange(next.name);
  }

  stats() {
    const i = this.renderer.info;
    return { calls: i.render.calls, triangles: i.render.triangles, geometries: i.memory.geometries, quality: this.quality.name };
  }
}
