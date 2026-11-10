import { contextBridge, ipcRenderer } from "electron";
import {
  IPC_CHANNELS,
  isInputDebugEvent,
  isPointerInteraction,
  type InputDebugSnapshot,
} from "../shared/ipc";
import { isWindowState, type WindowState } from "../shared/window-state";

declare const __INPUT_DEBUG_ENABLED__: boolean;

const inputDebugEnabled = __INPUT_DEBUG_ENABLED__;

console.info(`[preload ${new Date().toISOString()}] bridge loaded`, {
  inputDebugEnabled,
});

contextBridge.exposeInMainWorld("dashboard", {
  isDesktop: true,
  inputDebugEnabled,
  getWindowState: (): Promise<WindowState> =>
    ipcRenderer.invoke(IPC_CHANNELS.getWindowState),
  getInputDebugState: async (): Promise<InputDebugSnapshot> => {
    const snapshot: InputDebugSnapshot = await ipcRenderer.invoke(
      IPC_CHANNELS.getInputDebugState,
    );
    console.info(`[preload ${new Date().toISOString()}] diagnostics response`, {
      enabled: snapshot.enabled,
      startupBanner: snapshot.startupBanner,
      logFile: snapshot.logFile,
    });
    return snapshot;
  },
  reportInputDebugEvent: (inputEvent: unknown): void => {
    if (!inputDebugEnabled || !isInputDebugEvent(inputEvent)) return;
    console.info(`[renderer ${new Date().toISOString()}]`, inputEvent);
    ipcRenderer.send(IPC_CHANNELS.inputDebugEvent, inputEvent);
  },
  onInputDebugChange: (
    callback: (snapshot: InputDebugSnapshot) => void,
  ): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, snapshot: unknown) => {
      if (isInputDebugSnapshot(snapshot)) callback(snapshot);
    };
    ipcRenderer.on(IPC_CHANNELS.inputDebugChanged, listener);
    return () =>
      ipcRenderer.removeListener(IPC_CHANNELS.inputDebugChanged, listener);
  },
  setPointerInteraction: (interaction: unknown): void => {
    if (isPointerInteraction(interaction)) {
      if (inputDebugEnabled) {
        console.info(
          `[preload ${new Date().toISOString()}] pointer-interaction`,
          interaction,
        );
      }
      ipcRenderer.send(IPC_CHANNELS.pointerInteraction, interaction);
    }
  },
  onWindowStateChange: (
    callback: (state: WindowState) => void,
  ): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, state: unknown) => {
      if (isWindowState(state)) callback(state);
    };
    ipcRenderer.on(IPC_CHANNELS.windowStateChanged, listener);
    return () =>
      ipcRenderer.removeListener(IPC_CHANNELS.windowStateChanged, listener);
  },
});

function isInputDebugSnapshot(value: unknown): value is InputDebugSnapshot {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  return (
    "enabled" in value &&
    typeof value.enabled === "boolean" &&
    "mode" in value &&
    typeof value.mode === "string" &&
    "startupBanner" in value &&
    typeof value.startupBanner === "string" &&
    "logFile" in value &&
    typeof value.logFile === "string" &&
    "lastPointerEvent" in value &&
    typeof value.lastPointerEvent === "string" &&
    "lastClick" in value &&
    typeof value.lastClick === "string" &&
    "lastSetIgnoreMouseEvents" in value &&
    typeof value.lastSetIgnoreMouseEvents === "string" &&
    "scaleFactor" in value &&
    typeof value.scaleFactor === "number" &&
    "windowBounds" in value &&
    typeof value.windowBounds === "string" &&
    "displayWorkArea" in value &&
    typeof value.displayWorkArea === "string" &&
    "rendererViewport" in value &&
    typeof value.rendererViewport === "string" &&
    "hasModeTransitionSinceLaunch" in value &&
    typeof value.hasModeTransitionSinceLaunch === "boolean" &&
    "hasEnteredEditModeSinceLaunch" in value &&
    typeof value.hasEnteredEditModeSinceLaunch === "boolean" &&
    "modeTransitionCount" in value &&
    typeof value.modeTransitionCount === "number" &&
    "lastModeTransitionAt" in value &&
    typeof value.lastModeTransitionAt === "string" &&
    "millisecondsSinceLastModeTransition" in value &&
    typeof value.millisecondsSinceLastModeTransition === "number" &&
    "initialWindowSetup" in value &&
    typeof value.initialWindowSetup === "string"
  );
}
