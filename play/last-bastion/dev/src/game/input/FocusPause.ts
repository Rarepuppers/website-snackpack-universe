export type FocusLossEvent = "blur" | "visibilitychange";

/** Focus loss pauses; visibility changes only pause when the document hid. */
export function focusLossRequestsPause(event: FocusLossEvent, documentHidden: boolean): boolean {
  return event === "blur" || documentHidden;
}
