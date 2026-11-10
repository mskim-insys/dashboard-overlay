export type WindowState = "hidden" | "display" | "edit";

export type WindowAction =
  | "hotkey"
  | "show"
  | "hide"
  | "toggle-edit"
  | "escape"
  | "renderer-gone"
  | "renderer-unresponsive";

export interface DisplayWorkArea {
  id: number;
  scaleFactor: number;
  workArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function transitionWindowState(
  state: WindowState,
  action: WindowAction,
): WindowState {
  switch (action) {
    case "hotkey":
      if (state === "hidden") return "display";
      if (state === "edit") return "display";
      return "hidden";
    case "show":
      return "display";
    case "hide":
    case "renderer-gone":
      return "hidden";
    case "toggle-edit":
      return state === "edit" ? "display" : "edit";
    case "escape":
    case "renderer-unresponsive":
      return state === "edit" ? "display" : state;
  }
}

export function shouldIgnoreMouseEvents(
  state: WindowState,
  pointerInteractive: boolean,
  pointerDragging: boolean,
): boolean {
  if (state === "hidden") return true;
  if (state === "edit") return false;
  return !pointerInteractive && !pointerDragging;
}

export function getPrimaryWorkAreaBounds(
  displays: readonly DisplayWorkArea[],
  primaryDisplayId: number,
): WindowBounds {
  const primary = displays.find((display) => display.id === primaryDisplayId);
  if (!primary) {
    throw new Error(`Primary display ${primaryDisplayId} was not found`);
  }

  return { ...primary.workArea };
}
