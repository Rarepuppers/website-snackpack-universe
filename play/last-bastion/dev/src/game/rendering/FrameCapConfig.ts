import type { FrameCap } from "./DisplayCapabilities";

export interface PhaserFrameTiming {
  limit: number;
  target: number;
}

export function phaserFrameTiming(frameCap: FrameCap): PhaserFrameTiming {
  return {
    limit: frameCap === "display" ? 0 : frameCap,
    target: frameCap === "display" ? 60 : frameCap,
  };
}
