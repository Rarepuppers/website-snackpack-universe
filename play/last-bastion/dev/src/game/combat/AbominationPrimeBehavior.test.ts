import { describe, expect, it } from "vitest";
import type { ArenaDefinition } from "../arena/ArenaDefinition";
import {
  ABOMINATION_PRIME_BIOMASS_REGEN_SECONDS,
  ABOMINATION_PRIME_GRAB_BREAK_DAMAGE,
  ABOMINATION_PRIME_HAZARD_SECONDS,
  ABOMINATION_PRIME_SLAM_RADIUS_METRES,
  ABOMINATION_PRIME_THROW_RADIUS_METRES,
  abominationPrimeMoveHasEscapeLane,
  createAbominationPrimeBehavior,
  damageAbominationPrimeGrab,
  selectAbominationPrimeMove,
  stepAbominationPrimeBehavior,
  type AbominationPrimeContext,
  type AbominationPrimeState,
} from "./AbominationPrimeBehavior";

const ARENA: ArenaDefinition = {
  id: "abomination-prime-test",
  widthMetres: 24,
  heightMetres: 16,
  tileSizeMetres: 1,
  obstacles: [],
};

const BASE: AbominationPrimeContext = {
  ownerPosition: { x: 8, y: 8 },
  playerPosition: { x: 10.5, y: 8 },
  ownerHealth: 920,
  ownerMaxHealth: 920,
  arena: ARENA,
  playerRadiusMetres: 0.55,
  grabLineClear: true,
  playerDodged: false,
};

function setupState(seed = 0, context = BASE): AbominationPrimeState {
  return stepAbominationPrimeBehavior(createAbominationPrimeBehavior(seed, context), 2, context).state;
}

function enterAction(state: AbominationPrimeState, context = BASE): AbominationPrimeState {
  return stepAbominationPrimeBehavior(state, state.phaseRemainingSeconds, context).state;
}

describe("Abomination Prime behavior boundary", () => {
  it("selects three deterministic moves without immediate repeats", () => {
    const first = stepAbominationPrimeBehavior(setupState(0), 1, BASE);
    const repeat = stepAbominationPrimeBehavior(setupState(0), 1, BASE);
    expect(first).toEqual(repeat);
    expect(first.moveStarted).toBe("ground-slam");
    const nextSetup: AbominationPrimeState = {
      ...setupState(0),
      previousMove: "ground-slam",
      attackIndex: 1,
    };
    expect(selectAbominationPrimeMove(nextSetup, BASE)).toBe("biomass-grab");
  });

  it("locks slam geometry and preserves a player-radius escape sample", () => {
    const begun = stepAbominationPrimeBehavior(setupState(0), 1, BASE).state;
    expect(begun).toMatchObject({ move: "ground-slam", lockedTarget: BASE.playerPosition });
    expect(abominationPrimeMoveHasEscapeLane(begun, BASE)).toBe(true);
    const moved = stepAbominationPrimeBehavior(begun, 0.2, {
      ...BASE,
      playerPosition: { x: 18, y: 3 },
    });
    expect(moved.state.lockedTarget).toEqual(BASE.playerPosition);
    expect(ABOMINATION_PRIME_SLAM_RADIUS_METRES).toBe(1.8);
  });

  it("breaks a committed grab on dodge, cover/range loss, or damage", () => {
    const begun = stepAbominationPrimeBehavior(setupState(1), 1, BASE).state;
    expect(begun.move).toBe("biomass-grab");
    const active = enterAction(begun);
    expect(stepAbominationPrimeBehavior(active, 0.01, { ...BASE, playerDodged: true }))
      .toMatchObject({ grabBroken: true, state: { phase: "recovery" } });
    expect(stepAbominationPrimeBehavior(active, 0.01, { ...BASE, grabLineClear: false }))
      .toMatchObject({ grabBroken: true, state: { phase: "recovery" } });
    expect(stepAbominationPrimeBehavior(active, 0.01, {
      ...BASE,
      playerPosition: { x: 20, y: 8 },
    })).toMatchObject({ grabBroken: true, state: { phase: "recovery" } });
    const damaged = damageAbominationPrimeGrab(active, ABOMINATION_PRIME_GRAB_BREAK_DAMAGE);
    expect(stepAbominationPrimeBehavior(damaged, 0.01, BASE))
      .toMatchObject({ grabBroken: true, state: { phase: "recovery" } });
  });

  it("creates one fixed finite thrown hazard and waits for regeneration", () => {
    const begun = stepAbominationPrimeBehavior(setupState(2), 1, BASE).state;
    expect(begun).toMatchObject({ move: "thrown-biomass", lockedTarget: BASE.playerPosition });
    const action = enterAction(begun);
    const landed = stepAbominationPrimeBehavior(action, action.phaseRemainingSeconds, BASE);
    expect(landed.hazardCreated).toMatchObject({
      centre: BASE.playerPosition,
      radiusMetres: ABOMINATION_PRIME_THROW_RADIUS_METRES,
      remainingSeconds: ABOMINATION_PRIME_HAZARD_SECONDS,
    });
    expect(landed.state.biomassCooldownSeconds).toBe(ABOMINATION_PRIME_BIOMASS_REGEN_SECONDS);
    expect(selectAbominationPrimeMove({
      ...landed.state,
      phase: "setup",
      previousMove: "biomass-grab",
    }, BASE)).not.toBe("thrown-biomass");
    const expired = stepAbominationPrimeBehavior(landed.state, ABOMINATION_PRIME_HAZARD_SECONDS, BASE);
    expect(expired).toMatchObject({ hazardExpired: true, state: { hazard: null, biomassCooldownSeconds: 1 } });
  });

  it("moves a thrown-biomass landing point off intact cover without retargeting later", () => {
    const context: AbominationPrimeContext = {
      ...BASE,
      arena: {
        ...ARENA,
        obstacles: [{ id: "crate", kind: "cargo-crate", x: 10, y: 7.5, width: 1, height: 1 }],
      },
    };
    const begun = stepAbominationPrimeBehavior(setupState(2, context), 1, context).state;
    expect(begun.move).toBe("thrown-biomass");
    expect(begun.lockedTarget).not.toEqual(context.playerPosition);
    const moved = stepAbominationPrimeBehavior(begun, 0.2, {
      ...context,
      playerPosition: { x: 18, y: 3 },
    });
    expect(moved.state.lockedTarget).toEqual(begun.lockedTarget);
  });

  it("waits rather than repeating when the only available move is the previous move", () => {
    const farContext = { ...BASE, playerPosition: { x: 19, y: 8 } };
    const state = {
      ...setupState(0, farContext),
      previousMove: "thrown-biomass" as const,
      attackIndex: 2,
    };
    expect(selectAbominationPrimeMove(state, farContext)).toBeNull();
    expect(stepAbominationPrimeBehavior(state, 1, farContext)).toMatchObject({
      moveStarted: null,
      state: { phase: "setup" },
    });
  });

  it("frenzy changes timing only, never radii, hazard lifetime, or break threshold", () => {
    const normal = stepAbominationPrimeBehavior(setupState(2), 1, BASE).state;
    const frenzyContext = { ...BASE, ownerHealth: 100 };
    const frenzy = stepAbominationPrimeBehavior(setupState(2, frenzyContext), 1, frenzyContext).state;
    expect(frenzy.phaseRemainingSeconds).toBeLessThan(normal.phaseRemainingSeconds);
    expect(ABOMINATION_PRIME_SLAM_RADIUS_METRES).toBe(1.8);
    expect(ABOMINATION_PRIME_THROW_RADIUS_METRES).toBe(2.1);
    expect(ABOMINATION_PRIME_HAZARD_SECONDS).toBe(4.5);
    expect(ABOMINATION_PRIME_GRAB_BREAK_DAMAGE).toBe(32);
    expect(frenzy.hazard).toBeNull();
  });
});
