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

function makeView(title, scene, labels = [], framing = {}) {
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
    const { span = CRATE.half * 2 + 3.4, tall = CRATE.height + 4.6,
      focus = CRATE.height / 2 + 1.1, x = 0 } = framing;
    const dist = Math.max(tall / (2 * tangent), span / (2 * tangent * camera.aspect));
    camera.position.set(x, focus + dist * .17, dist);
    camera.lookAt(x, focus, 0);
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
  const boxes = Object.values(window.SnackDrop.CONTAINERS);
  if (!boxes.some((box) => box.id === "hopper") && report.files.has("models/containers/container_hopper.glb")) {
    boxes.push({ id: "hopper", name: "Vending Hopper" });
  }
  for (const kind of boxes) {
    const scene = new THREE.Scene();
    const crate = model(`containers/container_${kind.id}`);
    scene.add(model(`backdrops/backdrop_${kind.id}`) || new THREE.Group(), crate || fallbackContainer());
    const half = CRATE.half;
    const radius = kind.fillet || 0;
    const right = [[kind.id === "hopper" ? 2.10 : half - radius, 0, 1.035]];
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
  const names = {
    "corgi-on-the-cob": "Corgi-on-the-Cob", "belgian-waffle": "Belgian-Waffle",
    "pork-ulele": "Pork-ulele", "professor-hooten": "Professor Hooten",
    "ted-e-bear": "Ted-E-Bear", booklava_driver: "Booklava and the van",
  };
  for (const [slug, title] of Object.entries(names)) {
    const parked = slug === "booklava_driver";
    const id = parked ? "cameos/booklava_driver" : `cameos/cameo_${slug}`;
    const standing = model(id);
    const posed = model(parked ? "cameos/truck_van" : id);
    if (!standing || !posed) continue;
    const scene = new THREE.Scene();
    const backdrop = model("backdrops/backdrop_pantry");
    if (backdrop) scene.add(backdrop);
    const anchor = backdrop?.getObjectByName("anchor_floor_r");
    const at = anchor?.getWorldPosition(new THREE.Vector3()) || new THREE.Vector3(4.6, -.6, .6);
    standing.position.copy(at);
    posed.position.copy(standing.position);
    posed.position.x -= 2.3;
    posed.rotation.y = slug === "corgi-on-the-cob" ? -Math.PI / 2 : -.22;
    for (const [joint, swing] of Object.entries({ leg_fl: .62, leg_fr: -.57,
      leg_bl: -.58, leg_br: .60, leg_l: .5, leg_r: -.48, tail: -.25 })) {
      const part = posed.getObjectByName(joint);
      if (part) part.rotation.x += swing;
    }
    const head = posed.getObjectByName("head");
    if (head) head.rotation.y += slug === "professor-hooten" ? .95 : .39;
    const wingL = posed.getObjectByName("wing_l"), wingR = posed.getObjectByName("wing_r");
    if (wingL && wingR) { wingL.rotation.z = -.42; wingR.rotation.z = .50; }
    const arm = posed.getObjectByName("arm_r");
    if (arm && slug === "ted-e-bear") {
      arm.rotation.z = -1.74;
      arm.rotation.x = -.36;
    }
    if (parked) {
      for (const axle of [-1.10, 1.20]) {
        for (const side of [-1, 1]) {
          const wheel = model("cameos/wheel_van");
          if (!wheel) continue;
          wheel.position.set(axle, -.58, side * .82);
          if (side < 0) wheel.rotation.y = Math.PI;
          posed.add(wheel);
        }
      }
      const seat = posed.getObjectByName("seat");
      if (seat) {
        const driver = model(id);
        driver.position.copy(posed.worldToLocal(seat.getWorldPosition(new THREE.Vector3())));
        posed.add(driver);
      }
      const bounds = new THREE.Box3().setFromObject(posed, true);
      const size = bounds.getSize(new THREE.Vector3());
      const scale = 2.9 / Math.max(size.x, size.z);
      posed.scale.setScalar(scale);
      posed.position.y -= (bounds.min.y - at.y) * scale;
      const driverBottom = new THREE.Box3().setFromObject(standing, true).min.y - at.y;
      standing.scale.setScalar(2.2);
      standing.position.y = at.y + .19 - driverBottom * 2.2;
      box(scene, pale, [.77, .19, .64], [at.x, at.y + .095, at.z]);
    }
    scene.add(standing, posed);
    makeView(title, scene, [], { x: at.x - 1.13, focus: at.y + 1.2, span: parked ? 6.1 : 5.2, tall: 3.45 });
  }
}

({ snacks, containers: containerView, cameos })[view]();
const status = document.querySelector("#status");
status.textContent = report.failed.length ? report.failed.join(" · ")
  : view === "snacks" ? "Green outlines show collision shapes. Teal dots mark face anchors."
    : view === "containers" ? "Green lines show the playable floor and inner walls." : "";
document.documentElement.dataset.galleryReady = "true";
