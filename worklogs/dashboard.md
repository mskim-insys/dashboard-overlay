# Worklog: dashboard

Spec: specs/dashboard.md
Status: in progress

## Handover

- Current milestone: M2 (acceptance criteria live in the spec)
- Done and verified: M0 and M1 are complete. The sandboxed preload builds as bundled CommonJS at `out/preload/index.cjs`; the build check executes it with a mocked Electron bridge and verifies the exposed API keys. `preload-error` is logged in main regardless of debug mode, and the renderer displays/logs a visible error if `window.dashboard` is missing. Pointer capture is skipped on controls and their descendants, while plain panel-body capture and the main mouse policy remain unchanged. Manual checks confirm display-mode click-through, panel interaction and body drag, pointer boundary transitions, edit-mode input, hotkey, tray actions, single-monitor operation at 100% and 125%, WebGL visibility, and dual-monitor behavior. The final debug-off build and timed Electron 42.3.3 run produced 0 Code Integrity events 3033/3076/3077 and no `vk_swiftshader.dll` event (2026-11-10T16:51:07.712+09:00–16:52:34.953+09:00).
- Not done / partial: The fullscreen YouTube grey-screen focus effect and one unreproduced panel click-through report are accepted known issues per [decision 2026-11-10-06](../DECISIONS.md#2026-11-10-06-accept-m1-with-fullscreen-focus-side-effect-as-known-issue); do not fix them in M1. PowerPoint was not tested because it is not installed. Keyboard focus has not otherwise been assessed with the placeholder UI. The missing-bridge error and startup banner have not been observed on screen. Drag and resize are not implemented in the M1 shell. The diagnostics log is `%APPDATA%\dashboard-overlay\input-diagnostics.log` (`C:\Users\In-sys\AppData\Roaming\dashboard-overlay\input-diagnostics.log`). Clean-clone `pnpm dev` still needs the Electron runtime download workaround described in README.md. Packaging spike (`electron-builder`, unsigned installer on a second PC with SAC on) remains planned.
- First step next session: Begin M2. Before M6, investigate the fullscreen focus effect and retest with PowerPoint if available; revisit the unreproduced panel click-through case if it recurs.
- Read first: `specs/dashboard.md`, `README.md`, `AGENTS.md`. `m0_postwork.md` is archived; do not look for it.
- Traps: Keep Electron-only behavior behind the preload bridge; see DECISIONS.md 2026-11-09-03. Do not bypass application-control restrictions or upgrade Node/Electron without approval; see DECISIONS.md 2026-11-10-01.
- Open questions: Code signing and SAC on colleagues' PCs; decision needed before M6. Owner: user.

## Sessions

### 2026-11-10 · M1 close

- Changed: Closed the M1 acceptance criterion and recorded the fullscreen behavior and rare click-through report as known issues per [decision 2026-11-10-06](../DECISIONS.md#2026-11-10-06-accept-m1-with-fullscreen-focus-side-effect-as-known-issue). No application code changed.
- Verified: With `DASHBOARD_OVERLAY_DEBUG_INPUT` unset, `pnpm build` and the preload API check passed. The built Electron 42.3.3 app ran from 2026-11-10T16:51:07.712+09:00 through 16:52:34.953+09:00. Code Integrity Operational events 3033, 3076, and 3077: 0; no `vk_swiftshader.dll` event.
- Risks / open: Keep the fullscreen grey-screen focus effect and unreproduced panel click-through report as known issues. PowerPoint was unavailable; retest before M6 if a machine with it is available.

### 2026-11-10 · M1 manual regression follow-up

- Changed: Recorded the user's manual results; no code or M1 acceptance checkbox changed.
- Verified: The user reports panel-body drag, the `Ctrl+Alt+Shift+D` hotkey, tray actions, single-monitor 100% scaling, WebGL visibility, and dual-monitor behavior all passed. On dual monitors, the overlay stayed on the primary display and apps on the other display remained clickable even while the overlay was in edit mode; mixed scaling was not specified. The hotkey does not enter edit mode; edit mode is available from the tray, and the hotkey exits edit mode back to display mode. The later fullscreen triage clarified that YouTube playback continued while the video surface turned grey; see the triage entry below.
- Risks / open: At the time, the fullscreen behavior had not been triaged; the later M1 decision accepts it as a known issue. Keyboard focus beyond this effect remains unassessed.

### 2026-11-10 · M1 fullscreen triage

- Changed: Corrected the fullscreen observation and recorded the acceptance decision; no code change.
- Verified: In YouTube fullscreen, interacting with the overlay panel made the video appear grey/deactivated while playback continued. The effect appeared immediately in edit mode, reverted on return to display mode, and disappeared when the overlay was hidden. Focus/activation is a hypothesis, not confirmed by logs. PowerPoint was not tested because it is not installed. One reported display-mode click inside the panel passing through could not be reproduced.
- Risks / open: Accept the fullscreen appearance and unreproduced panel click-through report as known issues under [decision 2026-11-10-06](../DECISIONS.md#2026-11-10-06-accept-m1-with-fullscreen-focus-side-effect-as-known-issue). Revisit focus behavior before M6, and retest PowerPoint if available.

### 2026-11-10 · Part B

- Changed: Added pnpm Electron build approval and fresh-clone instructions; updated the Electron/SAC decision, M1 monitor requirements, runtime-upgrade boundary, and worklog handover.
- Verified: The clean clone installed with pnpm 12.16.1, but the first `pnpm dev` failed with `Electron uninstall`; `pnpm exec electron --version` downloaded Electron 42.3.3 and the next `pnpm dev` opened the window. Thus the requested no-manual-step check failed. `engines.pnpm` (`>=10`) includes the pinned package manager version. Registry metadata shows the native extractor starting at 42.4.0; latest 42.x/43.x/44.x/45.x are 42.11.18/43.8.7/44.10.2/45.2.3. With the local `pnpm dev` running, the renderer visibly changed to "Dashboard Overlay - hot reload test" without restarting (Electron window PID 25432 stayed the same); the original text was restored and M0 remains checked. Targeted Prettier and `git diff --check` passed.
- Risks / open: First-run Electron runtime download remains a clean-clone friction point; investigate before relying on zero-manual-step setup. Packaging spike is scheduled after M1.

### 2026-11-10 · Electron override spike and M1 preparation

- Changed: Recorded the Electron 42.11.18 SAC result and added the M1 manual regression checklist below.
- Verified: Downloaded the official Electron 42.11.18 Windows zip and verified its SHA256 against the release checksum. The isolated clone built and its tests passed. `pnpm exec electron --version` ran v42.11.18 with `ELECTRON_OVERRIDE_DIST_PATH`; electron-vite also needed `ELECTRON_EXEC_PATH` to launch. The app window opened, but Code Integrity events 3077 and 3033 blocked `runtime\vk_swiftshader.dll`. No native extractor module was loaded. The route is not SAC-compatible; the isolated clone was removed.
- Risks / open: Keep Electron pinned at 42.3.3 for now. Before M6, resolve the pin with an Electron runtime that works under SAC or a signed build.

## M1 manual regression checklist

- [x] Display mode: fifth run confirmed a stationary click in the transparent area outside the visible panel reaches the underlying app; clicks inside the panel are consumed. Fourth-run logs confirmed the test-button count increments.
- [x] Pointer boundary: fifth run confirmed pointerover/out events and `setIgnoreMouseEvents` transitions.
- [x] Edit mode input boundary: clicks in transparent areas are consumed as intended. Panel clicks and Escape exit have been exercised; keyboard focus is not assessed.
- [x] Panel-body drag: user reports the test passed. Window move/resize is not implemented in M1.
- [x] Hotkey: user reports `Ctrl+Alt+Shift+D` passed. It toggles visibility and exits edit mode to display mode; it does not enter edit mode.
- [x] Tray: user reports the tray checks passed, including entering edit mode.
- [x] Single monitor at 100% scaling: user reports the fixed-preload build passed.
- [x] Single monitor at 125% scaling: fourth and fifth run diagnostics report `scaleFactor=1.25`; panel and click behavior were usable in those runs.
- [x] Dual monitors: user reports no issue; the overlay stayed on the primary display and apps on the other display remained clickable, including while edit mode was active. The tested scaling combination was not specified.
- [x] Fullscreen behavior: YouTube playback continued while the video surface turned grey when interacting with the panel; the effect reverted in display mode and disappeared when the overlay was hidden. Cause is unconfirmed. PowerPoint was not tested because it is not installed. Accepted as a known issue by [decision 2026-11-10-06](../DECISIONS.md#2026-11-10-06-accept-m1-with-fullscreen-focus-side-effect-as-known-issue).
- [x] Code Integrity query: final debug-off Electron 42.3.3 run from 2026-11-10T16:51:07.712+09:00 to 16:52:34.953+09:00; events 3033/3076/3077: 0, including no `vk_swiftshader.dll`.
- [x] WebGL: user confirms the visible WebGL canvas is active.
- Known issues: The fullscreen grey-screen focus effect and one unreproduced panel click-through report are accepted for M1 by [decision 2026-11-10-06](../DECISIONS.md#2026-11-10-06-accept-m1-with-fullscreen-focus-side-effect-as-known-issue).
- Not observed: the diagnostics startup banner and missing-bridge error have not been seen on screen; they are known UI gaps, not M1 blockers.

```powershell
$start = Get-Date
$start.ToString("o")
pnpm dev
# After the WebGL canvas is active and the manual checks are complete, stop with Ctrl+C.
$events = Get-WinEvent -FilterHashtable @{
  LogName = "Microsoft-Windows-CodeIntegrity/Operational"
  Id = 3033, 3076, 3077
  StartTime = $start
} -ErrorAction SilentlyContinue
if ($events) {
  $events | Format-List TimeCreated, Id, Message
  "Event count: $($events.Count)"
} else {
  "Event count: 0"
}
```

### 2026-11-10 · M1 implementation

- Changed: Added a transparent, primary-work-area overlay with display/edit state, tray controls, a global hotkey, click-through pointer reporting, crash/unresponsive failsafes, a placeholder interactive panel, and a WebGL runtime-check canvas.
- Verified: `pnpm build`, `pnpm test` (9 tests), `pnpm lint`, and targeted Prettier passed. On 2026-11-10 at 10:13:38.794 +09:00, launched the final source on Electron 42.3.3 and confirmed the visible panel reported "WebGL canvas active"; Code Integrity events 3033/3076/3077 after that timestamp: 0. The overlay appeared over a focused browser without taking focus. GPU/hardware acceleration settings were not changed.
- Risks / open: User must run the manual regression list below. Fullscreen behavior and mouse/focus interactions have not been manually verified.

### 2026-11-10 · M1 user regression results

- Changed: Recorded the user's manual observations; no implementation changes were made in this entry.
- Verified: The user reported display-mode click-through OK; hotkey and tray appear to work; Esc exits edit mode; scaling appears to apply; the overlay remains visible during fullscreen and clicks pass through. At 100% scaling, edit mode stopped click-through; at 125%, clicks still passed through in edit mode. The user later confirmed the placeholder button count never increased in any mode. Hover behavior at 100% appeared normal, but at 125% applied only to text and looked flickery. All clicks passing through during the panel-edge/drag check means placeholder-panel interaction and drag capture are not confirmed. No visible block notification appeared. Code Integrity Operational events 3033/3076/3077 from the manual run start at 2026-11-10 10:25:38.939 +09:00: 0, including no `vk_swiftshader.dll` event.
- Risks / open: M1 remains pending. Repeat the explicit **Click test** button check and verify edit-mode input at 125%; resize/move is not implemented for the static placeholder panel.

### 2026-11-10 · M1 input diagnostics

- Changed: Added dev-only (`DASHBOARD_OVERLAY_DEBUG_INPUT=1`) renderer/preload/main timestamped event logging and an on-panel readout. No interaction policy or behavior was changed.
- Verified: Static inspection found no `-webkit-app-region: drag`, pointer-event rules only on the app shell and interactive panel, and no overlay above the button. The click count is React state with no remount/reset and its handler is not mode-gated. Renderer pointer reports are limited to display mode, and main rejects them in edit mode; the mode transition itself disables mouse-ignore in edit mode. These findings do not establish why the button click or 125% hit test failed. The flagged dev app started at 2026-11-10T02:01:25.7126868Z; Code Integrity events 3033/3076/3077 after that time: 0, including no `vk_swiftshader.dll`. Follow-up accessibility inspection confirmed the visible **WebGL canvas active** status, but no input-diagnostics node. `pnpm typecheck`, `pnpm test` (9 tests), `pnpm lint`, `pnpm build`, targeted Prettier, and `git diff --check` passed. Full `pnpm format:check` still reports the already-user-modified `specs/m0_postwork.md`; that file was not changed.
- Risks / open: F1-F4 remain unresolved. The user repeated the interactions, but no renderer-event or pointer-IPC logs appeared and the on-panel diagnostics readout was not visible. Therefore the event-log absence cannot be treated as evidence that no DOM events occurred; diagnostics initialization/rendering needs to be repaired before another behavior diagnosis.

### 2026-11-10 · M1 diagnostic user run

- Changed: Recorded the user's diagnostic-run results; no interaction fix was made.
- Verified: At 100%, the user reported hover only on text in display mode, normal hover in edit mode, and normal display-mode hover after returning from edit mode. Button clicks and panel-boundary interaction failed; dragging text in edit mode worked, but dragging from the panel outside did not. At 125%, both modes showed hover, but the app was not restarted between scale tests; button clicks, boundary interaction, and drag still failed. Main logs show the expected mode transitions and `setIgnoreMouseEvents(false)` on entering edit mode, but no renderer-event, pointer-IPC receive, or pointer-IPC rejection entries. The user confirmed the on-panel diagnostics readout was not visible. Code Integrity events 3033/3076/3077 after 2026-11-10T02:01:25.7126868Z: 0, including no `vk_swiftshader.dll`.
- Risks / open: F1-F3 causes remain hypotheses because the instrumentation did not establish whether pointer events reached the renderer. F2's 100% recovery after an edit/display transition suggests a hit-test refresh effect but does not prove it. F4 was not reproduced at 125% in this run and no repeated mouse-ignore toggling was logged. Repair the diagnostics initialization/readout before another behavior diagnosis. M1 remains pending.

### 2026-11-10 · M1 diagnostics-repair handoff

- Current state: Diagnostics repair code is modified but uncommitted in `electron.vite.config.ts`, `src/main/index.ts`, `src/preload/index.ts`, `src/renderer/src/App.tsx`, `src/renderer/src/env.d.ts`, `src/renderer/src/style.css`, and `src/shared/ipc.ts`. `specs/m0_postwork.md` also has user-authored edits; preserve them. Last committed revision is `e650bd8`.
- Log location: Full JSONL log is preserved at `%APPDATA%\dashboard-overlay\input-diagnostics.log` (`C:\Users\In-sys\AppData\Roaming\dashboard-overlay\input-diagnostics.log`), about 1.35 MB / 2,772 records. Do not paste the full log into chat or commit it; filter by process ID and message. Latest relevant run: PID 20408, started 2026-11-10T03:47:47Z (12:47:47 +09:00).
- Findings: The renderer build flag is true and the fixed-position readout is visible, but preload fails before exposing `window.dashboard`: `out/preload/index.mjs` raises `SyntaxError: Cannot use import statement outside a module`. The displayed fallback says `preload bridge unavailable`; main logs and the JSONL file still work. Thus the original missing readout was compounded by missing flag delivery; current blocker is confirmed preload module loading, not an F1-F4 behavior diagnosis.
- Latest-run evidence: PID 20408 has 2,681 renderer pointer records: 1,311 `pointerover`, 1,311 `pointerout`, 29 `pointerdown`, 30 `pointerup`, and no `click` event. All are display-mode events; no edit-mode pointer events were logged. Main recorded transitions hidden→display→edit→display→edit→display and corresponding ignore-mouse calls. Initial configuration is `focusable=false`, `setIgnoreMouseEvents(true, {forward:true})`, then `showInactive()`; edit transition sets ignore=false and focusable=true. Note startup hidden→display counts as a transition, so use `hasEnteredEditModeSinceLaunch` to distinguish a user edit toggle. This evidence is useful but does not establish F1-F4 root causes; do not change interaction policy yet.
- Next: Inspect electron-vite's sandboxed preload output/configuration and make the preload load successfully without weakening sandbox/context isolation. Then verify `window.dashboard`, flag propagation, renderer→preload→main event delivery, visible startup banner, and JSONL fallback in a fresh run. The user's log shows no click event despite pointerdown/up; only after the bridge works should a separate diagnosis/plan be made. Do not fix F1-F4 in this diagnostics-repair step.
- Validation/environment: `pnpm typecheck`, `pnpm test` (9 tests), `pnpm lint`, `pnpm build`, targeted Prettier, and `git diff --check` passed during the repair. No dashboard-overlay Electron process remained at handoff.

### 2026-11-10 · M1 diagnostics repair

- Changed: Configured the sandboxed preload to bundle dependencies as CommonJS with a `.cjs` output and updated the main-process preload path. `sandbox`, `contextIsolation`, `nodeIntegration`, and the preload API surface are unchanged.
- Verified: PID 20408's 2,724 log records show the confirmed preload error, `SyntaxError: Cannot use import statement outside a module`, followed by renderer `isDesktop=false` and `bridgeAvailable=false`. The renderer did emit 2,681 pointer events to the main-process console (1,311 each `pointerover`/`pointerout`, 29 `pointerdown`, 30 `pointerup`), all in display mode; there was no click, structured renderer event, or pointer IPC receive. The ESM failure explains why bridge-backed delivery was absent; these observations do not establish an F1-F4 cause. `pnpm build`, `pnpm test` (9 tests), and `pnpm lint` passed; generated `out/preload/index.cjs` contains no ESM import and the main bundle points to that file.
- Risks / open: The bridge fix has not yet been exercised in a fresh Electron run. Follow the updated Handover before analyzing F1-F4; M1 remains pending.

### 2026-11-10 · M1 third input diagnostic run

- Changed: Reviewed the user's three debug runs; the 125% run with the longest log is PID 24568. No interaction code or policy was changed.
- Verified: The 1.25-scale run logged `startup` and `flag=true`, loaded `out/preload/index.cjs`, and reported `isDesktop=true`, `bridgeAvailable=true`, `inputDebugEnabled=true`. It contains 368 renderer pointer records and 72 pointer IPC receives across display and edit mode, confirming diagnostics now reach main. There were 20 pointerdown and 20 pointerup events but no click event. Button presses in both modes reported `pointerdown` on `button.test-button` and `pointerup` on `section.interactive-panel`, consistent with the code capturing the pointer on that parent; the button's `onClick` therefore appears not to receive the synthesized click. Startup configured `focusable=false`, `setIgnoreMouseEvents(true, {forward:true})`, and `showInactive()`. The mode-transition count includes the automatic hidden→display startup transition; the run later entered and exited edit mode. The reported hover/flicker improvement is consistent with the log, but does not validate click-through behavior. Resize and layout dragging are not part of the M1 placeholder shell.
- Risks / open: The main/renderer startup banner is present in the log and bootstrap snapshot, but its visible appearance on the panel is not proven by JSONL. The click-target explanation is strongly supported by the recorded target pairs but needs a targeted confirmation before changing pointer capture. M1 remains pending.

### 2026-11-10 · M1 failsafe and click-fix plan

- Changed: Added unconditional main-process `preload-error` logging and a renderer on-panel error when the desktop bridge is absent. Added a post-build check that executes the generated `index.cjs` with a mocked Electron module and verifies its exposed API keys. Recorded the sandboxed CommonJS requirement in DECISIONS.md. This adds visible error UI beyond the earlier no-behavior-change brief; no mouse interaction policy was changed.
- Verified: The earlier user run's banner visibility remains unverified; the new bridge-failure alert is implemented but has not been observed in a live window. The diagnostics JSONL is at `%APPDATA%\dashboard-overlay\input-diagnostics.log` (`C:\Users\In-sys\AppData\Roaming\dashboard-overlay\input-diagnostics.log`). `pnpm build` and its preload check, `pnpm test` (9 tests), `pnpm lint`, and targeted Prettier passed. The build check reports the expected `dashboard` API.
- Risks / open: F1-F4 remain hypotheses pending a manual rerun; M1 stays unchecked. Button capture diagnosis is statically confirmed: `App.tsx` captures the nearest `[data-overlay-interactive]` ancestor on pointerdown only when the target is inside that region, then releases it on pointerup/pointercancel. Recommended plan only: skip capture for controls (`button`, `input`, `a`, or `[data-no-capture]`) while retaining capture for other panel targets; this preserves outside drag tracking for panel-originated gestures and lets controls receive normal pointerup/click. Display-mode hit-testing and click-through policy in main remain unchanged; edit mode does not use this display-only pointer reporting path. Add pure predicate tests for control vs. non-control targets, then verify the debug sequence is button pointerdown → button pointerup → click/count increment, plus press-drag-outside-release from a non-control panel area in both modes.

### 2026-11-10 · M1 control pointer capture

- Changed: Added pure `shouldCapturePointer(target)` and unit coverage for a control, child of a control, plain panel area, and null target. Control-originated presses no longer capture the panel; plain panel presses retain existing capture/release behavior. Accepted behavior: press a control, drag out, and release is not a click; display-mode click-through may change mid-press. Main mouse policy, focus, `setIgnoreMouseEvents`, and mode logic are unchanged.
- Verified: `pnpm build` (including preload artifact check), `pnpm test` (13 tests), and `pnpm lint` passed. Targeted Prettier passed. Repository-wide `pnpm format:check` reports only the already user-modified `specs/m0_postwork.md`; it was preserved. Code Integrity Operational events 3033/3076/3077 since 2026-11-10T14:30:48.6346379+09:00: 0. No Electron runtime was launched during this event-count interval, so this is not a runtime SAC verification.
- Risks / open: Manually verify control pointerup/click and count increment in both modes, control drag-out release does not click, and panel-body drag remains captured through outside release.
- F1 remains unconfirmed until the user's manual rerun; M1 remains unchecked.

### 2026-11-10 · M1 fourth manual run

- Changed: Recorded the user's result and clarified the remaining manual checks; no code or mouse-policy change.
- Verified: The 4th-run log (PID 13488) contains four `click` events on `button.test-button`, including display- and edit-mode clicks, matching the user's report that the counter now increments. Pointerdown/up pairs on panel and button targets are also recorded. The user reported Code Integrity event count 0. The log does not show whether an underlying application received a click, so display-mode click-through outside the visible panel remains unverified.
- Risks / open: Per R4, display-mode pass-through must be tested on a desktop/application target in a transparent area outside the visible panel, without first clicking the panel. Do not use the button click as the pass-through test. Edit mode is fully interactive, so clicks within transparent parts of the overlay's full-work-area window are expected to be consumed; because the window covers the primary work area, “outside click” needs a target beyond that window or a clear description of the intended behavior. To test panel capture, press on an empty part of the panel body, drag across its visible boundary while holding, release outside over the other app, then click that app again. Hover-boundary test is separate: move across the panel edge without pressing and verify the hover/cursor behavior changes at the edge. Window move/resize is not implemented in M1; text selection drag does not test overlay dragging. M1 remains unchecked.

### 2026-11-10 · M1 fifth manual run

- Changed: Recorded the user's fifth-run observations; no code or interaction-policy change.
- Verified: The user reports that a stationary click in display mode on a transparent area outside the visible panel reaches the underlying app, and a click inside the panel is consumed. Pointer over/out and mouse-ignore changes were observed. Pressing inside the panel and releasing outside did not activate the other app. The user clarified that item 4 means outside click-through works normally in edit mode; treat this as expected, not as a failure. The latest debug process (PID 23336) logged 112 renderer events and 39 pointer IPC receives; these logs cannot prove whether the underlying application received OS input. User-reported Code Integrity event count: 0.
- Risks / open: Drag-out behavior remains separate from stationary click-through; if it is retested, record whether the underlying app responds to the release and to a subsequent click. Window move/resize is not implemented in M1. M1 remains unchecked pending the remaining scale, monitor, hotkey/tray, and fullscreen observations.

### 2026-11-10 · M1 checklist reconciliation

- Changed: Compared the manual checklist with the active M1 criterion (R1-R4, R14), recorded the fixed-build 125% and click-through results, and added the edit-mode input boundary decision. No code changed.
- Verified: The checklist now distinguishes confirmed display click-through, button clicks, pointer-boundary behavior, edit-mode input, 125% scaling, and the fifth-run Code Integrity query from still-unverified 100%, fullscreen, WebGL visual status, keyboard focus, exact hotkey/tray sequences, and dual-monitor availability.
- Risks / open: M1 remains unchecked because required fixed-build checks remain open. The user finds keyboard-focus assessment difficult with the placeholder UI; record as unassessed rather than claiming success. Dual-monitor testing is conditional on display availability and remains a pre-M6 risk if unavailable.

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
