import type { LocalSaveStore } from "./LocalSaveStore";

/** Retains the current scene until its cached save is durable; retries never replay gameplay. */
export class SaveHandoffRecovery {
  private panel: HTMLElement | null = null;
  private continuation: (() => void) | null = null;

  constructor(private readonly store: LocalSaveStore) {}

  get active(): boolean { return this.panel !== null; }

  continueWhenSaved(continuation: () => void): void {
    if (this.continuation) return;
    this.continuation = continuation;
    if (this.store.persistence().kind === "saved") { continuation(); return; }
    const panel = document.createElement("section");
    panel.className = "save-handoff-retry";
    panel.setAttribute("role", "alertdialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-labelledby", "handoff-save-title");
    panel.setAttribute("aria-describedby", "handoff-save-detail");
    panel.innerHTML = '<h2 id="handoff-save-title">Progress could not be saved</h2><p id="handoff-save-detail">Your progress is still here. Keep this window open and retry saving before continuing.</p><button type="button">Retry saving and continue</button>';
    panel.querySelector("button")!.onclick = () => this.retry();
    panel.addEventListener("keydown", event => {
      if (event.code === "Tab") { event.preventDefault(); panel.querySelector("button")!.focus(); }
    });
    document.body.append(panel);
    this.panel = panel;
    panel.querySelector("button")!.focus();
  }

  retry(): void {
    if (!this.continuation) return;
    this.store.retryPersistence();
    if (this.store.persistence().kind === "saved") this.continuation();
    else this.panel?.querySelector("p")?.setAttribute("role", "alert");
  }

  destroy(): void { this.panel?.remove(); this.panel = null; this.continuation = null; }
}
