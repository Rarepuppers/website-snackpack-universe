import { createBrowserPlatformAdapter, createPlatformAdapterForHost, type SteamworksWindow } from "./HostPlatform";
import type { PlatformAdapter } from "./PlatformAdapter";

let adapter: PlatformAdapter = createBrowserPlatformAdapter();

export function initializePlatformAdapter(host: SteamworksWindow): PlatformAdapter {
  adapter = createPlatformAdapterForHost(host);
  return adapter;
}

export function currentPlatformAdapter(): PlatformAdapter {
  return adapter;
}
