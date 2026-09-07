export type ExpeditionMapIntent = "previous" | "next" | "confirm" | "back";

/** Standard-mapping pad: d-pad cycles routes, A confirms, B returns. */
export function expeditionMapGamepadIntent(buttonIndex: number): ExpeditionMapIntent | null {
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
