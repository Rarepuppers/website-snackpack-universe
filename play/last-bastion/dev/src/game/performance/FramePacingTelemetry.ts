export interface FramePacingSnapshot {
  readonly ready: boolean;
  readonly sampleCount: number;
  readonly sampledMilliseconds: number;
  readonly averageFrameMilliseconds: number;
  readonly p95FrameMilliseconds: number;
  readonly p99FrameMilliseconds: number;
  readonly onePercentLowFps: number;
}

const DEFAULT_CAPACITY = 600;
const DEFAULT_READY_SAMPLES = 120;

/**
 * Bounded rolling frame-time window for release QA. Suspended frames are
 * excluded so tab switches and pause-menu inspection do not poison combat
 * measurements; real in-combat stalls remain visible in p95/p99.
 */
export class FramePacingTelemetry {
  private readonly samples: number[] = [];

  constructor(
    private readonly capacity = DEFAULT_CAPACITY,
    private readonly readySamples = DEFAULT_READY_SAMPLES,
  ) {
    if (!Number.isInteger(capacity) || capacity <= 0) throw new Error("capacity must be a positive integer");
    if (!Number.isInteger(readySamples) || readySamples <= 0 || readySamples > capacity) {
      throw new Error("readySamples must be a positive integer no greater than capacity");
    }
  }

  sample(deltaMilliseconds: number, suspended = false): void {
    if (suspended || !Number.isFinite(deltaMilliseconds) || deltaMilliseconds <= 0) return;
    this.samples.push(deltaMilliseconds);
    if (this.samples.length > this.capacity) this.samples.shift();
  }

  snapshot(): FramePacingSnapshot {
    if (this.samples.length === 0) {
      return {
        ready: false,
        sampleCount: 0,
        sampledMilliseconds: 0,
        averageFrameMilliseconds: 0,
        p95FrameMilliseconds: 0,
        p99FrameMilliseconds: 0,
        onePercentLowFps: 0,
      };
    }
    const sorted = [...this.samples].sort((left, right) => left - right);
    const sampledMilliseconds = this.samples.reduce((total, sample) => total + sample, 0);
    const p95FrameMilliseconds = percentile(sorted, 0.95);
    const p99FrameMilliseconds = percentile(sorted, 0.99);
    return {
      ready: this.samples.length >= this.readySamples,
      sampleCount: this.samples.length,
      sampledMilliseconds,
      averageFrameMilliseconds: sampledMilliseconds / this.samples.length,
      p95FrameMilliseconds,
      p99FrameMilliseconds,
      onePercentLowFps: 1_000 / p99FrameMilliseconds,
    };
  }
}

function percentile(sorted: readonly number[], ratio: number): number {
  const index = Math.max(0, Math.ceil(sorted.length * ratio) - 1);
  return sorted[index]!;
}
