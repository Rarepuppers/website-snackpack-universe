/**
 * Phones and touch-only tablets get a plain notice before the game boots.
 *
 * Last Bastion has no touch controls. Before this, a phone visitor saw a tiny
 * letterboxed title that said PRESS ENTER, could tap into the menu, and then
 * reached combat with no way to move — a dead end with no explanation. The
 * notice says so up front, points at arcade games that work by touch, and still
 * lets anyone with a keyboard or controller continue.
 *
 * A device with any fine pointer (a laptop touchscreen, an iPad with a
 * trackpad) is not touch-only and never sees it, and a connected controller
 * dismisses it on its own.
 */

export interface InputEnvironment {
  /** Primary pointer is coarse: a finger. */
  readonly coarsePointer: boolean;
  /** Any fine pointer is available: a mouse or trackpad. */
  readonly anyFinePointer: boolean;
  readonly gamepadConnected: boolean;
  /** The player already chose "play anyway" in this tab. */
  readonly acknowledged: boolean;
  /** The packaged desktop host loads over a custom protocol and never needs this. */
  readonly webPage: boolean;
}

export function shouldShowTouchNotice(environment: InputEnvironment): boolean {
  return environment.webPage
    && environment.coarsePointer
    && !environment.anyFinePointer
    && !environment.gamepadConnected
    && !environment.acknowledged;
}

export const TOUCH_NOTICE_ACK_KEY = "last-bastion:touch-notice-ack";

/** Arcade games that are built for touch, and the hub. Same-site links only. */
export const TOUCH_FRIENDLY_GAMES: readonly { readonly label: string; readonly href: string }[] = Object.freeze([
  { label: "Flappy Snacky", href: "/play/flappy-snacky/" },
  { label: "2048", href: "/play/2048/" },
  { label: "Water Sort", href: "/play/water-sort/" },
]);

export function readInputEnvironment(host: Window): InputEnvironment {
  const query = (media: string): boolean => {
    try {
      return host.matchMedia?.(media).matches === true;
    } catch {
      return false;
    }
  };
  let acknowledged = false;
  try {
    acknowledged = host.sessionStorage.getItem(TOUCH_NOTICE_ACK_KEY) === "1";
  } catch {
    acknowledged = false;
  }
  let gamepadConnected = false;
  try {
    gamepadConnected = Array.from(host.navigator.getGamepads?.() ?? []).some(Boolean);
  } catch {
    gamepadConnected = false;
  }
  return {
    coarsePointer: query("(pointer: coarse)"),
    anyFinePointer: query("(any-pointer: fine)"),
    gamepadConnected,
    acknowledged,
    webPage: host.location.protocol === "https:" || host.location.protocol === "http:",
  };
}

/**
 * Resolves when the game may boot: immediately on a keyboard/mouse device,
 * otherwise once the player chooses to continue or connects a controller.
 */
export function awaitTouchNotice(host: Window): Promise<void> {
  if (!shouldShowTouchNotice(readInputEnvironment(host))) return Promise.resolve();
  return new Promise((resolve) => {
    const document = host.document;
    const notice = document.createElement("section");
    notice.className = "touch-notice";
    notice.setAttribute("role", "dialog");
    notice.setAttribute("aria-modal", "true");
    notice.setAttribute("aria-labelledby", "touch-notice-title");

    const title = document.createElement("h1");
    title.id = "touch-notice-title";
    title.textContent = "Last Bastion needs a keyboard or controller";
    const body = document.createElement("p");
    body.textContent = "It is a desktop action game with no touch controls yet. "
      + "On a computer, play with WASD and the mouse, or pair a controller.";
    const listLabel = document.createElement("p");
    listLabel.className = "touch-notice-label";
    listLabel.textContent = "Games that work by touch:";
    const list = document.createElement("ul");
    for (const game of TOUCH_FRIENDLY_GAMES) {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = game.href;
      link.textContent = game.label;
      item.append(link);
      list.append(item);
    }
    const actions = document.createElement("div");
    actions.className = "touch-notice-actions";
    const arcade = document.createElement("a");
    arcade.href = "/play/";
    arcade.className = "touch-notice-primary";
    arcade.textContent = "Browse the arcade";
    const anyway = document.createElement("button");
    anyway.type = "button";
    anyway.textContent = "I have a keyboard or controller";
    actions.append(arcade, anyway);
    notice.append(title, body, listLabel, list, actions);

    let settled = false;
    const proceed = (remember: boolean): void => {
      if (settled) return;
      settled = true;
      if (remember) {
        try {
          host.sessionStorage.setItem(TOUCH_NOTICE_ACK_KEY, "1");
        } catch {
          // Without storage the notice simply returns on the next page load.
        }
      }
      host.removeEventListener("gamepadconnected", onGamepad);
      notice.remove();
      resolve();
    };
    const onGamepad = (): void => proceed(false);
    anyway.addEventListener("click", () => proceed(true));
    host.addEventListener("gamepadconnected", onGamepad);
    document.body.append(notice);
    arcade.focus();
  });
}
