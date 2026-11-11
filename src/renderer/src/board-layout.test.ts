import { describe, expect, it } from "vitest";
import {
  addBoardTile,
  beginBoardInteraction,
  BOARD_MAX_ROWS,
  cancelBoardInteraction,
  createBoardLayoutState,
  finishBoardInteraction,
  findTilePosition,
  initialBoardLayout,
  isBoardDraggable,
  isBoardLayoutWithinBounds,
  isBoardResizable,
  NEW_TILE_HEIGHT,
  NEW_TILE_WIDTH,
  removeBoardTile,
  updateBoardInteraction,
} from "./board-layout";
import { transitionWindowState } from "../../shared/window-state";

const movedLayout = initialBoardLayout.map((item) =>
  item.i === "overview" ? { ...item, x: 8, y: 5 } : item,
);

const fullBoardLayout = Array.from({ length: 24 }, (_, index) => ({
  i: `tile-${index}`,
  x: (index % 6) * 2,
  y: Math.floor(index / 6) * 2,
  w: 2,
  h: 2,
}));

describe("board layout editing", () => {
  it("allows tile dragging and resizing only in edit mode", () => {
    expect(isBoardDraggable("edit")).toBe(true);
    expect(isBoardDraggable("display")).toBe(false);
    expect(isBoardDraggable("hidden")).toBe(false);
    expect(isBoardResizable("edit")).toBe(true);
    expect(isBoardResizable("display")).toBe(false);
    expect(isBoardResizable("hidden")).toBe(false);
  });

  it.each([
    ["Escape", "escape"],
    ["tray toggle", "toggle-edit"],
    ["hotkey", "hotkey"],
  ] as const)(
    "cancels a drag or resize cleanly when %s switches modes",
    (_source, action) => {
      const state = updateBoardInteraction(
        beginBoardInteraction(createBoardLayoutState(initialBoardLayout)),
        movedLayout,
      );

      expect(transitionWindowState("edit", action)).toBe("display");
      const cancelled = cancelBoardInteraction(state);

      expect(cancelled.layout).toEqual(initialBoardLayout);
      expect(cancelled.committedLayout).toEqual(initialBoardLayout);
      expect(cancelled.interactionStartLayout).toBeNull();
      expect(updateBoardInteraction(cancelled, movedLayout)).toBe(cancelled);
      expect(finishBoardInteraction(cancelled, movedLayout)).toBe(cancelled);
    },
  );

  it("preserves a committed layout across edit, display, and edit", () => {
    const editing = finishBoardInteraction(
      updateBoardInteraction(
        beginBoardInteraction(createBoardLayoutState(initialBoardLayout)),
        movedLayout,
      ),
      movedLayout,
    );
    const displayMode = transitionWindowState("edit", "toggle-edit");
    const afterDisplay = cancelBoardInteraction(editing);
    const editMode = transitionWindowState(displayMode, "toggle-edit");

    expect(displayMode).toBe("display");
    expect(editMode).toBe("edit");
    expect(afterDisplay.layout).toEqual(movedLayout);
    expect(afterDisplay.committedLayout).toEqual(movedLayout);
    expect(afterDisplay.interactionStartLayout).toBeNull();
  });

  it("rejects drag or resize layouts that overflow the full eight-row board", () => {
    expect(isBoardLayoutWithinBounds(fullBoardLayout)).toBe(true);
    expect(findTilePosition(fullBoardLayout)).toBeNull();

    const state = beginBoardInteraction(
      createBoardLayoutState(fullBoardLayout),
    );
    const overflowLayout = fullBoardLayout.map((item) =>
      item.i === "tile-0" ? { ...item, y: BOARD_MAX_ROWS - 1 } : item,
    );

    expect(isBoardLayoutWithinBounds(overflowLayout)).toBe(false);
    expect(updateBoardInteraction(state, overflowLayout)).toBe(state);
    expect(finishBoardInteraction(state, overflowLayout)).toMatchObject({
      layout: fullBoardLayout,
      committedLayout: fullBoardLayout,
      interactionStartLayout: null,
    });
  });

  it("enforces the minimum tile size and board boundaries", () => {
    expect(isBoardLayoutWithinBounds(initialBoardLayout)).toBe(true);
    expect(
      isBoardLayoutWithinBounds([{ i: "too-small", x: 0, y: 0, w: 1, h: 2 }]),
    ).toBe(false);
    expect(
      isBoardLayoutWithinBounds([
        { i: "too-low", x: 0, y: BOARD_MAX_ROWS - 1, w: 2, h: 2 },
      ]),
    ).toBe(false);
  });

  it("adds a placeholder only where its full size fits within the board", () => {
    const state = createBoardLayoutState(initialBoardLayout);
    const added = addBoardTile(state, "placeholder-1");

    expect(added).not.toBeNull();
    expect(
      added?.layout.find((item) => item.i === "placeholder-1"),
    ).toMatchObject({
      w: NEW_TILE_WIDTH,
      h: NEW_TILE_HEIGHT,
      minW: 2,
      minH: 2,
      maxW: 12,
      maxH: BOARD_MAX_ROWS,
    });
    expect(isBoardLayoutWithinBounds(added?.layout ?? [])).toBe(true);
    expect(addBoardTile(state, "overview")).toBeNull();
    expect(
      addBoardTile(createBoardLayoutState(fullBoardLayout), "extra"),
    ).toBeNull();
  });

  it("supports an empty board and adding after removing the last tile", () => {
    const empty = createBoardLayoutState([]);

    expect(findTilePosition(empty.layout)).toEqual({ x: 0, y: 0 });
    const first = addBoardTile(empty, "placeholder-1");
    if (!first) throw new Error("Expected an empty board to accept a tile");
    expect(first.layout).toHaveLength(1);
    expect(first.layout[0]).toMatchObject({
      x: 0,
      y: 0,
      w: NEW_TILE_WIDTH,
      h: NEW_TILE_HEIGHT,
    });

    const cleared = removeBoardTile(first, "placeholder-1");
    expect(cleared.layout).toEqual([]);
    expect(findTilePosition(cleared.layout)).toEqual({ x: 0, y: 0 });
    expect(addBoardTile(cleared, "placeholder-2")?.layout).toHaveLength(1);
  });

  it("compacts remaining tiles after removal", () => {
    const state = createBoardLayoutState(initialBoardLayout);
    const removed = removeBoardTile(state, "overview");

    expect(removed.layout.some((item) => item.i === "overview")).toBe(false);
    expect(isBoardLayoutWithinBounds(removed.layout)).toBe(true);
    expect(
      removed.layout.find((item) => item.i === "weekly-focus")?.y,
    ).toBeLessThan(2);
  });
});
