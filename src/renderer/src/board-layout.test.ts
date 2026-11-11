import { describe, expect, it } from "vitest";
import {
  beginBoardDrag,
  cancelBoardDrag,
  createBoardLayoutState,
  finishBoardDrag,
  initialBoardLayout,
  isBoardDraggable,
  updateBoardDrag,
} from "./board-layout";
import { transitionWindowState } from "../../shared/window-state";

const movedLayout = initialBoardLayout.map((item) =>
  item.i === "overview" ? { ...item, x: 1, y: 1 } : item,
);

describe("board layout editing", () => {
  it("allows tile dragging only in edit mode", () => {
    expect(isBoardDraggable("edit")).toBe(true);
    expect(isBoardDraggable("display")).toBe(false);
    expect(isBoardDraggable("hidden")).toBe(false);
  });

  it.each([
    ["Escape", "escape"],
    ["tray toggle", "toggle-edit"],
    ["hotkey", "hotkey"],
  ] as const)(
    "cancels a drag cleanly when %s switches modes",
    (_source, action) => {
      const state = updateBoardDrag(
        beginBoardDrag(createBoardLayoutState(initialBoardLayout)),
        movedLayout,
      );

      expect(transitionWindowState("edit", action)).toBe("display");
      const cancelled = cancelBoardDrag(state);

      expect(cancelled.layout).toEqual(initialBoardLayout);
      expect(cancelled.committedLayout).toEqual(initialBoardLayout);
      expect(cancelled.dragStartLayout).toBeNull();
      expect(updateBoardDrag(cancelled, movedLayout)).toBe(cancelled);
      expect(finishBoardDrag(cancelled, movedLayout)).toBe(cancelled);
    },
  );

  it("preserves a committed layout across edit, display, and edit", () => {
    const editing = finishBoardDrag(
      updateBoardDrag(
        beginBoardDrag(createBoardLayoutState(initialBoardLayout)),
        movedLayout,
      ),
      movedLayout,
    );
    const displayMode = transitionWindowState("edit", "toggle-edit");
    const afterDisplay = cancelBoardDrag(editing);
    const editMode = transitionWindowState(displayMode, "toggle-edit");

    expect(displayMode).toBe("display");
    expect(editMode).toBe("edit");
    expect(afterDisplay.layout).toEqual(movedLayout);
    expect(afterDisplay.committedLayout).toEqual(movedLayout);
    expect(afterDisplay.dragStartLayout).toBeNull();
  });
});
