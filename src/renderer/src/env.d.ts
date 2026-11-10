import type { PointerInteraction } from "../../shared/ipc";
import type { WindowState } from "../../shared/window-state";

declare global {
  interface Window {
    dashboard?: {
      readonly isDesktop: boolean;
      getWindowState(): Promise<WindowState>;
      setPointerInteraction(interaction: PointerInteraction): void;
      onWindowStateChange(callback: (state: WindowState) => void): () => void;
    };
  }
}
