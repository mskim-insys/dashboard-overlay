# Spec: dashboard

Last updated: 2026-11-10

## Goal

A Windows desktop overlay that shows a customizable dashboard of widgets on top of the desktop, for office users inside the company and for light demos. Build the shell first: overlay window, editable grid, link widget, layout save and share, light 3D visuals, installer.

## Requirements

Overlay

- R1. Frameless, transparent, always-on-top window covering the primary monitor's work area.
- R2. A global hotkey shows and hides the overlay.
- R3. A tray icon offers Show/Hide, Edit mode on/off, and Quit. Autostart on login is optional.
- R4. Display mode is click-through except over widgets. Edit mode is fully interactive.

Layout

- R5. Grid with drag, resize, and snap. Tiles can be added and removed in edit mode. The layout is locked in display mode.

Widgets

- R6. Widget registry with entries `{ type, defaultSize, Component, configSchema }`. Only the `link` type is registered at first.
- R7. Link widget: icon, label, target. Icon is an emoji, a favicon fetched from the URL, or an uploaded image. Target is an http/https URL or a local app or file path. Clicking opens the URL in the default browser or launches the app.
- R8. A config dialog adds, edits, and deletes widgets.

Persistence and sharing

- R9. The layout is stored as JSON with a `schemaVersion` field in the app data folder and survives restart. A migration stub exists.
- R10. Layouts export to and import from a file. Import validates the schema, drops unknown widget types, sanitizes targets, and shows a preview summary (for example "12 links, 3 point to local paths") before applying.

Visuals

- R11. Themes (colors, fonts, tile opacity) are CSS variables stored in the layout JSON and switch live.
- R12. A three.js 3D background or tile tilt/parallax. Rendering pauses when the overlay is hidden or a fullscreen app is active. A low-power toggle exists.

Delivery

- R13. A Windows installer (NSIS) built with electron-builder, with an autostart option, auto-update from a GitHub release or an internal share, and a default demo layout.
- R14. With a second monitor attached, the overlay stays on the primary monitor and nothing breaks. Choosing the monitor is out of scope for now.

## Constraints

- Windows only.
- Electron desktop shell, see DECISIONS.md 2026-11-09-01. Overlay, not wallpaper replacement, see DECISIONS.md 2026-11-09-02.
- The dashboard UI is a plain web app. Electron-only behavior sits behind a thin platform adapter so a web build could later turn it into no-ops.
- Security: `contextIsolation` on, `nodeIntegration` off, minimal preload API. App windows load only bundled local files or the loopback development server, never remote content; links open in the default browser. Keep the renderer-loading policy centralized in the main process so a future policy change is localized. URL opening and app launching only for allowlisted targets. Imported layouts are untrusted input.
- Selected in M0: Vite, React, TypeScript, and electron-vite. Remaining planned libraries: react-grid-layout, three.js (react-three-fiber), and electron-builder; confirm when their milestones begin.
- Out of scope for now: GitHub Pages/PWA/Android build, MCP server, widget types other than `link`, monitor selection, macOS/Linux.

## Open questions

- Code signing and SAC on colleagues' PCs; decision needed before M6. Owner: user.

## Acceptance criteria

- [x] M0: `dev` script opens an Electron window with hot reload; lint and format scripts pass; build and test commands are recorded in AGENTS.md.
- [ ] M1 (R1-R4, R14): a translucent panel floats over the desktop, toggles by hotkey and tray, and does not block clicks on other apps in display mode. Manually check a single display at 100% and 125% scaling, plus mixed-scaling dual monitors if an external monitor is available; record the results in worklogs/dashboard.md.
- [ ] M2 (R5): placeholder tiles can be rearranged in edit mode and are locked in display mode.
- [ ] M3 (R6-R9): a launcher board of link widgets can be built, survives quit and relaunch unchanged, and clicking a link opens it. Targets outside the allowlist are refused.
- [ ] M4 (R10): a layout exported on one PC imports on another PC and produces an identical board. A malformed or hostile file is rejected or sanitized, with a preview shown first.
- [ ] M5 (R11, R12): a theme switch applies live; the 3D scene runs smoothly; GPU use is near zero while the overlay is hidden.
- [ ] M6 (R13): on a clean Windows PC, the installer yields the demo board in under 2 minutes.

## Plan

Estimates are rough part-time days. Status and next steps are tracked in worklogs/dashboard.md, not here.

- M0, dev environment (about 0.5 day): install Node LTS, pnpm, Git, ESLint, Prettier; scaffold Vite (React + TS); add Electron with a main/preload/renderer split (electron-vite or manual); add lint, format, `dev` scripts.
- M1, overlay shell (1-2 days): R1-R4. Highest risk: hover and click behavior over transparent areas on Windows, DPI scaling. Use `setIgnoreMouseEvents(true, { forward: true })` with interactive regions that capture the mouse.
- M2, grid and layout editing (2-3 days): R5, plus the edit/display mode toggle that also controls click-through.
- M3, link widget and persistence (2 days): R6-R9. Allowlist the protocols and paths passed to `shell.openExternal` and app launching. App icon extraction from `.exe` is optional and may wait.
- M4, sharing (1-2 days): R10. A shared team folder or Git repo as a layout "gallery" is an optional later step.
- M5, 3D and customization (2-4 days): R11, R12.
- M6, packaging and rollout (1-2 days): R13. Unsigned installers trigger SmartScreen warnings; tell colleagues or ask IT about a certificate.
- Later, outside this spec: web/PWA build (GitHub Pages, Android), MCP server (for example `list_widgets`, `add_link`, `export_layout`), more widget types.
