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
  if (typeof value !== "object" || value === null) return false;

  const interaction = value as Record<string, unknown>;
  return (
    typeof interaction.interactive === "boolean" &&
    typeof interaction.dragging === "boolean"
  );
}
