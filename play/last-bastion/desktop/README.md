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

## Packaging

Run the platform script on that platform:

```powershell
npm run package:win
npm run package:linux
npm run package:mac
```

The script first rebuilds the web game and desktop TypeScript, stages only the published page, codex,
runtime assets, and Steam Input manifest, then asks electron-builder for an unpacked directory in
`release/`. Packaged clients read web content from `resources/game`; source runs continue to read the
parent game directory. The native `steamworks.js` binaries are unpacked from ASAR.

### Windows packaged acceptance

After `npm run package:win`, run:

```powershell
npm run smoke:package:win
release\win-unpacked\LastBastion.exe
```

The automated smoke must print `PASS packaged renderer:`. For the visible launch, verify Title,
keyboard/controller navigation, windowed/borderless transitions, the target monitor selector, pause,
focus loss/resume, and a short combat encounter. Repeat once with Steam closed and once from the
Steam client when an App ID is assigned.

The Codex managed Windows environment currently terminates Electron 42.9.0, 43.3.0, and 43.4.0 in
Electron's pre-app `IsSandboxedProcess` startup path with Windows access violation `0xC0000005`.
The web build, desktop unit tests, and packaging complete before that environment-only launch
failure. Do not weaken `sandbox: true` or suppress the smoke gate to make it appear green; run the
executable from an ordinary local PowerShell session to distinguish host policy from a distributable
failure. Electron is pinned to the current stable 43.4.0 patch and should be retested when Electron 44
reaches stable.

## SteamPipe

Keep the assigned App ID and Depot ID out of the source templates. After packaging, create an ignored
SteamPipe work tree with the real partner IDs:

```powershell
powershell -File scripts/prepare-steampipe.ps1 `
  -AppId <real-app-id> -DepotId <real-depot-id> `
  -PackageDir release/win-unpacked -Description "QA candidate" -Preview
```

Inspect `steampipe/work/scripts/app_build.vdf`, `depot_build.vdf`, and the staged content. `-Preview`
asks SteamPipe to produce logs and a manifest without uploading depot content. Remove `-Preview` only
when that preview is correct, prepare again, then upload with the Steamworks SDK's SteamCMD:

```powershell
powershell -File scripts/upload-steampipe.ps1 `
  -SteamCmdPath C:\SteamworksSDK\tools\ContentBuilder\builder\steamcmd.exe `
  -AccountName <builder-account>
```

The upload command intentionally prompts for credentials/Steam Guard instead of accepting a password
argument. It never sets a branch live; choose and promote the uploaded build in Steamworks App Admin.
