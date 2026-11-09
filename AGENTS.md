# Dashboard Overlay (working name)

Windows desktop overlay with a customizable widget dashboard (layout editing, shareable layouts, light 3D visuals). Internal company tool, also used for demos. Windows only.

## Read first

- README.md for current usage and behavior
- Active specs: specs/dashboard.md
- DECISIONS.md before changing architecture or retrying a past approach

## Commands

- Install: `pnpm install`
- Develop: `pnpm dev`
- Build: `pnpm build`
- Test: `pnpm test`
- Lint: `pnpm lint`
- Format check: `pnpm format:check`
- Format files: `pnpm format`

## Boundaries

- Do not edit: lockfiles by hand, `node_modules/`, build output (`dist/`, `out/`, `release/`), signing certificates or secrets
- Ask first:
  - adding a dependency outside the agreed stack
  - changing Electron security settings (`contextIsolation`, `nodeIntegration`, preload API surface)
  - code that opens URLs or launches local paths (needs an allowlist)
  - adding non-Windows code paths
  - publishing a release, code signing, or rewriting git history

## Workspace docs

- Rules for these files: `WORKSPACE.md`
