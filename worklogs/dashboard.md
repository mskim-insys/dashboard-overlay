# Worklog: dashboard

Spec: specs/dashboard.md
Status: in progress

## Handover

- Current milestone: M1 (acceptance criteria live in the spec)
- Done and verified: M0 is complete. M1 shell code is implemented and automated checks pass; the WebGL canvas rendered under Electron 42.3.3 with zero matching Code Integrity events in the recorded run. User-only M1 input, DPI, display, and fullscreen checks are pending below.
- Not done / partial: M1 manual acceptance is not complete. The clean-clone `pnpm dev` first run still needs the Electron runtime download workaround described in README.md. Packaging spike (`electron-builder`, unsigned installer on a second PC with SAC on) is planned after M1.
- First step next session: Collect the user's M1 manual regression results before marking the M1 criterion complete.
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

- [ ] Display mode: click a blank transparent area over another app and verify its control receives the click; click **Click test** and verify its count increments.
- [ ] Edge/drag: move across the placeholder panel edge repeatedly, then press in the panel, drag outside it, and release; verify there is no click-through flicker or lost drag input.
- [ ] Edit mode: select **Edit mode** in the tray, verify panel interaction and keyboard focus, then press Esc and verify the overlay returns to non-focusable display mode.
- [ ] Hotkey: press `Ctrl+Alt+Shift+D` to hide, press again to show, then enter edit mode and press it once to exit edit mode. Confirm display mode does not steal focus while typing in another app.
- [ ] Tray: verify Show, Hide, Edit mode, and Quit. If the hotkey cannot register, confirm a visible tray notice identifies the unavailable shortcut.
- [ ] Single monitor at 100% scaling: verify primary-work-area placement, click-through, placeholder input, focus, and hotkey/tray behavior.
- [ ] Single monitor at 125% scaling: repeat the same checks and verify the panel remains aligned and usable.
- [ ] Mixed-scaling dual monitors, if available: verify the overlay stays on the primary monitor and the secondary monitor remains usable.
- [ ] Fullscreen observation: start a PowerPoint slideshow or fullscreen video; note whether the overlay is hidden, visible above it, or otherwise affects input/content. Verify the fullscreen app remains usable and record the result.
- [ ] WebGL/SAC: use the PowerShell steps below. Wait until the panel says **WebGL canvas active**; record the event count and details, including any `vk_swiftshader.dll` entry. Any blocked runtime file fails this check.

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
- Verified: The user reported display-mode click-through OK; hotkey and tray appear to work; Esc exits edit mode; scaling appears to apply; the overlay remains visible during fullscreen and clicks pass through. At 100% scaling, edit mode stopped click-through; at 125%, clicks still passed through in edit mode. The user also reported all clicks passing through during the panel-edge/drag check, so placeholder-panel interaction and drag capture are not confirmed. No visible block notification appeared. Code Integrity Operational events 3033/3076/3077 from the manual run start at 2026-11-10 10:25:38.939 +09:00: 0, including no `vk_swiftshader.dll` event.
- Risks / open: M1 remains pending. Repeat the explicit **Click test** button check and verify edit-mode input at 125%; resize/move is not implemented for the static placeholder panel.

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
