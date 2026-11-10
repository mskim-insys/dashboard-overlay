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

- Context: On 2026-11-09 at 08:40 UTC, Code Integrity event 3077 under policy `VerifiedAndReputableDesktop` blocked `node.exe` from loading `node_modules/@electron-internal/extract-zip/index.win32-x64-msvc.node`. Its SHA256 was `47315D2B8EDD374AAC3DC6379C170DFDC1D3831F50A0BFAEDA3693D910F90380`. `VerifiedAndReputablePolicyState` was `1` (enforcing). Electron 42.3.3 uses JavaScript `extract-zip` 2.0.1. Registry metadata confirms 42.3.4 does not exist: 42.3.3 is the highest 42.x release before 42.4.0, where the native `@electron-internal/extract-zip` dependency starts. The latest 42.x patch is 42.11.18, so the pin already misses Electron 42 security patches from 42.4.0 through 42.11.18.
- Decision: Keep Node.js at 22.23.4 and pin Electron to exactly 42.3.3, with Node 22 type definitions.
- Alternatives considered and rejected:
  - Disabling Windows application control: deferred as a last resort because it would be inappropriate for the intended internal deployment environment.
  - Staying on current Electron 45.x (45.2.3 was in the lockfile before the pin): rejected because it uses the native extractor blocked by SAC.
- Impact / follow-ups:
  - After the pin, the 2026-11-10 install/build/dev checks produced no Code Integrity 3033/3076/3077 events, and `electron.exe` loaded normally. The pnpm Electron build-script approval is committed in `pnpm-workspace.yaml`, but the clean-clone test still does not run with no manual step: its first `pnpm dev` failed with `Electron uninstall`. Running `pnpm exec electron --version` downloaded the runtime, after which `pnpm dev` opened the window. The workaround is documented in README.md. No application-control bypass is authorized.
  - This is a developer-install issue. The installer is expected not to contain the extractor; this has not been verified by building an installer, since `electron-builder` is not installed.
  - A 2026-11-10 spike used the official Electron 42.11.18 zip with `ELECTRON_OVERRIDE_DIST_PATH` (and `ELECTRON_EXEC_PATH` for electron-vite). The app window opened, but SAC blocked `runtime\vk_swiftshader.dll`, producing Code Integrity events 3077 and 3033. The native extractor was not loaded. This route is not SAC-compatible; defer the upgrade.
  - Before the M6 rollout this pin must be resolved: either an Electron with a SAC-compatible runtime, or a signed build.
  - Electron app windows must load only local app content: bundled files in a packaged app or the loopback Vite dev server during development. Never load remote content in an app window; open links in the default browser. Keep the renderer-loading policy centralized in the main process so a future, explicitly approved policy change can be made in one place rather than scattered through the app.

## 2026-11-10-02 Use the floating always-on-top level

- Context: The M1 overlay must remain above ordinary work windows without using an unnecessarily high system z-order.
- Decision: Set Electron always-on-top at the `floating` level.
- Alternatives considered and rejected:
  - The `screen-saver` level: rejected because the overlay is not a screensaver and should not claim a higher z-order than needed.
  - The default `normal` level: rejected because ordinary windows could cover the overlay.
- Impact / follow-ups:
  - Verify behavior with a fullscreen presentation or video during the M1 manual check. Do not change the GPU or hardware-acceleration policy to address z-order behavior.

## 2026-11-10-03 Do not add fullscreen-app detection in M1

- Context: The overlay should stay useful during ordinary desktop work, while fullscreen applications need to remain usable.
- Decision: Keep the `floating` always-on-top policy and do not add app-specific fullscreen detection or automatic hiding in M1. Let Windows determine fullscreen z-order; observe PowerPoint slideshow or fullscreen video behavior and record it in the worklog.
- Alternatives considered and rejected:
  - Hiding automatically for fullscreen apps: deferred because the current app has no reliable cross-process fullscreen detection mechanism.
  - Raising the overlay above fullscreen apps: rejected because it could obstruct presentations or video.
- Impact / follow-ups:
  - If the manual observation shows that the overlay obstructs fullscreen content, revisit the policy before treating M1 as accepted.

## 2026-11-10-04 Bundle the sandboxed preload as CommonJS

- Context: Electron 42 attempted to load the generated sandboxed `index.mjs` as a preload script and failed with `Cannot use import statement outside a module`, leaving `window.dashboard` unavailable.
- Decision: Emit the preload as a fully bundled CommonJS `index.cjs` and load that file from the main process.
- Alternatives considered and rejected:
  - Keep the ESM preload: rejected because the recorded Electron run failed before the bridge could be exposed.
  - Disable Electron sandboxing: rejected because it weakens the required process boundary and is unnecessary.
- Impact / follow-ups:
  - `electron.vite.config.ts` sets `preload.build.externalizeDeps` to `false`, the output format to `cjs`, and the entry filename to `[name].cjs`; `src/main/index.ts` loads `../preload/index.cjs`.
  - `pnpm build` runs `scripts/check-preload-output.mjs` to verify the generated CommonJS file and exposed dashboard API keys.
  - This is a diagnostics/bridge reliability fix. It does not change the main-process mouse interaction policy.

## 2026-11-10-05 Edit mode captures the overlay window

- Context: The transparent overlay spans the primary monitor work area, while display mode must allow clicks through transparent space and edit mode must remain fully interactive.
- Decision: In edit mode, the entire overlay window receives input, including transparent areas within its bounds. Exit edit mode with Escape, the global hotkey, or the tray menu. In display mode, input remains click-through except over the visible interactive panel.
- Alternatives considered and rejected:
  - Passing clicks through transparent areas while editing: rejected for now because it conflicts with the current "fully interactive" edit-mode requirement and makes editing behavior inconsistent across the window.
- Impact / follow-ups:
  - A click being consumed in the transparent part of the overlay during edit mode is expected behavior, not a click-through defect.
  - Keyboard-focus behavior has not been manually assessed with the current placeholder UI; do not infer it from clicks or Escape handling.
  - Revisit only if the product requirement changes.
