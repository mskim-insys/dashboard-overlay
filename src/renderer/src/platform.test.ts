import { describe, expect, it } from "vitest";
import { isDesktop } from "./platform";

describe("platform adapter", () => {
  it("uses the web fallback when no desktop bridge is available", () => {
    expect(isDesktop).toBe(false);
  });
});
