import { app, BrowserWindow, net, protocol, session } from "electron";
import { fileURLToPath, pathToFileURL } from "node:url";
import { registerSteamworksIpc } from "./SteamworksIpc.js";
import { initializeSteamworksHost } from "./SteamworksHost.js";
import { AtomicSaveStorage } from "./AtomicSaveStorage.js";
import { registerDesktopSaveIpc } from "./DesktopSaveIpc.js";
import { isAllowedDevelopmentUrl, resolveWebRequest, WEB_PATH_PREFIX } from "./WebProtocol.js";
import { registerDesktopDisplayIpc } from "./DesktopDisplayIpc.js";
import { desktopWebRoot } from "./DesktopPaths.js";

const APP_SCHEME = "last-bastion";
const PACKAGED_SMOKE_TEST = process.argv.includes("--smoke-test")
  || process.env.LAST_BASTION_PACKAGED_SMOKE === "1";

protocol.registerSchemesAsPrivileged([{
  scheme: APP_SCHEME,
  privileges: { standard: true, secure: true, supportFetchAPI: true },
}]);

function webRoot(): string {
  return desktopWebRoot({
    configuredRoot: process.env.LAST_BASTION_WEB_ROOT,
    isPackaged: app.isPackaged,
    appPath: app.getAppPath(),
    resourcesPath: process.resourcesPath,
  });
}

async function createWindow(): Promise<BrowserWindow> {
  if (PACKAGED_SMOKE_TEST) console.log("Smoke: creating packaged BrowserWindow");
  const window = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 960,
    minHeight: 540,
    backgroundColor: "#05070a",
    show: false,
    webPreferences: {
      preload: fileURLToPath(new URL("./preload.js", import.meta.url)),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event, destination) => {
    const url = new URL(destination);
    if (url.protocol !== `${APP_SCHEME}:` && !isAllowedDevelopmentUrl(destination)) event.preventDefault();
  });
  if (!PACKAGED_SMOKE_TEST) window.once("ready-to-show", () => window.show());

  const developmentUrl = process.env.LAST_BASTION_DEV_URL;
  await window.loadURL(developmentUrl && isAllowedDevelopmentUrl(developmentUrl)
    ? developmentUrl
    : `${APP_SCHEME}://game${WEB_PATH_PREFIX}index.html`);
  if (PACKAGED_SMOKE_TEST) console.log("Smoke: custom-protocol document loaded");
  return window;
}

app.whenReady().then(async () => {
  if (PACKAGED_SMOKE_TEST) console.log("Smoke: Electron ready");
  const root = webRoot();
  protocol.handle(APP_SCHEME, (request) => {
    const filePath = resolveWebRequest(root, request.url);
    return filePath
      ? net.fetch(pathToFileURL(filePath).toString())
      : new Response("Not found", { status: 404 });
  });
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  const steamworksHost = PACKAGED_SMOKE_TEST ? null : await initializeSteamworksHost();
  registerSteamworksIpc(steamworksHost);
  registerDesktopSaveIpc(new AtomicSaveStorage(app.getPath("userData")));
  registerDesktopDisplayIpc();
  const window = await createWindow();
  if (PACKAGED_SMOKE_TEST) {
    const result = await window.webContents.executeJavaScript(`({
      title: document.title,
      hasGameRoot: document.getElementById("game-root") !== null,
      url: window.location.href
    })`) as { title: string; hasGameRoot: boolean; url: string };
    if (!result.hasGameRoot || !result.url.startsWith(`${APP_SCHEME}://game${WEB_PATH_PREFIX}`)) {
      throw new Error(`Packaged renderer failed smoke acceptance: ${JSON.stringify(result)}`);
    }
    console.log(`PASS packaged renderer: ${result.title} [${result.url}]`);
    window.destroy();
    app.exit(0);
  }
}).catch((error: unknown) => {
  const detail = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`[Last Bastion] Desktop boot failed: ${detail}`);
  app.exit(1);
});

app.on("window-all-closed", () => app.quit());
