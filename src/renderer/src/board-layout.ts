import type { Layout } from "react-grid-layout";
import type { WindowState } from "../../shared/window-state";

export const initialBoardLayout: Layout = [
  { i: "overview", x: 0, y: 0, w: 4, h: 2 },
  { i: "team-links", x: 4, y: 0, w: 3, h: 2 },
  { i: "scratchpad", x: 7, y: 0, w: 2, h: 3 },
  { i: "webgl-check", x: 9, y: 0, w: 3, h: 3 },
  { i: "weekly-focus", x: 0, y: 2, w: 4, h: 2 },
  { i: "activity", x: 4, y: 3, w: 4, h: 2 },
];

export interface BoardLayoutState {
  layout: Layout;
  committedLayout: Layout;
  dragStartLayout: Layout | null;
}

export function isBoardDraggable(windowState: WindowState): boolean {
  return windowState === "edit";
}

export function createBoardLayoutState(layout: Layout): BoardLayoutState {
  const copy = cloneLayout(layout);
  return {
    layout: copy,
    committedLayout: copy,
    dragStartLayout: null,
  };
}

export function beginBoardDrag(state: BoardLayoutState): BoardLayoutState {
  if (state.dragStartLayout) return state;
  return {
    ...state,
    layout: cloneLayout(state.committedLayout),
    dragStartLayout: cloneLayout(state.committedLayout),
  };
}

export function updateBoardDrag(
  state: BoardLayoutState,
  layout: Layout,
): BoardLayoutState {
  if (!state.dragStartLayout) return state;
  return { ...state, layout: cloneLayout(layout) };
}

export function finishBoardDrag(
  state: BoardLayoutState,
  layout: Layout,
): BoardLayoutState {
  if (!state.dragStartLayout) return state;
  const copy = cloneLayout(layout);
  return {
    layout: copy,
    committedLayout: copy,
    dragStartLayout: null,
  };
}

export function cancelBoardDrag(state: BoardLayoutState): BoardLayoutState {
  if (!state.dragStartLayout) return state;
  return {
    ...state,
    layout: state.dragStartLayout,
    dragStartLayout: null,
  };
}

function cloneLayout(layout: Layout): Layout {
  return layout.map((item) => ({ ...item }));
}
