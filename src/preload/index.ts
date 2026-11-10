import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS, isPointerInteraction } from "../shared/ipc";
import { isWindowState, type WindowState } from "../shared/window-state";

contextBridge.exposeInMainWorld("dashboard", {
  isDesktop: true,
  getWindowState: (): Promise<WindowState> =>
    ipcRenderer.invoke(IPC_CHANNELS.getWindowState),
  setPointerInteraction: (interaction: unknown): void => {
    if (isPointerInteraction(interaction)) {
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
