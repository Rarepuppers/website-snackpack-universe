import { localDayKey } from "../run/LocalDayKey";

/**
 * The four questions this game has never been able to answer.
 *
 * Until 11 September 2026 Last Bastion sent nothing anywhere, and nothing on the
 * site linked to it, so every content decision for six months was made without
 * evidence that a single stranger had ever played. This module is the smallest
 * thing that fixes the measuring half.
 *
 * It is deliberately four questions and not an analytics platform:
 *
 *   1. Does someone who opens the page actually start a run?
 *   2. Do they survive the first wave? The fifth?
 *   3. What ends their runs?
 *   4. Do they ever come back on another day?
 *
 * Anything beyond that is a feature request, not a measurement, and should be
 * argued for on its own terms.
 *
 * ## Privacy contract — read before adding a field
 *
 * No identifier of any kind leaves the browser. There is no visitor id, no
 * fingerprint, no session token, no URL, no referrer, no timestamp finer than a
 * local calendar day, and no free text. Every payload below is either a fixed
 * event name or a value drawn from a small closed set defined in this file.
 * That is what makes it defensible on a family-facing site, and it is a
 * constraint on future edits, not a description of the current state.
 *
 * `returning` is derived by comparing local day keys held in this browser and is
 * reported as a single boolean. Nothing is stored that could distinguish one
 * returning player from another.
 */

export type FunnelEvent =
  /** The page loaded far enough to boot the shell. The denominator for everything. */
  | "opened"
  /** The player actually committed to a run rather than bouncing off the title. */
  | "run-started"
  /** Survived the first wave. The single most important number in the funnel. */
  | "wave-1"
  /** Survived the fifth wave — by here they are playing the game, not sampling it. */
  | "wave-5"
  /** A run finished, win or lose. Carries a coarse cause. */
  | "run-ended"
  /** First event of a session on a later calendar day than the first ever visit. */
  | "returning";

const ALL_EVENTS: readonly FunnelEvent[] = Object.freeze([
  "opened", "run-started", "wave-1", "wave-5", "run-ended", "returning",
]);

/**
 * Coarse buckets, never raw values. A wave number would be a weak identifier in
 * combination with a day; "reached wave 5-9" is not.
 */
export type FunnelDepth = "wave-1-4" | "wave-5-9" | "wave-10-19" | "wave-20-plus";

export type FunnelOutcome = "victory" | "defeat" | "abandoned";

export interface FunnelProperties {
  readonly depth?: FunnelDepth;
  readonly outcome?: FunnelOutcome;
  readonly mode?: "quick-drop" | "expedition";
}

/**
 * A non-finite or nonsensical wave count lands in the SHALLOWEST bucket, not the
 * deepest. Corrupt data should never inflate the number we are trying to raise;
 * an undercount is a boring error, an overcount is a misleading one.
 */
export function depthBucket(waveReached: number): FunnelDepth {
  if (!Number.isFinite(waveReached) || waveReached < 5) return "wave-1-4";
  if (waveReached < 10) return "wave-5-9";
  if (waveReached < 20) return "wave-10-19";
  return "wave-20-plus";
}

/**
 * Where funnel events go. Kept as an interface with a no-op default because the
 * hosting choice is a separate decision from the instrumentation, and because a
 * game must never fail to start over an analytics endpoint.
 */
export interface FunnelTransport {
  send(event: FunnelEvent, properties: FunnelProperties): void;
}

export const NO_OP_TRANSPORT: FunnelTransport = Object.freeze({ send(): void {} });

/** Local, per-browser state. Not sent; only the derived boolean is. */
export interface FunnelVisitState {
  /** Local calendar day of the first ever visit, or null before one is recorded. */
  readonly firstDay: string | null;
  /** Local calendar day of the most recent visit. */
  readonly lastDay: string | null;
  /** Whether the "returning" event has already fired today, so it fires once. */
  readonly returningReportedOn: string | null;
}

export const NEW_VISITOR: FunnelVisitState = Object.freeze({
  firstDay: null,
  lastDay: null,
  returningReportedOn: null,
});

export interface VisitOutcome {
  readonly state: FunnelVisitState;
  /** True only on the first open of a day that is later than the first ever day. */
  readonly isReturningToday: boolean;
}

/**
 * Pure day-boundary logic, so the "do they come back?" question is testable
 * without a browser, a clock, or a storage stub.
 *
 * `localDayKey` rather than a UTC date deliberately: a player in UTC+12 whose
 * evening session rolls past midnight UTC has not come back on another day, and
 * counting them as a returning player would quietly inflate the one number this
 * whole exercise exists to measure.
 */
export function recordVisit(previous: FunnelVisitState, nowMs: number): VisitOutcome {
  const today = localDayKey(nowMs);
  if (today === "") return { state: previous, isReturningToday: false };

  const firstDay = previous.firstDay ?? today;
  const isLaterDay = firstDay < today;
  const alreadyReported = previous.returningReportedOn === today;
  const isReturningToday = isLaterDay && !alreadyReported;

  return {
    state: {
      firstDay,
      lastDay: today,
      returningReportedOn: isReturningToday ? today : previous.returningReportedOn,
    },
    isReturningToday,
  };
}

/**
 * Sends each event at most once per run, so a wave-1 clear in a long run cannot
 * be counted five times by a caller that fires on every wave tick. `opened` and
 * `returning` are per-session; the rest reset when a run starts.
 */
/**
 * Remembers which events a browsing session has already reported, across page
 * loads. Last Bastion is a multi-page app — the title, the map, combat and the
 * debrief are each their own URL and their own page load — so an in-memory set
 * would count one player opening the game four or five times in a single visit,
 * and the funnel denominator would be meaningless.
 */
export interface SessionLedger {
  has(event: FunnelEvent): boolean;
  add(event: FunnelEvent): void;
}

/** For tests and for a browser that refuses session storage. */
export function memorySessionLedger(): SessionLedger {
  const seen = new Set<FunnelEvent>();
  return { has: (e) => seen.has(e), add: (e) => void seen.add(e) };
}

export class PlayerFunnel {
  /**
   * Page-scoped rather than session-scoped. Combat is its own page load, so one
   * of these sets covers exactly one run — or, in an expedition, one node —
   * which is the right granularity for an outcome: three defeats in a visit are
   * three facts, where three "did they start a run" answers would be one.
   */
  private readonly sentThisRun = new Set<FunnelEvent>();

  constructor(
    private readonly transport: FunnelTransport = NO_OP_TRANSPORT,
    private readonly session: SessionLedger = memorySessionLedger(),
  ) {}

  opened(): void {
    this.onceInSession("opened", {});
  }

  returning(): void {
    this.onceInSession("returning", {});
  }

  /**
   * Session-scoped, not run-scoped. The question is "does someone who opens the
   * page start a run?", and a player who starts three runs in one visit answered
   * that once.
   */
  runStarted(mode: FunnelProperties["mode"]): void {
    this.onceInSession("run-started", { mode });
  }

  /** Also session-scoped: the first time this visitor ever got this deep. */
  waveCleared(waveNumber: number): void {
    if (waveNumber === 1) this.onceInSession("wave-1", {});
    if (waveNumber === 5) this.onceInSession("wave-5", {});
  }

  runEnded(outcome: FunnelOutcome, waveReached: number, mode: FunnelProperties["mode"]): void {
    this.once(this.sentThisRun, "run-ended", { outcome, depth: depthBucket(waveReached), mode });
  }

  /** Test seam: which events this instance has already reported. */
  reported(): readonly FunnelEvent[] {
    return [...ALL_EVENTS.filter((e) => this.session.has(e)), ...this.sentThisRun];
  }

  private onceInSession(event: FunnelEvent, properties: FunnelProperties): void {
    if (this.session.has(event)) return;
    this.session.add(event);
    this.deliver(event, properties);
  }

  private once(seen: Set<FunnelEvent>, event: FunnelEvent, properties: FunnelProperties): void {
    if (seen.has(event)) return;
    seen.add(event);
    this.deliver(event, properties);
  }

  private deliver(event: FunnelEvent, properties: FunnelProperties): void {
    // A broken or blocked endpoint must never surface as a broken game.
    try {
      this.transport.send(event, properties);
    } catch {
      /* measurement is never worth a crash */
    }
  }
}
