# Dashboard Overlay (working name)

A Windows desktop overlay that shows a personal/work dashboard of widgets on top of the desktop. Users can edit the layout and share it as a file. The first widget type is a link tile (icon plus a web or app link). Light 3D visuals and theming are planned for demo use.

## Usage

Run `npm install`, then `npm run dev` to open the starter dashboard in an Electron window. The current window is a development shell; overlay behavior and widgets are future milestones.

## Build and run

Prerequisites: Node.js 22 or newer, npm 10 or newer, and Git on Windows.

- `npm run dev` starts the Electron window with Vite hot reload.
- `npm run build` type-checks and builds the Electron and renderer bundles.
- `npm test` runs the unit tests.
- `npm run lint` checks the TypeScript source.
- `npm run format:check` checks formatting; `npm run format` applies it.
- If switching package managers on an existing checkout, use `npm ci` to clean-install from the committed npm lockfile.

## Current behavior and limits

- Status: M0 development scaffold with a basic Electron window and React welcome screen.
- Platform: Windows only.
- Stack: Electron, electron-vite, Vite, React, TypeScript, ESLint, Prettier, and Vitest.
- Electron exposes only a small desktop-presence flag through preload. Overlay behavior, widgets, persistence, packaging, and auto-update are not implemented yet.
