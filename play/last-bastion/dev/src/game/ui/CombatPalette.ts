import type { GameSettings } from "../save/LocalSaveStore";

export type ColorVisionMode = GameSettings["colorVisionMode"];

export interface CombatPalette {
  readonly standardThreat: number;
  readonly eliteThreat: number;
  readonly bossThreat: number;
  readonly danger: number;
  readonly dangerBright: number;
}

const PALETTES: Readonly<Record<ColorVisionMode, CombatPalette>> = Object.freeze({
  standard: Object.freeze({
    standardThreat: 0xe55a67, eliteThreat: 0xd66cff, bossThreat: 0xff9a52,
    danger: 0xa8202f, dangerBright: 0xff725f,
  }),
  deuteranopia: Object.freeze({
    standardThreat: 0xffc857, eliteThreat: 0x4ea5ff, bossThreat: 0xff7b32,
    danger: 0xb45f06, dangerBright: 0xffc857,
  }),
  protanopia: Object.freeze({
    standardThreat: 0xf2cf5b, eliteThreat: 0x5aa9ff, bossThreat: 0xf28e2b,
    danger: 0x9b6618, dangerBright: 0xffd166,
  }),
  tritanopia: Object.freeze({
    standardThreat: 0xff5f87, eliteThreat: 0x55d6be, bossThreat: 0xff8c42,
    danger: 0xb72f5b, dangerBright: 0xff7aa2,
  }),
});

export function combatPalette(mode: ColorVisionMode): CombatPalette {
  return PALETTES[mode];
}
