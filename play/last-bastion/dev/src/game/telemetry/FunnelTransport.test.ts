import { describe, expect, it, vi } from "vitest";
import { NEW_VISITOR } from "./PlayerFunnel";
import {
  bufferedGoatCounterTransport,
  flushPendingFunnelEvents,
  goatCounterTransport,
  installFunnelTransport,
  readVisitState,
  startPlayerFunnel,
  writeVisitState,
} from "./FunnelTransport";

/** Minimal window stand-in: only the surface these functions actually touch. */
function memoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  } as unknown as Storage;
}

function fakeHost(options: { storage?: Storage | null; session?: Storage | null; goatcounter?: unknown } = {}) {
  const appended: { dataset: Record<string, string>; src?: string }[] = [];
  const loadListeners: (() => void)[] = [];
  const store = new Map<string, string>();
  const storage = options.storage === undefined
    ? {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    } as unknown as Storage
    : options.storage;

  const host = {
    localStorage: storage,
    sessionStorage: options.session === undefined ? memoryStorage() : options.session,
    goatcounter: options.goatcounter,
    document: {
      querySelector: () => null,
      createElement: () => ({
        dataset: {} as Record<string, string>,
        addEventListener: (name: string, listener: () => void) => {
          if (name === "load") loadListeners.push(listener);
        },
      }),
      head: { appendChild: (node: never) => void appended.push(node) },
    },
  } as unknown as Window;
  return { host, appended, store, fireLoad: () => loadListeners.splice(0).forEach((listener) => listener()) };
}

describe("installFunnelTransport", () => {
  it("installs nothing while no site code is configured", () => {
    const { host, appended } = fakeHost();
    expect(installFunnelTransport(host)).toBe(false);
    expect(appended).toHaveLength(0);
  });

  it("installs once with the configured endpoint and flushes after load", () => {
    const count = vi.fn();
    const session = memoryStorage();
    const setup = fakeHost({ session });
    expect(bufferedGoatCounterTransport(setup.host).send("opened", {})).toBe(true);
    expect(installFunnelTransport(setup.host, "snackpack-test")).toBe(true);
    expect(setup.appended).toHaveLength(1);
    expect(setup.appended[0]?.dataset.goatcounter).toBe("https://snackpack-test.goatcounter.com/count");
    (setup.host as unknown as { goatcounter: unknown }).goatcounter = { count };
    setup.fireLoad();
    expect(count).toHaveBeenCalledTimes(1);
    expect(session.getItem("lastBastion.funnelPending.v1")).toBe("[]");
  });
});

describe("goatCounterTransport", () => {
  it("groups events under a readable path", () => {
    const count = vi.fn();
    const { host } = fakeHost({ goatcounter: { count } });
    goatCounterTransport(host).send("run-ended", {
      outcome: "defeat",
      depth: "wave-5-9",
      mode: "expedition",
    });
    expect(count).toHaveBeenCalledWith({
      path: "last-bastion/run-ended/expedition/defeat/wave-5-9",
      title: "run-ended",
      event: true,
    });
  });

  it("declines immediate delivery when the counter script has not loaded", () => {
    const { host } = fakeHost({ goatcounter: undefined });
    expect(goatCounterTransport(host).send("opened", {})).toBe(false);
  });

  it("sends only values drawn from the closed vocabulary", () => {
    // The real privacy property. A digit on its own proves nothing — "wave-20-plus"
    // is a bucket name — so assert that every segment is one of the known tokens
    // rather than that the payload merely looks number-free.
    const VOCABULARY = new Set([
      "last-bastion",
      "opened", "run-started", "wave-1", "wave-5", "run-ended", "returning",
      "quick-drop", "expedition",
      "victory", "defeat", "abandoned",
      "wave-1-4", "wave-5-9", "wave-10-19", "wave-20-plus",
    ]);
    const count = vi.fn();
    const { host } = fakeHost({ goatcounter: { count } });
    for (const properties of [
      { outcome: "victory", depth: "wave-20-plus", mode: "expedition" },
      { outcome: "defeat", depth: "wave-1-4", mode: "quick-drop" },
      {},
    ] as const) {
      goatCounterTransport(host).send("run-ended", properties);
    }
    for (const [payload] of count.mock.calls) {
      for (const segment of payload.path.split("/")) {
        expect(VOCABULARY.has(segment), segment).toBe(true);
      }
      expect(Object.keys(payload).sort()).toEqual(["event", "path", "title"]);
    }
  });
});

describe("buffered delivery", () => {
  it("survives a navigation and flushes oldest-first", () => {
    const session = memoryStorage();
    const first = fakeHost({ session });
    expect(bufferedGoatCounterTransport(first.host).send("opened", {})).toBe(true);
    expect(bufferedGoatCounterTransport(first.host).send("run-started", { mode: "expedition" })).toBe(true);

    const count = vi.fn();
    const second = fakeHost({ session, goatcounter: { count } });
    expect(flushPendingFunnelEvents(second.host)).toBe(2);
    expect(count.mock.calls.map(([payload]) => payload.path)).toEqual([
      "last-bastion/opened",
      "last-bastion/run-started/expedition",
    ]);
  });

  it("does not claim acceptance when storage and delivery are both blocked", () => {
    const blocked = {
      getItem: () => { throw new Error("SecurityError"); },
      setItem: () => { throw new Error("SecurityError"); },
    } as unknown as Storage;
    const { host } = fakeHost({ session: blocked });
    expect(bufferedGoatCounterTransport(host).send("opened", {})).toBe(false);
  });
});

describe("visit state", () => {
  it("round-trips through storage", () => {
    const { host } = fakeHost();
    const state = { firstDay: "2026-09-01", lastDay: "2026-09-11", returningReportedOn: "2026-09-11" };
    writeVisitState(host, state);
    expect(readVisitState(host)).toEqual(state);
  });

  it("treats a blocked storage as a new visitor rather than failing", () => {
    const blocked = {
      getItem: () => { throw new Error("SecurityError"); },
      setItem: () => { throw new Error("SecurityError"); },
    } as unknown as Storage;
    const { host } = fakeHost({ storage: blocked });
    expect(readVisitState(host)).toEqual(NEW_VISITOR);
    expect(() => writeVisitState(host, NEW_VISITOR)).not.toThrow();
  });

  it("discards anything that is not a calendar day", () => {
    const { host, store } = fakeHost();
    store.set(
      "lastBastion.funnelVisit.v1",
      JSON.stringify({ firstDay: "tuesday", lastDay: 17, returningReportedOn: { a: 1 } }),
    );
    expect(readVisitState(host)).toEqual(NEW_VISITOR);
  });

  it("survives corrupt JSON", () => {
    const { host, store } = fakeHost();
    store.set("lastBastion.funnelVisit.v1", "{not json");
    expect(readVisitState(host)).toEqual(NEW_VISITOR);
  });
});

describe("the session ledger", () => {
  it("survives the page loads of one visit, because each screen is its own URL", () => {
    // The exact failure this guards: title, map, combat and debrief are four
    // page loads, so a per-page counter would report four opens for one visitor
    // and make the funnel denominator meaningless.
    const session = memoryStorage();
    const first = fakeHost({ session });
    const second = fakeHost({ session });
    startPlayerFunnel(first.host, Date.UTC(2026, 8, 11, 12), "snackpack-test");
    startPlayerFunnel(second.host, Date.UTC(2026, 8, 11, 12, 5), "snackpack-test");
    expect(session.getItem("lastBastion.funnelSession.v1")).toBe(JSON.stringify(["opened"]));
  });

  it("falls back to memory when session storage throws", () => {
    const hostile = {
      getItem: () => { throw new Error("SecurityError"); },
      setItem: () => { throw new Error("SecurityError"); },
    } as unknown as Storage;
    const { host } = fakeHost({ session: hostile });
    expect(() => startPlayerFunnel(host, Date.now())).not.toThrow();
  });
});

describe("startPlayerFunnel", () => {
  it("records a first visit without claiming a return", () => {
    const { host } = fakeHost();
    const funnel = startPlayerFunnel(host, Date.UTC(2026, 8, 11, 12));
    expect(funnel.reported()).not.toContain("opened");
    expect(funnel.reported()).not.toContain("returning");
  });

  it("reports a return on a later day", () => {
    const { host } = fakeHost();
    startPlayerFunnel(host, Date.UTC(2026, 8, 11, 12), "snackpack-test");
    const second = startPlayerFunnel(host, Date.UTC(2026, 8, 13, 12), "snackpack-test");
    expect(second.reported()).toContain("returning");
  });

  it("still starts the game when storage is unavailable", () => {
    const { host } = fakeHost({ storage: null });
    expect(() => startPlayerFunnel(host, Date.now())).not.toThrow();
  });
});
