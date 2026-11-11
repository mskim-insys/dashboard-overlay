import { verticalCompactor, type Layout } from "react-grid-layout";
import type { WindowState } from "../../shared/window-state";

export const BOARD_COLUMNS = 12;
export const BOARD_MAX_ROWS = 8;
export const BOARD_MIN_TILE_WIDTH = 2;
export const BOARD_MIN_TILE_HEIGHT = 2;
export const NEW_TILE_WIDTH = 3;
export const NEW_TILE_HEIGHT = 2;

export const initialBoardLayout: Layout = [
  { i: "overview", x: 0, y: 0, w: 4, h: 2 },
  { i: "team-links", x: 4, y: 0, w: 3, h: 2 },
  { i: "scratchpad", x: 7, y: 0, w: 2, h: 3 },
  { i: "webgl-check", x: 9, y: 0, w: 3, h: 3 },
  { i: "weekly-focus", x: 0, y: 2, w: 4, h: 2 },
  { i: "activity", x: 4, y: 3, w: 4, h: 2 },
].map(withTileConstraints);

export interface BoardLayoutState {
  layout: Layout;
  committedLayout: Layout;
  interactionStartLayout: Layout | null;
}

export interface TilePosition {
  x: number;
  y: number;
}

export function isBoardDraggable(windowState: WindowState): boolean {
  return windowState === "edit";
}

export function isBoardResizable(windowState: WindowState): boolean {
  return windowState === "edit";
}

export function createBoardLayoutState(layout: Layout): BoardLayoutState {
  const copy = cloneLayout(layout);
  return {
    layout: copy,
    committedLayout: copy,
    interactionStartLayout: null,
  };
}

export function beginBoardInteraction(
  state: BoardLayoutState,
): BoardLayoutState {
  if (state.interactionStartLayout) return state;
  return {
    ...state,
    layout: cloneLayout(state.committedLayout),
    interactionStartLayout: cloneLayout(state.committedLayout),
  };
}

export function updateBoardInteraction(
  state: BoardLayoutState,
  layout: Layout,
): BoardLayoutState {
  if (!state.interactionStartLayout || !isBoardLayoutWithinBounds(layout)) {
    return state;
  }
  return { ...state, layout: cloneLayout(layout) };
}

export function finishBoardInteraction(
  state: BoardLayoutState,
  layout: Layout,
): BoardLayoutState {
  if (!state.interactionStartLayout) return state;
  const committed = isBoardLayoutWithinBounds(layout)
    ? cloneLayout(layout)
    : cloneLayout(state.layout);
  return {
    layout: committed,
    committedLayout: committed,
    interactionStartLayout: null,
  };
}

export function cancelBoardInteraction(
  state: BoardLayoutState,
): BoardLayoutState {
  if (!state.interactionStartLayout) return state;
  return {
    ...state,
    layout: state.interactionStartLayout,
    interactionStartLayout: null,
  };
}

export function isBoardLayoutWithinBounds(layout: Layout): boolean {
  const ids = new Set<string>();
  for (const item of layout) {
    if (
      ids.has(item.i) ||
      !Number.isInteger(item.x) ||
      !Number.isInteger(item.y) ||
      !Number.isInteger(item.w) ||
      !Number.isInteger(item.h) ||
      item.x < 0 ||
      item.y < 0 ||
      item.w < BOARD_MIN_TILE_WIDTH ||
      item.h < BOARD_MIN_TILE_HEIGHT ||
      item.x + item.w > BOARD_COLUMNS ||
      item.y + item.h > BOARD_MAX_ROWS
    ) {
      return false;
    }
    ids.add(item.i);
  }

  for (let first = 0; first < layout.length; first += 1) {
    for (let second = first + 1; second < layout.length; second += 1) {
      if (layoutsOverlap(layout[first], layout[second])) return false;
    }
  }
  return true;
}

export function findTilePosition(layout: Layout): TilePosition | null {
  for (let y = 0; y <= BOARD_MAX_ROWS - NEW_TILE_HEIGHT; y += 1) {
    for (let x = 0; x <= BOARD_COLUMNS - NEW_TILE_WIDTH; x += 1) {
      const candidate = {
        i: "__new_tile__",
        x,
        y,
        w: NEW_TILE_WIDTH,
        h: NEW_TILE_HEIGHT,
      };
      if (layout.every((item) => !layoutsOverlap(item, candidate))) {
        return { x, y };
      }
    }
  }
  return null;
}

export function addBoardTile(
  state: BoardLayoutState,
  id: string,
): BoardLayoutState | null {
  if (state.layout.some((item) => item.i === id)) return null;
  const position = findTilePosition(state.layout);
  if (!position) return null;
  const layout = compactLayout([
    ...state.layout,
    withTileConstraints({
      i: id,
      ...position,
      w: NEW_TILE_WIDTH,
      h: NEW_TILE_HEIGHT,
    }),
  ]);
  if (!isBoardLayoutWithinBounds(layout)) return null;
  return createBoardLayoutState(layout);
}

export function removeBoardTile(
  state: BoardLayoutState,
  id: string,
): BoardLayoutState {
  const layout = compactLayout(state.layout.filter((item) => item.i !== id));
  return createBoardLayoutState(layout);
}

function compactLayout(layout: Layout): Layout {
  return verticalCompactor
    .compact(cloneLayout(layout), BOARD_COLUMNS)
    .map(withTileConstraints);
}

function withTileConstraints<T extends Layout[number]>(item: T): T {
  return {
    ...item,
    minW: BOARD_MIN_TILE_WIDTH,
    minH: BOARD_MIN_TILE_HEIGHT,
    maxW: BOARD_COLUMNS,
    maxH: BOARD_MAX_ROWS,
  };
}

function layoutsOverlap(
  first: Pick<Layout[number], "x" | "y" | "w" | "h">,
  second: Pick<Layout[number], "x" | "y" | "w" | "h">,
): boolean {
  return (
    first.x < second.x + second.w &&
    first.x + first.w > second.x &&
    first.y < second.y + second.h &&
    first.y + first.h > second.y
  );
}

function cloneLayout(layout: Layout): Layout {
  return layout.map((item) => ({ ...item }));
}
