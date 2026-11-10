export const IPC_CHANNELS = {
  getWindowState: "dashboard:get-window-state",
  windowStateChanged: "dashboard:window-state-changed",
  pointerInteraction: "dashboard:pointer-interaction",
} as const;

export interface PointerInteraction {
  interactive: boolean;
  dragging: boolean;
}

export function isPointerInteraction(
  value: unknown,
): value is PointerInteraction {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  return (
    "interactive" in value &&
    typeof value.interactive === "boolean" &&
    "dragging" in value &&
    typeof value.dragging === "boolean"
  );
}
