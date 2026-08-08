# Last Bastion desktop host

This workspace owns the Electron host only. The browser game remains in `../dev`, and its production
build remains in the parent directory.

- `npm start` builds and opens the production web output through the secure `last-bastion://` protocol.
- Set `LAST_BASTION_DEV_URL=http://127.0.0.1:4173/play/last-bastion/` to point the shell at Vite.
- The renderer receives only `window.steamworks`, matching the five-method `SteamworksBridge` contract,
  and only after native Steamworks initialization succeeds.
- Set `LAST_BASTION_STEAM_APP_ID` to a positive Steam App ID, or provide the local-only
  `steam_appid.txt` used by the Steamworks SDK. Do not commit that file.
- If Steam is down, the client is not running, or initialization fails, preload exposes no bridge and
  the renderer selects its browser adapter. It does not expose a bridge whose calls fail later.

The custom protocol confines requests to the parent Last Bastion directory. Electron runs with
`nodeIntegration: false`, `contextIsolation: true`, sandboxing enabled, denied permission requests,
and new-window creation disabled.

Desktop saves live under Electron's per-user `userData/saves` directory. The renderer receives a
separate synchronous `window.desktopSave` bridge with only `getItem` and `setItem`; it never receives
a path or general filesystem access. Writes go to a temporary JSON file, flush where the filesystem
supports it, rotate one known-good backup, then atomically rename into the primary slot. A corrupt
primary reads from the backup and is never rotated over that backup.
