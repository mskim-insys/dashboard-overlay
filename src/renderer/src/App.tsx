import { useEffect, useRef, useState } from "react";
import type { PointerInteraction } from "../../shared/ipc";
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
    void bridge
      .getWindowState()
      .then((state) => {
        if (active) setWindowState(state);
      })
      .catch((error: unknown) => {
        console.error("Failed to get overlay state:", error);
      });

    return () => {
      active = false;
      unsubscribe();
      bridge.setPointerInteraction({ interactive: false, dragging: false });
    };
  }, []);

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
    if (isInteractiveTarget(event.target)) reportPointer(true, false);
  }

  function handlePointerOut(event: React.PointerEvent<HTMLElement>): void {
    if (!isInteractiveTarget(event.target)) return;
    if (isInteractiveTarget(event.relatedTarget)) return;
    reportPointer(false, interactionRef.current.dragging);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLElement>): void {
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
    const captureTarget = pointerCaptureRef.current;
    if (captureTarget?.hasPointerCapture(event.pointerId)) {
      captureTarget.releasePointerCapture(event.pointerId);
    }
    pointerCaptureRef.current = null;
    const target = document.elementFromPoint(event.clientX, event.clientY);
    reportPointer(isInteractiveTarget(target), false);
  }

  function handlePointerCancel(event: React.PointerEvent<HTMLElement>): void {
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
            onClick={() => setClickCount((count) => count + 1)}
          >
            Click test ({clickCount})
          </button>
          <span className="mode-indicator" role="status">
            {windowState === "edit"
              ? "Edit mode · Esc to exit"
              : "Display mode"}
          </span>
        </div>
      </section>
    </main>
  );
}
