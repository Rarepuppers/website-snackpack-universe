import type { EvasiveMoveStats } from "./EvasiveMove";
import { validateEvasiveMoveStats } from "./EvasiveMove";
import type { Vector2Data } from "../math/Vector2Data";
import { normalizeVector } from "../math/Vector2Data";

export type HeroState = "idle" | "moving" | "evading" | "defeated";

export interface HeroFrameState {
  state: HeroState;
  displacementMetres: Vector2Data;
  isInvulnerable: boolean;
  evasiveProgress: number;
}

export class HeroStateMachine {
  private state: HeroState = "idle";
  private evasiveElapsedSeconds = 0;
  private evasiveDirection: Vector2Data = { x: 1, y: 0 };
  private evasiveStats: EvasiveMoveStats | null = null;

  get currentState(): HeroState {
    return this.state;
  }

  startEvasiveMove(direction: Vector2Data, stats: EvasiveMoveStats): boolean {
    if (this.state === "evading" || this.state === "defeated") {
      return false;
    }

    validateEvasiveMoveStats(stats);
    const normalized = normalizeVector(direction);

    this.evasiveDirection = normalized.x === 0 && normalized.y === 0
      ? { x: 1, y: 0 }
      : normalized;
    this.evasiveStats = { ...stats };
    this.evasiveElapsedSeconds = 0;
    this.state = "evading";
    return true;
  }

  update(deltaSeconds: number, moveDirection: Vector2Data): HeroFrameState {
    if (this.state === "defeated") {
      return this.frame({ x: 0, y: 0 }, false, 0);
    }

    if (this.state !== "evading" || !this.evasiveStats) {
      const moving = moveDirection.x !== 0 || moveDirection.y !== 0;
      this.state = moving ? "moving" : "idle";
      return this.frame({ x: 0, y: 0 }, false, 0);
    }

    const stats = this.evasiveStats;
    const previousProgress = Math.min(this.evasiveElapsedSeconds / stats.durationSeconds, 1);
    const wasInvulnerable = this.evasiveElapsedSeconds < stats.invulnerabilitySeconds;
    this.evasiveElapsedSeconds = Math.min(
      this.evasiveElapsedSeconds + Math.max(deltaSeconds, 0),
      stats.durationSeconds,
    );
    const nextProgress = Math.min(this.evasiveElapsedSeconds / stats.durationSeconds, 1);
    const distanceThisFrame = stats.distanceMetres * (nextProgress - previousProgress);
    const displacementMetres = {
      x: this.evasiveDirection.x * distanceThisFrame,
      y: this.evasiveDirection.y * distanceThisFrame,
    };

    if (nextProgress >= 1) {
      this.state = moveDirection.x !== 0 || moveDirection.y !== 0 ? "moving" : "idle";
      this.evasiveStats = null;
    }

    return this.frame(displacementMetres, wasInvulnerable, nextProgress);
  }

  defeat(): void {
    this.state = "defeated";
    this.evasiveStats = null;
  }

  private frame(
    displacementMetres: Vector2Data,
    isInvulnerable: boolean,
    evasiveProgress: number,
  ): HeroFrameState {
    return {
      state: this.state,
      displacementMetres,
      isInvulnerable,
      evasiveProgress,
    };
  }
}
