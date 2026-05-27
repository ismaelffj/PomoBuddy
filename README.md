# PomoBuddy

A macOS Pomodoro timer with a painted lofi scene to keep you company. Two modes:
a small compact card that stays out of the way, and a full-window scene with a wall
clock that counts down your focus session.

> Status: pre-1.0, scaffolded and feature-complete; painted scene art still placeholder
> (gradients). Drop your own scene packs into `~/Library/Application Support/PomoBuddy/scenes/`
> while we work on the bundled illustrations.

## Why

Most Pomodoro timers are utilitarian. PomoBuddy adds a calm, painted ambience — a quiet
cabin or cafe — without becoming a distraction. Every action is one click; no menu diving.

## Features

- Compact mode + full painted-scene mode
- **Wall-clock-accurate timer** (survives sleep, wake, and macOS App Nap)
- Configurable durations (default 25 / 5 / 15 with 4 sessions per long break)
- Skip, +5 min extend, reset, pause / resume
- **Four notification channels**, each independently toggleable: system banner,
  in-app overlay, audible chime, dock bounce
- Menu bar countdown + always-on-top option
- Multiple scenes, **user-extensible via `scene.json` packs**
- Time-of-day cycle that tints the scene through the day
- Light history: today / this week tallies

## Install

Pre-built `.dmg` releases will live on the
[Releases page](https://github.com/ismaelffj/PomoBuddy/releases) when v1.0 ships.

## Build from source

Prerequisites: Node 20+, Rust stable, Xcode command-line tools.

```bash
git clone https://github.com/ismaelffj/PomoBuddy
cd PomoBuddy
npm install
npm run tauri dev          # development
npm run tauri build        # produces .dmg in src-tauri/target/release/bundle/dmg
```

## Where your data lives

- **Settings:** `~/Library/Application Support/PomoBuddy/settings.json`
- **Session history:** `~/Library/Application Support/PomoBuddy/history.jsonl`
- **Custom scenes:** `~/Library/Application Support/PomoBuddy/scenes/`

**No sync, no cloud, no telemetry.** Everything stays on your machine.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the scene-pack contribution guide and dev setup.
The scene-pack format is documented in [docs/scene-pack-format.md](docs/scene-pack-format.md).

## License

MIT — see [LICENSE](LICENSE).
