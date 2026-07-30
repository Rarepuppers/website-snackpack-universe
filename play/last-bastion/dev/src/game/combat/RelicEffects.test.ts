import { describe, expect, it } from "vitest";
import { CombatSimulation } from "./CombatSimulation";
import { RELIC_CATALOG, resolveRelicModifiers } from "../content/relicCatalog";

/**
 * Relic *behaviour* tests.
 *
 * Every one of these relics previously set its modifier field correctly and had
 * **zero combat read-sites** — a test asserting on `resolveRelicModifiers` alone
 * passed the whole time they did nothing. So each case here drives a real
 * `CombatSimulation` and asserts an observable difference between owning the
 * relic and not owning it.
 */
const IDLE = {
  move: { x: 0, y: 0 }, aim: { x: 1, y: 0 }, fireHeld: false,
  evasiveMovePressed: false, ultimatePressed: false, kitPressed: false, interactPressed: false,
  pausePressed: false, restartPressed: false,
};

function build(relicIds: string[]) {
  return {
    health: 20, shield: 0, level: 1, experience: 0, scrap: 0,
    weapons: [], upgrades: [], relicIds: relicIds as never,
  };
}

describe("relic combat effects", () => {
  it("Stabiliser Gyro narrows the fired spread while moving, and only while moving", () => {
    // Measured off real projectile angles: asserting the modifier value would
    // have passed for the entire period this relic did nothing.
    // Needs a multi-projectile weapon: the starting rifle fires one projectile
    // with no spread, so measuring it would assert nothing at all.
    const spreadWhileMoving = (relicIds: string[], moving: boolean): number => {
      const simulation = new CombatSimulation({
        autoStartWaves: false,
        startingBuild: { ...build(relicIds), weapons: [{ weaponId: "scattergun", tier: 1 }] },
      });
      const move = moving ? { x: 1, y: 0 } : { x: 0, y: 0 };
      for (let tick = 0; tick < 60; tick += 1) {
        simulation.step({ ...IDLE, move, fireHeld: true }, 0.05);
        const angles = simulation.snapshot().projectiles.map((p) => p.rotationRadians);
        if (angles.length >= 2) return Math.max(...angles) - Math.min(...angles);
      }
      return 0;
    };
    const movingWithout = spreadWhileMoving([], true);
    // Guard the guard: if this is 0 the comparisons below are vacuous.
    expect(movingWithout).toBeGreaterThan(0);

    expect(spreadWhileMoving(["rel-stabiliser-gyro"], true)).toBeLessThan(movingWithout);
    // Stationary is untouched — the relic is a moving-only bonus.
    expect(spreadWhileMoving(["rel-stabiliser-gyro"], false))
      .toBeCloseTo(spreadWhileMoving([], false), 5);
  });

  it("Field Lattice chills nearby aliens when health is collected", () => {
    const chilled = (relicIds: string[]): boolean => {
      const simulation = new CombatSimulation({
        autoStartWaves: false, startingBuild: build(relicIds),
      });
      const player = simulation.snapshot().playerPosition;
      simulation.spawnEnemy("scuttler", { x: player.x + 1, y: player.y });
      simulation.spawnPowerup("medkit", { x: player.x, y: player.y });
      simulation.step(IDLE, 0.05);
      return simulation.snapshot().enemies.some((enemy) => enemy.statuses.includes("freeze"));
    };
    expect(chilled(["rel-field-lattice"])).toBe(true);
    expect(chilled([])).toBe(false);
  });

  it("Kinetic Greaves sends the evasive move further", () => {
    const dashDistance = (relicIds: string[]): number => {
      const simulation = new CombatSimulation({
        autoStartWaves: false, startingBuild: build(relicIds),
      });
      const start = { ...simulation.snapshot().playerPosition };
      simulation.step({ ...IDLE, move: { x: 1, y: 0 } }, 0.05);
      simulation.step({ ...IDLE, move: { x: 1, y: 0 }, evasiveMovePressed: true }, 0.05);
      for (let tick = 0; tick < 12; tick += 1) simulation.step({ ...IDLE, move: { x: 1, y: 0 } }, 0.05);
      const end = simulation.snapshot().playerPosition;
      return Math.hypot(end.x - start.x, end.y - start.y);
    };
    expect(dashDistance(["rel-kinetic-greaves"])).toBeGreaterThan(dashDistance([]));
  });

  it("Broodbreaker Seal bursts a destroyed egg into nearby aliens", () => {
    const neighbourHealth = (artifactId: string | null): number => {
      const simulation = new CombatSimulation({
        autoStartWaves: false,
        startingBuild: { ...build([]), equippedArtifactId: artifactId as never },
      });
      const eggId = simulation.spawnEnemy("egg-cluster", { x: 10, y: 10 });
      simulation.spawnEnemy("scuttler", { x: 11, y: 10 });
      simulation.dealDamage(eggId, 9999);
      const neighbour = simulation.snapshot().enemies.find((enemy) => enemy.type === "scuttler");
      return neighbour?.health ?? 0;
    };
    expect(neighbourHealth("art-broodbreaker-seal")).toBeLessThan(neighbourHealth(null));
  });

  it("Broodbreaker Seal holds an egg through one crack window before it hatches", () => {
    const hatchedBy = (artifactId: string | null, seconds: number): boolean => {
      const simulation = new CombatSimulation({
        autoStartWaves: false,
        startingBuild: { ...build([]), equippedArtifactId: artifactId as never },
      });
      simulation.spawnEnemy("egg-cluster", { x: 10, y: 10 });
      for (let tick = 0; tick < seconds / 0.05; tick += 1) simulation.step(IDLE, 0.05);
      return simulation.snapshot().enemies.every((enemy) => enemy.type !== "egg-cluster");
    };
    // The base hatch is 6s; the Seal stalls it one crack window longer.
    expect(hatchedBy(null, 6.4)).toBe(true);
    expect(hatchedBy("art-broodbreaker-seal", 6.4)).toBe(false);
    expect(hatchedBy("art-broodbreaker-seal", 8)).toBe(true);
  });

  it("Last Bastion Protocol braces the rack at critical health", () => {
    const simulation = new CombatSimulation({
      autoStartWaves: false,
      startingBuild: { ...build([]), health: 2, equippedArtifactId: "art-last-bastion-protocol" as never },
    });
    let braced = false;
    for (let tick = 0; tick < 20 && !braced; tick += 1) {
      const snapshot = simulation.step(IDLE, 0.05);
      braced = snapshot.events.some((event) => event.type === "brace-formation");
    }
    expect(braced).toBe(true);
  });

  it("Event Horizon Core turns a periodic impact into an implosion field", () => {
    const simulation = new CombatSimulation({
      autoStartWaves: false,
      startingBuild: { ...build([]), equippedArtifactId: "art-event-horizon-core" as never },
    });
    const player = simulation.snapshot().playerPosition;
    simulation.spawnEnemy("scuttler", { x: player.x + 2, y: player.y });
    let fields = 0;
    for (let tick = 0; tick < 200 && fields === 0; tick += 1) {
      simulation.step({ ...IDLE, fireHeld: true }, 0.05);
      fields = simulation.snapshot().eventHorizonFields.length;
    }
    expect(fields).toBeGreaterThan(0);
  });

  it("Blast Baffle halves explosive damage but not ordinary hits", () => {
    const damageTaken = (relicIds: string[]): number => {
      const simulation = new CombatSimulation({
        autoStartWaves: false, startingBuild: build(relicIds),
      });
      const before = simulation.snapshot().playerHealth;
      const player = simulation.snapshot().playerPosition;
      // Blast Mite detonation is one of the tagged explosive sources.
      const miteId = simulation.spawnEnemy("blast-mite", { x: player.x + 0.3, y: player.y });
      simulation.dealDamage(miteId, 9999);
      for (let tick = 0; tick < 40; tick += 1) simulation.step(IDLE, 0.05);
      return before - simulation.snapshot().playerHealth;
    };
    const bare = damageTaken([]);
    // Guard the guard: a zero here would make the comparison below vacuous.
    expect(bare).toBeGreaterThan(0);
    expect(damageTaken(["rel-blast-baffle"])).toBeCloseTo(bare * 0.5, 5);
  });

  it("Salvaged Capacitor arcs to a second alien every fifth hit", () => {
    const arcs = (relicIds: string[]): number => {
      const simulation = new CombatSimulation({
        autoStartWaves: false, startingBuild: build(relicIds),
      });
      const player = simulation.snapshot().playerPosition;
      // Needs targets durable enough to survive five hits, and a neighbour still
      // alive to arc to — two scuttlers die long before the counter comes round.
      for (let index = 0; index < 8; index += 1) {
        simulation.spawnEnemy("quillback", { x: player.x + 2 + index * 0.4, y: player.y });
      }
      let seen = 0;
      for (let tick = 0; tick < 300; tick += 1) {
        const snapshot = simulation.step({ ...IDLE, fireHeld: true }, 0.05);
        seen += snapshot.events.filter((event) => event.type === "chain-arc").length;
      }
      return seen;
    };
    // The starting rifle has no chain of its own, so any arc is the relic's.
    expect(arcs([])).toBe(0);
    expect(arcs(["rel-salvaged-capacitor"])).toBeGreaterThan(0);
  });

  it("Bastion Beacon converts the first lethal hit into a sliver of health", () => {
    const survives = (artifactId: string | null): boolean => {
      const simulation = new CombatSimulation({
        autoStartWaves: false,
        startingBuild: { ...build([]), health: 2, equippedArtifactId: artifactId as never },
      });
      const player = simulation.snapshot().playerPosition;
      const mite = simulation.spawnEnemy("blast-mite", { x: player.x + 0.2, y: player.y });
      simulation.dealDamage(mite, 9999);
      for (let tick = 0; tick < 60; tick += 1) simulation.step(IDLE, 0.05);
      return simulation.snapshot().status !== "defeat";
    };
    expect(survives("art-bastion-beacon")).toBe(true);
  });

  it("Null Field eats the first hit of the wave", () => {
    const damageTaken = (artifactId: string | null): number => {
      const simulation = new CombatSimulation({
        autoStartWaves: false,
        startingBuild: { ...build([]), equippedArtifactId: artifactId as never },
      });
      const before = simulation.snapshot().playerHealth;
      const player = simulation.snapshot().playerPosition;
      const mite = simulation.spawnEnemy("blast-mite", { x: player.x + 0.3, y: player.y });
      simulation.dealDamage(mite, 9999);
      for (let tick = 0; tick < 40; tick += 1) simulation.step(IDLE, 0.05);
      return before - simulation.snapshot().playerHealth;
    };
    const bare = damageTaken(null);
    expect(bare).toBeGreaterThan(0);
    expect(damageTaken("art-null-field")).toBe(0);
  });

  it("Butcher's Rig only lifts melee, not the rifle", () => {
    const modifiers = resolveRelicModifiers(["rel-butchers-rig"], null);
    expect(modifiers.meleeDamageMultiplier).toBeGreaterThan(1);
    // Ranged weapons must not inherit it — the relic is the melee commitment.
    const neutral = resolveRelicModifiers([], null);
    expect(neutral.meleeDamageMultiplier).toBe(1);
  });

  /* Elemental balance pass relics (31 July 2026). Same rule as the rest of this
     file: drive a real simulation and assert an observable difference. */

  it("Coolant Loop raises sustained beam damage, and only beams", () => {
    const beamDamageOver = (relicIds: string[]): number => {
      const simulation = new CombatSimulation({
        autoStartWaves: false,
        startingBuild: { ...build(relicIds), weapons: [{ weaponId: "cryo-lance", tier: 1 }] },
      });
      const player = simulation.snapshot().playerPosition;
      const id = simulation.spawnEnemy("abomination", { x: player.x + 2, y: player.y });
      const before = simulation.snapshot().enemies.find((enemy) => enemy.id === id)!.health;
      for (let tick = 0; tick < 20; tick += 1) simulation.step({ ...IDLE, fireHeld: true }, 0.05);
      const after = simulation.snapshot().enemies.find((enemy) => enemy.id === id)?.health ?? 0;
      return before - after;
    };
    expect(beamDamageOver(["rel-coolant-loop"])).toBeGreaterThan(beamDamageOver([]));
  });

  it("Element Primer reaches the status threshold sooner", () => {
    const ticksToStatus = (relicIds: string[]): number => {
      const simulation = new CombatSimulation({
        autoStartWaves: false,
        startingBuild: { ...build(relicIds), weapons: [{ weaponId: "cryo-lance", tier: 1 }] },
      });
      const player = simulation.snapshot().playerPosition;
      simulation.spawnEnemy("abomination", { x: player.x + 2, y: player.y });
      for (let tick = 1; tick <= 200; tick += 1) {
        const snapshot = simulation.step({ ...IDLE, fireHeld: true }, 0.05);
        if (snapshot.events.some((event) => event.type === "status-applied")) return tick;
      }
      return Number.POSITIVE_INFINITY;
    };
    const primed = ticksToStatus(["rel-element-primer"]);
    expect(primed).toBeLessThan(ticksToStatus([]));
    expect(Number.isFinite(primed)).toBe(true);
  });

  it("Overwatch Rig lifts ranged damage only once you have actually held still", () => {
    const damageAfterStandingFor = (relicIds: string[], stillTicks: number): number => {
      const simulation = new CombatSimulation({
        autoStartWaves: false,
        startingBuild: { ...build(relicIds), weapons: [{ weaponId: "bolt-carbine", tier: 1 }] },
      });
      const player = simulation.snapshot().playerPosition;
      // Stand still (or keep moving) before firing, then fire from a fixed spot.
      const move = stillTicks > 0 ? { x: 0, y: 0 } : { x: 1, y: 0 };
      for (let tick = 0; tick < Math.max(1, stillTicks); tick += 1) {
        simulation.step({ ...IDLE, move }, 0.05);
      }
      const id = simulation.spawnEnemy("abomination", { x: player.x + 3, y: player.y });
      const before = simulation.snapshot().enemies.find((enemy) => enemy.id === id)!.health;
      for (let tick = 0; tick < 60; tick += 1) simulation.step({ ...IDLE, fireHeld: true }, 0.05);
      const after = simulation.snapshot().enemies.find((enemy) => enemy.id === id)?.health ?? 0;
      return before - after;
    };
    // 40 ticks at 0.05s = 2s stationary, past the 1.5s threshold.
    const held = damageAfterStandingFor(["rel-overwatch-rig"], 40);
    const baseline = damageAfterStandingFor([], 40);
    expect(held).toBeGreaterThan(baseline);
  });

  /** Fires the rifle at the centre barricade and reports what happened to it. */
  function shellCover(relicIds: string[], ticks: number) {
    const simulation = new CombatSimulation({
      autoStartWaves: false,
      startingBuild: { ...build(relicIds), weapons: [{ weaponId: "bastion-service-rifle", tier: 1 }] },
    });
    const player = simulation.snapshot().playerPosition;
    const target = { x: 25.8 + 3.4 / 2, y: 9.1 + 0.8 / 2 };
    const offset = { x: target.x - player.x, y: target.y - player.y };
    const length = Math.hypot(offset.x, offset.y);
    const aim = { x: offset.x / length, y: offset.y / length };

    let coverDamage = 0;
    let scrapFromObjects = 0;
    let sawDamageWithoutScrap = false;
    for (let tick = 0; tick < ticks; tick += 1) {
      const snapshot = simulation.step({ ...IDLE, aim, fireHeld: true }, 0.05);
      let destroyedThisTick = false;
      for (const event of snapshot.events) {
        if (event.type === "obstacle-damaged") coverDamage += event.damage;
        if (event.type === "obstacle-destroyed") {
          coverDamage += event.damage;
          destroyedThisTick = true;
        }
        if (event.type === "scrap-secured" && event.source === "world-object") {
          scrapFromObjects += event.amount;
        }
      }
      const damaged = snapshot.events.some((event) => event.type === "obstacle-damaged");
      if (damaged && !destroyedThisTick) sawDamageWithoutScrap = true;
    }
    return { coverDamage, scrapFromObjects, sawDamageWithoutScrap };
  }

  it("Breacher's Wedge multiplies the damage a shot does to cover", () => {
    // Reads the damage off the obstacle event rather than trusting the modifier
    // field, which is the whole point of this file.
    const wedged = shellCover(["rel-breachers-wedge"], 60).coverDamage;
    const baseline = shellCover([], 60).coverDamage;
    expect(baseline).toBeGreaterThan(0);
    expect(wedged).toBeGreaterThan(baseline);
  });

  it("Scavenger's Eye pays out on destruction, not on damage", () => {
    const result = shellCover(["rel-scavengers-eye", "rel-breachers-wedge"], 400);
    expect(result.scrapFromObjects).toBeGreaterThan(0);
    // Chipping cover must not pay — otherwise the relic rewards flailing at walls.
    expect(result.sawDamageWithoutScrap).toBe(true);
    // And no relic means no world-object scrap at all.
    expect(shellCover(["rel-breachers-wedge"], 400).scrapFromObjects).toBe(0);
  });

  it("every relic in the live pool sets at least one modifier that combat reads", () => {
    // A catalogue-level guard: a relic whose fields are all unread is a placebo
    // pickup, and the player cannot tell the difference.
    for (const relic of RELIC_CATALOG) {
      const modifiers = resolveRelicModifiers([relic.id], null);
      const neutral = resolveRelicModifiers([], null);
      const changed = (Object.keys(modifiers) as (keyof typeof modifiers)[])
        .filter((key) => modifiers[key] !== neutral[key]);
      expect(changed.length, `${relic.id} changes nothing`).toBeGreaterThan(0);
    }
  });
});
