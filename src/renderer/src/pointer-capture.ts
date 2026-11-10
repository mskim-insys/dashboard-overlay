interface PointerCaptureTarget {
  closest(selectors: string): object | null;
}

const noCaptureSelector =
  "button, input, select, textarea, a, [data-no-capture]";

export function shouldCapturePointer(
  target: PointerCaptureTarget | null,
): boolean {
  return target !== null && target.closest(noCaptureSelector) === null;
}
