# Release smoke checklist

Before tagging a release, run through this list manually with `npm run tauri dev`.

## Timer correctness

- [ ] Start a 1-minute focus session (Settings → focus duration = 1). After 1 min, all
      enabled notification channels fire.
- [ ] Pause mid-session, wait 30s, resume — remaining time is correct.
- [ ] Skip during a focus — no notification fires, no history entry logged, next phase
      loaded (idle).
- [ ] Extend (+5) during a focus — remaining increases by exactly 5 min.
- [ ] Reset during a phase — returns to idle, full duration restored, same phase.
- [ ] Sleep the Mac mid-session for ≥ 1 min, wake — remaining is correct, no drift.
- [ ] Complete a long-break cycle (`sessionsPerLongBreak = 2` for speed) — phase order is
      `focus → short → focus → long → focus`, `sessionIndex` resets to 1.

## UI

- [ ] Compact mode: all controls visible, no overflow at default size.
- [ ] Full mode: scene background loads, wall clock visible, phase tag in top-left, button
      bar at bottom.
- [ ] Window resizes work (drag corner, then toggle compact ↔ full).
- [ ] Portrait/half-screen aspect ratio doesn't break layout.
- [ ] Settings dialog opens and closes; tab switching works.
- [ ] History panel opens and closes.

## Persistence

- [ ] Change focus duration to 30 min, quit app, relaunch — setting persisted.
- [ ] Complete a focus session, open History — counters incremented.
- [ ] Corrupt `~/Library/Application Support/PomoBuddy/settings.json` by hand (insert
      garbage), relaunch — app loads defaults, warning logged.

## Notifications

- [ ] Banner permission prompt appears on first enable; denying keeps toggle off.
- [ ] Each channel toggle independently fires/silences as expected.

## Scenes

- [ ] Both bundled scenes (`cabin`, `cafe`) appear in Settings → Scene and swap cleanly.
- [ ] Drop a folder with a valid `scene.json` into `~/Library/Application Support/PomoBuddy/scenes/`
      — appears in Settings → Scene on next launch.
- [ ] Drop a folder with `scene.json` containing `"../escape.webp"` — does NOT appear in the
      picker; warning logged.

## Build

- [ ] `npm test` passes
- [ ] `npm run check` passes
- [ ] `npm run lint` passes
- [ ] `cargo check --manifest-path src-tauri/Cargo.toml` passes
- [ ] `npm run tauri build` produces a `.dmg` in
      `src-tauri/target/release/bundle/dmg/` and the bundled app launches.
