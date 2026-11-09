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
