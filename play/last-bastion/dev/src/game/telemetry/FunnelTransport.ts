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
 * every counter starts working; leave it empty and the game sends nothing,
 * exactly as before. That is deliberately not the same thing as local-only
 * telemetry, which is a trap this portfolio has already fallen into once: a
 * counter nobody can read is a counter that never changes a decision.
 *
 * ## Activating it
 *
 * 1. Create a free GoatCounter site (goatcounter.com). It sets no cookies,
 *    collects no personal data and needs no consent banner, which is why it is
 *    the recommendation over anything session-based.
 * 2. Put the code — the `<code>.goatcounter.com` subdomain — in `SITE_CODE`.
 * 3. Update `/privacy/` to disclose it before shipping the change, not after.
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
      if (!api || typeof api.count !== "function") return;
      api.count({ path: eventPath(event, properties), title: event, event: true });
    },
  };
}

/**
 * Injects the counter script once. Returns false when no site code is
 * configured, which is the current state and is not an error.
 */
export function installFunnelTransport(host: Window): boolean {
  if (!SITE_CODE) return false;
  const document = host.document;
  if (document.querySelector("script[data-funnel-transport]")) return true;
  const script = document.createElement("script");
  script.async = true;
  script.dataset.funnelTransport = "goatcounter";
  script.dataset.goatcounter = `https://${SITE_CODE}.goatcounter.com/count`;
  // `data-goatcounter-settings` with no_onload stops it counting a page view of
  // its own: the shell reports `opened` explicitly, and two denominators that
  // disagree are worse than one.
  script.dataset.goatcounterSettings = JSON.stringify({ no_onload: true });
  script.src = "https://gc.zgo.at/count.js";
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
export function startPlayerFunnel(host: Window, nowMs: number = Date.now()): PlayerFunnel {
  const active = installFunnelTransport(host);
  const funnel = new PlayerFunnel(
    active ? goatCounterTransport(host) : NO_OP_TRANSPORT,
    sessionLedger(host),
  );

  const { state, isReturningToday } = recordVisit(readVisitState(host), nowMs);
  writeVisitState(host, state);

  funnel.opened();
  if (isReturningToday) funnel.returning();
  return funnel;
}
