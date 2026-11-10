import {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  Menu,
  nativeImage,
  screen,
  Tray,
  type IpcMainEvent,
  type IpcMainInvokeEvent,
  type WebContents,
  type WebFrameMain,
} from "electron";
import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  IPC_CHANNELS,
  isInputDebugEvent,
  isPointerInteraction,
  type InputDebugEvent,
  type InputDebugSnapshot,
} from "../shared/ipc";
import {
  getPrimaryWorkAreaBounds,
  shouldIgnoreMouseEvents,
  transitionWindowState,
  type WindowAction,
  type WindowState,
} from "../shared/window-state";

declare const __BUILD_TIMESTAMP__: string;

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const rendererFile = resolve(currentDirectory, "../renderer/index.html");
const rendererUrl = process.env["ELECTRON_RENDERER_URL"];
if (rendererUrl) {
  const parsedRendererUrl = new URL(rendererUrl);
  const isLoopback =
    parsedRendererUrl.hostname === "localhost" ||
    parsedRendererUrl.hostname === "127.0.0.1" ||
    parsedRendererUrl.hostname === "[::1]";
  if (parsedRendererUrl.protocol !== "http:" || !isLoopback) {
    throw new Error(
      "The development renderer URL must use the local Vite server",
    );
  }
}
const hotkey = "CommandOrControl+Alt+Shift+D";
const singleInstanceLock = app.requestSingleInstanceLock();
const inputDebugEnabled =
  !app.isPackaged && process.env["DASHBOARD_OVERLAY_DEBUG_INPUT"] === "1";

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let windowState: WindowState = "hidden";
let pointerInteractive = false;
let pointerDragging = false;
let hotkeyRegistered = false;
let rendererNeedsReload = false;
let rendererReloadPending = false;
let isQuitting = false;
let lastInputDebugEvent = "none";
let lastClick = "none";
let lastSetIgnoreMouseEvents = "not called";
let rendererViewport = "not reported";
const appStartedAt = new Date();
let inputDebugLogFile = "";
let modeTransitionCount = 0;
let hasEnteredEditModeSinceLaunch = false;
let lastModeTransitionAt = appStartedAt;
let initialWindowSetup = "not initialized";

if (!singleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    applyWindowAction("show");
  });

  void app
    .whenReady()
    .then(() => {
      initializeInputDiagnostics();
      registerIpcHandlers();
      createWindow();
      createTray();
      registerHotkey();
      registerDisplayListeners();
      applyWindowAction("show");
    })
    .catch((error: unknown) => {
      console.error("Failed to start Dashboard Overlay:", error);
      app.exit(1);
    });
}

app.on("before-quit", () => {
  isQuitting = true;
  globalShortcut.unregisterAll();
  tray?.destroy();
  tray = null;
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

function createWindow(): void {
  const primaryDisplay = screen.getPrimaryDisplay();
  mainWindow = new BrowserWindow({
    ...getPrimaryWorkAreaBounds(screen.getAllDisplays(), primaryDisplay.id),
    title: "Dashboard Overlay",
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    hasShadow: false,
    focusable: false,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      preload: join(currentDirectory, "../preload/index.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.setAlwaysOnTop(true, "floating");
  applyNativeMouseIgnore(true, "window-created");

  mainWindow.on("close", (event) => {
    if (isQuitting) return;
    event.preventDefault();
    applyWindowAction("hide");
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.on("unresponsive", () => {
    resetPointerState();
    applyWindowAction("renderer-unresponsive");
  });

  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    console.error("Dashboard renderer process exited:", details.reason);
    rendererNeedsReload = true;
    rendererReloadPending = false;
    resetPointerState();
    applyWindowAction("renderer-gone");
  });

  mainWindow.webContents.on("preload-error", (_event, preloadPath, error) => {
    const details = {
      preloadPath,
      name: error.name,
      message: error.message,
    };
    console.error(
      "Dashboard preload failed; renderer bridge is unavailable:",
      details,
    );
    if (inputDebugEnabled) {
      logInputDebug("preload failed", {
        ...details,
      });
    }
  });

  if (inputDebugEnabled) {
    mainWindow.webContents.on("console-message", (event) => {
      logInputDebug("renderer console", {
        level: event.level,
        message: event.message,
        lineNumber: event.lineNumber,
        sourceId: event.sourceId,
      });
    });
  }

  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (
      input.type === "keyDown" &&
      input.key === "Escape" &&
      windowState === "edit"
    ) {
      event.preventDefault();
      applyWindowAction("escape");
    }
  });

  void loadRenderer(mainWindow).catch((error: unknown) => {
    console.error("Failed to load the dashboard renderer:", error);
    rendererNeedsReload = true;
    applyWindowAction("renderer-gone");
  });
}

function registerIpcHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.getWindowState, (event: IpcMainInvokeEvent) => {
    if (inputDebugEnabled) {
      logInputDebug("window-state IPC request", {
        trusted: isTrustedRenderer(event.sender, event.senderFrame),
        senderFrameUrl: event.senderFrame?.url ?? "no frame",
      });
    }
    if (!isTrustedRenderer(event.sender, event.senderFrame)) {
      throw new Error("Rejected IPC request from an untrusted renderer");
    }
    return windowState;
  });

  ipcMain.handle(
    IPC_CHANNELS.getInputDebugState,
    (event: IpcMainInvokeEvent): InputDebugSnapshot => {
      if (inputDebugEnabled) {
        logInputDebug("diagnostics bootstrap request", {
          trusted: isTrustedRenderer(event.sender, event.senderFrame),
          senderFrameUrl: event.senderFrame?.url ?? "no frame",
        });
      }
      if (!isTrustedRenderer(event.sender, event.senderFrame)) {
        throw new Error(
          "Rejected input-debug request from an untrusted renderer",
        );
      }
      const snapshot = getInputDebugSnapshot();
      if (inputDebugEnabled) {
        logInputDebug("renderer requested diagnostics bootstrap", snapshot);
      }
      return snapshot;
    },
  );

  ipcMain.on(
    IPC_CHANNELS.inputDebugEvent,
    (event: IpcMainEvent, payload: unknown) => {
      if (!inputDebugEnabled) return;
      if (!isTrustedRenderer(event.sender, event.senderFrame)) {
        logInputDebug("rejected renderer event from untrusted sender");
        return;
      }
      if (!isInputDebugEvent(payload)) {
        logInputDebug("rejected malformed renderer event");
        return;
      }
      recordRendererEvent(payload);
    },
  );

  ipcMain.on(
    IPC_CHANNELS.pointerInteraction,
    (event: IpcMainEvent, payload: unknown) => {
      if (!isTrustedRenderer(event.sender, event.senderFrame)) {
        if (inputDebugEnabled) {
          logInputDebug("rejected pointer IPC from untrusted sender");
        }
        console.warn("Rejected pointer IPC from an untrusted renderer");
        return;
      }
      if (!isPointerInteraction(payload)) {
        if (inputDebugEnabled) {
          logInputDebug("rejected malformed pointer IPC payload");
        }
        console.warn("Rejected malformed pointer IPC payload");
        return;
      }
      if (windowState !== "display") {
        if (inputDebugEnabled) {
          logInputDebug(`rejected pointer IPC in ${windowState} mode`, payload);
        }
        return;
      }

      pointerDragging = payload.dragging;
      pointerInteractive = payload.interactive || payload.dragging;
      if (inputDebugEnabled) {
        logInputDebug("received pointer IPC", payload);
      }
      applyMousePolicy();
    },
  );
}

function isTrustedRenderer(
  sender: WebContents,
  frame: WebFrameMain | null,
): boolean {
  if (!mainWindow || sender !== mainWindow.webContents) return false;
  if (!frame || frame !== sender.mainFrame) return false;

  try {
    const frameUrl = new URL(frame.url);
    if (rendererUrl) {
      const expectedUrl = new URL(rendererUrl);
      const isLoopback =
        expectedUrl.hostname === "localhost" ||
        expectedUrl.hostname === "127.0.0.1" ||
        expectedUrl.hostname === "[::1]";
      return isLoopback && frameUrl.origin === expectedUrl.origin;
    }

    return fileURLToPath(frameUrl).toLowerCase() === rendererFile.toLowerCase();
  } catch {
    return false;
  }
}

function applyWindowAction(action: WindowAction): void {
  const nextState = transitionWindowState(windowState, action);
  if (nextState !== windowState) {
    const previousState = windowState;
    windowState = nextState;
    modeTransitionCount += 1;
    lastModeTransitionAt = new Date();
    if (windowState === "edit") hasEnteredEditModeSinceLaunch = true;
    if (windowState !== "display") resetPointerState();
    mainWindow?.webContents.send(IPC_CHANNELS.windowStateChanged, windowState);
    if (inputDebugEnabled) {
      logInputDebug(
        `mode transition ${previousState} -> ${windowState}; count=${modeTransitionCount}; enteredEdit=${hasEnteredEditModeSinceLaunch}`,
      );
    }
  }

  if (inputDebugEnabled) {
    logInputDebug(`window action ${action}; mode=${windowState}`);
    sendInputDebugSnapshot();
  }
  updateTray();
  applyMousePolicy();

  if (!mainWindow || windowState === "hidden") {
    mainWindow?.hide();
    return;
  }

  if (rendererNeedsReload) {
    recoverRenderer();
    return;
  }

  presentWindow();
}

function presentWindow(): void {
  if (!mainWindow || windowState === "hidden") return;
  mainWindow.setBounds(getPrimaryBounds());

  if (windowState === "edit") {
    mainWindow.setFocusable(true);
    applyNativeMouseIgnore(false, "edit-mode");
    mainWindow.show();
    mainWindow.focus();
    return;
  }

  mainWindow.setFocusable(false);
  mainWindow.showInactive();
  if (!initialWindowSetup.includes("showInactive()")) {
    initialWindowSetup +=
      "; initial display presentation: focusable=false; showInactive()";
    if (inputDebugEnabled) {
      logInputDebug("initial display presentation", initialWindowSetup);
      sendInputDebugSnapshot();
    }
  }
}

function recoverRenderer(): void {
  if (!mainWindow || rendererReloadPending) return;
  rendererReloadPending = true;
  mainWindow.hide();

  void loadRenderer(mainWindow)
    .then(() => {
      rendererNeedsReload = false;
      rendererReloadPending = false;
      presentWindow();
    })
    .catch((error: unknown) => {
      rendererReloadPending = false;
      console.error("Failed to recover the dashboard renderer:", error);
    });
}

function loadRenderer(window: BrowserWindow): Promise<void> {
  return rendererUrl
    ? window.loadURL(rendererUrl)
    : window.loadFile(rendererFile);
}

function resetPointerState(): void {
  pointerInteractive = false;
  pointerDragging = false;
}

function applyMousePolicy(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const ignore = shouldIgnoreMouseEvents(
    windowState,
    pointerInteractive,
    pointerDragging,
  );
  applyNativeMouseIgnore(ignore, "pointer-policy");
}

function applyNativeMouseIgnore(ignore: boolean, reason: string): void {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const options = ignore ? { forward: true } : undefined;
  mainWindow.setIgnoreMouseEvents(ignore, options);
  lastSetIgnoreMouseEvents = `ignore=${ignore}, options=${JSON.stringify(options ?? null)}, reason=${reason}`;
  if (initialWindowSetup === "not initialized") {
    initialWindowSetup = `constructor focusable=false; initial setIgnoreMouseEvents(${lastSetIgnoreMouseEvents})`;
  }
  if (inputDebugEnabled) {
    logInputDebug(`setIgnoreMouseEvents(${ignore}) reason=${reason}`);
    sendInputDebugSnapshot();
  }
}

function getInputDebugSnapshot(): InputDebugSnapshot {
  const primaryDisplay = screen.getPrimaryDisplay();
  const now = new Date();
  const millisecondsSinceLastModeTransition =
    now.getTime() - lastModeTransitionAt.getTime();
  return {
    enabled: inputDebugEnabled,
    mode: windowState,
    startupBanner: `pid=${process.pid} build=${__BUILD_TIMESTAMP__} started=${appStartedAt.toISOString()} flag=${inputDebugEnabled} Electron=${process.versions.electron} app=${app.getVersion()}`,
    logFile: inputDebugLogFile || "not initialized",
    lastPointerEvent: lastInputDebugEvent,
    lastClick,
    lastSetIgnoreMouseEvents,
    scaleFactor: primaryDisplay.scaleFactor,
    windowBounds: mainWindow
      ? JSON.stringify(mainWindow.getBounds())
      : "no window",
    displayWorkArea: JSON.stringify(primaryDisplay.workArea),
    rendererViewport,
    hasModeTransitionSinceLaunch: modeTransitionCount > 0,
    hasEnteredEditModeSinceLaunch,
    modeTransitionCount,
    lastModeTransitionAt:
      modeTransitionCount > 0 ? lastModeTransitionAt.toISOString() : "none",
    millisecondsSinceLastModeTransition,
    initialWindowSetup,
  };
}

function recordRendererEvent(inputEvent: InputDebugEvent): void {
  const eventSummary = `${inputEvent.type} target=${inputEvent.target} client=(${inputEvent.clientX},${inputEvent.clientY}) screen=(${inputEvent.screenX},${inputEvent.screenY}) mode=${inputEvent.mode}`;
  if (inputEvent.type === "click") {
    lastClick = `${eventSummary} at=${new Date().toISOString()}`;
  } else {
    lastInputDebugEvent = eventSummary;
  }
  rendererViewport = `${inputEvent.innerWidth}x${inputEvent.innerHeight} @${inputEvent.devicePixelRatio}`;
  logInputDebug("received renderer event", inputEvent);
  sendInputDebugSnapshot();
}

function logInputDebug(message: string, detail?: unknown): void {
  const entry = {
    timestamp: new Date().toISOString(),
    processId: process.pid,
    process: "main",
    message,
    detail: detail ?? null,
  };
  console.info("[input diagnostics]", entry);
  if (!inputDebugLogFile) return;
  try {
    appendFileSync(inputDebugLogFile, `${JSON.stringify(entry)}\n`, "utf8");
  } catch (error) {
    console.error(
      `Failed to append input diagnostics to ${inputDebugLogFile}:`,
      error,
    );
  }
}

function initializeInputDiagnostics(): void {
  if (!inputDebugEnabled) return;
  inputDebugLogFile = join(app.getPath("userData"), "input-diagnostics.log");
  try {
    mkdirSync(dirname(inputDebugLogFile), { recursive: true });
    const startupBanner = getInputDebugSnapshot().startupBanner;
    const entry = {
      timestamp: new Date().toISOString(),
      processId: process.pid,
      process: "main",
      message: "startup",
      detail: { startupBanner, logFile: inputDebugLogFile },
    };
    appendFileSync(inputDebugLogFile, `${JSON.stringify(entry)}\n`, "utf8");
    console.info("[input diagnostics]", entry);
  } catch (error) {
    console.error(
      `Failed to initialize input diagnostics log at ${inputDebugLogFile}:`,
      error,
    );
  }
}

function sendInputDebugSnapshot(): void {
  if (!inputDebugEnabled || !mainWindow || mainWindow.isDestroyed()) return;
  const snapshot = getInputDebugSnapshot();
  logInputDebug("diagnostic snapshot", snapshot);
  mainWindow.webContents.send(IPC_CHANNELS.inputDebugChanged, snapshot);
}

function getPrimaryBounds(): ReturnType<typeof getPrimaryWorkAreaBounds> {
  const primaryDisplay = screen.getPrimaryDisplay();
  return getPrimaryWorkAreaBounds(screen.getAllDisplays(), primaryDisplay.id);
}

function registerDisplayListeners(): void {
  screen.on("display-metrics-changed", () => applyPrimaryBounds());
  screen.on("display-added", () => applyPrimaryBounds());
  screen.on("display-removed", () => applyPrimaryBounds());
}

function applyPrimaryBounds(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.setBounds(getPrimaryBounds());
}

function createTray(): void {
  const svg = encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect x="2" y="2" width="28" height="28" rx="8" fill="#597ce8"/><path d="M10 8h6a8 8 0 0 1 0 16h-6zm5 12a4 4 0 0 0 0-8h-1v8z" fill="#fff"/></svg>',
  );
  const icon = nativeImage.createFromDataURL(
    `data:image/svg+xml;charset=utf-8,${svg}`,
  );
  tray = new Tray(icon);
  tray.setToolTip("Dashboard Overlay");
  tray.on("click", () => applyWindowAction("show"));
  updateTray();
}

function updateTray(): void {
  if (!tray || tray.isDestroyed()) return;
  const menu = Menu.buildFromTemplate([
    ...(hotkeyRegistered
      ? []
      : [
          {
            label: `Hotkey unavailable (${hotkey}); use this menu`,
            enabled: false,
          },
        ]),
    {
      label: "Show",
      click: () => applyWindowAction("show"),
    },
    {
      label: "Hide",
      click: () => applyWindowAction("hide"),
    },
    {
      label: "Edit mode",
      type: "checkbox",
      checked: windowState === "edit",
      click: () => applyWindowAction("toggle-edit"),
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => app.quit(),
    },
  ]);
  tray.setContextMenu(menu);
  tray.setToolTip(
    hotkeyRegistered
      ? `Dashboard Overlay (${hotkey})`
      : `Dashboard Overlay — hotkey unavailable`,
  );
}

function registerHotkey(): void {
  hotkeyRegistered = globalShortcut.register(hotkey, () => {
    applyWindowAction("hotkey");
  });

  if (!hotkeyRegistered) {
    tray?.displayBalloon({
      title: "Dashboard Overlay",
      content: `The hotkey ${hotkey} is unavailable. Use the tray menu instead.`,
    });
    updateTray();
  }
}
