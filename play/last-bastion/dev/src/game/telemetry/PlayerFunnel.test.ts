import { describe, expect, it } from "vitest";
import {
  NEW_VISITOR,
  PlayerFunnel,
  depthBucket,
  memorySessionLedger,
  recordVisit,
  type FunnelEvent,
  type FunnelProperties,
  type FunnelTransport,
} from "./PlayerFunnel";

function recordingTransport(): FunnelTransport & { sent: { event: FunnelEvent; properties: FunnelProperties }[] } {
  const sent: { event: FunnelEvent; properties: FunnelProperties }[] = [];
  return { sent, send: (event, properties) => void sent.push({ event, properties }) };
}

const DAY = 24 * 60 * 60 * 1000;

describe("depthBucket", () => {
  it("reports a band rather than the wave number", () => {
    expect(depthBucket(1)).toBe("wave-1-4");
    expect(depthBucket(4)).toBe("wave-1-4");
    expect(depthBucket(5)).toBe("wave-5-9");
    expect(depthBucket(9)).toBe("wave-5-9");
    expect(depthBucket(10)).toBe("wave-10-19");
    expect(depthBucket(20)).toBe("wave-20-plus");
    expect(depthBucket(999)).toBe("wave-20-plus");
  });

  it("puts a corrupt wave count in the shallowest bucket, never the deepest", () => {
    // An undercount is a boring error; an overcount would quietly flatter the
    // one metric this funnel exists to move.
    expect(depthBucket(Number.NaN)).toBe("wave-1-4");
    expect(depthBucket(Number.POSITIVE_INFINITY)).toBe("wave-1-4");
    expect(depthBucket(-5)).toBe("wave-1-4");
  });
});

describe("recordVisit", () => {
  it("does not treat a first-ever visit as a return", () => {
    const outcome = recordVisit(NEW_VISITOR, Date.now());
    expect(outcome.isReturningToday).toBe(false);
    expect(outcome.state.firstDay).not.toBeNull();
  });

  it("does not treat a second session on the same day as a return", () => {
    const morning = Date.now();
    const first = recordVisit(NEW_VISITOR, morning);
    const second = recordVisit(first.state, morning + 60_000);
    expect(second.isReturningToday).toBe(false);
  });

  it("counts a visit on a later day as a return", () => {
    const first = recordVisit(NEW_VISITOR, Date.now());
    const later = recordVisit(first.state, Date.now() + DAY);
    expect(later.isReturningToday).toBe(true);
  });

  it("reports a return only once per day", () => {
    const first = recordVisit(NEW_VISITOR, Date.now());
    const tomorrow = Date.now() + DAY;
    const returned = recordVisit(first.state, tomorrow);
    const again = recordVisit(returned.state, tomorrow + 60_000);
    expect(returned.isReturningToday).toBe(true);
    expect(again.isReturningToday).toBe(false);
  });

  it("leaves state untouched when the clock is unusable", () => {
    const outcome = recordVisit(NEW_VISITOR, Number.NaN);
    expect(outcome).toEqual({ state: NEW_VISITOR, isReturningToday: false });
  });

  it("stores no identifier of any kind", () => {
    const state = recordVisit(NEW_VISITOR, Date.now()).state;
    // Only calendar days. If this ever fails, read the privacy contract in the
    // module before changing the assertion.
    for (const value of Object.values(state)) {
      expect(value === null || /^\d{4}-\d{2}-\d{2}$/.test(value as string)).toBe(true);
    }
  });
});

describe("PlayerFunnel", () => {
  it("reports the opening of a session exactly once", () => {
    const transport = recordingTransport();
    const funnel = new PlayerFunnel(transport);
    funnel.opened();
    funnel.opened();
    expect(transport.sent.map((s) => s.event)).toEqual(["opened"]);
  });

  it("counts a wave-1 clear once even when the caller fires every wave", () => {
    const transport = recordingTransport();
    const funnel = new PlayerFunnel(transport);
    funnel.runStarted("quick-drop");
    for (const wave of [1, 1, 2, 3, 4, 5, 5, 6]) funnel.waveCleared(wave);
    const events = transport.sent.map((s) => s.event);
    expect(events.filter((e) => e === "wave-1")).toHaveLength(1);
    expect(events.filter((e) => e === "wave-5")).toHaveLength(1);
  });

  it("counts one visit once, however many runs it contains", () => {
    // Session-scoped on purpose. The funnel question is "does someone who opens
    // the page start a run and survive a wave?" — a player who does that three
    // times in one visit has answered it once, and counting them three times
    // would make the conversion rate a function of how much they enjoyed it.
    const transport = recordingTransport();
    const funnel = new PlayerFunnel(transport);
    for (let run = 0; run < 3; run += 1) {
      funnel.runStarted("expedition");
      funnel.waveCleared(1);
      funnel.runEnded("defeat", 3, "expedition");
    }
    expect(transport.sent.filter((s) => s.event === "run-started")).toHaveLength(1);
    expect(transport.sent.filter((s) => s.event === "wave-1")).toHaveLength(1);
  });

  it("shares its ledger across page loads, because each screen is its own page", () => {
    const transport = recordingTransport();
    const ledger = memorySessionLedger();
    // Title page, then the combat page: two PlayerFunnel instances, one visit.
    new PlayerFunnel(transport, ledger).opened();
    new PlayerFunnel(transport, ledger).opened();
    expect(transport.sent.filter((s) => s.event === "opened")).toHaveLength(1);
  });

  it("sends a band and an outcome, never the raw wave", () => {
    const transport = recordingTransport();
    const funnel = new PlayerFunnel(transport);
    funnel.runStarted("quick-drop");
    funnel.runEnded("defeat", 7, "quick-drop");
    const ended = transport.sent.find((s) => s.event === "run-ended");
    expect(ended?.properties).toEqual({ outcome: "defeat", depth: "wave-5-9", mode: "quick-drop" });
    expect(JSON.stringify(ended)).not.toContain("7");
  });

  it("never lets a failing transport reach the game", () => {
    const exploding: FunnelTransport = { send: () => { throw new Error("blocked by an extension"); } };
    const funnel = new PlayerFunnel(exploding);
    expect(() => {
      funnel.opened();
      funnel.runStarted("quick-drop");
      funnel.waveCleared(1);
      funnel.runEnded("victory", 12, "quick-drop");
    }).not.toThrow();
  });

  it("does nothing at all with the default transport", () => {
    const funnel = new PlayerFunnel();
    expect(() => funnel.opened()).not.toThrow();
    expect(funnel.reported()).toContain("opened");
  });
});
