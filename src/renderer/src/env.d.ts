import type {
  InputDebugEvent,
  InputDebugSnapshot,
  PointerInteraction,
} from "../../shared/ipc";
import type { WindowState } from "../../shared/window-state";

declare global {
  interface Window {
    dashboard?: {
      readonly isDesktop: boolean;
      getWindowState(): Promise<WindowState>;
      getInputDebugState(): Promise<InputDebugSnapshot>;
      reportInputDebugEvent(inputEvent: InputDebugEvent): void;
      onInputDebugChange(
        callback: (snapshot: InputDebugSnapshot) => void,
      ): () => void;
      setPointerInteraction(interaction: PointerInteraction): void;
      onWindowStateChange(callback: (state: WindowState) => void): () => void;
    };
  }
}
