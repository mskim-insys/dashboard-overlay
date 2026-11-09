# Decisions

Append-only. Newest entries go at the bottom. Never reuse or renumber an ID.

## 2026-11-09-01 Electron over Tauri for the desktop shell

- Context: The app is a transparent always-on-top overlay with a 3D (WebGL) background, written in JS/TS, for internal distribution on Windows PCs.
- Decision: Use Electron. Keep the dashboard itself a plain web app (Vite) and use Electron only for overlay behavior (transparency, click-through, global hotkey, tray, autostart).
- Alternatives considered and rejected:
  - Tauri: rejected because native-side work (overlay, tray, hotkeys, file access) would need Rust, while the team works in JS. Its system WebView (WebView2 on Windows) would also have been acceptable for WebGL, so this was not a hard blocker. Its main advantages are installer size and idle memory; the size gap is not measured, and an installer of roughly 100 MB is acceptable for internal rollout.
- Impact / follow-ups:
  - Electron security settings (`contextIsolation` on, `nodeIntegration` off, minimal preload API) are mandatory; see specs/dashboard.md.
  - Revisit if idle RAM or installer size becomes a real complaint from users.

## 2026-11-09-02 Desktop overlay instead of wallpaper replacement

- Context: The first idea was to replace the desktop wallpaper with the dashboard. The user rarely uses dual monitors.
- Decision: Build a desktop overlay window (hotkey toggle, click-through display mode) instead of a wallpaper-layer app.
- Alternatives considered and rejected:
  - Wallpaper replacement: rejected because the dashboard would only be visible when all windows are minimized or on a second monitor, which does not fit the user's single-monitor usage. It would also likely need native desktop-layer tricks outside plain Electron (not verified).
- Impact / follow-ups:
  - Click-through versus interactive behavior over transparent areas must be tested early on Windows, including DPI scaling (see M1 in specs/dashboard.md).
  - The overlay must not block normal work: display mode is click-through except over widgets.

## 2026-11-09-03 electron-vite for the M0 scaffold

- Context: M0 needs a Vite React/TypeScript renderer and a separate Electron main/preload process with development reload.
- Decision: Use electron-vite to build and run the Electron main, preload, and renderer processes. Use ESLint, Prettier, and Vitest as project-level development tools.
- Alternatives considered and rejected:
  - Manually wiring Electron and Vite: not selected because it duplicates process and reload integration that electron-vite already provides.
- Impact / follow-ups:
  - The renderer remains a plain React web app; Electron exposure is limited to the preload bridge.
  - Confirm the planned grid, 3D, and packaging libraries when their milestones begin.

## 2026-11-09-04 Electron runtime blocked by Windows application control

- Context: The M0 development command needs Electron's downloaded runtime and its native installation helper.
- Decision: Do not bypass the machine's application-control policy or pin an older Electron solely to avoid it. Continue verifying the scaffold with build, test, lint, and format commands; run the desktop smoke test only in an authorized environment.
- Alternatives considered and rejected:
  - Downgrading Electron to avoid its native extraction helper: rejected because it would trade away current runtime fixes to work around an endpoint policy.
- Impact / follow-ups:
  - `pnpm dev` could not start here because Windows blocked `index.win32-x64-msvc.node`; if this reproduces in the user's terminal, ask IT for an approved Electron development environment.

## 2026-11-10-01 Pin Electron 42 for the M0 development environment

- Context: Electron installation hit a Windows application-control issue involving the `extract-zip` package. Disabling application control was recommended but would be a last resort because the app is intended for internal distribution.
- Decision: Use the installed Node.js 22.23.4 runtime and pin Electron to exactly 42.3.3 for this project; align the Node.js type definitions with Node 22.
- Alternatives considered and rejected:
  - Disabling Windows application control: deferred as a last resort because it would be inappropriate for the intended internal deployment environment.
  - Continuing with Node.js 24 and Electron 45: not selected after the installation issue prevented completing M0.
- Impact / follow-ups:
  - Keep Node.js at 22.23.4 and Electron at 42.3.3 until the installation and development workflow is confirmed in the target environment.
  - This supersedes the M0 runtime follow-up in DECISIONS.md 2026-11-09-04; it does not authorize bypassing Windows application-control policy.
