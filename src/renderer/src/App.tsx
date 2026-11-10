import { useEffect, useRef, useState } from "react";
import type {
  InputDebugEvent,
  InputDebugSnapshot,
  PointerInteraction,
} from "../../shared/ipc";
import type { WindowState } from "../../shared/window-state";
import { isDesktop } from "./platform";

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
  const [debugSnapshot, setDebugSnapshot] = useState<InputDebugSnapshot>({
    enabled: false,
    mode: "unknown",
    lastEvent: "none",
    lastSetIgnoreMouseEvents: "not called",
    scaleFactor: 0,
    windowBounds: "unknown",
    displayWorkArea: "unknown",
    rendererViewport: "not reported",
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
    if (!isDesktop || !bridge) return;

    let active = true;
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
        if (active) setDebugSnapshot(snapshot);
      })
      .catch((error: unknown) => {
        console.error("Failed to get input debug state:", error);
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
    if (!debugSnapshot.enabled || !window.dashboard) return;
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
    window.dashboard.reportInputDebugEvent(inputEvent);
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
            <strong>Input diagnostics (dev flag)</strong>
            <span>Last event: {debugSnapshot.lastEvent}</span>
            <span>
              Mode: {debugSnapshot.mode}; setIgnoreMouseEvents:{" "}
              {debugSnapshot.lastSetIgnoreMouseEvents}
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
          </aside>
        )}
      </section>
    </main>
  );
}
