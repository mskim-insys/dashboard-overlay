BRIEF FOR LUNA (2026-11-10): do Part A first, then Part B, then start M1 only after the user confirms.

FACTS FROM THE USER (treat as given, do not re-verify):
- Smart App Control (SAC) was NOT turned off. pnpm dev runs normally with Node 22.23.4 and Electron 42.3.3.
- Electron 42.3.3 is the last release that uses the extract-zip package; newer releases use the native extractor (unsigned .node file) that SAC blocked (event 3077, policy VerifiedAndReputableDesktop).
- Dev machine: ASUS ExpertBook P1503CVA, Windows 10.0.26300.9711, 1920x1080 at 125% scaling.
- Dev department will likely use dual monitors; office staff nearly all use one monitor.
- The company has no IT team. Colleagues may have SAC on; their Windows builds are likely older than 26300.

PART A: REPORT (evidence only, make no changes yet)
1. In PowerShell run: Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-CodeIntegrity/Operational'; Id=3033,3076,3077} -MaxEvents 30 | Format-List TimeCreated, Message
   after a clean pnpm install, pnpm build, pnpm dev. Report every event newer than 2026-11-10 08:00 local time, or say "none".
2. List the unsigned native binaries in node_modules (for example the esbuild executable, Rollup's .node file). Do they load with no SAC events?
3. Report the exact engines, electron, packageManager (pnpm version) and Node type-definition entries in package.json. Exact versions or ranges? Is pnpm-lock.yaml committed?
4. Quote DECISIONS.md entry 2026-11-10-01 in full. Which earlier entry contains the "rejected downgrading Electron" wording?
5. Was hot reload actually verified? Do the Build and Test lines in AGENTS.md match the real package.json scripts? Is the M0 checkbox in specs/dashboard.md ticked?
6. Report the current BrowserWindow settings in the main process (contextIsolation, nodeIntegration, sandbox) and what the preload exposes.
7. Optional: can electron-builder produce an NSIS installer now? If so, does the unsigned installer run on this machine with SAC on?

A2: evidence only, make no changes yet.
1. Compute the SHA256 of node_modules/@electron-internal/extract-zip/index.win32-x64-msvc.node. Compare with the blocked file's hash from the 2026-11-09 event 3077: 6D9B70ADDBCDA211212A5F1CA805D03E3E02DF455EF1385F138B6F0C4170C0FD. Same or different?
2. Run `pnpm why @electron-internal/extract-zip` and `pnpm why extract-zip`. Which package does Electron 42.3.3 depend on, and which version of Electron was installed before the pin?
3. Run in PowerShell: (Get-ItemProperty HKLM:\SYSTEM\CurrentControlSet\Control\CI\Policy).VerifiedAndReputablePolicyState
   Report the value (as far as I know: 1 = on/enforcing, 2 = evaluation, 0 = off).
4. Clean-clone test: clone the repo to a fresh folder, run `pnpm install`, then `pnpm dev`. Does it work with no manual step? If Electron's binary is missing, approve its build script in the pnpm config and retry.
(---DONE---)
PART B (revised, 2026-11-10). Do these in order; commit after each numbered step.

1. Repo config: commit the pnpm build-script approval for Electron (allowBuilds: electron: true, in the correct pnpm config file for pnpm 12.16.1) to the repo itself. Then repeat the clean-clone test in a scratch folder: `git clone`, `pnpm install`, `pnpm dev` with no manual step. Report pass/fail. Put the exact steps in README.md and delete the scratch folder afterwards. Also check that engines.pnpm (>=10) is consistent with packageManager pnpm@12.16.1.

2. Find the first Electron version that depends on @electron-internal/extract-zip (use `pnpm view electron@<version> dependencies` for the latest 42.x, 43.x, 44.x and 45.x). Also report whether 42.3.3 is the latest 42.x patch.

3. Rewrite DECISIONS.md entry 2026-11-10-01 with these facts:
   - On 2026-11-09 08:40 UTC, Code Integrity event 3077 (policy VerifiedAndReputableDesktop) blocked node.exe from loading node_modules/@electron-internal/extract-zip/index.win32-x64-msvc.node (SHA256 flat hash 47315D2B...10F90380). SAC is enforcing (VerifiedAndReputablePolicyState = 1).
   - That file belongs to the native extractor used by Electron 45.2.3 (the version in the lockfile before the pin; confirm with the result of step 2).
   - Electron 42.3.3 depends on extract-zip 2.0.1 (JavaScript), so no unsigned native file is loaded. A stale copy of the .node file remains in node_modules, but nothing loads it.
   - After the pin: no Code Integrity events (3033/3076/3077) after install, build and dev on 2026-11-10; electron.exe loads normally.
   - Upgrading Electron to a version that uses the native extractor is blocked until the extractor loads under SAC (check the event log after any upgrade), is signed or allowed by reputation, or a different install route is used (for example a pre-downloaded zip with ELECTRON_OVERRIDE_DIST_PATH).
   - The problem affects developer installs only; the built installer does not contain the extractor.
   - The pinned Electron version will eventually lose security backports.
   - Append "Superseded by 2026-11-10-01" to entry 2026-11-09-04 (do not rewrite it). Do NOT supersede 2026-11-09-03.

4. Hot reload: while `pnpm dev` runs, change a visible string in the renderer and confirm the window updates without a restart. Record the result in the worklog. If it fails, untick M0 in specs/dashboard.md.

5. specs/dashboard.md (set "Last updated" to 2026-11-10; no status text in the spec):
   - Add R14: with a second monitor attached, the overlay stays on the primary monitor and nothing breaks. Choosing the monitor is out of scope for now.
   - M1 acceptance: checks at 100% and 125% scaling on a single display, plus a mixed-scaling dual-monitor check if an external monitor is available; record results in the worklog.
   - Move code signing from "out of scope" to an open question: "Code signing and SAC on colleagues' PCs; decision needed before M6." Owner: the user.

6. AGENTS.md: under "Ask first" add "upgrading Node or Electron (see DECISIONS.md 2026-11-10-01)".

7. worklogs/dashboard.md: replace "Open questions: None" with the question above, add a session entry, and note "packaging spike (electron-builder, unsigned installer on a second PC with SAC on) after M1".

PART C (after Part B): propose the M1 plan with manual test steps the user can run (click-through, 125% DPI, second monitor attached). Do not write M1 code until the user confirms.

PART C: M1 PREP (do not implement yet)
- First propose a plan for M1 with manual test steps the user can run, because only the user can see click-through and DPI behavior on screen.
- Highest risks: click-through over transparent areas (setIgnoreMouseEvents with forward), DPI scaling at 125%, and behavior when a second monitor is attached.
- Wait for the user's confirmation before writing M1 code.
