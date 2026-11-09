# Worklog: dashboard

Spec: specs/dashboard.md
Status: in progress

## Handover

- Current milestone: M0 (acceptance criteria live in the spec)
- Done and verified: Node.js 24.x is enforced by the package engine and used by the Node type definitions; build, test, lint, and format checks pass on Node 24.22.2.
- Not done / partial: `pnpm dev` builds the Electron processes and starts Vite, but Electron cannot launch because its Windows native helper is unavailable.
- First step next session: Ask IT for an approved environment that allows Electron's native helper, then rerun `pnpm dev`.
- Read first: `specs/dashboard.md`, `README.md`, `AGENTS.md`
- Traps: Keep Electron-only behavior behind the preload bridge; see DECISIONS.md 2026-11-09-03. Do not bypass application-control restrictions; see DECISIONS.md 2026-11-09-04.
- Open questions: Electron needs to run in an approved Windows environment before M0 can be completed.

## Sessions

### 2026-11-09 · M0

- Changed: Aligned the project runtime requirement, Node type definitions, and setup docs with Node.js 24.x.
- Verified: On Node 24.22.2, `pnpm build`, `pnpm test`, `pnpm lint`, and `pnpm format:check` pass. `pnpm dev` builds main/preload and starts Vite, but Electron exits with `Electron uninstall`; the Windows x64 native helper remains unavailable after `pnpm rebuild electron`.
- Risks / open: The M0 window and hot reload still need runtime confirmation in an approved environment; see DECISIONS.md 2026-11-09-04.

### 2026-11-09 · M0

- Changed: Added the electron-vite app scaffold, secure minimal preload bridge, project scripts, and setup docs.
- Verified: `pnpm build`, `pnpm test`, `pnpm lint`, and `pnpm format:check` pass. `pnpm dev` builds the Electron processes and starts Vite, but Windows blocked the native helper before the app window launched.
- Risks / open: The M0 window and hot reload still need runtime confirmation in an authorized environment.
