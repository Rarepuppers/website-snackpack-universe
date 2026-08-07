import { describe, expect, it } from "vitest";
import {
  damageTypeForStatus,
  dominantBuildupProgress,
  primaryDamageAffinity,
} from "./EnemyDamageReadout";
import { STATUS_BUILDUP_THRESHOLD } from "../combat/damageTypes";

describe("primaryDamageAffinity", () => {
  it("reports the machine faction's shock weakness", () => {
    const mark = primaryDamageAffinity("arc-warden");
    expect(mark?.damageType).toBe("shock");
    expect(mark?.affinity).toBe("weak");
  });

  it("reports the corrupted-human fire weakness added on 7 Aug", () => {
    for (const type of ["infected-survivor", "corrupted-marine", "abomination"] as const) {
      const mark = primaryDamageAffinity(type);
      expect(mark?.damageType, type).toBe("fire");
      expect(mark?.affinity, type).toBe("weak");
    }
  });

  it("prefers a weakness over a resistance when an enemy has both", () => {
    // slime-spitter is fire 1.5 / toxic 0.25. "Hit it with fire" is actionable;
    // "don't hit it with toxic" mostly is not.
    const mark = primaryDamageAffinity("slime-spitter");
    expect(mark?.affinity).toBe("weak");
    expect(mark?.damageType).toBe("fire");
  });

  it("falls back to the resistance when there is no weakness", () => {
    // storm-savant resists shock at 0.45 and is weak to nothing.
    const mark = primaryDamageAffinity("storm-savant");
    expect(mark?.affinity).toBe("resistant");
    expect(mark?.damageType).toBe("shock");
  });

  it("returns null for the deliberately neutral enemies", () => {
    for (const type of ["scuttler", "swarm-scuttler", "aurum-hoarder"] as const) {
      expect(primaryDamageAffinity(type), type).toBeNull();
    }
  });

  it("picks the strongest weakness when several qualify", () => {
    // bastion-eater is toxic 0.5 / cryo 0.8 — both resistances, toxic stronger.
    const mark = primaryDamageAffinity("bastion-eater");
    expect(mark?.affinity).toBe("resistant");
    expect(mark?.damageType).toBe("toxic");
  });
});

describe("dominantBuildupProgress", () => {
  it("returns null when nothing is building", () => {
    expect(dominantBuildupProgress({}, [])).toBeNull();
  });

  it("reports progress as a fraction of the threshold", () => {
    const result = dominantBuildupProgress({ blaze: STATUS_BUILDUP_THRESHOLD / 2 }, []);
    expect(result?.status).toBe("blaze");
    expect(result?.progress).toBeCloseTo(0.5);
  });

  it("clamps at 1 rather than overflowing the tick", () => {
    expect(dominantBuildupProgress({ blaze: 999 }, [])?.progress).toBe(1);
  });

  it("picks whichever status is furthest along", () => {
    const result = dominantBuildupProgress({ blaze: 2, corrode: 6 }, []);
    expect(result?.status).toBe("corrode");
  });

  it("ignores a status that is already active", () => {
    // Once it is burning, the status itself is the readout — not progress
    // toward re-applying it.
    const result = dominantBuildupProgress({ blaze: 7, corrode: 3 }, ["blaze"]);
    expect(result?.status).toBe("corrode");
  });

  it("returns null when every building status is already active", () => {
    expect(dominantBuildupProgress({ blaze: 7 }, ["blaze"])).toBeNull();
  });

  it("ignores zero and negative buildup", () => {
    expect(dominantBuildupProgress({ blaze: 0, corrode: -3 }, [])).toBeNull();
  });
});

describe("damageTypeForStatus", () => {
  it("maps each status back to the damage type that causes it", () => {
    expect(damageTypeForStatus("blaze")).toBe("fire");
    expect(damageTypeForStatus("overload")).toBe("shock");
    expect(damageTypeForStatus("freeze")).toBe("cryo");
    expect(damageTypeForStatus("corrode")).toBe("toxic");
  });
});
