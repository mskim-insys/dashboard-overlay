# Worklog: dashboard

Spec: specs/dashboard.md
Status: in progress

## Handover

- Current milestone: M0 (acceptance criteria live in the spec)
- Done and verified: npm dependency install, build, test, lint, and format checks pass.
- Not done / partial: Confirm the Electron window launches and renderer hot reloads; `npm run dev` currently fails because Electron cannot load its native extraction module.
- First step next session: Ask IT about an approved Electron development environment or application-control allowance; do not bypass the policy.
- Read first: `specs/dashboard.md`, `README.md`, `AGENTS.md`
- Traps: Keep Electron-only behavior behind the preload bridge; see DECISIONS.md 2026-11-09-03. Do not bypass application-control restrictions; see DECISIONS.md 2026-11-09-04. Package manager is npm; see DECISIONS.md 2026-11-09-05.
- Open questions: Can IT provide an approved environment for running Electron's native helper?

## Sessions

### 2026-11-09 · M0

- Changed: Added the electron-vite app scaffold, secure minimal preload bridge, project scripts, and setup docs.
- Verified: `pnpm build`, `pnpm test`, `pnpm lint`, and `pnpm format:check` pass. `pnpm dev` builds the Electron processes and starts Vite, but Windows blocked the native helper before the app window launched.
- Risks / open: The M0 window and hot reload still need runtime confirmation in an authorized environment.

### 2026-11-09 · M0

- Changed: Switched project scripts and setup instructions from pnpm to npm at the user's request; generated `package-lock.json`.
- Verified: `npm ci` installed 186 packages successfully. `npm install` against the old pnpm-created `node_modules` tree failed; the isolated lockfile generation followed by `npm ci` resolved that conflict.
- Risks / open: `npm run dev` still fails with `Electron uninstall` because Electron's native module cannot load under Windows application control. `npm audit --omit=dev` reports no runtime dependency vulnerabilities; npm reports 10 moderate findings across the full development dependency tree.
