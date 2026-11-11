import { describe, expect, it, vi } from "vitest";
import { shouldCapturePointer } from "./pointer-capture";

describe("shouldCapturePointer", () => {
  it.each([
    ["button", "button"],
    ["add/remove control", "button"],
    ["resize handle", ".react-resizable-handle"],
    ["explicit no-capture target", "[data-no-capture]"],
  ])("does not capture a %s", (_label, selector) => {
    const captureSelector =
      "button, input, select, textarea, a, [data-no-capture], .react-resizable-handle";
    const target = {
      closest: vi.fn((selectors: string) =>
        selectors.includes(selector) ? {} : null,
      ),
    };

    expect(shouldCapturePointer(target)).toBe(false);
    expect(target.closest).toHaveBeenCalledWith(captureSelector);
  });

  it("does not capture a child of a control", () => {
    const target = { closest: vi.fn(() => ({})) };

    expect(shouldCapturePointer(target)).toBe(false);
  });

  it("captures a plain panel area", () => {
    const target = { closest: vi.fn(() => null) };

    expect(shouldCapturePointer(target)).toBe(true);
  });

  it("does not capture when the target is null", () => {
    expect(shouldCapturePointer(null)).toBe(false);
  });
});
