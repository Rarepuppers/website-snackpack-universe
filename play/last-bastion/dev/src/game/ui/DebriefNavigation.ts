export type DebriefIntent = "previous" | "next" | "confirm" | "back";

/** Standard-mapping pad: d-pad left/up and right/down, A confirm, B back. */
export function debriefGamepadIntent(buttonIndex: number): DebriefIntent | null {
  switch (buttonIndex) {
    case 12:
    case 14:
      return "previous";
    case 13:
    case 15:
      return "next";
    case 0:
      return "confirm";
    case 1:
      return "back";
    default:
      return null;
  }
}

export function moveDebriefSelection(current: number, direction: -1 | 1, count: number): number {
  if (count <= 0) return 0;
  return (current + direction + count) % count;
}
