import { describe, expect, it } from "vitest";
import {
  getPrimaryWorkAreaBounds,
  shouldIgnoreMouseEvents,
  transitionWindowState,
  type DisplayWorkArea,
} from "./window-state";

describe("window state", () => {
  it("uses the hotkey to show, hide, or leave edit mode", () => {
    expect(transitionWindowState("hidden", "hotkey")).toBe("display");
    expect(transitionWindowState("display", "hotkey")).toBe("hidden");
    expect(transitionWindowState("edit", "hotkey")).toBe("display");
  });

  it("keeps renderer failures safe and recoverable from the main process", () => {
    expect(transitionWindowState("edit", "renderer-unresponsive")).toBe(
      "display",
    );
    expect(transitionWindowState("edit", "renderer-gone")).toBe("hidden");
    expect(transitionWindowState("hidden", "show")).toBe("display");
  });

  it("does not ignore input during edit mode or a pointer drag", () => {
    expect(shouldIgnoreMouseEvents("edit", false, false)).toBe(false);
    expect(shouldIgnoreMouseEvents("display", false, true)).toBe(false);
    expect(shouldIgnoreMouseEvents("display", false, false)).toBe(true);
    expect(shouldIgnoreMouseEvents("hidden", true, true)).toBe(true);
  });

  it.each([1, 1.25, 1.5])(
    "returns primary work area DIP bounds at scale factor %s",
    (scaleFactor) => {
      const displays: DisplayWorkArea[] = [
        {
          id: 1,
          scaleFactor,
          workArea: { x: 0, y: 0, width: 1536, height: 864 },
        },
      ];

      expect(getPrimaryWorkAreaBounds(displays, 1)).toEqual({
        x: 0,
        y: 0,
        width: 1536,
        height: 864,
      });
    },
  );

  it("chooses the primary display when another display is attached", () => {
    const displays: DisplayWorkArea[] = [
      {
        id: 2,
        scaleFactor: 1.5,
        workArea: { x: 1536, y: -120, width: 1707, height: 960 },
      },
      {
        id: 1,
        scaleFactor: 1.25,
        workArea: { x: 0, y: 0, width: 1536, height: 864 },
      },
    ];

    expect(getPrimaryWorkAreaBounds(displays, 1)).toEqual({
      x: 0,
      y: 0,
      width: 1536,
      height: 864,
    });
  });

  it("fails explicitly if the primary display is missing", () => {
    expect(() => getPrimaryWorkAreaBounds([], 1)).toThrow(
      "Primary display 1 was not found",
    );
  });
});
