import * as THREE from "../vendor/three.module.min.js";

const query = new URLSearchParams(location.search);
const view = ["containers", "cameos"].includes(query.get("view")) ? query.get("view") : "snacks";
document.querySelector(`nav a[href="?view=${view}"]`).setAttribute("aria-current", "page");
document.querySelector("#gallery").className = view;

// The game loader resolves its asset path against the page, which lives one
// directory higher than this gallery.
if (!query.has("assets")) {
  query.set("assets", "../assets/");
  history.replaceState(null, "", `?${query}`);
}
const { loadAssets, model } = await import("../assets.js");
const { TIERS, CRATE } = window.SnackDrop;
const report = await loadAssets();
const outlineColor = 0x28534f;
const cream = new THREE.MeshStandardMaterial({ color: 0xc8955c });
const pale = new THREE.MeshStandardMaterial({ color: 0xe9c696 });

function box(parent, material, size, at) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...at);
  parent.add(mesh);
  return mesh;
}

function fallbackContainer() {
  const crate = new THREE.Group();
  box(crate, cream, [6.6, 10.4, .16], [0, 5.2, -1.08]);
  box(crate, cream, [7.2, .30, 2], [0, -.15, 0]);
  for (const side of [-1, 1]) {
    box(crate, pale, [.3, 10.4, 2], [3.45 * side, 5.2, 0]);
  }
  return crate;
}

function pointsFor(tier) {
  if (tier.shape === "circle") {
    return Array.from({ length: 64 }, (_, i) => {
      const angle = i * Math.PI / 32;
      return [tier.r * Math.cos(angle), tier.r * Math.sin(angle)];
    });
  }
  if (tier.shape === "wedge") {
    return [[-tier.w / 3, -tier.h / 3], [2 * tier.w / 3, -tier.h / 3], [-tier.w / 3, 2 * tier.h / 3]];
  }
  return [[-tier.w / 2, -tier.h / 2], [tier.w / 2, -tier.h / 2],
    [tier.w / 2, tier.h / 2], [-tier.w / 2, tier.h / 2]];
}

function line(parent, points, closed = false) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points.map((p) => new THREE.Vector3(...p)));
  const material = new THREE.LineBasicMaterial({ color: outlineColor, depthTest: false });
  const overlay = closed ? new THREE.LineLoop(geometry, material) : new THREE.Line(geometry, material);
  overlay.renderOrder = 4;
  parent.add(overlay);
}

function makeView(title, scene, labels = [], fitWidth = CRATE.half * 2 + 3.4) {
  const figure = document.createElement("figure");
  const caption = document.createElement("figcaption");
  caption.textContent = title;
  figure.append(caption);
  const view = document.createElement("div");
  view.className = "view";
  figure.append(view);
  document.querySelector("#gallery").append(figure);

  scene.background = new THREE.Color(0xf3dfc4);
  scene.add(new THREE.HemisphereLight(0xffeed6, 0xae7a68, 2));
  const key = new THREE.DirectionalLight(0xffe6bc, 2.1);
  key.position.set(-5, 10, 9);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xcde8ff, 1);
  fill.position.set(5, 5, 3);
  scene.add(fill);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0xf3dfc4);
  view.prepend(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(30, 1, 1, 200);
  const projected = new THREE.Vector3();
  const badges = labels.map(({ text, at }) => {
    const badge = document.createElement("span");
    badge.className = "tier-label";
    badge.textContent = text;
    view.append(badge);
    return { badge, at };
  });

  const render = () => {
    const { clientWidth: width, clientHeight: height } = view;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    const tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const dist = Math.max((CRATE.height + 4.6) / (2 * tangent), fitWidth / (2 * tangent * camera.aspect));
    const focus = CRATE.height / 2 + 1.1;
    camera.position.set(0, focus + dist * .17, dist);
    camera.lookAt(0, focus, 0);
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    for (const { badge, at } of badges) {
      projected.set(...at).project(camera);
      badge.style.left = `${(projected.x + 1) * width / 2}px`;
      badge.style.top = `${(1 - projected.y) * height / 2}px`;
    }
  };
  new ResizeObserver(render).observe(view);
  render();
}

function fallbackSnack(tier) {
  const shape = new THREE.Shape(pointsFor(tier).map(([x, y]) => new THREE.Vector2(x, y)));
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: .2, bevelEnabled: false });
  geometry.translate(0, 0, -.1);
  return new THREE.Mesh(geometry, pale);
}

function snacks() {
  const scene = new THREE.Scene();
  const pantry = model("containers/container_pantry");
  scene.add(model("backdrops/backdrop_pantry") || new THREE.Group(), pantry || fallbackContainer());
  const rows = [
    { floor: 0, items: [[9, -1.63], [10, 1.57]] },
    { floor: 3.35, items: [[8, -2.11], [6, .18], [5, 2.12]] },
    { floor: 5.90, items: [[7, -1.88], [4, .20], [3, 1.90]] },
    { floor: 8.65, items: [[0, -1.15], [1, 0], [2, 1.18]] },
  ];
  const labels = [];
  for (const { floor, items } of rows) {
    if (floor) box(scene, pale, [6.6, .10, 1.28], [0, floor - .05, -.33]);
    for (const [index, x] of items) {
      const tier = TIERS[index];
      const outline = pointsFor(tier);
      const y = floor - Math.min(...outline.map((p) => p[1]));
      const asset = model(`snacks/snack_${tier.id}`);
      const group = new THREE.Group();
      scene.add(group);
      group.position.set(x, y, 0);
      group.add(asset || fallbackSnack(tier));
      line(group, outline.map(([px, py]) => [px, py, 0]), true);
      const face = asset?.getObjectByName("face");
      if (face) {
        const mark = new THREE.Mesh(new THREE.SphereGeometry(.034, 10, 8),
          new THREE.MeshBasicMaterial({ color: 0x18d7c4, depthTest: false }));
        group.updateMatrixWorld(true);
        mark.position.copy(group.worldToLocal(face.getWorldPosition(new THREE.Vector3())));
        mark.renderOrder = 5;
        group.add(mark);
      }
      labels.push({ text: tier.name, at: [x, y + Math.max(...outline.map((p) => p[1])) + .24, .95] });
    }
  }
  makeView("Ladder at game scale", scene, labels);
}

function containerView() {
  for (const kind of Object.values(window.SnackDrop.CONTAINERS)) {
    const scene = new THREE.Scene();
    const crate = model(`containers/container_${kind.id}`);
    scene.add(model(`backdrops/backdrop_${kind.id}`) || new THREE.Group(), crate || fallbackContainer());
    const half = CRATE.half;
    const radius = kind.fillet || 0;
    const right = [[half - radius, 0, 1.035]];
    if (radius) {
      for (let i = 7; i >= 0; i--) {
        const angle = i * Math.PI / 16;
        right.push([half - radius + radius * Math.cos(angle), radius * (1 - Math.sin(angle)), 1.035]);
      }
    }
    right.push([half, CRATE.height, 1.035]);
    line(scene, [...right.slice().reverse().map(([x, y, z]) => [-x, y, z]), ...right]);
    makeView(kind.name + (crate ? "" : " (fallback)"), scene);
  }
}

function cameos() {
  const scene = new THREE.Scene();
  const backdrop = model("backdrops/backdrop_pantry");
  if (backdrop) scene.add(backdrop);
  const anchor = backdrop?.getObjectByName("anchor_floor_r");
  const at = anchor?.getWorldPosition(new THREE.Vector3()) || new THREE.Vector3(4.6, -.6, .6);
  const available = [...report.files].filter((entry) => /^models\/cameos\/.+\.glb$/.test(entry));
  const labels = [];
  for (const [index, entry] of available.entries()) {
    const id = entry.slice("models/".length, -4);
    const standing = model(id);
    const posed = model(id);
    if (!standing || !posed) continue;
    standing.position.copy(at);
    standing.position.x -= index * 2.28;
    posed.position.copy(standing.position);
    posed.position.x -= 2.3;
    posed.rotation.y = -Math.PI / 2;
    for (const [joint, swing] of Object.entries({ leg_fl: .62, leg_fr: -.57,
      leg_bl: -.58, leg_br: .60, leg_l: .5, leg_r: -.48, tail: -.25 })) {
      const part = posed.getObjectByName(joint);
      if (part) part.rotation.x += swing;
    }
    const head = posed.getObjectByName("head");
    if (head) head.rotation.y += .39;
    scene.add(standing, posed);
    labels.push({ text: id.split("/")[1].replace(/^cameo_/, "").replaceAll("_", " "),
      at: [standing.position.x, at.y + 2.7, at.z] });
  }
  makeView("Standing and posed", scene, labels, CRATE.half * 2 + 5.6);
}

({ snacks, containers: containerView, cameos })[view]();
const status = document.querySelector("#status");
status.textContent = report.failed.length ? report.failed.join(" · ")
  : view === "snacks" ? "Green outlines show collision shapes. Teal dots mark face anchors."
    : view === "containers" ? "Green lines show the playable floor and inner walls." : "";
document.documentElement.dataset.galleryReady = "true";
