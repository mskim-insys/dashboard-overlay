import { describe, expect, it, vi } from "vitest";
import { shouldCapturePointer } from "./pointer-capture";

describe("shouldCapturePointer", () => {
  it("does not capture a control", () => {
    const target = { closest: vi.fn(() => ({})) };

    expect(shouldCapturePointer(target)).toBe(false);
    expect(target.closest).toHaveBeenCalledWith(
      "button, input, select, textarea, a, [data-no-capture]",
    );
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
