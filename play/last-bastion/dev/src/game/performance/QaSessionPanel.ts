import type { RunProvenance } from "../run/RunSummary";
import type { GameSettings } from "../save/LocalSaveStore";
import { QaSession } from "./QaSession";

interface QaContext {
  paused: boolean;
  provenance: RunProvenance;
  hero: string;
  weapons: readonly string[];
  settings: Pick<GameSettings, "presentationMode" | "effectQuality" | "frameCap" | "uiScale" | "reducedFlashEnabled">;
}

/** Explicit ?qasession=1 surface; no storage, transport, or save/progression writes. */
export function mountQaSessionPanel(canvas: HTMLCanvasElement, context: () => QaContext) {
  const session = new QaSession();
  const panel = document.createElement("section");
  panel.className = "qa-session";
  panel.setAttribute("aria-label", "Local QA session");
  const status = document.createElement("p");
  status.setAttribute("role", "status");
  const output = document.createElement("textarea");
  output.readOnly = true;
  output.hidden = true;
  output.setAttribute("aria-label", "QA report JSON");
  let start: object | null = null;
  let end: object | null = null;
  let startedAt: string | null = null;
  let stoppedAt: string | null = null;
  let stopReason: string | null = null;
  let latest: object | null = null;
  let peakDecodedBytes = 0;
  const environment = () => {
    const rect = canvas.getBoundingClientRect();
    const audit = (window as unknown as { __displayPresentationAudit?: Record<string, unknown> }).__displayPresentationAudit;
    const textures = audit?.textures as { estimatedDecodedBytes?: number } | undefined;
    peakDecodedBytes = Math.max(peakDecodedBytes, textures?.estimatedDecodedBytes ?? 0);
    return {
      ...context(), css: { width: rect.width, height: rect.height },
      backing: { width: canvas.width, height: canvas.height }, devicePixelRatio,
      presentation: audit ? { mode: audit.mode, renderDeviceScale: audit.renderDeviceScale,
        textures: audit.textures, contextRecovery: audit.contextRecovery } : null,
      rollingWindow: audit?.framePacing ? { capacity: 600, interval: "latest active frames", data: audit.framePacing } : null,
      hardware: null, driver: null, windowsScaling: null,
    };
  };
  const update = () => {
    const data = session.progress(performance.now());
    panel.dataset.state = data.state;
    status.textContent = `QA: ${data.state} · ${data.activeSamples} active frames · ${Math.round(data.excludedMilliseconds)} ms excluded`;
    begin.disabled = data.state === "recording";
    stop.disabled = data.state !== "recording";
    exportButton.disabled = data.state === "idle";
  };
  const button = (label: string, action: () => void) => {
    const control = document.createElement("button");
    control.type = "button"; control.textContent = label;
    control.addEventListener("click", action); panel.append(control); return control;
  };
  panel.append(status);
  const begin = button("Start QA", () => {
    peakDecodedBytes = 0; latest = null; end = null; stoppedAt = null;
    stopReason = null; startedAt = new Date().toISOString(); start = environment();
    session.start(performance.now(), document.hidden || context().paused); output.hidden = true; update();
  });
  const finish = (reason: string) => {
    if (session.progress(performance.now()).state !== "recording") return;
    session.stop(performance.now()); end = environment(); stoppedAt = new Date().toISOString(); stopReason = reason; update();
  };
  const stop = button("Stop QA", () => finish("tester stopped"));
  button("Reset QA", () => {
    session.reset(); start = end = latest = null; startedAt = stoppedAt = null;
    stopReason = null; peakDecodedBytes = 0; output.value = ""; output.hidden = true; update();
  });
  const exportButton = button("Export QA", () => {
    const report = {
      schemaVersion: 1, kind: "local-qa-session", startedAt, stoppedAt, stopReason,
      session: session.snapshot(performance.now()), start, end, latest,
      peakObservedDecodedTextureBytesEstimate: peakDecodedBytes,
      limitations: ["Frame intervals are browser timings, not GPU timings or a hardware verdict.",
        "Pause, hidden and boundary intervals are excluded; unobserved time is reported separately.",
        "Texture bytes are decoded estimates sampled once per second; scene reload ends collection.",
        "Hardware, driver and Windows scaling require the tester's separate record.",
        "Display and settings are start/latest/end snapshots, not continuous hardware traces.",
        "This report does not count as an observed campaign run or Steam acceptance."],
    };
    // Always retain a visible selectable fallback, including custom protocols without downloads.
    output.value = JSON.stringify(report, null, 2); output.hidden = false;
    output.focus(); output.select();
    try {
      const url = URL.createObjectURL(new Blob([output.value], { type: "application/json" }));
      const link = document.createElement("a"); link.href = url; link.download = "last-bastion-qa-session.json";
      link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    } catch { /* selectable text remains available */ }
  });
  panel.append(output);
  // These controls must never also fire/evade/confirm in the canvas below them.
  for (const event of ["keydown", "keyup", "pointerdown", "pointerup"]) {
    panel.addEventListener(event, e => e.stopPropagation());
  }
  document.body.append(panel);
  const timer = window.setInterval(() => {
    if (session.progress(performance.now()).state === "recording") latest = environment();
    update();
  }, 1_000);
  update();
  return {
    tick: (now: number, suspended: boolean) => session.tick(now, suspended),
    stop: finish,
    destroy: () => { window.clearInterval(timer); panel.remove(); },
  };
}
