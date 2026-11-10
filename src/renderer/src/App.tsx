import { useEffect, useRef, useState } from "react";
import type {
  InputDebugEvent,
  InputDebugSnapshot,
  PointerInteraction,
} from "../../shared/ipc";
import type { WindowState } from "../../shared/window-state";
import { isDesktop } from "./platform";
import { shouldCapturePointer } from "./pointer-capture";

function isInteractiveTarget(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    target.closest("[data-overlay-interactive]") !== null
  );
}

export default function App() {
  const [windowState, setWindowState] = useState<WindowState>("display");
  const [clickCount, setClickCount] = useState(0);
  const [webglStatus, setWebglStatus] = useState("Initializing WebGL…");
  const [bridgeError, setBridgeError] = useState<string | null>(null);
  const [debugSnapshot, setDebugSnapshot] = useState<InputDebugSnapshot>({
    enabled: __INPUT_DEBUG_ENABLED__,
    mode: "unknown",
    startupBanner: `renderer build flag=${__INPUT_DEBUG_ENABLED__}; main bootstrap pending`,
    logFile: "not initialized",
    lastPointerEvent: "none",
    lastClick: "none",
    lastSetIgnoreMouseEvents: "not called",
    scaleFactor: 0,
    windowBounds: "unknown",
    displayWorkArea: "unknown",
    rendererViewport: "not reported",
    hasModeTransitionSinceLaunch: false,
    hasEnteredEditModeSinceLaunch: false,
    modeTransitionCount: 0,
    lastModeTransitionAt: "none",
    millisecondsSinceLastModeTransition: 0,
    initialWindowSetup: "not initialized",
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerCaptureRef = useRef<HTMLElement | null>(null);
  const interactionRef = useRef<PointerInteraction>({
    interactive: false,
    dragging: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
    });
    if (!context) {
      setWebglStatus("WebGL unavailable");
      return;
    }

    context.viewport(0, 0, canvas.width, canvas.height);
    context.clearColor(0.13, 0.2, 0.37, 1);
    context.clear(context.COLOR_BUFFER_BIT);
    setWebglStatus("WebGL canvas active");
  }, []);

  useEffect(() => {
    const bridge = window.dashboard;
    const bridgeStatus = {
      isDesktop,
      bridgeAvailable: Boolean(bridge),
      inputDebugEnabled: bridge?.inputDebugEnabled ?? false,
    };
    console.info(
      `[renderer] diagnostics bridge ${JSON.stringify(bridgeStatus)}`,
    );
    if (!isDesktop || !bridge) {
      const error = !bridge
        ? "Dashboard preload bridge is unavailable. Restart the app; if this persists, check the main-process log."
        : "Dashboard preload bridge did not identify this as the desktop app.";
      console.error(error, bridgeStatus);
      setBridgeError(error);
      if (__INPUT_DEBUG_ENABLED__) {
        setDebugSnapshot((snapshot) => ({
          ...snapshot,
          enabled: true,
          startupBanner: `renderer flag=true; preload bridge unavailable (${JSON.stringify(bridgeStatus)})`,
        }));
      }
      return;
    }

    let active = true;
    if (bridge.inputDebugEnabled) {
      setDebugSnapshot((snapshot) => ({
        ...snapshot,
        enabled: true,
        startupBanner: `renderer flag=${__INPUT_DEBUG_ENABLED__}; preload flag=${bridge.inputDebugEnabled}; main bootstrap pending`,
      }));
    }
    const unsubscribe = bridge.onWindowStateChange(setWindowState);
    const unsubscribeDebug = bridge.onInputDebugChange(setDebugSnapshot);
    void bridge
      .getWindowState()
      .then((state) => {
        if (active) setWindowState(state);
      })
      .catch((error: unknown) => {
        console.error("Failed to get overlay state:", error);
      });
    void bridge
      .getInputDebugState()
      .then((snapshot) => {
        console.info("[renderer] diagnostics bootstrap", snapshot);
        if (active) setDebugSnapshot(snapshot);
      })
      .catch((error: unknown) => {
        console.error("Failed to get input debug state:", error);
        if (active && __INPUT_DEBUG_ENABLED__) {
          setDebugSnapshot((snapshot) => ({
            ...snapshot,
            enabled: true,
            startupBanner: `renderer flag=${__INPUT_DEBUG_ENABLED__}; preload flag=${bridge.inputDebugEnabled}; main bootstrap failed: ${String(error)}`,
          }));
        }
      });

    return () => {
      active = false;
      unsubscribe();
      unsubscribeDebug();
      bridge.setPointerInteraction({ interactive: false, dragging: false });
    };
  }, []);

  function reportInputDebugEvent(
    event: MouseEvent | PointerEvent,
    type: string,
  ): void {
    if (!__INPUT_DEBUG_ENABLED__) return;
    const describe = (target: EventTarget | null): string => {
      if (!(target instanceof Element)) return "none";
      const id = target.id ? `#${target.id}` : "";
      const className =
        typeof target.className === "string" && target.className
          ? `.${target.className.trim().replace(/\s+/g, ".")}`
          : "";
      return `${target.tagName.toLowerCase()}${id}${className}`;
    };
    const inputEvent: InputDebugEvent = {
      type,
      mode: windowState,
      target: describe(event.target),
      relatedTarget:
        "relatedTarget" in event ? describe(event.relatedTarget) : "none",
      clientX: "clientX" in event ? event.clientX : null,
      clientY: "clientY" in event ? event.clientY : null,
      screenX: "screenX" in event ? event.screenX : null,
      screenY: "screenY" in event ? event.screenY : null,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
    };
    const eventSummary = `${type} target=${inputEvent.target} client=(${inputEvent.clientX},${inputEvent.clientY}) screen=(${inputEvent.screenX},${inputEvent.screenY}) mode=${windowState}`;
    console.info(
      `[input diagnostics renderer event] ${JSON.stringify(inputEvent)}`,
    );
    setDebugSnapshot((snapshot) => ({
      ...snapshot,
      lastPointerEvent:
        type === "click" ? snapshot.lastPointerEvent : eventSummary,
      lastClick:
        type === "click"
          ? `${eventSummary} at=${new Date().toISOString()}`
          : snapshot.lastClick,
      mode: windowState,
      rendererViewport: `${window.innerWidth}x${window.innerHeight} @${window.devicePixelRatio}`,
    }));
    window.dashboard?.reportInputDebugEvent(inputEvent);
  }

  function reportPointer(interactive: boolean, dragging: boolean): void {
    if (!isDesktop || !window.dashboard || windowState !== "display") return;
    const next = { interactive: interactive || dragging, dragging };
    const previous = interactionRef.current;
    if (
      previous.interactive === next.interactive &&
      previous.dragging === next.dragging
    ) {
      return;
    }
    interactionRef.current = next;
    window.dashboard.setPointerInteraction(next);
  }

  function handlePointerOver(event: React.PointerEvent<HTMLElement>): void {
    reportInputDebugEvent(event.nativeEvent, "pointerover");
    if (isInteractiveTarget(event.target)) reportPointer(true, false);
  }

  function handlePointerOut(event: React.PointerEvent<HTMLElement>): void {
    reportInputDebugEvent(event.nativeEvent, "pointerout");
    if (!isInteractiveTarget(event.target)) return;
    if (isInteractiveTarget(event.relatedTarget)) return;
    reportPointer(false, interactionRef.current.dragging);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLElement>): void {
    reportInputDebugEvent(event.nativeEvent, "pointerdown");
    if (!isInteractiveTarget(event.target)) return;
    const eventTarget = event.target instanceof Element ? event.target : null;
    if (!shouldCapturePointer(eventTarget)) {
      pointerCaptureRef.current = null;
      reportPointer(true, true);
      return;
    }
    const target =
      event.target instanceof HTMLElement
        ? event.target.closest<HTMLElement>("[data-overlay-interactive]")
        : null;
    target?.setPointerCapture(event.pointerId);
    pointerCaptureRef.current = target;
    reportPointer(true, true);
  }

  function handlePointerUp(event: React.PointerEvent<HTMLElement>): void {
    reportInputDebugEvent(event.nativeEvent, "pointerup");
    const captureTarget = pointerCaptureRef.current;
    if (captureTarget?.hasPointerCapture(event.pointerId)) {
      captureTarget.releasePointerCapture(event.pointerId);
    }
    pointerCaptureRef.current = null;
    const target = document.elementFromPoint(event.clientX, event.clientY);
    reportPointer(isInteractiveTarget(target), false);
  }

  function handlePointerCancel(event: React.PointerEvent<HTMLElement>): void {
    reportInputDebugEvent(event.nativeEvent, "pointercancel");
    const captureTarget = pointerCaptureRef.current;
    if (captureTarget?.hasPointerCapture(event.pointerId)) {
      captureTarget.releasePointerCapture(event.pointerId);
    }
    pointerCaptureRef.current = null;
    reportPointer(false, false);
  }

  return (
    <main
      className={`app-shell mode-${windowState}`}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <section
        className="interactive-panel"
        data-overlay-interactive
        aria-labelledby="app-title"
      >
        {bridgeError && (
          <aside className="bridge-error" role="alert">
            {bridgeError}
          </aside>
        )}
        <p className="eyebrow">M1 | OVERLAY SHELL</p>
        <h1 id="app-title">Dashboard Overlay</h1>
        <p className="description">
          This placeholder panel is interactive. The transparent area around it
          should pass clicks through in display mode.
        </p>
        <canvas
          ref={canvasRef}
          className="webgl-canvas"
          width={240}
          height={90}
          aria-label="WebGL runtime check"
        />
        <p className="webgl-status" role="status">
          {webglStatus}
        </p>
        <div className="panel-footer">
          <button
            className="test-button"
            type="button"
            onClick={(event) => {
              reportInputDebugEvent(event.nativeEvent, "click");
              setClickCount((count) => count + 1);
            }}
          >
            Click test ({clickCount})
          </button>
          <span className="mode-indicator" role="status">
            {windowState === "edit"
              ? "Edit mode · Esc to exit"
              : "Display mode"}
          </span>
        </div>
        {debugSnapshot.enabled && (
          <aside className="input-debug" aria-label="Input diagnostics">
            <strong>INPUT DIAGNOSTICS · {debugSnapshot.startupBanner}</strong>
            <span>Pointer: {debugSnapshot.lastPointerEvent}</span>
            <span>Click: {debugSnapshot.lastClick}</span>
            <span>
              Mode: {debugSnapshot.mode}; transitions since launch:{" "}
              {debugSnapshot.hasModeTransitionSinceLaunch} (
              {debugSnapshot.modeTransitionCount}); entered edit:{" "}
              {debugSnapshot.hasEnteredEditModeSinceLaunch}; last transition:{" "}
              {debugSnapshot.lastModeTransitionAt} (
              {debugSnapshot.millisecondsSinceLastModeTransition} ms ago)
            </span>
            <span>
              setIgnoreMouseEvents: {debugSnapshot.lastSetIgnoreMouseEvents}
            </span>
            <span>
              Scale: {debugSnapshot.scaleFactor}; bounds:{" "}
              {debugSnapshot.windowBounds}; work area:{" "}
              {debugSnapshot.displayWorkArea}
            </span>
            <span>
              Renderer: {debugSnapshot.rendererViewport} (current{" "}
              {window.innerWidth}x{window.innerHeight} @
              {window.devicePixelRatio})
            </span>
            <span>Initial setup: {debugSnapshot.initialWindowSetup}</span>
            <span>Diagnostics log: {debugSnapshot.logFile}</span>
          </aside>
        )}
      </section>
    </main>
  );
}
