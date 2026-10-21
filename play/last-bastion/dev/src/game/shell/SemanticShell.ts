import type { GameProgress } from "../save/LocalSaveStore";
import { localDayKey } from "../run/LocalDayKey";
import { howToPlayPages, menuCardSubtitle, SETTINGS_GROUPS, settingsGroup, type ShellIntent, type ShellState } from "./ScreenFlow";

/** Text alternatives for the existing code-native teaching diagrams. */
const HELP_DIAGRAM_DESCRIPTIONS = [
  "Movement path around cover toward an evade position, with a threat ahead.",
  "A player surrounded by a weapon rack, aiming toward a target in Auto-fire or Manual mode.",
  "Fire, Shock, Cryo and Toxic build status toward a threshold marker.",
  "A branching expedition route passes encounters and rejoins before a boss.",
] as const;

interface ShellActions {
  intent(intent: ShellIntent): void;
  select(index: number): void;
  activate(index: number): void;
  group(name: string): void;
  setting(index: number, value: unknown): void;
  retrySave(): void;
}

export interface SemanticShellView {
  state: ShellState;
  progress: GameProgress;
  saved: boolean;
  saveFailed: boolean;
  feedback: string | null;
  formatValue(key: string, value: unknown): string;
}

/** Visible native controls, positioned over the existing canvas chrome.
 * The scene retains ScreenFlow and effects; this class owns only DOM/focus.
 * Nodes are keyed and reused so changing a value never replaces the focused input.
 */
export class SemanticShell {
  private readonly root = document.createElement("section");
  private screen = "";
  private readonly nodes = new Map<string, HTMLElement>();
  private readonly observer: ResizeObserver;

  constructor(private readonly canvas: HTMLCanvasElement, private readonly actions: ShellActions) {
    this.root.className = "semantic-shell";
    this.root.setAttribute("aria-label", "Game menus");
    canvas.parentElement!.append(this.root);
    this.observer = new ResizeObserver(this.position);
    this.observer.observe(canvas);
    window.addEventListener("resize", this.position);
    this.position();
  }

  owns(target: EventTarget | null): boolean {
    return target instanceof Node && this.root.contains(target);
  }

  destroy(): void {
    this.observer.disconnect();
    window.removeEventListener("resize", this.position);
    this.root.remove();
  }

  private readonly position = (): void => {
    const box = this.canvas.getBoundingClientRect();
    this.root.style.left = `${box.left}px`;
    this.root.style.top = `${box.top}px`;
    this.root.style.transform = `scale(${box.width / 960}, ${box.height / 540})`;
  };

  render(view: SemanticShellView, focusSelection = false): void {
    const { state } = view;
    const supported = ["title", "menu", "settings", "how-to-play"].includes(state.screen);
    const changed = this.screen !== state.screen;
    const hadFocus = this.owns(document.activeElement);
    if (changed) {
      this.root.replaceChildren();
      this.nodes.clear();
      this.screen = state.screen;
    }
    this.root.hidden = !supported;
    // The canvas remains visible; its decorative labels are not duplicate controls.
    if (supported) this.canvas.setAttribute("aria-hidden", "true");
    else this.canvas.removeAttribute("aria-hidden");
    if (!supported) {
      if (hadFocus) { this.canvas.tabIndex = -1; this.canvas.focus({ preventScroll: true }); }
      return;
    }
    const used = new Set<string>();
    const node = <T extends HTMLElement>(key: string, tag: string, x: number, y: number, width: number, height: number): T => {
      used.add(key);
      let el = this.nodes.get(key);
      if (!el) {
        el = document.createElement(tag);
        el.dataset.shellKey = key;
        this.nodes.set(key, el);
      }
      Object.assign(el.style, { left: `${x}px`, top: `${y}px`, width: `${width}px`, height: `${height}px` });
      // append only when needed: moving an existing focused node can blur it.
      if (!el.isConnected) this.root.append(el);
      return el as T;
    };
    const text = (key: string, value: string, x: number, y: number, w: number, h: number, tag = "p") => {
      const el = node<HTMLElement>(key, tag, x, y, w, h);
      if (el.textContent !== value) el.textContent = value;
      return el;
    };
    const button = (key: string, label: string, x: number, y: number, w: number, h: number, click: () => void) => {
      const el = node<HTMLButtonElement>(key, "button", x, y, w, h);
      el.type = "button";
      if (label && el.textContent !== label) el.textContent = label;
      el.onclick = click;
      return el;
    };
    let selectedKey = "start";
    if (state.screen === "title") {
      text("heading", "LAST BASTION", 0, 140, 960, 65, "h1").className = "semantic-title";
      button("start", "Start game", 358, 294, 244, 72, () => this.actions.intent("confirm")).className = "semantic-start";
    } else if (state.screen === "menu") {
      text("heading", "LAST BASTION", 70, 30, 330, 38, "h1");
      state.menuCards.forEach((card, index) => {
        const el = button(`menu-${card.id}`, "", 90 + (index % 3) * 264, 100 + Math.floor(index / 3) * 84, 252, 72,
          () => this.actions.activate(index));
        // Reuse these children too: click/focus remain on the actual button.
        if (!el.firstElementChild) el.innerHTML = "<span></span><small></small>";
        el.firstElementChild!.textContent = card.label;
        el.lastElementChild!.textContent = menuCardSubtitle(card, view.progress, view.saved, localDayKey(Date.now()));
        el.className = "semantic-menu-card";
        el.dataset.selected = String(index === state.menuIndex);
        el.onfocus = () => this.actions.select(index);
      });
      selectedKey = `menu-${state.menuCards[state.menuIndex]!.id}`;
      button("back", "Back", 825, 496, 84, 28, () => this.actions.intent("back"));
    } else if (state.screen === "how-to-play") {
      const pages = howToPlayPages(state.controls);
      const page = pages[state.howToPlayPage]!;
      text("heading", "HOW TO PLAY", 70, 29, 600, 38, "h1");
      text("help-hint", "LEFT/RIGHT or D-PAD pages  •  ENTER / A next  •  ESC / B back", 110, 94, 740, 22).className = "semantic-help-status";
      const diagram = node<HTMLElement>("help-diagram", "figure", 290, 175, 380, 130);
      diagram.setAttribute("role", "img");
      diagram.setAttribute("aria-label", HELP_DIAGRAM_DESCRIPTIONS[state.howToPlayPage]!);
      const content = node<HTMLElement>("help-content", "article", 110, 318, 740, 120);
      content.id = "shell-help-content";
      content.className = "semantic-help-content";
      content.setAttribute("aria-live", "polite");
      content.setAttribute("aria-atomic", "true");
      if (!content.firstElementChild) content.innerHTML = "<h2></h2><p></p>";
      if (content.firstElementChild!.textContent !== page.title) content.firstElementChild!.textContent = page.title;
      if (content.lastElementChild!.textContent !== page.body) content.lastElementChild!.textContent = page.body;
      const status = text("help-status", `Page ${state.howToPlayPage + 1} of ${pages.length}`, 390, 450, 180, 22);
      status.id = "shell-help-status";
      status.className = "semantic-help-status";
      const previous = button("help-previous", "Previous page", 110, 482, 160, 34, () => {
        if (state.howToPlayPage > 0) this.actions.intent("left");
      });
      // Keep the boundary button focusable so returning to page one never
      // drops native focus. aria-disabled and the guarded action agree.
      previous.setAttribute("aria-disabled", String(state.howToPlayPage === 0));
      const next = button("help-next", state.howToPlayPage === pages.length - 1 ? "Return to menu" : "Next page",
        690, 482, 160, 34, () => this.actions.intent("confirm"));
      next.setAttribute("aria-describedby", "shell-help-status shell-help-content");
      previous.setAttribute("aria-describedby", "shell-help-status");
      button("back", "Back", 438, 482, 84, 34, () => this.actions.intent("back"));
      selectedKey = "help-next";
    } else {
      text("heading", "SETTINGS", 70, 48, 600, 38, "h1");
      const feedback = text("feedback", view.feedback ?? "Changes save automatically. Select a group to see its settings.", 70, 84, 820, 20);
      feedback.setAttribute("role", "status");
      const group = settingsGroup(state.settingsRows[state.settingsIndex]!.key);
      SETTINGS_GROUPS.forEach((name, index) => {
        const el = button(`group-${name}`, name, 66 + index * 166, 104, 160, 30, () => this.actions.group(name));
        el.setAttribute("aria-pressed", String(name === group));
        el.className = "semantic-group";
      });
      const rows = state.settingsRows.map((row, index) => ({ row, index })).filter(({ row }) => settingsGroup(row.key) === group);
      const perColumn = Math.ceil(rows.length / 2);
      rows.forEach(({ row, index }, position) => {
        const x = 70 + Math.floor(position / perColumn) * 420, y = 156 + (position % perColumn) * 38;
        const key = `setting-${row.key}`;
        if (row.kind === "action") {
          const el = button(key, row.label, x, y, 380, 28, () => this.actions.activate(index));
          el.onfocus = () => this.actions.select(index);
          el.className = "semantic-setting-action";
          return;
        }
        const label = node<HTMLLabelElement>(`label-${row.key}`, "label", x + 12, y + 7, 216, 17);
        label.textContent = row.label;
        label.htmlFor = `shell-${row.key}`;
        let input: HTMLInputElement | HTMLSelectElement;
        if (row.kind === "choice") {
          const select = node<HTMLSelectElement>(key, "select", x + 222, y + 1, 146, 26);
          const signature = row.options.join("|");
          if (select.dataset.options !== signature) {
            select.replaceChildren(...row.options.map(value => new Option(view.formatValue(row.key, value), value)));
            select.dataset.options = signature;
          }
          select.value = String(state.settings[row.key]);
          select.onchange = () => this.actions.setting(index, select.value);
          input = select;
        } else {
          const control = node<HTMLInputElement>(key, "input", x + (row.kind === "toggle" ? 336 : 222), y + 2, row.kind === "toggle" ? 28 : 102, 24);
          control.type = row.kind === "toggle" ? "checkbox" : "range";
          if (row.kind === "toggle") {
            control.checked = Boolean(state.settings[row.key]);
            control.onchange = () => this.actions.setting(index, control.checked);
          } else {
            control.min = String(row.min); control.max = String(row.max); control.step = String(row.step);
            control.value = String(state.settings[row.key]);
            control.setAttribute("aria-valuetext", view.formatValue(row.key, state.settings[row.key]));
            control.oninput = () => this.actions.setting(index, Number(control.value));
            text(`value-${row.key}`, view.formatValue(row.key, state.settings[row.key]), x + 328, y + 7, 42, 16, "output");
          }
          input = control;
        }
        input.id = `shell-${row.key}`;
        input.onfocus = () => this.actions.select(index);
      });
      selectedKey = `setting-${state.settingsRows[state.settingsIndex]!.key}`;
      button("back", "Back", 825, 496, 84, 28, () => this.actions.intent("back"));
    }
    if (!view.saved) {
      const message = view.saveFailed ? "Save error. Retry saving" : "Save unavailable. Progress lasts until this window closes.";
      if (view.saveFailed) button("save-warning", message, 0, 0, 960, 28, this.actions.retrySave);
      else text("save-warning", message, 0, 0, 960, 28).setAttribute("role", "status");
    }
    for (const [key, el] of this.nodes) if (!used.has(key)) { el.remove(); this.nodes.delete(key); }
    const back = this.nodes.get("back");
    // New group controls are appended; keep Back after them in native tab order.
    if (back && back !== this.root.lastElementChild && back !== document.activeElement) this.root.append(back);
    if (changed || focusSelection) this.nodes.get(selectedKey)?.focus({ preventScroll: true });
    this.position();
  }
}
