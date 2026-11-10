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
- Superseded by 2026-11-10-01.

## 2026-11-10-01 Pin Electron 42 for the M0 development environment

- Context: On 2026-11-09 at 08:40 UTC, Code Integrity event 3077 under policy `VerifiedAndReputableDesktop` blocked `node.exe` from loading `node_modules/@electron-internal/extract-zip/index.win32-x64-msvc.node`. Its SHA256 was `47315D2B8EDD374AAC3DC6379C170DFDC1D3831F50A0BFAEDA3693D910F90380`. `VerifiedAndReputablePolicyState` was `1` (enforcing).
- Decision: Use Node.js 22.23.4 and pin Electron to exactly 42.3.3, with Node 22 type definitions. Electron 42.3.3 depends on the JavaScript `extract-zip` 2.0.1 package and does not load the blocked native file. A stale copy of that `.node` file can remain in `node_modules`, but the pinned Electron runtime does not load it.
- Alternatives considered and rejected:
  - Disabling Windows application control: deferred as a last resort because it would be inappropriate for the intended internal deployment environment.
  - Electron 45.2.3, the version in the lockfile before the pin, uses the native extractor. Registry metadata shows the native `@electron-internal/extract-zip` dependency starting at Electron 42.4.0; latest 42.x (42.11.18), 43.x (43.8.7), 44.x (44.10.2), and 45.x (45.2.3) use it. Electron 42.3.3 is not the latest 42.x patch.
- Impact / follow-ups:
  - After the pin, the 2026-11-10 install/build/dev checks produced no Code Integrity 3033/3076/3077 events, and `electron.exe` loaded normally. A clean clone's first `pnpm dev` did fail with `Electron uninstall` because Electron 42.3.3 did not fetch its runtime during `pnpm install`; `pnpm exec electron --version` downloaded it, after which `pnpm dev` opened the window. No application-control bypass is authorized.
  - This is a developer-install issue. The installer is expected not to contain the extractor; this has not been verified by building an installer, since `electron-builder` is not installed.
  - Do not upgrade to an Electron version using the native extractor until the extractor loads under SAC (check the event log after an upgrade), is signed or allowed by reputation, or another install route is used (for example, a pre-downloaded zip with `ELECTRON_OVERRIDE_DIST_PATH`).
  - The pinned Electron version will eventually stop receiving security backports.
