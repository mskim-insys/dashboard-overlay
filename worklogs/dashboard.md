# Worklog: dashboard

Spec: specs/dashboard.md
Status: in progress

## Handover

- Current milestone: M1 (acceptance criteria live in the spec)
- Done and verified: M0 is complete. Node.js 22.23.4 and Electron 42.3.3 are pinned; `pnpm dev` opened the Dashboard Overlay window; build, test, lint, and format checks passed.
- Not done / partial: M1 has not started.
- First step next session: Implement the overlay shell against the M1 requirements in specs/dashboard.md.
- Read first: `specs/dashboard.md`, `README.md`, `AGENTS.md`
- Traps: Keep Electron-only behavior behind the preload bridge; see DECISIONS.md 2026-11-09-03. Do not bypass application-control restrictions; see DECISIONS.md 2026-11-10-01.
- Open questions: None.

## Sessions

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
