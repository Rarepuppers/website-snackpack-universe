import { app, BrowserWindow, net, protocol, session } from "electron";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { registerSteamworksIpc } from "./SteamworksIpc.js";
import { isAllowedDevelopmentUrl, resolveWebRequest, WEB_PATH_PREFIX } from "./WebProtocol.js";

const APP_SCHEME = "last-bastion";

protocol.registerSchemesAsPrivileged([{
  scheme: APP_SCHEME,
  privileges: { standard: true, secure: true, supportFetchAPI: true },
}]);

function webRoot(): string {
  const configured = process.env.LAST_BASTION_WEB_ROOT;
  return configured ? resolve(configured) : resolve(app.getAppPath(), "..");
}

async function createWindow(): Promise<void> {
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
  window.once("ready-to-show", () => window.show());

  const developmentUrl = process.env.LAST_BASTION_DEV_URL;
  await window.loadURL(developmentUrl && isAllowedDevelopmentUrl(developmentUrl)
    ? developmentUrl
    : `${APP_SCHEME}://game${WEB_PATH_PREFIX}index.html`);
}

app.whenReady().then(async () => {
  const root = webRoot();
  protocol.handle(APP_SCHEME, (request) => {
    const filePath = resolveWebRequest(root, request.url);
    return filePath
      ? net.fetch(pathToFileURL(filePath).toString())
      : new Response("Not found", { status: 404 });
  });
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  registerSteamworksIpc(null);
  await createWindow();
});

app.on("window-all-closed", () => app.quit());
