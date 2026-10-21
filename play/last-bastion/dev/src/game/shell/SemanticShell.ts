import type { GameProgress } from "../save/LocalSaveStore";
import { localDayKey } from "../run/LocalDayKey";
import { howToPlayPages, menuCardSubtitle, SETTINGS_GROUPS, settingsGroup, type ShellIntent, type ShellState } from "./ScreenFlow";
import { GAMEPAD_BINDABLE_ACTIONS, KEYBOARD_BINDABLE_ACTIONS, gamepadBindingLabel, keyboardBindingLabel, type GamepadBindableAction, type KeyboardBindableAction } from "../input/ControlBindings";
import type { RunHistoryEntry } from "../run/RunHistory";
import { historyRecordPresentation } from "../run/RunRecordPresentation";
import { careerRecordRows, controlActionLabel } from "./ShellPresentation";

export interface BindingCapture {
  device: "keyboard" | "gamepad";
  action: KeyboardBindableAction | GamepadBindableAction;
}

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
  device(device: "keyboard" | "gamepad"): void;
  resetBindings(): void;
  cancelBinding(): void;
}

export interface SemanticShellView {
  state: ShellState;
  progress: GameProgress;
  saved: boolean;
  saveFailed: boolean;
  feedback: string | null;
  formatValue(key: string, value: unknown): string;
  bindingCapture: BindingCapture | null;
  bindingFeedback: string | null;
  history: readonly RunHistoryEntry[];
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
  private capturing = false;

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
    const supported = ["title", "menu", "settings", "how-to-play", "controls", "records"].includes(state.screen);
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
    } else if (state.screen === "controls") {
      text("heading", "CONTROL BINDINGS", 70, 29, 500, 38, "h1");
      const status = text("binding-status", view.bindingFeedback ?? "Select an action to rebind. Duplicate assignments swap. Delete resets all; Escape goes back.", 70, 78, 820, 24);
      status.setAttribute("role", "status");
      for (const [index, device] of (["keyboard", "gamepad"] as const).entries()) {
        const el = button(`device-${device}`, device === "keyboard" ? "Keyboard" : "Controller", 594 + index * 148, 34, 140, 30, () => this.actions.device(device));
        el.setAttribute("aria-pressed", String(state.controlDevice === device));
      }
      KEYBOARD_BINDABLE_ACTIONS.forEach((action, index) => {
        const available = state.controlDevice === "keyboard" || GAMEPAD_BINDABLE_ACTIONS.includes(action as GamepadBindableAction);
        const binding = state.controlDevice === "keyboard" ? keyboardBindingLabel(state.controls.keyboard[action])
          : available ? gamepadBindingLabel(state.controls.gamepad[action as GamepadBindableAction]) : "LEFT STICK";
        const el = button(`binding-${action}`, `${controlActionLabel(action)}: ${binding}`, 80 + Math.floor(index / 5) * 420, 108 + (index % 5) * 72, 380, 54,
          () => { if (available) this.actions.activate(index); });
        el.className = "semantic-binding";
        el.dataset.selected = String(state.controlIndex === index);
        el.setAttribute("aria-disabled", String(!available));
        el.onfocus = () => this.actions.select(index);
      });
      button("bindings-reset", "Reset all bindings", 80, 486, 220, 34, this.actions.resetBindings);
      button("back", "Back", 800, 486, 80, 34, () => this.actions.intent("back"));
      selectedKey = `binding-${KEYBOARD_BINDABLE_ACTIONS[state.controlIndex]}`;
    } else if (state.screen === "records") {
      text("heading", "RECORDS", 70, 29, 500, 38, "h1");
      text("career-heading", "CAREER", 90, 76, 300, 24, "h2").className = "semantic-record-heading";
      const career = node<HTMLElement>("career", "dl", 90, 120, 320, 310);
      career.className = "semantic-career";
      if (!career.firstElementChild) for (const [label, value] of careerRecordRows(view.progress)) {
        const term = document.createElement("dt"), detail = document.createElement("dd");
        term.textContent = label; detail.textContent = value; career.append(term, detail);
      }
      text("history-heading", "RECENT RUNS", 470, 76, 220, 24, "h2").className = "semantic-record-heading";
      const history = view.history.slice(state.recordsOffset, state.recordsOffset + 6);
      const first = view.history.length === 0 ? 0 : state.recordsOffset + 1;
      const status = text("history-status", `${first}–${state.recordsOffset + history.length} of ${view.history.length}`, 710, 76, 170, 24);
      status.setAttribute("role", "status");
      status.className = "semantic-history-status";
      const list = node<HTMLOListElement>("history-list", "ol", 466, 118, 418, 328);
      list.className = "semantic-run-list";
      list.tabIndex = 0;
      list.dataset.nativeScroll = "true";
      list.setAttribute("aria-label", "Recent runs");
      list.start = first || 1;
      const signature = `${state.recordsOffset}:${view.history.map(entry => entry.id).join("|")}`;
      if (list.dataset.records !== signature) {
        list.replaceChildren(...history.map(entry => {
          const record = historyRecordPresentation(entry);
          const row = document.createElement("li"), heading = document.createElement("p"), detail = document.createElement("p");
          heading.textContent = `${record.outcome}  •  ${record.progress}  •  ${record.date}`;
          detail.textContent = record.detail;
          row.append(heading, detail); return row;
        }));
        list.dataset.records = signature;
        list.scrollTop = 0;
      }
      if (!history.length) text("history-empty", "NO COMPLETED RUNS YET", 470, 240, 410, 40).className = "semantic-help-status";
      const newer = button("history-newer", "Newer runs", 470, 478, 135, 34, () => this.actions.intent("up"));
      newer.setAttribute("aria-disabled", String(state.recordsOffset === 0));
      const older = button("history-older", "Older runs", 620, 478, 135, 34, () => this.actions.intent("down"));
      older.setAttribute("aria-disabled", String(state.recordsOffset + 6 >= view.history.length));
      button("back", "Back", 800, 478, 80, 34, () => this.actions.intent("back"));
      selectedKey = "back";
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
    if (view.bindingCapture) {
      node<HTMLElement>("capture-shade", "div", 0, 0, 960, 540).className = "semantic-capture-shade";
      const dialog = node<HTMLElement>("capture-dialog", "section", 180, 184, 600, 172);
      dialog.className = "semantic-capture";
      dialog.setAttribute("role", "dialog");
      dialog.setAttribute("aria-modal", "true");
      dialog.setAttribute("aria-labelledby", "shell-capture-title");
      dialog.setAttribute("aria-describedby", "shell-capture-detail");
      dialog.tabIndex = -1;
      if (!dialog.firstElementChild) dialog.innerHTML = '<h2 id="shell-capture-title"></h2><p id="shell-capture-detail" role="status"></p><button type="button" data-shell-key="capture-cancel">Cancel capture</button>';
      dialog.querySelector("h2")!.textContent = `Rebind ${controlActionLabel(view.bindingCapture.action)}`;
      dialog.querySelector("p")!.textContent = view.bindingFeedback ?? (view.bindingCapture.device === "keyboard"
        ? "Press a key. Duplicate assignments swap automatically. Escape cancels."
        : "Press a controller button. Duplicate assignments swap automatically. Escape or Cancel capture cancels.");
      dialog.querySelector("button")!.onclick = this.actions.cancelBinding;
    }
    for (const [key, el] of this.nodes) if (!used.has(key)) { el.remove(); this.nodes.delete(key); }
    for (const [key, el] of this.nodes) el.inert = Boolean(view.bindingCapture) && key !== "capture-dialog";
    const back = this.nodes.get("back");
    // New group controls are appended; keep Back after them in native tab order.
    if (back && !view.bindingCapture && back !== this.root.lastElementChild && back !== document.activeElement) this.root.append(back);
    if (view.bindingCapture) {
      if (!this.capturing || changed) this.nodes.get("capture-dialog")?.focus({ preventScroll: true });
    } else if (changed || focusSelection || this.capturing) this.nodes.get(selectedKey)?.focus({ preventScroll: true });
    this.capturing = Boolean(view.bindingCapture);
    this.position();
  }
}
