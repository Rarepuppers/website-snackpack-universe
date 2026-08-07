// TEMPORARY equivalence harness — untracked, deleted once the refactor is proven.
// Steps real simulations for many frames and records the full snapshot stream,
// so RNG-sequence and ordering changes surface, not just the initial state.
import { writeFileSync } from "node:fs";
import { describe, it } from "vitest";
import { CombatSimulation, type CombatScenario } from "./CombatSimulation";
import type { PlayerIntent } from "../input/PlayerIntent";

const SCENARIOS: CombatScenario[] = [
  "slime-spitter", "carapace-elite", "siege-crusher", "brood-warden", "rift-stalker",
  "synapse-herald", "assembly-prime", "storm-regent", "abomination-prime",
  "infected-survivor", "corrupted-marine", "abomination", "corrupted-human",
  "nest-weaver", "storm-savant", "scrap-skitterer", "arc-warden", "cyborg-reclaimer",
  "foundry-fabricator", "ripper", "razor-scuttler", "quillback", "spinewheel",
  "tether-bloom", "bastion-eater", "density-capacity", "aurum-hoarder", "batch-j",
];

/** Deterministic wandering input so the player moves through the arena. */
function intentAt(frame: number): PlayerIntent {
  const angle = frame * 0.11;
  return {
    move: { x: Math.cos(angle), y: Math.sin(angle * 0.7) },
    aim: { x: Math.cos(angle * 1.3), y: Math.sin(angle) },
    firing: frame % 3 !== 0,
    evading: frame % 37 === 0,
    interacting: false,
    usingKit: frame % 53 === 0,
    ultimate: frame % 97 === 0,
  } as PlayerIntent;
}

describe("behaviour equivalence capture", () => {
  it("records a long stepped run for every scenario", () => {
    const captured: Record<string, unknown> = {};
    for (const scenario of SCENARIOS) {
      const simulation = new CombatSimulation({ scenario, seed: 4242 });
      const frames: unknown[] = [];
      for (let frame = 0; frame < 600; frame += 1) {
        const snapshot = simulation.step(intentAt(frame), 1 / 60);
        if (frame % 20 === 0) {
          frames.push({
            frame,
            status: snapshot.status,
            playerHealth: snapshot.playerHealth,
            enemies: snapshot.enemies.map((enemy) => [
              enemy.id, enemy.type, Math.round(enemy.position.x * 1e6),
              Math.round(enemy.position.y * 1e6), Math.round(enemy.health * 1e6),
            ]),
            projectiles: snapshot.projectiles.length,
            events: snapshot.events?.length ?? 0,
          });
        }
      }
      captured[scenario] = frames;
    }
    writeFileSync(process.env.EQUIV_OUT!, JSON.stringify(captured));
  });
});
