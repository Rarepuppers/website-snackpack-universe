import { NO_OP_TRANSPORT, PlayerFunnel } from "./PlayerFunnel";

/**
 * Lets scenes reach the funnel without importing the entry point.
 *
 * Same shape as `DisplayPresentationRuntime`: boot owns construction, scenes
 * ask for what boot made. A scene importing `main.ts` would be an import cycle,
 * and passing the funnel down through five scene constructors would be a lot of
 * plumbing for four counters.
 */
let current: PlayerFunnel | null = null;

export function publishPlayerFunnel(funnel: PlayerFunnel): void {
  current = funnel;
}

/**
 * Never null, so no caller needs a guard and no missed counter can become a
 * crash. Before boot publishes one — which includes every unit test that does
 * not opt in — this is inert.
 */
export function playerFunnel(): PlayerFunnel {
  return current ?? (current = new PlayerFunnel(NO_OP_TRANSPORT));
}

/** Test seam: forget the published funnel between cases. */
export function resetPlayerFunnel(): void {
  current = null;
}
