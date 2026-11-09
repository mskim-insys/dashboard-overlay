import { app, BrowserWindow } from "electron";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 720,
    minHeight: 480,
    title: "Dashboard Overlay",
    autoHideMenuBar: true,
    backgroundColor: "#11141b",
    webPreferences: {
      preload: join(currentDirectory, "../preload/index.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  const rendererUrl = process.env["ELECTRON_RENDERER_URL"];
  const loadPromise = rendererUrl
    ? mainWindow.loadURL(rendererUrl)
    : mainWindow.loadFile(join(currentDirectory, "../renderer/index.html"));

  void loadPromise.catch((error: unknown) => {
    console.error("Failed to load the dashboard renderer:", error);
    app.quit();
  });
}

void app
  .whenReady()
  .then(createWindow)
  .catch((error: unknown) => {
    console.error("Failed to start Dashboard Overlay:", error);
    app.exit(1);
  });

app.on("window-all-closed", () => {
  app.quit();
});
