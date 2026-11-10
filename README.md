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

- Status: M1 overlay shell with display/edit modes, a tray menu, a global hotkey, a transparent click-through surface, and an interactive placeholder panel with a WebGL runtime check. Widgets and layout editing are not implemented yet.
- Platform: Windows only.
- Stack: Electron, electron-vite, Vite, React, TypeScript, ESLint, Prettier, and Vitest.
- The default hotkey is `Ctrl+Alt+Shift+D` on Windows. The tray menu also provides Show, Hide, Edit mode, and Quit.
- The Electron window loads only the local bundled renderer or the loopback Vite development server; it does not load remote content.
- Widgets, layout persistence, packaging, and auto-update are not implemented yet.
