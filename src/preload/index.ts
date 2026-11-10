import { contextBridge, ipcRenderer } from "electron";
import {
  IPC_CHANNELS,
  isInputDebugEvent,
  isPointerInteraction,
  type InputDebugSnapshot,
} from "../shared/ipc";
import { isWindowState, type WindowState } from "../shared/window-state";

let inputDebugEnabled = false;

contextBridge.exposeInMainWorld("dashboard", {
  isDesktop: true,
  getWindowState: (): Promise<WindowState> =>
    ipcRenderer.invoke(IPC_CHANNELS.getWindowState),
  getInputDebugState: async (): Promise<InputDebugSnapshot> => {
    const snapshot: InputDebugSnapshot = await ipcRenderer.invoke(
      IPC_CHANNELS.getInputDebugState,
    );
    inputDebugEnabled = snapshot.enabled;
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
    "lastEvent" in value &&
    typeof value.lastEvent === "string" &&
    "lastSetIgnoreMouseEvents" in value &&
    typeof value.lastSetIgnoreMouseEvents === "string" &&
    "scaleFactor" in value &&
    typeof value.scaleFactor === "number" &&
    "windowBounds" in value &&
    typeof value.windowBounds === "string" &&
    "displayWorkArea" in value &&
    typeof value.displayWorkArea === "string" &&
    "rendererViewport" in value &&
    typeof value.rendererViewport === "string"
  );
}
