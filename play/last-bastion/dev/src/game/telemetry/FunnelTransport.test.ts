import { describe, expect, it, vi } from "vitest";
import { NEW_VISITOR } from "./PlayerFunnel";
import {
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
      createElement: () => ({ dataset: {} as Record<string, string> }),
      head: { appendChild: (node: never) => void appended.push(node) },
    },
  } as unknown as Window;
  return { host, appended, store };
}

describe("installFunnelTransport", () => {
  it("installs nothing while no site code is configured", () => {
    const { host, appended } = fakeHost();
    expect(installFunnelTransport(host)).toBe(false);
    expect(appended).toHaveLength(0);
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

  it("does nothing when the counter script has not loaded", () => {
    const { host } = fakeHost({ goatcounter: undefined });
    expect(() => goatCounterTransport(host).send("opened", {})).not.toThrow();
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
    startPlayerFunnel(first.host, Date.UTC(2026, 8, 11, 12));
    startPlayerFunnel(second.host, Date.UTC(2026, 8, 11, 12, 5));
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
    expect(funnel.reported()).toContain("opened");
    expect(funnel.reported()).not.toContain("returning");
  });

  it("reports a return on a later day", () => {
    const { host } = fakeHost();
    startPlayerFunnel(host, Date.UTC(2026, 8, 11, 12));
    const second = startPlayerFunnel(host, Date.UTC(2026, 8, 13, 12));
    expect(second.reported()).toContain("returning");
  });

  it("still starts the game when storage is unavailable", () => {
    const { host } = fakeHost({ storage: null });
    expect(() => startPlayerFunnel(host, Date.now())).not.toThrow();
  });
});
