import type { ArenaDefinition } from "../../arena/ArenaDefinition";
import type { EnemyType } from "../../content/enemyCatalog";
import type { Vector2Data } from "../../math/Vector2Data";
import type { WeaponTile } from "../../equipment/WeaponInventory";
import type { EliteKind } from "../EliteCadence";
import type { EnemyPressureRole } from "../DensityDirector";
import {
  ARC_WARDEN_CHARGE_SECONDS,
  ARC_WARDEN_LAB_CAP,
  lockArcWardenLane,
} from "../ArcWardenBeam";
import { INFECTED_SURVIVOR_PACK_CAP } from "../CorruptedHumanWaves";
import { SCRAP_SKITTERER_PACK_CAP } from "../ScrapSkittererBehavior";
import { buildDensityCapacityRoster } from "../DensityDirector";
// Type-only, so it is erased at build time and no import cycle exists with
// `CombatSimulation`, which imports this module for its value export.
import type {
  CombatScenario,
  BossKind,
  EnemyState,
  MiniBossKind,
  PendingDecision,
  PowerupType,
} from "../CombatSimulation";

/**
 * Review-lab setup, lifted out of `CombatSimulation` so the simulation file
 * carries gameplay rules rather than the fixtures used to inspect them. These
 * run once at construction and never during `step`, so nothing here is on the
 * hot path.
 *
 * The context is deliberately explicit and deliberately wide: it is the honest
 * record of how much simulation state a review fixture reaches into. Prefer
 * narrowing it over growing it — anything added here is state a lab can
 * silently diverge from real play with.
 */
export interface ScenarioPopulationContext {
  readonly widthMetres: number;
  readonly heightMetres: number;
  readonly playerPosition: Vector2Data;
  readonly enemies: readonly EnemyState[];

  setPlayerHealth(value: number): void;
  setWaveLiveCap(value: number): void;
  setWaveThreatBudget(value: number): void;
  resetDensityCounters(): void;

  spawnEnemy(type: EnemyType, position?: Vector2Data): number;
  spawnElite(kind: EliteKind, position?: Vector2Data): number;
  spawnMiniBoss(kind: MiniBossKind, position?: Vector2Data): number;
  spawnAurumHoarder(position?: Vector2Data): number | null;
  spawnBastionEater(position?: Vector2Data): number;
  spawnBoss(kind: BossKind, position?: Vector2Data): number;
  spawnPowerup(type: PowerupType, position?: Vector2Data): number;
  activatePowerup(type: PowerupType): void;
  recordDensitySpawn(spawn: { type: EnemyType }): void;

  activeObstacles(): ArenaDefinition["obstacles"];
  nextWeaponInstanceId(): number;
  setPendingWeaponTile(tile: WeaponTile): void;
  queueDecision(decision: PendingDecision): void;
  openScrapShopVisit(): PendingDecision;
  buildWeaponPlacementDecision(tile: WeaponTile): PendingDecision;
}

type Populate = (context: ScenarioPopulationContext) => void;

const centreOf = (context: ScenarioPopulationContext): Vector2Data => ({
  x: context.widthMetres / 2,
  y: context.heightMetres / 2,
});

const byId = (context: ScenarioPopulationContext, id: number): EnemyState =>
  context.enemies.find((enemy) => enemy.id === id)!;

const POPULATE: Readonly<Record<CombatScenario, Populate>> = Object.freeze({
  "slime-spitter": (context) => {
    const centre = centreOf(context);
    for (const offset of [
      { x: -7, y: -4 },
      { x: 7, y: -3 },
      { x: 6, y: 4 },
    ]) {
      context.spawnEnemy("slime-spitter", { x: centre.x + offset.x, y: centre.y + offset.y });
    }
    context.spawnEnemy("scuttler", { x: centre.x - 6, y: centre.y + 3.5 });
  },

  "carapace-elite": (context) => {
    const centre = centreOf(context);
    context.spawnElite("carapace-scuttler", { x: centre.x + 6.5, y: centre.y });
    context.spawnEnemy("scuttler", { x: centre.x - 5.5, y: centre.y - 3 });
    context.spawnEnemy("scuttler", { x: centre.x - 6.5, y: centre.y + 3 });
  },

  "ironhide-abomination": (context) => {
    const centre = centreOf(context);
    context.spawnElite("ironhide-abomination", { x: centre.x + 6, y: centre.y });
    context.spawnEnemy("infected-survivor", { x: centre.x - 5, y: centre.y - 3 });
    context.spawnEnemy("infected-survivor", { x: centre.x - 5, y: centre.y + 3 });
  },

  "splitcaller-weaver": (context) => {
    const centre = centreOf(context);
    context.setWaveLiveCap(16);
    context.setWaveThreatBudget(48);
    context.spawnElite("splitcaller-weaver", { x: centre.x + 6.5, y: centre.y });
    context.spawnEnemy("nest-hatchling", { x: centre.x - 5, y: centre.y - 2 });
    context.spawnEnemy("nest-hatchling", { x: centre.x - 5, y: centre.y + 2 });
  },

  "voltaic-warden": (context) => {
    const centre = centreOf(context);
    context.spawnElite("voltaic-warden", { x: centre.x + 6.5, y: centre.y });
    context.spawnEnemy("scuttler", { x: centre.x - 5.5, y: centre.y - 3 });
    context.spawnEnemy("scuttler", { x: centre.x - 5.5, y: centre.y + 3 });
  },

  "siege-crusher": (context) => {
    context.spawnMiniBoss("siege-crusher", { x: 4, y: 14 });
    context.spawnEnemy("scuttler", { x: 25, y: 3 });
    context.spawnEnemy("scuttler", { x: 26, y: 13 });
  },

  "brood-warden": (context) => {
    context.spawnMiniBoss("brood-warden", { x: 7, y: context.heightMetres / 2 });
    context.spawnEnemy("egg-cluster", { x: context.widthMetres - 8, y: 4 });
  },

  "rift-stalker": (context) => {
    context.spawnMiniBoss("rift-stalker", { x: 7, y: context.heightMetres / 2 });
    context.spawnEnemy("scuttler", { x: context.widthMetres - 8, y: 4 });
  },

  "synapse-herald": (context) => {
    const centre = { ...context.playerPosition };
    context.setWaveLiveCap(10);
    context.setWaveThreatBudget(44);
    context.spawnMiniBoss("synapse-herald", { x: centre.x - 6.5, y: centre.y - 1.5 });
    context.spawnEnemy("brain-blob", { x: centre.x - 3.8, y: centre.y + 2.7 });
    context.spawnEnemy("brain-blob", { x: centre.x + 4.2, y: centre.y - 3.2 });
  },

  "assembly-prime": (context) => {
    const centre = { ...context.playerPosition };
    context.setWaveLiveCap(10);
    context.setWaveThreatBudget(51);
    const id = context.spawnMiniBoss("assembly-prime", { x: centre.x - 7, y: centre.y - 4 });
    byId(context, id).foundryThreatRemaining = 7;
    context.spawnEnemy("arc-warden", { x: centre.x + 6.8, y: centre.y - 3.2 });
    context.spawnEnemy("scrap-skitterer", { x: centre.x + 5.2, y: centre.y + 2.5 });
    context.spawnEnemy("scrap-skitterer", { x: centre.x - 3.2, y: centre.y + 4 });
  },

  "storm-regent": (context) => {
    const centre = { ...context.playerPosition };
    context.setWaveLiveCap(10);
    context.setWaveThreatBudget(44);
    context.spawnMiniBoss("storm-regent", { x: centre.x - 7.2, y: centre.y - 3.6 });
    context.spawnEnemy("scuttler", { x: centre.x + 6.8, y: centre.y - 3.4 });
    context.spawnEnemy("scuttler", { x: centre.x + 5.8, y: centre.y + 3.8 });
  },

  "abomination-prime": (context) => {
    const centre = { ...context.playerPosition };
    context.setWaveLiveCap(10);
    context.setWaveThreatBudget(48);
    context.spawnMiniBoss("abomination-prime", { x: centre.x - 5.4, y: centre.y - 2.4 });
    context.spawnEnemy("corrupted-marine", { x: centre.x + 6.2, y: centre.y - 3.4 });
    context.spawnEnemy("infected-survivor", { x: centre.x + 5.2, y: centre.y + 2.6 });
    context.spawnEnemy("infected-survivor", { x: centre.x - 3.8, y: centre.y + 4.1 });
  },

  "the-choir": (context) => {
    const centre = centreOf(context);
    context.setWaveLiveCap(12);
    context.spawnBoss("the-choir", { x: centre.x - 5.5, y: centre.y });
  },

  "foundry-sovereign": (context) => {
    const centre = centreOf(context);
    context.setWaveLiveCap(16);
    context.spawnBoss("foundry-sovereign", { x: centre.x - 6, y: centre.y });
  },

  "infected-survivor": (context) => {
    const centre = centreOf(context);
    const positions = Array.from({ length: INFECTED_SURVIVOR_PACK_CAP }, (_, index) => ({
      x: centre.x - 8.5 - (index % 2) * 0.9,
      y: centre.y - 4.2 + index * 1.2,
    }));
    for (const position of positions) {
      context.spawnEnemy("infected-survivor", position);
    }
  },

  "corrupted-marine": (context) => {
    const centre = centreOf(context);
    context.spawnEnemy("corrupted-marine", { x: centre.x - 7.5, y: centre.y - 2.8 });
    context.spawnEnemy("corrupted-marine", { x: centre.x + 7.2, y: centre.y + 3.4 });
  },

  abomination: (context) => {
    const centre = { ...context.playerPosition };
    context.spawnEnemy("abomination", { x: centre.x - 2.1, y: centre.y });
    context.spawnEnemy("infected-survivor", { x: centre.x + 6.5, y: centre.y - 3.2 });
    context.spawnEnemy("corrupted-marine", { x: centre.x + 7.5, y: centre.y + 3.4 });
  },

  "corrupted-human": (context) => {
    const centre = { ...context.playerPosition };
    const survivorOffsets = [
      [-8, -4], [-8.8, -1.5], [-8.4, 2], [7, -4.4], [8.2, -1.2], [7.6, 3.2],
    ] as const;
    for (const [x, y] of survivorOffsets) {
      context.spawnEnemy("infected-survivor", { x: centre.x + x, y: centre.y + y });
    }
    context.spawnEnemy("corrupted-marine", { x: centre.x - 12, y: centre.y - 5.5 });
    context.spawnEnemy("corrupted-marine", { x: centre.x + 2, y: centre.y + 9.5 });
    context.spawnEnemy("abomination", { x: centre.x - 5.2, y: centre.y + 0.5 });
  },

  "nest-weaver": (context) => {
    const centre = { ...context.playerPosition };
    // The lab uses wave-one capacity so reservations are exercised, not bypassed.
    context.setWaveLiveCap(18);
    context.setWaveThreatBudget(25);
    context.spawnEnemy("nest-weaver", { x: centre.x - 7.2, y: centre.y - 1.8 });
    context.spawnEnemy("infected-survivor", { x: centre.x + 6.5, y: centre.y - 3.4 });
    context.spawnEnemy("infected-survivor", { x: centre.x + 7.3, y: centre.y + 2.8 });
  },

  "storm-savant": (context) => {
    const centre = { ...context.playerPosition };
    context.setWaveLiveCap(18);
    context.setWaveThreatBudget(18);
    context.spawnEnemy("storm-savant", { x: centre.x - 8, y: centre.y });
    context.spawnEnemy("infected-survivor", { x: centre.x + 7, y: centre.y - 3.5 });
  },

  "scrap-skitterer": (context) => {
    const centre = { ...context.playerPosition };
    context.setWaveLiveCap(18);
    context.setWaveThreatBudget(SCRAP_SKITTERER_PACK_CAP);
    for (let index = 0; index < SCRAP_SKITTERER_PACK_CAP; index += 1) {
      const side = index % 2 === 0 ? -1 : 1;
      const row = Math.floor(index / 2);
      context.spawnEnemy("scrap-skitterer", {
        x: centre.x + side * (5.2 + row * 0.65),
        y: centre.y - 4.5 + row * 2.8,
      });
    }
  },

  "arc-warden": (context) => {
    const centre = { ...context.playerPosition };
    context.setWaveLiveCap(12);
    context.setWaveThreatBudget(ARC_WARDEN_LAB_CAP * 4);
    // The west Warden begins with an authored long pre-cover lane so the lab
    // always demonstrates the square cover-stop language beside a free lane.
    // Ordinary Warden acquisition still obeys the pure 3.4-9.5 m range gate.
    const coverWardenId = context.spawnEnemy("arc-warden", { x: centre.x - 12.5, y: centre.y + 0.75 });
    const coverWarden = byId(context, coverWardenId);
    const coverLane = lockArcWardenLane(
      coverWarden.position,
      context.playerPosition,
      context.activeObstacles(),
    );
    if (coverLane) {
      coverWarden.arcWardenBehavior = {
        phase: "charge",
        phaseRemainingSeconds: ARC_WARDEN_CHARGE_SECONDS,
        cooldownSeconds: 0,
        lockedLane: coverLane,
      };
      coverWarden.facingDirection = { ...coverLane.direction };
    }
    context.spawnEnemy("arc-warden", { x: centre.x + 8, y: centre.y + 2.2 });
  },

  "cyborg-reclaimer": (context) => {
    const centre = { ...context.playerPosition };
    context.setWaveLiveCap(12);
    context.setWaveThreatBudget(14);
    const reclaimerId = context.spawnEnemy("cyborg-reclaimer", { x: centre.x - 5.3, y: centre.y - 2.2 });
    const arcId = context.spawnEnemy("arc-warden", { x: centre.x - 1.8, y: centre.y - 3.2 });
    const skittererIds = [
      context.spawnEnemy("scrap-skitterer", { x: centre.x - 2.8, y: centre.y + 1.2 }),
      context.spawnEnemy("scrap-skitterer", { x: centre.x + 3.5, y: centre.y - 2.5 }),
      context.spawnEnemy("scrap-skitterer", { x: centre.x + 4.4, y: centre.y + 0.4 }),
      context.spawnEnemy("scrap-skitterer", { x: centre.x + 2.8, y: centre.y + 3.1 }),
    ];
    const reclaimer = byId(context, reclaimerId);
    reclaimer.reclaimerBehavior = { ...reclaimer.reclaimerBehavior, cooldownSeconds: 0 };
    const arc = byId(context, arcId);
    arc.health = Math.max(1, arc.maxHealth - 4);
    for (const id of skittererIds.slice(0, 2)) {
      const skitterer = byId(context, id);
      skitterer.health = Math.max(1, skitterer.maxHealth - 2);
    }
  },

  "foundry-fabricator": (context) => {
    const centre = { ...context.playerPosition };
    context.setWaveLiveCap(8);
    context.setWaveThreatBudget(19);
    context.spawnEnemy("foundry-fabricator", { x: centre.x - 5.2, y: centre.y - 1.4 });
    const arcId = context.spawnEnemy("arc-warden", { x: centre.x + 6.2, y: centre.y - 2.8 });
    context.spawnEnemy("cyborg-reclaimer", { x: centre.x - 1.8, y: centre.y - 3.4 });
    context.spawnEnemy("scrap-skitterer", { x: centre.x + 4.4, y: centre.y + 2.8 });
    context.spawnEnemy("scrap-skitterer", { x: centre.x - 3.8, y: centre.y + 3.5 });
    const arc = byId(context, arcId);
    arc.health = Math.max(1, arc.maxHealth - 4);
  },

  ripper: (context) => {
    const centre = centreOf(context);
    context.spawnEnemy("ripper", { x: centre.x + 4.5, y: centre.y - 2.5 });
    context.spawnEnemy("ripper", { x: centre.x - 5, y: centre.y + 2.5 });
    context.spawnEnemy("scuttler", { x: centre.x + 6, y: centre.y + 3.5 });
  },

  "razor-scuttler": (context) => {
    const centre = centreOf(context);
    context.spawnEnemy("razor-scuttler", { x: centre.x - 6.2, y: centre.y });
    context.spawnEnemy("razor-scuttler", { x: centre.x + 5.6, y: centre.y - 3.4 });
    context.spawnEnemy("scuttler", { x: centre.x + 4.8, y: centre.y + 4.2 });
  },

  quillback: (context) => {
    const centre = centreOf(context);
    context.spawnEnemy("quillback", { x: centre.x + 7.5, y: centre.y });
    context.spawnEnemy("quillback", { x: centre.x - 7, y: centre.y - 3.5 });
    context.spawnEnemy("scuttler", { x: centre.x + 4.5, y: centre.y + 4 });
  },

  spinewheel: (context) => {
    const centre = centreOf(context);
    context.spawnEnemy("spinewheel", { x: centre.x - 7.5, y: centre.y });
    context.spawnEnemy("spinewheel", { x: centre.x + 6.5, y: centre.y - 4.5 });
    context.spawnEnemy("scuttler", { x: centre.x + 5, y: centre.y + 4.5 });
  },

  "tether-bloom": (context) => {
    const centre = centreOf(context);
    context.spawnEnemy("tether-bloom", { x: centre.x - 3.2, y: centre.y });
    context.spawnEnemy("tether-bloom", { x: centre.x + 4.6, y: centre.y - 2.8 });
    context.spawnEnemy("scuttler", { x: centre.x + 5.5, y: centre.y + 3.8 });
  },

  "escort-objective": (context) => {
    const centreY = context.heightMetres / 2;
    context.spawnEnemy("scuttler", { x: 4.8, y: centreY });
    context.spawnEnemy("infected-survivor", { x: context.widthMetres / 2, y: centreY - 4.5 });
    context.spawnEnemy("corrupted-marine", { x: context.widthMetres - 10, y: centreY + 1.5 });
  },

  "deny-objective": (context) => {
    const centre = centreOf(context);
    for (const position of [
      { x: centre.x - 7, y: centre.y - 3.5 },
      { x: centre.x + 7, y: centre.y - 3.5 },
      { x: centre.x, y: centre.y + 5 },
    ]) context.spawnEnemy("storm-node", position);
    context.spawnEnemy("storm-savant", { x: centre.x, y: centre.y - 6 });
    context.spawnEnemy("scrap-skitterer", { x: centre.x - 3, y: centre.y + 3 });
    context.spawnEnemy("scrap-skitterer", { x: centre.x + 3, y: centre.y + 3 });
  },

  "collect-objective": (context) => {
    const centre = centreOf(context);
    context.spawnEnemy("infected-survivor", { x: centre.x - 8, y: centre.y });
    context.spawnEnemy("infected-survivor", { x: centre.x + 8, y: centre.y });
    context.spawnEnemy("corrupted-marine", { x: centre.x, y: centre.y - 7 });
  },

  "bastion-eater": (context) => {
    context.spawnBastionEater({
      x: context.widthMetres / 2 - 7,
      y: context.heightMetres / 2,
    });
  },

  "density-capacity": (context) => {
    const roster = buildDensityCapacityRoster();
    context.setWaveLiveCap(roster.length);
    context.resetDensityCounters();
    for (const type of roster) {
      context.spawnEnemy(type);
      context.recordDensitySpawn({ type });
    }
  },

  "aurum-hoarder": (context) => {
    context.spawnAurumHoarder({
      x: context.widthMetres / 2 + 5,
      y: context.heightMetres / 2,
    });
  },

  "scrap-shop": (context) => {
    context.setPlayerHealth(5.5);
    context.queueDecision(context.openScrapShopVisit());
  },

  /** Deterministic review lab for the tile placement, stash, and merge contract. */
  "weapon-gate": (context) => {
    const incoming: WeaponTile = {
      instanceId: context.nextWeaponInstanceId(),
      weaponId: "scattergun",
      weaponClass: "heavy",
      tier: 1,
    };
    context.setPendingWeaponTile(incoming);
    context.queueDecision(context.buildWeaponPlacementDecision(incoming));
  },

  /** Quiet live HUD fixture; the scene supplies the requested four-weapon page. */
  "weapon-review": () => {},

  /**
   * Exact-size review lab for the dedicated world-pickup and HUD identities.
   * EMP is intentionally absent from the timed tray because its real mechanic
   * detonates immediately; it remains present in the pickup ring.
   */
  "powerup-identity": (context) => {
    const centre = centreOf(context);
    const types = [
      "siege-loader",
      "phase-jacket",
      "hunter-optics",
      "last-stand-stimulant",
      "emp-charge",
      "butchers-serum",
    ] as const satisfies readonly PowerupType[];
    types.forEach((type, index) => {
      const angle = -Math.PI / 2 + index * Math.PI / 3;
      context.spawnPowerup(type, {
        x: centre.x + Math.cos(angle) * 4.2,
        y: centre.y + Math.sin(angle) * 4.2,
      });
      context.activatePowerup(type);
    });
  },

  /** Stable live-art lab for Batch J body silhouettes, cadence, and telegraphs. */
  "batch-j": (context) => {
    const centre = centreOf(context);
    context.spawnEnemy("swarm-scuttler", { x: centre.x - 7.5, y: centre.y - 4.5 });
    context.spawnElite("razorlord", { x: centre.x + 7, y: centre.y - 4 });
    context.spawnElite("blightspitter", { x: centre.x + 7.5, y: centre.y + 4 });
    context.spawnElite("quillback-matriarch", { x: centre.x - 7, y: centre.y + 4.5 });
  },
});

/** Every scenario the review routes can boot has an entry; the map is exhaustive. */
export function populateScenario(
  scenario: CombatScenario,
  context: ScenarioPopulationContext,
): void {
  POPULATE[scenario](context);
}

export const SCENARIO_IDS = Object.freeze(Object.keys(POPULATE) as CombatScenario[]);

export const DENSITY_PRESSURE_RESET: Readonly<Record<EnemyPressureRole, number>> = Object.freeze({
  pursuit: 0,
  ranged: 0,
  specialist: 0,
  boss: 0,
});
