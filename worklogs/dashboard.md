# Worklog: dashboard

Spec: specs/dashboard.md
Status: in progress

## Handover

- Current milestone: M1 (acceptance criteria live in the spec)
- Done and verified: M0 is complete. Node.js 22.23.4 and Electron 42.3.3 are pinned; hot reload visibly updated the running window without restarting it. The Electron 42.11.18 override spike opened a window but SAC blocked `vk_swiftshader.dll`; do not upgrade on this route.
- Not done / partial: M1 has not started. The clean-clone `pnpm dev` first run still needs the Electron runtime download workaround described in README.md. Packaging spike (`electron-builder`, unsigned installer on a second PC with SAC on) is planned after M1.
- First step next session: After the user confirms the M1 plan, implement the overlay shell and use the manual regression list below.
- Read first: `specs/dashboard.md`, `README.md`, `AGENTS.md`
- Traps: Keep Electron-only behavior behind the preload bridge; see DECISIONS.md 2026-11-09-03. Do not bypass application-control restrictions or upgrade Node/Electron without approval; see DECISIONS.md 2026-11-10-01.
- Open questions: Code signing and SAC on colleagues' PCs; decision needed before M6. Owner: user.

## Sessions

### 2026-11-10 · Part B

- Changed: Added pnpm Electron build approval and fresh-clone instructions; updated the Electron/SAC decision, M1 monitor requirements, runtime-upgrade boundary, and worklog handover.
- Verified: The clean clone installed with pnpm 12.16.1, but the first `pnpm dev` failed with `Electron uninstall`; `pnpm exec electron --version` downloaded Electron 42.3.3 and the next `pnpm dev` opened the window. Thus the requested no-manual-step check failed. `engines.pnpm` (`>=10`) includes the pinned package manager version. Registry metadata shows the native extractor starting at 42.4.0; latest 42.x/43.x/44.x/45.x are 42.11.18/43.8.7/44.10.2/45.2.3. With the local `pnpm dev` running, the renderer visibly changed to "Dashboard Overlay - hot reload test" without restarting (Electron window PID 25432 stayed the same); the original text was restored and M0 remains checked. Targeted Prettier and `git diff --check` passed.
- Risks / open: First-run Electron runtime download remains a clean-clone friction point; investigate before relying on zero-manual-step setup. Packaging spike is scheduled after M1.

### 2026-11-10 · Electron override spike and M1 preparation

- Changed: Recorded the Electron 42.11.18 SAC result and added the M1 manual regression checklist below.
- Verified: Downloaded the official Electron 42.11.18 Windows zip and verified its SHA256 against the release checksum. The isolated clone built and its tests passed. `pnpm exec electron --version` ran v42.11.18 with `ELECTRON_OVERRIDE_DIST_PATH`; electron-vite also needed `ELECTRON_EXEC_PATH` to launch. The app window opened, but Code Integrity events 3077 and 3033 blocked `runtime\vk_swiftshader.dll`. No native extractor module was loaded. The route is not SAC-compatible; the isolated clone was removed.
- Risks / open: Keep Electron pinned at 42.3.3 for now. Before M6, resolve the pin with an Electron runtime that works under SAC or a signed build.

## M1 manual regression checklist

- [ ] Display mode: clicks on transparent areas reach the app underneath; clicking a widget still interacts with that widget.
- [ ] Edit mode: the overlay receives pointer input across its surface and widgets can be interacted with.
- [ ] Hotkey toggles the overlay reliably.
- [ ] Tray Show/Hide, Edit mode, and Quit actions work.
- [ ] Single monitor at 100% scaling: placement, click-through, and widget hit areas work.
- [ ] Single monitor at 125% scaling: placement, click-through, and widget hit areas work.
- [ ] With mixed-scaling dual monitors, if available: the overlay stays on the primary monitor and the secondary monitor remains usable.
- [ ] With a visible WebGL canvas, inspect Code Integrity events 3033, 3076, and 3077 after running the app; check specifically for `vk_swiftshader.dll` and any other blocked runtime file. Record the event result; any block means this regression check fails.

### 2026-11-10 · M0

- Changed: Pinned Electron to 42.3.3, aligned the project engine and Node type definitions with Node.js 22.23.4, and updated the runtime decision and setup docs.
- Verified: With Node.js v22.23.4 and Electron v42.3.3, `pnpm install`, `pnpm build`, `pnpm test`, `pnpm lint`, and `pnpm format:check` passed. `pnpm dev` built main/preload/renderer, started Vite, and opened a window titled "Dashboard Overlay".
- Risks / open: None for M0. The installed version pins and reason are recorded in DECISIONS.md 2026-11-10-01.

### 2026-11-09 · M0

- Changed: Aligned the project runtime requirement, Node type definitions, and setup docs with Node.js 24.x.
- Verified: On Node 24.22.2, `pnpm build`, `pnpm test`, `pnpm lint`, and `pnpm format:check` pass. `pnpm dev` builds main/preload and starts Vite, but Electron exits with `Electron uninstall`; the Windows x64 native helper remains unavailable after `pnpm rebuild electron`.
- Risks / open: The M0 window and hot reload still need runtime confirmation in an approved environment; see DECISIONS.md 2026-11-09-04.

### 2026-11-09 · M0

- Changed: Added the electron-vite app scaffold, secure minimal preload bridge, project scripts, and setup docs.
- Verified: `pnpm build`, `pnpm test`, `pnpm lint`, and `pnpm format:check` pass. `pnpm dev` builds the Electron processes and starts Vite, but Windows blocked the native helper before the app window launched.
- Risks / open: The M0 window and hot reload still need runtime confirmation in an authorized environment.
