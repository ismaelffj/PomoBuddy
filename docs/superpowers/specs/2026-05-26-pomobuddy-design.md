# PomoBuddy — Design Spec

**Status:** Design approved, ready for implementation plan
**Date:** 2026-05-26
**Owner:** Ismael Florentino
**License:** MIT

## 1. Summary

PomoBuddy is a macOS desktop Pomodoro timer with two display modes: a small **compact** card that stays out of the way, and a **full** mode that frames the timer inside a painted lofi scene (cabin, cafe, library) for ambience while working. The wall clock in the scene *is* the timer — an analog face with a countdown arc plus a small digital readout.

The app targets macOS first, with a future web build planned from the same UI codebase. All UI logic is built in Svelte; a thin Tauri (Rust) shell provides native OS integration. No background sounds in v1 — only a single chime for the phase-end alert.

## 2. Goals & non-goals

**Goals**
- A polished, single-window desktop Pomodoro timer that's pleasant to look at and disappear into
- Every action is reachable in one click — no menu diving, just a settings dialog for config
- Multiple lofi scenes that shift palette through the day, extensible via a documented scene-pack format
- Open-source, MIT-licensed, contributor-friendly repo on GitHub
- Architecture that supports a future web (PWA) build without rewriting the UI

**Non-goals (v1)**
- Background ambient sounds (rain, wind, fire) — `Notifier` only fires the alert chime
- Cross-platform builds (Windows, Linux) — Tauri supports them, but v1 ships macOS only
- Detailed productivity analytics — only today / this week tallies for v1
- Cloud sync, accounts, telemetry — everything is local
- Themes beyond what scene palettes provide

## 3. User-facing features

### 3.1 Timer behavior
- Standard Pomodoro defaults: **25 min focus / 5 min short break / 15 min long break** after every 4 focus sessions. All durations and the cycle length are user-configurable.
- **Manual phase advance** — when a phase ends, the user clicks Start to begin the next one. No auto-advance. Rationale: keeps the loop deliberate.
- Controls (always visible, both modes): **Start/Pause, Skip, +5 (extend), Reset, Settings**. Full mode also surfaces **Compact toggle**, **History glance**, **Scene picker**.

### 3.2 Modes

**Compact mode** — a small card (~320×200 px) with:
- Phase pill (`Focus · 1 / 4`)
- Large countdown (mm:ss)
- All controls in a single row of icon buttons

**Full mode** — fills the window with a painted scene; the wall clock in the scene displays the timer. Bottom button bar overlays the scene with a soft glass treatment. Phase pill in the top-left corner. Responsive: the layout works in landscape, square, and portrait aspect ratios (e.g., a half-iPad split view).

The mode toggle is one click; the window resizes itself.

### 3.3 Scenes
- v1 ships two scenes: **Cabin** and **Cafe**, AI-generated in a consistent lofi-anime style (Ghibli-adjacent painted illustration).
- Time-of-day cycle: the scene tints gradually through morning → midday → dusk → night based on real wall-clock time. Users can override with "fixed" presets.
- Scenes are user-extensible: drop a folder into `~/Library/Application Support/PomoBuddy/scenes/`. See §6.

### 3.4 Phase-end alert
Four independent channels, each toggleable in Settings:
1. **macOS system banner** (via `tauri-plugin-notification`) — fires permission prompt on first enable
2. **In-app visual overlay** — soft pulse + next-phase label over the scene
3. **Audible chime** — single bundled WAV, plays once
4. **Dock bounce** — `requestUserAttention(critical)`; off by default

Defaults: banner + in-app + chime on; dock bounce off.

### 3.5 Window behavior
- Standard resizable window
- **Always-on-top** toggle (Settings)
- **Menu bar countdown** (Settings) — small icon in macOS status bar showing remaining time; click opens the app

### 3.6 History
Light: a small panel shows **sessions today**, **sessions this week**, and **total focus hours this week**. No detailed per-session log in v1. Sessions are logged only on **phase-end** of a focus phase (skip ≠ logged).

## 4. Architecture

Three layers:

```
┌─────────────────────────────────────────────────────────┐
│  TAURI SHELL · Rust · thin bridge                       │
│  Window mgmt · Notifications · Tray/menu bar · FS · Dock│
└─────────────────────────────────────────────────────────┘
                ↕ Tauri IPC (commands + events)
┌─────────────────────────────────────────────────────────┐
│  SVELTE UI · TypeScript · runs in macOS WebView         │
│  TimerEngine · SceneLoader · ModeManager · Notifier     │
│  SettingsStore · HistoryStore · UI views                │
└─────────────────────────────────────────────────────────┘
                ↕ Filesystem via Tauri FS plugin
┌─────────────────────────────────────────────────────────┐
│  CONTENT · on disk                                      │
│  scenes/  ·  ~/Library/Application Support/PomoBuddy/   │
└─────────────────────────────────────────────────────────┘
```

**Tauri shell** stays minimal — it owns window/tray/notifications/FS and exposes a small set of typed commands. It does not hold app state.

**Svelte UI** owns essentially all logic. Each unit in `lib/` has one responsibility, exposes a small interface, hides internals, and can be tested independently. Views import units; units never import views.

**Content layer** is two folders: scenes bundled with the app live in the repo's `scenes/`, and user-installed scenes + persisted state live in `~/Library/Application Support/PomoBuddy/`.

### 4.1 Stack

| Concern | Choice | Notes |
|---|---|---|
| Native shell | Tauri 2 (Rust) | Small bundle (~10MB + assets), built-in macOS APIs |
| Frontend framework | Svelte 5 + TypeScript | Compact, reactive, small bundle |
| Build tool | Vite | Standard Svelte/Tauri toolchain |
| Schema validation | Zod | For `scene.json` and `settings.json` |
| Tests | Vitest | Unit tests for logic units |
| Lint/format | ESLint + Prettier | Standard config in repo |

## 5. Repo layout

```
PomoBuddy/
├── README.md                      ← what it is, install, screenshot
├── LICENSE                        ← MIT
├── CONTRIBUTING.md                ← how to submit scene packs / code
├── .gitignore
├── package.json
├── tsconfig.json
├── svelte.config.js
├── vite.config.ts
│
├── src/                           ← Svelte UI (TypeScript)
│   ├── app.html
│   ├── main.ts
│   ├── App.svelte                 ← root view, decides Full vs Compact
│   │
│   ├── lib/
│   │   ├── timer/
│   │   │   ├── TimerEngine.ts
│   │   │   └── timer.types.ts
│   │   ├── scenes/
│   │   │   ├── SceneLoader.ts
│   │   │   ├── timeOfDay.ts
│   │   │   └── scene.types.ts
│   │   ├── stores/
│   │   │   ├── settings.ts
│   │   │   ├── history.ts
│   │   │   └── mode.ts
│   │   ├── platform/
│   │   │   └── tauri.ts           ← thin wrapper over Tauri APIs (stubbable for web)
│   │   └── notify/
│   │       └── Notifier.ts
│   │
│   └── views/
│       ├── FullScene.svelte
│       ├── CompactCard.svelte
│       ├── WallClock.svelte
│       ├── ButtonBar.svelte
│       ├── SettingsDialog.svelte
│       └── HistoryPanel.svelte
│
├── scenes/                        ← bundled scene packs (ship with app)
│   ├── cabin/
│   │   ├── scene.json
│   │   ├── background.webp
│   │   ├── foreground.webp        ← optional
│   │   └── preview.webp
│   └── cafe/
│       └── ...
│
├── src-tauri/                     ← Rust shell (Tauri)
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── icons/
│   └── src/
│       ├── main.rs
│       └── commands.rs
│
├── tests/
│   └── timer.test.ts              ← TimerEngine unit tests
│
└── docs/
    ├── scene-pack-format.md       ← contributor reference
    └── screenshots/
```

The three top-level concerns (UI in `src/`, Rust shell in `src-tauri/`, content in `scenes/`) are visually separated so anyone landing in the repo immediately knows where to look.

## 6. Scene-pack format

A scene is a folder containing a `scene.json` manifest plus image assets. Bundled scenes live in `scenes/`; user scenes live in `~/Library/Application Support/PomoBuddy/scenes/` and are scanned at startup.

### 6.1 Manifest schema

```json
{
  "id": "cabin",
  "name": "Cozy Cabin",
  "author": "Ismael Florentino",
  "license": "CC-BY-4.0",
  "version": 1,

  "layers": {
    "background": "background.webp",
    "foreground": "foreground.webp"
  },

  "clock": {
    "x": 0.78,
    "y": 0.22,
    "diameter": 0.18,
    "face": "warm-cream"
  },

  "phaseTag": { "x": 0.04, "y": 0.06 },

  "palette": {
    "primary":   "#c97a5a",
    "accent":    "#c9b78a",
    "ink":       "#3a2f24"
  },

  "timeOfDay": {
    "mode": "tint",
    "tints": {
      "morning": "#f0c79a",
      "midday":  "#ffffff",
      "dusk":    "#c97a5a",
      "night":   "#4a5868"
    }
  },

  "responsive": {
    "portrait":  { "clock": { "x": 0.72, "y": 0.18, "diameter": 0.28 } }
  }
}
```

### 6.2 Conventions

- All positional values are **fractions of canvas (0–1)** so scenes scale across window sizes.
- `responsive` provides aspect-specific overrides (`portrait`, `square`); the closest match wins.
- `timeOfDay.mode`:
  - `"tint"` — single base image gets a color overlay shifting through the day (cheap, default)
  - `"variants"` — scene supplies separate `morning.webp`, `dusk.webp`, etc. (higher fidelity, larger bundle)
- `clock.face` picks a preset accent so the analog clock harmonizes with the scene art.
- `license` is required — submissions via PR must declare a license.

`SceneLoader` validates each manifest against a Zod schema on load. Invalid scenes are skipped with a logged error, never crash the app.

### 6.3 Security: scene asset paths

Scene packs are user-supplied content — especially those dropped into `~/Library/Application Support/PomoBuddy/scenes/`. A malicious or careless `scene.json` could try to reference files outside its folder. `SceneLoader` enforces the following on every asset reference in a manifest (`layers.*`, `timeOfDay.variants.*`, `preview`):

- Path must be a **relative string** — no leading `/`, no `file://`, no drive letters or UNC prefixes.
- Path may not contain any `..` segments.
- After normalization, the resolved absolute path must still be inside the scene's own folder. Anything resolving outside is rejected.
- Extension must be in an allowlist: `.webp`, `.png`, `.jpg`, `.jpeg`.

Tauri's asset protocol is configured with a **narrow scope** (`app.security.assetProtocol.scope` in `tauri.conf.json`) covering exactly two roots:

- the bundled `scenes/` directory inside the app
- the user `scenes/` directory under `appDataDir`

Anything outside those roots will not load even if a manifest tries. A scene that fails any of these checks is rejected at load time with a logged error and excluded from the picker — it never reaches the WebView.

## 7. Core components

### 7.1 TimerEngine (`src/lib/timer/`)

Pure TypeScript, no DOM, no Tauri. Owns the phase state machine.

**Phase cycle** (the order phases follow within one Pomodoro cycle — *not* an auto-advance loop):

```
focus → shortBreak → focus → shortBreak → focus → shortBreak → focus → longBreak → (cycle repeats)
```

**Per-phase state machine** — the engine never crosses a phase boundary on its own; the user must click Start to leave `ended`:

```
            ┌──────────┐  remaining → 0   ┌────────┐
  start ──▶ │ RUNNING  │ ───────────────▶ │ ENDED  │ ── emits PhaseEndedEvent
            └────┬─────┘                  └────────┘
   pause ↕      │                              │
            ┌────▼─────┐                       │ user clicks Start
            │  PAUSED  │                       ▼
            └──────────┘                  (RUNNING with nextPhase)
```

**States:** `idle`, `running`, `paused`, `ended`
**Phases:** `focus`, `shortBreak`, `longBreak`
**Actions:** `start()`, `pause()`, `resume()`, `skip()`, `extend(minutes)`, `reset()`

**The single event the engine emits:**

```ts
// Emitted exactly once when a phase reaches remaining === 0 naturally
type PhaseEndedEvent = {
  completedPhase: Phase;   // the phase that just ended — use this for notification copy + history
  nextPhase: Phase;        // the phase that will start when the user clicks Start
  natural: true;           // always true; skip() does NOT emit this event
  endedAt: number;         // epoch ms
  sessionIndex: number;    // 1-based within the current long-break cycle
};
```

This explicit shape prevents `Notifier` or `HistoryStore` from accidentally using `nextPhase` where `completedPhase` was meant.

**Tick semantics — wall-clock anchored, not interval-counted:**

The engine stores `phaseStartedAt` (epoch ms), `phaseDurationMs`, and `pausedOffsetMs`. Every tick computes `remaining = phaseDurationMs - (Date.now() - phaseStartedAt - pausedOffsetMs)`. A `setInterval` at ~250 ms drives **repaints only** — it does not advance state. This keeps the timer correct across:

- System sleep / wake
- macOS App Nap (Tauri windows can be napped when occluded)
- Throttled background execution (relevant for the future web build)
- Event-loop stalls

On `pause`, the elapsed time since the last anchor is folded into `pausedOffsetMs` on `resume`. On `skip`, `extend(n)`, and `reset`, the anchors are recomputed.

**Action semantics:**
- `skip()` advances to the next phase **without** emitting `PhaseEndedEvent`, firing notifications, or logging history (it's a quiet abort, by design).
- A focus session is logged to history only on natural phase-end, never on skip.
- `extend(5)` adds 5 minutes to `phaseDurationMs` while running (or paused).
- `reset()` returns to `idle` with phase set to the start of the current cycle.

### 7.2 SceneLoader (`src/lib/scenes/`)

- Scans bundled `scenes/` (app bundle) and `~/Library/Application Support/PomoBuddy/scenes/` (user) at startup
- Validates each `scene.json` against the Zod schema; invalid scenes are skipped with a logged error
- Exposes the active scene and computed time-of-day tint as a reactive store
- `timeOfDay.ts` maps current wall-clock time → interpolated tint between the four named anchors

### 7.3 SettingsStore (`src/lib/stores/settings.ts`)

Reactive Svelte store of typed `Settings`:

```ts
type Settings = {
  durations: { focus: number; shortBreak: number; longBreak: number; sessionsPerLongBreak: number };
  notifications: { banner: boolean; inApp: boolean; chime: boolean; dockBounce: boolean };
  scene: { id: string; timeOfDayMode: "auto" | "morning" | "midday" | "dusk" | "night" };
  window: { alwaysOnTop: boolean; menuBarCountdown: boolean };
};
```

- Persists to `settings.json` on every change (debounced 500 ms), via the atomic write described in §9
- On load: validate with Zod; on failure, write a `.bak` of the corrupt file and fall back to defaults
- Settings live-apply. The dialog has a single **Close** button (no Cancel — there's nothing to roll back).

### 7.4 HistoryStore (`src/lib/stores/history.ts`)

- Append-only `history.jsonl` (one JSON object per line, crash-safe)
- Entry shape: `{ id, phase: "focus", startedAt, endedAt, completed: true }`
- Tallies (`today`, `thisWeek`, `weekFocusHours`) computed from file at startup, updated incrementally on append
- Only logged on natural phase-end of a focus phase

### 7.5 Notifier (`src/lib/notify/`)

Single function `notifyPhaseEnd(event: PhaseEndedEvent)`. Uses `event.completedPhase` for notification copy and history. Reads `SettingsStore.notifications` and dispatches to enabled channels:

- **banner** → `@tauri-apps/plugin-notification`: `isPermissionGranted()` → `requestPermission()` if needed → `sendNotification({ title, body })`. If permission is denied, the toggle in Settings stays off and a hint shows linking to System Settings → Notifications.
- **inApp** → emits a custom event the `FullScene` view picks up to play a Svelte transition.
- **chime** → HTML5 `Audio` plays `assets/chime.wav`.
- **dockBounce** → `@tauri-apps/api/window`: `getCurrentWindow().requestUserAttention(UserAttentionType.Critical)`.

A disabled channel never fires. Each channel is independent.

### 7.6 ModeManager (`src/lib/stores/mode.ts`)

- Reactive store with `"compact" | "full"`
- On change, calls Tauri to resize the window (compact → ~320×200, full → previous full-mode size, restored from settings)
- The mode does not affect `TimerEngine` — both views subscribe to the same engine state

## 8. Data flow

```
SettingsDialog → SettingsStore → debounced write to settings.json
                      ↓ reactive
TimerEngine ─── tick / event ─→ WallClock / CompactCard / FullScene views
       │
       │ phase ended
       ↓
   Notifier ─→ Tauri (banner / chime / dock bounce)
            ─→ In-app overlay event
       │
       ↓ (only on focus phase-end)
HistoryStore ─→ append to history.jsonl
```

**Key principle:** the UI is a pure function of stores. Views never hold timer state; they subscribe and render. Compact ↔ full is therefore a free operation.

## 9. Persistence

All state under `~/Library/Application Support/PomoBuddy/` (Tauri's `appDataDir`):

```
settings.json       ← reactive store snapshot, debounced 500ms
history.jsonl       ← append-only focus-session log
scenes/             ← user-installed scene packs (optional)
```

- **`settings.json` — atomic write.** Writes go to `settings.json.tmp` first; after `fsync`, the temp file is renamed over `settings.json`. A crash mid-write leaves the previous good file intact. Validated against a Zod schema on load; corrupt → `.bak` of the bad file + defaults.
- **`history.jsonl` — single-process append.** Appends are performed by a small Rust Tauri command using `OpenOptions::new().create(true).append(true).open(...)`. There is only one writer (the app itself), so there are no concurrent-append concerns. The startup parser **tolerates a truncated final line**: any line that fails to parse as JSON is dropped with a warning, and the rest of the file is used — so a crash mid-write costs at most one entry. Tallies are computed at startup and maintained incrementally.
- **No sync, no cloud, no telemetry in v1.** The README states this explicitly.

## 10. Testing strategy

Scaled to scope — full coverage where bugs hurt most, manual smoke for the rest.

| Layer | Tested how | Why |
|---|---|---|
| `TimerEngine` | Vitest unit tests covering every transition, skip, extend, reset, long-break cycle. Uses `vi.useFakeTimers()` plus a controllable wall-clock (inject `now()` into the engine) for explicit time-travel tests: large jumps forward (simulating sleep/wake), small jitter, and event-loop stalls. | Bugs here = wrong session counts or drift after sleep. Full coverage. |
| `SceneLoader` validation | Vitest with fixture valid/invalid `scene.json` | Contribution interface — broken scenes must be rejected with clear errors, not crash. |
| `SettingsStore` / `HistoryStore` | Vitest contract tests with mocked FS | Persistence corruption fallback needs a real test. |
| `Notifier` | Vitest with mocked Tauri APIs; verify routing matches settings | A disabled channel must never fire. |
| Svelte views | Manual checklist in `CONTRIBUTING.md` | Views are thin; automated snapshots cost more than they catch at this scale. |
| End-to-end | Manual smoke checklist in `docs/release-checklist.md` | Cheaper than maintaining Playwright for one platform / one person. |

CI (GitHub Actions) runs on every PR:

- `npm test` — Vitest suite
- `npm run check` — Svelte type check
- `npm run lint` — ESLint + Prettier
- `cargo check --manifest-path src-tauri/Cargo.toml` — type-checks the Rust shell and surfaces broken capability config / missing plugin permissions / bad bundled resource paths without producing a binary (fast, ~10–30s)

A full Tauri debug build runs only on release branches and on demand — it's slow and adds little PR value for a single-platform target. Reconsider routine full builds when adding Windows/Linux.

## 11. Risks

1. **AI-generated scene art quality.** Getting two scenes that feel consistent and high-quality may need iteration. Mitigation: build the engine + scene-pack format against a placeholder gradient scene so a slow art process doesn't block plumbing. Scenes can drop in last.
2. **Tauri 2 + Svelte 5 newness.** Both are recent majors with smaller communities than React/Electron. Mitigation: pin versions, document the exact toolchain in README, scaffold a Tauri+Svelte hello-world spike before committing to the full design.
3. **Bundle size from images.** Two WebP scenes at high quality may run 5–15 MB. Acceptable for desktop. For the future web build we'd lazy-load.

## 12. v1 scope checklist

- [ ] Tauri 2 + Svelte 5 + TS scaffolding
- [ ] `TimerEngine` with skip / extend / reset, no auto-advance
- [ ] Compact card (mode B) + Full scene with wall clock
- [ ] Two bundled scenes: `cabin`, `cafe`
- [ ] Scene-pack format documented, user-installable scenes supported
- [ ] Settings dialog: Timer / Scene / Notifications tabs (live-apply)
- [ ] All four notification channels working, configurable, defaults set
- [ ] Menu bar countdown
- [ ] Always-on-top toggle
- [ ] Light history: today / this week tallies
- [ ] README with install instructions + screenshots
- [ ] MIT license, CONTRIBUTING.md with scene-pack guide
- [ ] CI: `npm test` + `npm run check` + `npm run lint` + `cargo check --manifest-path src-tauri/Cargo.toml` on PRs

## 13. Parking lot (post-v1)

- Background ambient sounds (rain, wind, storm, fire)
- Detailed per-session history + weekly chart
- Cross-platform builds (Windows, Linux)
- Web (PWA) build from the same Svelte UI
- Music player integration
- Custom timer presets / saved profiles
- iCloud / cloud sync
- Volume slider for chime; user-replaceable chime file
