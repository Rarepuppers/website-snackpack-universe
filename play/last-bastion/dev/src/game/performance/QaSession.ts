import { HITCH_THRESHOLD_MILLISECONDS, SEVERE_HITCH_THRESHOLD_MILLISECONDS } from "./FramePacingTelemetry";

/** Local QA only. Retain a bounded prefix, never average rolling-window percentiles. */
export class QaSession {
  private frames: number[] = [];
  private startedAt: number | null = null;
  private stoppedAt: number | null = null;
  private previous = 0;
  private suspended = false;
  private excluded = 0;
  private active = 0;
  private dropped = 0;
  private invalid = 0;
  private hitches = 0;
  private severeHitches = 0;
  private maximum = 0;

  constructor(private readonly capacity = 120_000) {
    if (!Number.isInteger(capacity) || capacity < 1) throw new Error("Invalid QA sample capacity");
  }

  start(now: number, suspended = false): void {
    this.reset();
    this.startedAt = this.previous = now;
    this.suspended = suspended;
  }

  reset(): void {
    this.frames = [];
    this.startedAt = this.stoppedAt = null;
    this.previous = this.excluded = this.active = this.dropped = this.invalid = 0;
    this.hitches = this.severeHitches = this.maximum = 0;
    this.suspended = false;
  }

  tick(now: number, suspended: boolean): void {
    if (this.startedAt === null || this.stoppedAt !== null) return;
    const elapsed = now - this.previous;
    if (!Number.isFinite(elapsed) || elapsed <= 0) { this.invalid++; return; }
    this.previous = now;
    // Exclude boundary intervals too: the first resumed frame includes suspended time.
    if (suspended || this.suspended) this.excluded += elapsed;
    else {
      this.active += elapsed;
      this.maximum = Math.max(this.maximum, elapsed);
      if (elapsed >= HITCH_THRESHOLD_MILLISECONDS) this.hitches++;
      if (elapsed >= SEVERE_HITCH_THRESHOLD_MILLISECONDS) this.severeHitches++;
      if (this.frames.length < this.capacity) this.frames.push(elapsed);
      else this.dropped++;
    }
    this.suspended = suspended;
  }

  stop(now: number): void {
    if (this.startedAt !== null && this.stoppedAt === null) this.stoppedAt = Math.max(this.previous, now);
  }

  progress(now: number) {
    const wall = this.startedAt === null ? 0 : Math.max(0, (this.stoppedAt ?? now) - this.startedAt);
    return {
      state: this.startedAt === null ? "idle" : this.stoppedAt === null ? "recording" : "stopped",
      capacity: this.capacity, retainedSamples: this.frames.length, droppedSamples: this.dropped,
      invalidSamples: this.invalid, activeSamples: this.frames.length + this.dropped,
      wallMilliseconds: wall, activeMilliseconds: this.active, excludedMilliseconds: this.excluded,
      unobservedMilliseconds: Math.max(0, wall - this.active - this.excluded),
      percentileScope: this.dropped ? "retained prefix only; session overflowed" : "all active samples",
      maximumFrameMilliseconds: this.maximum || null,
      hitchCount: this.hitches, severeHitchCount: this.severeHitches,
      hitchThresholdMilliseconds: HITCH_THRESHOLD_MILLISECONDS,
      severeHitchThresholdMilliseconds: SEVERE_HITCH_THRESHOLD_MILLISECONDS,
    };
  }

  snapshot(now: number) {
    const sorted = [...this.frames].sort((a, b) => a - b);
    const percentile = (ratio: number) => sorted.length ? sorted[Math.ceil(sorted.length * ratio) - 1]! : null;
    return { ...this.progress(now), p95FrameMilliseconds: percentile(.95), p99FrameMilliseconds: percentile(.99) };
  }
}
