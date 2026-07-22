import { PRODUCTION_AUDIO_S1_ASSETS } from "./ProductionAudioCatalog";

export interface ProductionAudioRuntimeUrls {
  readonly ogg: string;
  readonly mp3: string;
}

/** Vite expands these constrained relative URL templates into hashed build assets. */
export const PRODUCTION_AUDIO_S1_URLS: Readonly<Record<string, ProductionAudioRuntimeUrls>> = Object.freeze(
  Object.fromEntries(PRODUCTION_AUDIO_S1_ASSETS.map((asset) => [asset.id, Object.freeze({
    ogg: new URL(`./runtime/batch-s1/${asset.fileStem}.ogg`, import.meta.url).href,
    mp3: new URL(`./runtime/batch-s1/${asset.fileStem}.mp3`, import.meta.url).href,
  })])),
);
