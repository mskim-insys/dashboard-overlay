export const IPC_CHANNELS = {
  getWindowState: "dashboard:get-window-state",
  windowStateChanged: "dashboard:window-state-changed",
  pointerInteraction: "dashboard:pointer-interaction",
  getInputDebugState: "dashboard:get-input-debug-state",
  inputDebugEvent: "dashboard:input-debug-event",
  inputDebugChanged: "dashboard:input-debug-changed",
} as const;

export interface PointerInteraction {
  interactive: boolean;
  dragging: boolean;
}

export interface InputDebugEvent {
  type: string;
  mode: string;
  target: string;
  relatedTarget: string;
  clientX: number | null;
  clientY: number | null;
  screenX: number | null;
  screenY: number | null;
  innerWidth: number;
  innerHeight: number;
  devicePixelRatio: number;
}

export interface InputDebugSnapshot {
  enabled: boolean;
  mode: string;
  startupBanner: string;
  logFile: string;
  lastPointerEvent: string;
  lastClick: string;
  lastSetIgnoreMouseEvents: string;
  scaleFactor: number;
  windowBounds: string;
  displayWorkArea: string;
  rendererViewport: string;
  hasModeTransitionSinceLaunch: boolean;
  hasEnteredEditModeSinceLaunch: boolean;
  modeTransitionCount: number;
  lastModeTransitionAt: string;
  millisecondsSinceLastModeTransition: number;
  initialWindowSetup: string;
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

export function isInputDebugEvent(value: unknown): value is InputDebugEvent {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  return (
    "type" in value &&
    typeof value.type === "string" &&
    "mode" in value &&
    typeof value.mode === "string" &&
    "target" in value &&
    typeof value.target === "string" &&
    "relatedTarget" in value &&
    typeof value.relatedTarget === "string" &&
    "clientX" in value &&
    isNullableNumber(value.clientX) &&
    "clientY" in value &&
    isNullableNumber(value.clientY) &&
    "screenX" in value &&
    isNullableNumber(value.screenX) &&
    "screenY" in value &&
    isNullableNumber(value.screenY) &&
    "innerWidth" in value &&
    typeof value.innerWidth === "number" &&
    "innerHeight" in value &&
    typeof value.innerHeight === "number" &&
    "devicePixelRatio" in value &&
    typeof value.devicePixelRatio === "number"
  );
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || typeof value === "number";
}
