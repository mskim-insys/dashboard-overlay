# Dashboard Overlay (working name)

A Windows desktop overlay that shows a personal/work dashboard of widgets on top of the desktop. Users can edit the layout and share it as a file. The first widget type is a link tile (icon plus a web or app link). Light 3D visuals and theming are planned for demo use.

## Usage

Run `pnpm install`, then `pnpm dev` to open the dashboard overlay.

## Build and run

Prerequisites: Node.js >=22.12 <23, pnpm 10 or newer, and Git on Windows.

- `pnpm dev` starts the Electron window with Vite hot reload.
- `pnpm build` type-checks and builds the Electron and renderer bundles.
- `pnpm test` runs the unit tests.
- `pnpm lint` checks the TypeScript source.
- `pnpm format:check` checks formatting; `pnpm format` applies it.

To verify a fresh clone on Windows, run:

```powershell
git clone https://github.com/mskim-insys/dashboard-overlay.git
Set-Location dashboard-overlay
pnpm install
pnpm dev
```

The workspace allows Electron's install script. With the pinned Electron 42.3.3, a clean `pnpm install` did not fetch the runtime in the fresh-clone check. If the first `pnpm dev` reports `Electron uninstall`, run `pnpm exec electron --version` once to download the runtime, then run `pnpm dev` again.

## Current behavior and limits

- Status: M2 provides six placeholder tiles on a fluid-width, 12-column grid. In edit mode, tiles can be dragged and resized, and placeholder tiles can be added or removed; the board has a 2-by-2 tile minimum and an eight-row limit. Add is disabled with a reason when no 3-by-2 slot fits, and the empty-board state still offers Add. Full boards scroll within the available work area. Display mode locks the layout and hides resize/remove/add controls; gaps between tiles remain click-through. The tray and global hotkey switch modes, and Escape exits edit mode. Layout persistence and the widget configuration dialog are not implemented yet.
- Platform: Windows only.
- Stack: Electron, electron-vite, Vite, React, TypeScript, ESLint, Prettier, and Vitest.
- The default hotkey is `Ctrl+Alt+Shift+D` on Windows. The tray menu also provides Show, Hide, Edit mode, and Quit.
- The grid uses `react-grid-layout` 2.3.0. The WebGL smoke check remains in a placeholder tile.
- Changing display scaling from 125% to 100% while the app is running can make tile gaps look wider until a tile is rearranged; this is an accepted M2 known issue, with an unverified viewport-resizing hypothesis in [DECISIONS.md](./DECISIONS.md#2026-11-11-02-accept-display-scaling-gap-change-as-an-m2-known-issue).
- The Electron window loads only the local bundled renderer or the loopback Vite development server; it does not load remote content.
- Widgets, layout persistence, packaging, and auto-update are not implemented yet.
