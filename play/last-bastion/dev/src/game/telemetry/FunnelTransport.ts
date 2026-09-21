import {
  NEW_VISITOR,
  NO_OP_TRANSPORT,
  PlayerFunnel,
  recordVisit,
  type FunnelEvent,
  type FunnelProperties,
  type FunnelTransport,
  memorySessionLedger,
  type FunnelVisitState,
  type SessionLedger,
} from "./PlayerFunnel";

/**
 * Delivery for the four funnel questions, and the browser-local state behind
 * the "do they come back?" one.
 *
 * ## Why this is dormant until a site code is set
 *
 * Cloudflare Web Analytics, which the site already loads, has no event model at
 * all — it counts page views and nothing else, so it cannot answer any of the
 * four questions. A second, event-capable endpoint is therefore required, and
 * choosing one is a privacy decision on a family-facing site, not a coding one.
 *
 * So the instrumentation ships complete and switched off. Set `SITE_CODE` and
 * every counter starts working; leave it empty and the game sends nothing.
 * Visit-day state is still maintained locally while disabled so enabling the
 * transport later can identify a return without inventing a remote identifier.
 *
 * ## Activating it
 *
 * 1. Create and configure the approved GoatCounter site. Confirm its current
 *    privacy and retention settings rather than relying on a provider slogan.
 * 2. Put the code — the `<code>.goatcounter.com` subdomain — in `SITE_CODE`.
 * 3. Update `/privacy/last-bastion/` to disclose it before shipping the change, not after.
 */
const SITE_CODE = "";

/** Reported as a path so the events group together in any host's dashboard. */
function eventPath(event: FunnelEvent, properties: FunnelProperties): string {
  const parts = [`last-bastion`, event];
  if (properties.mode) parts.push(properties.mode);
  if (properties.outcome) parts.push(properties.outcome);
  if (properties.depth) parts.push(properties.depth);
  return parts.join("/");
}

interface GoatCounterApi {
  count(payload: { path: string; title: string; event: boolean }): void;
}

/**
 * Fire-and-forget. No callback, no retry, no queue: a missed count is a rounding
 * error, and a retry loop on a blocked endpoint is a battery drain and a bug
 * report waiting to happen.
 */
export function goatCounterTransport(host: Window): FunnelTransport {
  return {
    send(event, properties) {
      const api = (host as unknown as { goatcounter?: GoatCounterApi }).goatcounter;
      if (!api || typeof api.count !== "function") return false;
      api.count({ path: eventPath(event, properties), title: event, event: true });
      return true;
    },
  };
}

const PENDING_LEDGER_KEY = "lastBastion.funnelPending.v1";
const MAX_PENDING_EVENTS = 24;

interface PendingEvent {
  readonly event: FunnelEvent;
  readonly properties: FunnelProperties;
}

function readPending(host: Window): PendingEvent[] {
  try {
    const parsed: unknown = JSON.parse(host.sessionStorage.getItem(PENDING_LEDGER_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is PendingEvent => {
      if (typeof entry !== "object" || entry === null) return false;
      const event = (entry as { event?: unknown }).event;
      return ["opened", "run-started", "wave-1", "wave-5", "run-ended", "returning"].includes(String(event));
    }).slice(-MAX_PENDING_EVENTS);
  } catch {
    return [];
  }
}

function writePending(host: Window, pending: readonly PendingEvent[]): boolean {
  try {
    host.sessionStorage.setItem(PENDING_LEDGER_KEY, JSON.stringify(pending));
    return true;
  } catch {
    return false;
  }
}

/** Flushes oldest first and retains the unsent suffix for the next page load. */
export function flushPendingFunnelEvents(host: Window): number {
  const pending = readPending(host);
  const direct = goatCounterTransport(host);
  let delivered = 0;
  while (delivered < pending.length) {
    const entry = pending[delivered];
    if (!entry || !direct.send(entry.event, entry.properties)) break;
    delivered += 1;
  }
  if (delivered > 0) writePending(host, pending.slice(delivered));
  return delivered;
}

/**
 * Accepts an event only after it has been sent or persisted for a later load.
 * This is what lets PlayerFunnel mark its once-per-session ledger honestly.
 */
export function bufferedGoatCounterTransport(host: Window): FunnelTransport {
  return {
    send(event, properties) {
      flushPendingFunnelEvents(host);
      if (goatCounterTransport(host).send(event, properties)) return true;
      const pending = readPending(host);
      if (pending.length >= MAX_PENDING_EVENTS) return false;
      return writePending(host, [...pending, { event, properties }]);
    },
  };
}

/**
 * Injects the counter script once. Returns false when no site code is
 * configured, which is the current state and is not an error.
 */
export function installFunnelTransport(host: Window, siteCode: string = SITE_CODE): boolean {
  if (!siteCode) return false;
  const document = host.document;
  const existing = document.querySelector("script[data-funnel-transport]");
  if (existing) {
    existing.addEventListener("load", () => flushPendingFunnelEvents(host), { once: true });
    flushPendingFunnelEvents(host);
    return true;
  }
  const script = document.createElement("script");
  script.async = true;
  script.dataset.funnelTransport = "goatcounter";
  script.dataset.goatcounter = `https://${siteCode}.goatcounter.com/count`;
  // `data-goatcounter-settings` with no_onload stops it counting a page view of
  // its own: the shell reports `opened` explicitly, and two denominators that
  // disagree are worse than one.
  script.dataset.goatcounterSettings = JSON.stringify({ no_onload: true });
  script.src = "https://gc.zgo.at/count.js";
  script.addEventListener("load", () => flushPendingFunnelEvents(host), { once: true });
  document.head.appendChild(script);
  return true;
}

const VISIT_STORAGE_KEY = "lastBastion.funnelVisit.v1";
const SESSION_LEDGER_KEY = "lastBastion.funnelSession.v1";

/**
 * Session storage, not local: the ledger must survive the title -> map -> combat
 * -> debrief page loads of one visit and then be forgotten, so tomorrow's visit
 * is counted again. It holds event names only.
 */
function sessionLedger(host: Window): SessionLedger {
  let storage: Storage;
  try {
    storage = host.sessionStorage;
    // Touch it: Safari in private mode has the property and throws on use.
    storage.getItem(SESSION_LEDGER_KEY);
  } catch {
    return memorySessionLedger();
  }
  const read = (): string[] => {
    try {
      const parsed: unknown = JSON.parse(storage.getItem(SESSION_LEDGER_KEY) ?? "[]");
      return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
    } catch {
      return [];
    }
  };
  return {
    has: (event) => read().includes(event),
    add: (event) => {
      try {
        storage.setItem(SESSION_LEDGER_KEY, JSON.stringify([...new Set([...read(), event])]));
      } catch {
        /* the visit is still playable without a tidy denominator */
      }
    },
  };
}

/**
 * Reads the day-boundary state. Every failure path returns a new visitor rather
 * than throwing: private windows, blocked storage and corrupt values are all
 * ordinary, and none of them is a reason to interrupt a game.
 */
export function readVisitState(host: Window): FunnelVisitState {
  try {
    const raw = host.localStorage.getItem(VISIT_STORAGE_KEY);
    if (!raw) return NEW_VISITOR;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return NEW_VISITOR;
    const candidate = parsed as Record<string, unknown>;
    return {
      firstDay: dayOrNull(candidate.firstDay),
      lastDay: dayOrNull(candidate.lastDay),
      returningReportedOn: dayOrNull(candidate.returningReportedOn),
    };
  } catch {
    return NEW_VISITOR;
  }
}

export function writeVisitState(host: Window, state: FunnelVisitState): void {
  try {
    host.localStorage.setItem(VISIT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* a player in a private window still gets to play */
  }
}

/** Only ever a calendar day. Anything else is discarded rather than trusted. */
function dayOrNull(value: unknown): string | null {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

/**
 * Boot-time entry point: installs the transport if one is configured, records
 * the visit, and reports `opened` plus `returning` where it applies.
 */
export function startPlayerFunnel(
  host: Window,
  nowMs: number = Date.now(),
  siteCode: string = SITE_CODE,
): PlayerFunnel {
  const active = installFunnelTransport(host, siteCode);
  const funnel = new PlayerFunnel(
    active ? bufferedGoatCounterTransport(host) : NO_OP_TRANSPORT,
    sessionLedger(host),
  );

  const { state, isReturningToday } = recordVisit(readVisitState(host), nowMs);
  writeVisitState(host, state);

  funnel.opened();
  if (isReturningToday) funnel.returning();
  return funnel;
}
