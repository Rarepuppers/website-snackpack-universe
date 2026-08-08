# Last Bastion desktop host

This workspace owns the Electron host only. The browser game remains in `../dev`, and its production
build remains in the parent directory.

- `npm start` builds and opens the production web output through the secure `last-bastion://` protocol.
- Set `LAST_BASTION_DEV_URL=http://127.0.0.1:4173/play/last-bastion/` to point the shell at Vite.
- The renderer receives only `window.steamworks`, matching the five-method `SteamworksBridge` contract.
- Steamworks initialization is intentionally not faked. T3.2 will install a real host; until then,
  bridge calls reject with `Steamworks is unavailable`.

The custom protocol confines requests to the parent Last Bastion directory. Electron runs with
`nodeIntegration: false`, `contextIsolation: true`, sandboxing enabled, denied permission requests,
and new-window creation disabled.
