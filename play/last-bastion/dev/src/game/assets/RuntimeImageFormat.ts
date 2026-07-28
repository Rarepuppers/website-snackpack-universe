interface RuntimeImageEnvironment {
  search?: string;
  createCanvas?: () => { toDataURL(type: string): string };
}

export function runtimeImageUrl(
  pngUrl: string,
  webpUrl: string,
  environment: RuntimeImageEnvironment = browserEnvironment(),
): string {
  const forcedFormat = new URLSearchParams(environment.search ?? "").get("imageformat");
  if (forcedFormat === "png") return pngUrl;
  if (forcedFormat === "webp") return webpUrl;
  if (!environment.createCanvas) return pngUrl;
  try {
    return environment.createCanvas().toDataURL("image/webp").startsWith("data:image/webp")
      ? webpUrl
      : pngUrl;
  } catch {
    return pngUrl;
  }
}

function browserEnvironment(): RuntimeImageEnvironment {
  if (typeof document === "undefined") return {};
  return {
    search: typeof window === "undefined" ? "" : window.location.search,
    createCanvas: () => document.createElement("canvas"),
  };
}
