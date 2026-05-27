# PomoBuddy v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished macOS Pomodoro timer with a compact mode and a full painted-scene mode, per the design at `docs/superpowers/specs/2026-05-26-pomobuddy-design.md`.

**Architecture:** Tauri 2 (Rust) shell hosting a Svelte 5 + TypeScript UI in the macOS WebView. All app logic lives in the Svelte side; Tauri handles window, tray, notifications, and atomic filesystem operations. Scenes are user-extensible content packs validated by a Zod schema with strict path-safety checks.

**Tech Stack:**

- Tauri 2 (Rust shell, system WebView)
- Svelte 5 + TypeScript + Vite (UI)
- Zod (schema validation)
- Vitest (unit tests)
- ESLint + Prettier (style)
- GitHub Actions (CI: `npm test/check/lint` + `cargo check`)

**Conventions:**

- TDD: failing test → minimal impl → passing test → commit. Test public behavior, not internals.
- Frequent commits — one per task at minimum.
- All paths in this plan are relative to the repo root: `~/Documents/Dreamwell Collective LLC/PROJECTS/PomoBuddy/`.
- Commit messages follow Conventional Commits (`feat:`, `test:`, `chore:`, `docs:`, `fix:`).
- All commits include `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>` only if Claude is doing the work.

---

## Task 1: Project scaffold (Vite + Svelte + TypeScript + Vitest)

**Files:**

- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `svelte.config.js`, `vite.config.ts`, `vitest.config.ts`, `index.html`, `src/main.ts`, `src/App.svelte`, `src/app.css`, `.prettierrc`, `.eslintrc.cjs`
- Modify: `.gitignore` (already exists, may need additions)

- [ ] **Step 1: Scaffold the project with Vite's Svelte-TS template**

```bash
cd "$HOME/Documents/Dreamwell Collective LLC/PROJECTS/PomoBuddy"
npm create vite@latest . -- --template svelte-ts
```

When prompted "Current directory is not empty. Please choose how to proceed:" select **"Ignore files and continue"** (the existing `.git/`, `.gitignore`, and `docs/` should remain untouched).

- [ ] **Step 2: Install dependencies**

```bash
npm install
```

Expected: installs `svelte`, `typescript`, `vite`, `@sveltejs/vite-plugin-svelte`, `svelte-check`, etc. No errors.

- [ ] **Step 3: Add runtime + dev dependencies we need**

```bash
npm install zod
npm install --save-dev vitest @vitest/ui jsdom @testing-library/svelte prettier prettier-plugin-svelte eslint eslint-plugin-svelte @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

- [ ] **Step 4: Add npm scripts to `package.json`**

Edit the `"scripts"` block in `package.json` to:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest",
  "check": "svelte-check --tsconfig ./tsconfig.json",
  "lint": "eslint . && prettier --check .",
  "format": "prettier --write ."
}
```

- [ ] **Step 5: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [svelte({ hot: false })],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/**/*.test.ts"],
  },
});
```

- [ ] **Step 6: Create `.prettierrc`**

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "printWidth": 100,
  "plugins": ["prettier-plugin-svelte"],
  "overrides": [{ "files": "*.svelte", "options": { "parser": "svelte" } }]
}
```

- [ ] **Step 7: Create `.eslintrc.cjs`**

```js
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:svelte/recommended",
  ],
  plugins: ["@typescript-eslint"],
  overrides: [
    {
      files: ["*.svelte"],
      parser: "svelte-eslint-parser",
      parserOptions: { parser: "@typescript-eslint/parser" },
    },
  ],
  env: { browser: true, node: true, es2022: true },
};
```

- [ ] **Step 8: Add IDE / build dirs to `.gitignore` if not present**

Open `.gitignore` and ensure these lines are present (the brainstorm `.superpowers/` line should already exist):

```
node_modules/
dist/
.svelte-kit/
src-tauri/target/
*.log
.DS_Store
.vscode/
.idea/
.env
.env.local
```

- [ ] **Step 9: Verify the scaffold works**

```bash
npm run dev
```

Expected: Vite starts on `http://localhost:5173`. Open it — see the default Svelte counter. Stop the dev server (Ctrl-C).

```bash
npm run check
npm test
```

Expected: `check` produces no errors. `test` says "No test files found" (we haven't written any yet) — that's fine.

- [ ] **Step 10: Commit**

```bash
git add .
git commit -m "chore: scaffold Vite + Svelte 5 + TypeScript + Vitest"
```

---

## Task 2: Tauri 2 init with narrow capabilities

**Files:**

- Create: `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`, `src-tauri/src/main.rs`, `src-tauri/src/lib.rs`, `src-tauri/build.rs`, `src-tauri/icons/` (Tauri generates these)
- Modify: `package.json` (Tauri adds scripts and dev dependencies)

- [ ] **Step 1: Install Tauri CLI**

```bash
npm install --save-dev @tauri-apps/cli@^2
npm install @tauri-apps/api@^2 @tauri-apps/plugin-notification@^2 @tauri-apps/plugin-fs@^2
```

- [ ] **Step 2: Run Tauri init**

```bash
npx tauri init
```

Answer the prompts:

- App name: `PomoBuddy`
- Window title: `PomoBuddy`
- Web assets location (relative to `src-tauri`): `../dist`
- URL of dev server: `http://localhost:5173`
- Frontend dev command: `npm run dev`
- Frontend build command: `npm run build`

- [ ] **Step 3: Configure `src-tauri/tauri.conf.json`**

Replace the generated `tauri.conf.json` content with:

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "PomoBuddy",
  "version": "0.1.0",
  "identifier": "com.dreamwell.pomobuddy",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:5173",
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build"
  },
  "app": {
    "windows": [
      {
        "title": "PomoBuddy",
        "width": 900,
        "height": 600,
        "minWidth": 320,
        "minHeight": 200,
        "resizable": true,
        "fullscreen": false
      }
    ],
    "security": {
      "csp": "default-src 'self'; img-src 'self' asset: http://asset.localhost data:; media-src 'self' asset: http://asset.localhost; style-src 'self' 'unsafe-inline'; script-src 'self'",
      "assetProtocol": {
        "enable": true,
        "scope": ["$RESOURCE/scenes/**", "$APPDATA/scenes/**"]
      }
    }
  },
  "bundle": {
    "active": true,
    "targets": "dmg",
    "icon": ["icons/32x32.png", "icons/128x128.png", "icons/128x128@2x.png", "icons/icon.icns"],
    "resources": ["../scenes/**/*"]
  }
}
```

The `assetProtocol.scope` is the security boundary from spec §6.3 — only the bundled `scenes/` and user `scenes/` under appData can be loaded as assets.

- [ ] **Step 4: Create the Tauri capabilities file**

Create `src-tauri/capabilities/default.json`:

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Default window + plugins for PomoBuddy",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:allow-set-size",
    "core:window:allow-set-always-on-top",
    "core:window:allow-request-user-attention",
    "core:app:allow-name",
    "notification:default",
    "notification:allow-is-permission-granted",
    "notification:allow-request-permission",
    "notification:allow-notify",
    "fs:allow-app-read",
    "fs:allow-app-write",
    "fs:allow-resource-read"
  ]
}
```

- [ ] **Step 5: Verify Tauri scaffolding compiles**

```bash
cargo check --manifest-path src-tauri/Cargo.toml
```

Expected: green `cargo check` (may take ~30s for first run). Ignore warnings if any.

- [ ] **Step 6: Run the Tauri dev app once to confirm wiring**

```bash
npm run tauri dev
```

Expected: a native macOS window opens showing the default Svelte counter. Close it (Cmd-Q).

- [ ] **Step 7: Commit**

```bash
git add src-tauri/ package.json package-lock.json
git commit -m "chore: add Tauri 2 shell with narrow asset-protocol scope"
```

---

## Task 3: CI workflow

**Files:**

- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create the workflow file**

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  js:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm run lint
      - run: npm run check
      - run: npm test

  rust:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: Swatinem/rust-cache@v2
        with:
          workspaces: "src-tauri -> target"
      - run: cargo check --manifest-path src-tauri/Cargo.toml
```

- [ ] **Step 2: Commit**

```bash
git add .github/
git commit -m "ci: add GitHub Actions for npm + cargo check"
```

---

## Task 4: Timer types

**Files:**

- Create: `src/lib/timer/timer.types.ts`

- [ ] **Step 1: Define the timer types**

```ts
export type Phase = "focus" | "shortBreak" | "longBreak";
export type RunState = "idle" | "running" | "paused" | "ended";

export interface PhaseEndedEvent {
  completedPhase: Phase;
  nextPhase: Phase;
  natural: true;
  startedAt: number;
  endedAt: number;
  sessionIndex: number;
}

export interface TimerDurations {
  focus: number;
  shortBreak: number;
  longBreak: number;
  sessionsPerLongBreak: number;
}

export interface TimerSnapshot {
  runState: RunState;
  phase: Phase;
  remainingMs: number;
  sessionIndex: number;
}

export type ClockSource = () => number;
export type PhaseEndedListener = (event: PhaseEndedEvent) => void;
```

- [ ] **Step 2: Verify it type-checks**

```bash
npm run check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/timer/timer.types.ts
git commit -m "feat(timer): add timer types"
```

---

## Task 5: TimerEngine — wall-clock anchored core

**Files:**

- Create: `src/lib/timer/TimerEngine.ts`
- Test: `tests/timer.test.ts`

- [ ] **Step 1: Write failing tests for the running core**

```ts
// tests/timer.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { TimerEngine } from "../src/lib/timer/TimerEngine";
import type { PhaseEndedEvent, TimerDurations } from "../src/lib/timer/timer.types";

const minutes = (n: number) => n * 60_000;

function makeEngine(durations?: Partial<TimerDurations>) {
  let now = 1_000_000_000_000;
  const clock = () => now;
  const advance = (ms: number) => {
    now += ms;
  };
  const engine = new TimerEngine(
    {
      focus: 25,
      shortBreak: 5,
      longBreak: 15,
      sessionsPerLongBreak: 4,
      ...durations,
    },
    clock,
  );
  return { engine, advance };
}

describe("TimerEngine — core", () => {
  it("starts in idle on focus with full remaining", () => {
    const { engine } = makeEngine();
    const s = engine.snapshot();
    expect(s.runState).toBe("idle");
    expect(s.phase).toBe("focus");
    expect(s.remainingMs).toBe(minutes(25));
    expect(s.sessionIndex).toBe(1);
  });

  it("running: remaining decreases monotonically with wall-clock", () => {
    const { engine, advance } = makeEngine();
    engine.start();
    advance(60_000);
    expect(engine.snapshot().remainingMs).toBe(minutes(24));
    advance(60_000);
    expect(engine.snapshot().remainingMs).toBe(minutes(23));
  });

  it("survives a large clock jump (sleep/wake) without drift", () => {
    const { engine, advance } = makeEngine();
    engine.start();
    advance(minutes(30)); // jump past end
    const s = engine.snapshot();
    expect(s.runState).toBe("ended");
    expect(s.remainingMs).toBe(0);
  });
});
```

- [ ] **Step 2: Run the tests to verify failure**

```bash
npm test
```

Expected: FAIL — `TimerEngine` is not yet a module.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/lib/timer/TimerEngine.ts
import type {
  ClockSource,
  Phase,
  PhaseEndedEvent,
  PhaseEndedListener,
  RunState,
  TimerDurations,
  TimerSnapshot,
} from "./timer.types";

const MIN_MS = 60_000;

export class TimerEngine {
  private runState: RunState = "idle";
  private phase: Phase = "focus";
  private sessionIndex = 1; // 1..sessionsPerLongBreak

  private phaseStartedAt = 0;
  private phaseDurationMs = 0;
  private pausedOffsetMs = 0;
  private pausedAt = 0;

  private listeners = new Set<PhaseEndedListener>();
  private endedEmittedFor = -1;

  constructor(
    private durations: TimerDurations,
    private clock: ClockSource = () => Date.now(),
  ) {
    this.phaseDurationMs = durations.focus * MIN_MS;
  }

  onPhaseEnded(fn: PhaseEndedListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  snapshot(): TimerSnapshot {
    const remainingMs = this.computeRemainingMs();
    if (this.runState === "running" && remainingMs <= 0) {
      this.transitionToEnded();
    }
    return {
      runState: this.runState,
      phase: this.phase,
      remainingMs: Math.max(0, this.computeRemainingMs()),
      sessionIndex: this.sessionIndex,
    };
  }

  start(): void {
    if (this.runState === "running") return;
    this.phaseStartedAt = this.clock();
    this.pausedOffsetMs = 0;
    this.runState = "running";
  }

  private computeRemainingMs(): number {
    if (this.runState === "idle") return this.phaseDurationMs;
    if (this.runState === "paused") {
      return this.phaseDurationMs - (this.pausedAt - this.phaseStartedAt - this.pausedOffsetMs);
    }
    if (this.runState === "running") {
      return this.phaseDurationMs - (this.clock() - this.phaseStartedAt - this.pausedOffsetMs);
    }
    return 0;
  }

  private transitionToEnded(): void {
    if (this.endedEmittedFor === this.phaseStartedAt) return;
    this.endedEmittedFor = this.phaseStartedAt;
    this.runState = "ended";
    const completedPhase = this.phase;
    const nextPhase = this.computeNextPhase(completedPhase);
    const event: PhaseEndedEvent = {
      completedPhase,
      nextPhase,
      natural: true,
      startedAt: this.phaseStartedAt,
      endedAt: this.clock(),
      sessionIndex: this.sessionIndex,
    };
    for (const fn of this.listeners) fn(event);
  }

  private computeNextPhase(current: Phase): Phase {
    if (current === "focus") {
      return this.sessionIndex >= this.durations.sessionsPerLongBreak ? "longBreak" : "shortBreak";
    }
    return "focus";
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: PASS — all three core tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/timer/TimerEngine.ts tests/timer.test.ts
git commit -m "feat(timer): wall-clock anchored core (start, snapshot, sleep-safe)"
```

---

## Task 6: TimerEngine — pause, resume, skip, extend, reset

**Files:**

- Modify: `src/lib/timer/TimerEngine.ts`
- Modify: `tests/timer.test.ts`

- [ ] **Step 1: Add failing tests for the remaining actions**

Append to `tests/timer.test.ts`:

```ts
describe("TimerEngine — actions", () => {
  it("pause + resume preserves remaining", () => {
    const { engine, advance } = makeEngine();
    engine.start();
    advance(minutes(10));
    engine.pause();
    advance(minutes(3)); // pretend user took a break
    engine.resume();
    advance(minutes(5));
    expect(engine.snapshot().remainingMs).toBe(minutes(10)); // 25 - 10 - 5 = 10
  });

  it("skip advances phase WITHOUT emitting PhaseEndedEvent", () => {
    const { engine } = makeEngine();
    const spy = vi.fn<(e: PhaseEndedEvent) => void>();
    engine.onPhaseEnded(spy);
    engine.start();
    engine.skip();
    expect(spy).not.toHaveBeenCalled();
    expect(engine.snapshot().phase).toBe("shortBreak");
    expect(engine.snapshot().runState).toBe("idle"); // waits for user to click Start
  });

  it("extend(5) adds 5 minutes to remaining", () => {
    const { engine, advance } = makeEngine();
    engine.start();
    advance(minutes(10));
    engine.extend(5);
    expect(engine.snapshot().remainingMs).toBe(minutes(20)); // 25 - 10 + 5
  });

  it("reset returns to idle with current phase reset", () => {
    const { engine, advance } = makeEngine();
    engine.start();
    advance(minutes(20));
    engine.reset();
    const s = engine.snapshot();
    expect(s.runState).toBe("idle");
    expect(s.phase).toBe("focus");
    expect(s.remainingMs).toBe(minutes(25));
  });

  it("natural end emits PhaseEndedEvent exactly once", () => {
    const { engine, advance } = makeEngine();
    const spy = vi.fn<(e: PhaseEndedEvent) => void>();
    engine.onPhaseEnded(spy);
    engine.start();
    advance(minutes(25));
    engine.snapshot();
    engine.snapshot();
    expect(spy).toHaveBeenCalledTimes(1);
    const ev = spy.mock.calls[0][0];
    expect(ev.completedPhase).toBe("focus");
    expect(ev.nextPhase).toBe("shortBreak");
    expect(ev.natural).toBe(true);
    expect(typeof ev.startedAt).toBe("number");
    expect(ev.endedAt - ev.startedAt).toBe(minutes(25));
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

```bash
npm test
```

Expected: FAIL — `pause`, `resume`, `skip`, `extend`, `reset` don't exist.

- [ ] **Step 3: Implement the actions in `TimerEngine.ts`**

Add these methods to the class:

```ts
  pause(): void {
    if (this.runState !== "running") return;
    this.pausedAt = this.clock();
    this.runState = "paused";
  }

  resume(): void {
    if (this.runState !== "paused") return;
    this.pausedOffsetMs += this.clock() - this.pausedAt;
    this.runState = "running";
  }

  skip(): void {
    const nextPhase = this.computeNextPhase(this.phase);
    this.advanceTo(nextPhase, /*incrementSession=*/ this.phase !== "focus");
    this.runState = "idle";
  }

  extend(minutes: number): void {
    this.phaseDurationMs += minutes * MIN_MS;
  }

  reset(): void {
    this.advanceTo(this.phase, /*incrementSession=*/ false);
    this.runState = "idle";
  }

  private advanceTo(nextPhase: Phase, incrementSession: boolean): void {
    if (incrementSession) {
      if (this.sessionIndex >= this.durations.sessionsPerLongBreak) {
        this.sessionIndex = 1;
      } else {
        this.sessionIndex += 1;
      }
    }
    this.phase = nextPhase;
    this.phaseDurationMs = this.durationFor(nextPhase);
    this.phaseStartedAt = 0;
    this.pausedOffsetMs = 0;
    this.pausedAt = 0;
    this.endedEmittedFor = -1;
  }

  private durationFor(phase: Phase): number {
    if (phase === "focus") return this.durations.focus * MIN_MS;
    if (phase === "shortBreak") return this.durations.shortBreak * MIN_MS;
    return this.durations.longBreak * MIN_MS;
  }
```

Also: after a natural end, when the user calls `start()` again, the engine should advance to the next phase first. Update `start()`:

```ts
  start(): void {
    if (this.runState === "running") return;
    if (this.runState === "ended") {
      const nextPhase = this.computeNextPhase(this.phase);
      this.advanceTo(nextPhase, /*incrementSession=*/ this.phase !== "focus");
    }
    this.phaseStartedAt = this.clock();
    this.pausedOffsetMs = 0;
    this.runState = "running";
  }
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: PASS — all action tests plus the original three.

- [ ] **Step 5: Commit**

```bash
git add src/lib/timer/TimerEngine.ts tests/timer.test.ts
git commit -m "feat(timer): pause/resume/skip/extend/reset + PhaseEndedEvent contract"
```

---

## Task 7: TimerEngine — long-break cycle

**Files:**

- Modify: `tests/timer.test.ts`

- [ ] **Step 1: Add failing tests for the cycle**

```ts
describe("TimerEngine — cycle", () => {
  it("after sessionsPerLongBreak focus ends, next phase is longBreak", () => {
    const { engine, advance } = makeEngine({ sessionsPerLongBreak: 2 });
    // Complete focus #1 → shortBreak
    engine.start();
    advance(minutes(25));
    engine.snapshot();
    engine.start(); // begins shortBreak
    advance(minutes(5));
    engine.snapshot();
    // Complete focus #2 → longBreak
    engine.start();
    advance(minutes(25));
    const ev = vi.fn<(e: PhaseEndedEvent) => void>();
    engine.onPhaseEnded(ev);
    engine.snapshot();
    // Already emitted before listener attached; check next-phase directly
    engine.start(); // begins longBreak
    expect(engine.snapshot().phase).toBe("longBreak");
  });

  it("longBreak completes and resets sessionIndex to 1 for next focus", () => {
    const { engine, advance } = makeEngine({ sessionsPerLongBreak: 2 });
    // Run through cycle: focus → short → focus → long → focus(new cycle)
    for (const ms of [minutes(25), minutes(5), minutes(25), minutes(15)]) {
      engine.start();
      advance(ms);
      engine.snapshot();
    }
    engine.start();
    expect(engine.snapshot().phase).toBe("focus");
    expect(engine.snapshot().sessionIndex).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: this may already pass given Task 6's logic. If failing, fix `computeNextPhase` and `advanceTo` to handle the post-longBreak transition (sessionIndex resets when leaving longBreak).

In `computeNextPhase`, ensure: `if (current === "longBreak") return "focus";` already covered by the `else return "focus"` branch.

In `advanceTo`, the `incrementSession: this.phase !== "focus"` rule means: only increment when leaving a focus phase. After longBreak → focus, we DON'T increment (we just left a break). The `sessionIndex = 1` reset needs to happen when leaving longBreak. Update `advanceTo`:

```ts
  private advanceTo(nextPhase: Phase, incrementSession: boolean): void {
    if (this.phase === "longBreak" && nextPhase === "focus") {
      this.sessionIndex = 1;
    } else if (incrementSession) {
      if (this.sessionIndex >= this.durations.sessionsPerLongBreak) {
        this.sessionIndex = 1;
      } else {
        this.sessionIndex += 1;
      }
    }
    this.phase = nextPhase;
    this.phaseDurationMs = this.durationFor(nextPhase);
    this.phaseStartedAt = 0;
    this.pausedOffsetMs = 0;
    this.pausedAt = 0;
    this.endedEmittedFor = -1;
  }
```

- [ ] **Step 3: Re-run tests**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib/timer/TimerEngine.ts tests/timer.test.ts
git commit -m "feat(timer): long-break cycle with sessionIndex reset"
```

---

## Task 8: Scene types + Zod schema

**Files:**

- Create: `src/lib/scenes/scene.types.ts`
- Create: `src/lib/scenes/sceneSchema.ts`
- Test: `tests/scene-schema.test.ts`

- [ ] **Step 1: Write failing tests for the schema**

```ts
// tests/scene-schema.test.ts
import { describe, it, expect } from "vitest";
import { sceneSchema } from "../src/lib/scenes/sceneSchema";

const valid = {
  id: "cabin",
  name: "Cozy Cabin",
  author: "Test",
  license: "MIT",
  version: 1,
  layers: { background: "background.webp" },
  clock: { x: 0.78, y: 0.22, diameter: 0.18, face: "warm-cream" },
  phaseTag: { x: 0.04, y: 0.06 },
  palette: { primary: "#c97a5a", accent: "#c9b78a", ink: "#3a2f24" },
  timeOfDay: {
    mode: "tint",
    tints: { morning: "#fff", midday: "#fff", dusk: "#fff", night: "#000" },
  },
};

describe("sceneSchema", () => {
  it("accepts a valid manifest", () => {
    expect(() => sceneSchema.parse(valid)).not.toThrow();
  });

  it("rejects missing required fields", () => {
    const { license, ...bad } = valid;
    expect(() => sceneSchema.parse(bad)).toThrow(/license/);
  });

  it("rejects out-of-range coordinates", () => {
    const bad = { ...valid, clock: { ...valid.clock, x: 1.5 } };
    expect(() => sceneSchema.parse(bad)).toThrow();
  });

  it("rejects invalid hex colors", () => {
    const bad = { ...valid, palette: { ...valid.palette, primary: "red" } };
    expect(() => sceneSchema.parse(bad)).toThrow();
  });

  it("accepts variants mode with required keys", () => {
    const variants = {
      ...valid,
      timeOfDay: {
        mode: "variants",
        variants: {
          morning: "morning.webp",
          midday: "midday.webp",
          dusk: "dusk.webp",
          night: "night.webp",
        },
      },
    };
    expect(() => sceneSchema.parse(variants)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

```bash
npm test
```

Expected: FAIL — `sceneSchema` not defined.

- [ ] **Step 3: Create `src/lib/scenes/sceneSchema.ts`**

```ts
import { z } from "zod";

const unit = z.number().min(0).max(1);
const hex = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "must be a hex color");

const tintMode = z.object({
  mode: z.literal("tint"),
  tints: z.object({
    morning: hex,
    midday: hex,
    dusk: hex,
    night: hex,
  }),
});

const variantsMode = z.object({
  mode: z.literal("variants"),
  variants: z.object({
    morning: z.string(),
    midday: z.string(),
    dusk: z.string(),
    night: z.string(),
  }),
});

const responsive = z
  .object({
    portrait: z
      .object({
        clock: z.object({ x: unit, y: unit, diameter: unit }).partial(),
      })
      .partial()
      .optional(),
    square: z
      .object({
        clock: z.object({ x: unit, y: unit, diameter: unit }).partial(),
      })
      .partial()
      .optional(),
  })
  .partial();

export const sceneSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  author: z.string().min(1),
  license: z.string().min(1),
  version: z.literal(1),

  layers: z.object({
    background: z.string(),
    foreground: z.string().optional(),
  }),

  preview: z.string().optional(),

  clock: z.object({
    x: unit,
    y: unit,
    diameter: unit,
    face: z.string(),
  }),

  phaseTag: z.object({ x: unit, y: unit }),

  palette: z.object({
    primary: hex,
    accent: hex,
    ink: hex,
  }),

  timeOfDay: z.discriminatedUnion("mode", [tintMode, variantsMode]),

  responsive: responsive.optional(),
});

export type SceneManifest = z.infer<typeof sceneSchema>;
```

- [ ] **Step 4: Create `src/lib/scenes/scene.types.ts`**

```ts
export type { SceneManifest } from "./sceneSchema";

export interface LoadedScene {
  id: string;
  manifest: import("./sceneSchema").SceneManifest;
  baseDir: string; // absolute path to the scene folder
  assetUrl: (relativePath: string) => string; // resolves a layer to a Tauri asset URL
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/scenes/
git commit -m "feat(scenes): scene manifest Zod schema with strict validation"
```

---

## Task 9: Scene path-safe validator

**Files:**

- Create: `src/lib/scenes/scenePathSafe.ts`
- Test: `tests/scene-path-safe.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/scene-path-safe.test.ts
import { describe, it, expect } from "vitest";
import { isSafeRelativeAsset } from "../src/lib/scenes/scenePathSafe";

describe("isSafeRelativeAsset", () => {
  const cases: [string, boolean, string][] = [
    ["background.webp", true, "relative file with allowed extension"],
    ["sub/dir/img.png", true, "relative nested"],
    ["../escape.webp", false, "parent traversal"],
    ["sub/../still-ok.webp", false, "any '..' segment rejected"],
    ["/absolute.webp", false, "leading slash"],
    ["C:/abs.webp", false, "windows drive"],
    ["file:///x.webp", false, "file URL"],
    ["http://x.com/a.webp", false, "absolute URL"],
    ["bg.svg", false, "extension not allowed"],
    ["BG.WEBP", true, "case-insensitive extension"],
    ["", false, "empty"],
    ["bg.webp ", false, "trailing whitespace"],
  ];

  for (const [input, expected, why] of cases) {
    it(`${why}: ${JSON.stringify(input)} → ${expected}`, () => {
      expect(isSafeRelativeAsset(input)).toBe(expected);
    });
  }
});
```

- [ ] **Step 2: Run tests to verify failure**

```bash
npm test
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/scenes/scenePathSafe.ts`**

```ts
const ALLOWED_EXTENSIONS = [".webp", ".png", ".jpg", ".jpeg"];

export function isSafeRelativeAsset(input: string): boolean {
  if (typeof input !== "string") return false;
  if (input.length === 0) return false;
  if (input !== input.trim()) return false;

  // Reject absolute paths and URL schemes
  if (input.startsWith("/") || input.startsWith("\\")) return false;
  if (/^[a-zA-Z]:[\\/]/.test(input)) return false; // C:\ or C:/
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(input)) return false; // any URL scheme

  // Normalize separators, split, reject `..` anywhere
  const segments = input.replace(/\\/g, "/").split("/");
  if (segments.some((s) => s === ".." || s === "")) return false;

  // Extension allowlist (case-insensitive)
  const lower = input.toLowerCase();
  if (!ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext))) return false;

  return true;
}

export function collectManifestAssetPaths(manifest: {
  layers: { background: string; foreground?: string };
  preview?: string;
  timeOfDay: { mode: "tint" } | { mode: "variants"; variants: Record<string, string> };
}): string[] {
  const out: string[] = [manifest.layers.background];
  if (manifest.layers.foreground) out.push(manifest.layers.foreground);
  if (manifest.preview) out.push(manifest.preview);
  if (manifest.timeOfDay.mode === "variants") {
    out.push(...Object.values(manifest.timeOfDay.variants));
  }
  return out;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: PASS — all 12 cases.

- [ ] **Step 5: Commit**

```bash
git add src/lib/scenes/scenePathSafe.ts tests/scene-path-safe.test.ts
git commit -m "feat(scenes): path-safety guard for user-supplied asset paths"
```

---

## Task 10: timeOfDay tint interpolation

**Files:**

- Create: `src/lib/scenes/timeOfDay.ts`
- Test: `tests/time-of-day.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/time-of-day.test.ts
import { describe, it, expect } from "vitest";
import { tintForHour } from "../src/lib/scenes/timeOfDay";

const tints = {
  morning: "#ff0000", // 06:00
  midday: "#00ff00", // 12:00
  dusk: "#0000ff", // 18:00
  night: "#000000", // 00:00 / 24:00
};

describe("tintForHour", () => {
  it("returns morning at 06:00 exactly", () => {
    expect(tintForHour(6, tints)).toBe("#ff0000");
  });

  it("returns midday at 12:00 exactly", () => {
    expect(tintForHour(12, tints)).toBe("#00ff00");
  });

  it("interpolates between morning and midday at 09:00 (midpoint)", () => {
    // r: 255 → 0  half = 128, g: 0 → 255 half = 128, b: 0
    expect(tintForHour(9, tints).toLowerCase()).toBe("#808000");
  });

  it("wraps at 03:00 (between night #000000 and morning #ff0000)", () => {
    // half from night to morning → #800000
    expect(tintForHour(3, tints).toLowerCase()).toBe("#800000");
  });
});
```

- [ ] **Step 2: Run tests — verify failure**

```bash
npm test
```

Expected: FAIL.

- [ ] **Step 3: Implement `src/lib/scenes/timeOfDay.ts`**

```ts
type Tints = { morning: string; midday: string; dusk: string; night: string };

const ANCHORS: Array<{ hour: number; key: keyof Tints }> = [
  { hour: 0, key: "night" },
  { hour: 6, key: "morning" },
  { hour: 12, key: "midday" },
  { hour: 18, key: "dusk" },
  { hour: 24, key: "night" },
];

export function tintForHour(hour: number, tints: Tints): string {
  const h = ((hour % 24) + 24) % 24;
  for (let i = 0; i < ANCHORS.length - 1; i++) {
    const a = ANCHORS[i];
    const b = ANCHORS[i + 1];
    if (h >= a.hour && h <= b.hour) {
      const t = (h - a.hour) / (b.hour - a.hour);
      return mixHex(tints[a.key], tints[b.key], t);
    }
  }
  return tints.night;
}

export function tintNow(tints: Tints, now: Date = new Date()): string {
  return tintForHour(now.getHours() + now.getMinutes() / 60, tints);
}

function mixHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = parseHex(a);
  const [br, bg, bb] = parseHex(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return "#" + [r, g, bl].map((n) => n.toString(16).padStart(2, "0")).join("");
}

function parseHex(h: string): [number, number, number] {
  const s = h.startsWith("#") ? h.slice(1) : h;
  const full =
    s.length === 3
      ? s
          .split("")
          .map((c) => c + c)
          .join("")
      : s;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}
```

- [ ] **Step 4: Run tests — verify pass**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/scenes/timeOfDay.ts tests/time-of-day.test.ts
git commit -m "feat(scenes): time-of-day tint interpolation between anchors"
```

---

## Task 11: Platform wrapper interface (Tauri)

**Files:**

- Create: `src/lib/platform/platform.types.ts`
- Create: `src/lib/platform/tauri.ts`

- [ ] **Step 1: Define the platform interface**

```ts
// src/lib/platform/platform.types.ts
export interface Platform {
  // Filesystem (paths are absolute, supplied by the platform)
  appDataDir(): Promise<string>;
  resourceDir(): Promise<string>;
  readTextFile(path: string): Promise<string>;
  readDir(path: string): Promise<string[]>; // returns folder names

  // Atomic persistence
  writeSettingsAtomic(json: string): Promise<void>;
  appendHistoryLine(line: string): Promise<void>;
  readHistoryFile(): Promise<string>; // empty string if missing

  // Asset URL conversion (for use in <img src>)
  toAssetUrl(absolutePath: string): string;

  // Window
  setWindowSize(width: number, height: number): Promise<void>;
  setAlwaysOnTop(on: boolean): Promise<void>;
  requestUserAttentionCritical(): Promise<void>;

  // Notifications
  sendNotification(title: string, body: string): Promise<void>;
  notificationsPermitted(): Promise<boolean>;
  requestNotificationPermission(): Promise<boolean>;
}
```

- [ ] **Step 2: Implement the Tauri-backed platform**

```ts
// src/lib/platform/tauri.ts
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { appDataDir, resourceDir, join } from "@tauri-apps/api/path";
import { getCurrentWindow, UserAttentionType } from "@tauri-apps/api/window";
import { readDir, readTextFile, exists, BaseDirectory } from "@tauri-apps/plugin-fs";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import type { Platform } from "./platform.types";

export const tauriPlatform: Platform = {
  async appDataDir() {
    return appDataDir();
  },
  async resourceDir() {
    return resourceDir();
  },
  async readTextFile(path) {
    return readTextFile(path);
  },
  async readDir(path) {
    const entries = await readDir(path);
    return entries.filter((e) => e.isDirectory).map((e) => e.name ?? "");
  },
  async writeSettingsAtomic(json) {
    await invoke("write_settings_atomic", { json });
  },
  async appendHistoryLine(line) {
    await invoke("append_history_line", { line });
  },
  async readHistoryFile() {
    return invoke<string>("read_history_file");
  },
  toAssetUrl(absolutePath) {
    return convertFileSrc(absolutePath);
  },
  async setWindowSize(width, height) {
    const w = getCurrentWindow();
    await w.setSize({ type: "Logical", width, height });
  },
  async setAlwaysOnTop(on) {
    const w = getCurrentWindow();
    await w.setAlwaysOnTop(on);
  },
  async requestUserAttentionCritical() {
    const w = getCurrentWindow();
    await w.requestUserAttention(UserAttentionType.Critical);
  },
  async sendNotification(title, body) {
    sendNotification({ title, body });
  },
  async notificationsPermitted() {
    return isPermissionGranted();
  },
  async requestNotificationPermission() {
    const result = await requestPermission();
    return result === "granted";
  },
};
```

- [ ] **Step 3: Verify type-check**

```bash
npm run check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/platform/
git commit -m "feat(platform): Tauri-backed platform interface"
```

---

## Task 12: Rust commands — atomic settings write, history append

**Files:**

- Modify: `src-tauri/src/lib.rs` (or `main.rs` depending on Tauri 2 scaffolding)
- Create: `src-tauri/src/commands.rs`

- [ ] **Step 1: Add `commands.rs`**

```rust
// src-tauri/src/commands.rs
use std::fs::{self, OpenOptions};
use std::io::{Read, Write};
use std::path::PathBuf;
use tauri::Manager;

fn app_data_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map_err(|e| format!("appDataDir failed: {e}"))
}

fn settings_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(app_data_dir(app)?.join("settings.json"))
}

fn history_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(app_data_dir(app)?.join("history.jsonl"))
}

fn ensure_parent(p: &PathBuf) -> Result<(), String> {
    if let Some(parent) = p.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("create_dir_all: {e}"))?;
    }
    Ok(())
}

#[tauri::command]
pub fn write_settings_atomic(app: tauri::AppHandle, json: String) -> Result<(), String> {
    let dest = settings_path(&app)?;
    ensure_parent(&dest)?;
    let tmp = dest.with_extension("json.tmp");
    {
        let mut f = OpenOptions::new()
            .create(true)
            .write(true)
            .truncate(true)
            .open(&tmp)
            .map_err(|e| format!("open tmp: {e}"))?;
        f.write_all(json.as_bytes()).map_err(|e| format!("write: {e}"))?;
        f.sync_all().map_err(|e| format!("fsync: {e}"))?;
    }
    fs::rename(&tmp, &dest).map_err(|e| format!("rename: {e}"))?;
    Ok(())
}

#[tauri::command]
pub fn append_history_line(app: tauri::AppHandle, line: String) -> Result<(), String> {
    let dest = history_path(&app)?;
    ensure_parent(&dest)?;
    let mut f = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&dest)
        .map_err(|e| format!("open append: {e}"))?;
    let mut line = line;
    if !line.ends_with('\n') {
        line.push('\n');
    }
    f.write_all(line.as_bytes())
        .map_err(|e| format!("write: {e}"))?;
    Ok(())
}

#[tauri::command]
pub fn read_history_file(app: tauri::AppHandle) -> Result<String, String> {
    let p = history_path(&app)?;
    if !p.exists() {
        return Ok(String::new());
    }
    let mut buf = String::new();
    OpenOptions::new()
        .read(true)
        .open(&p)
        .and_then(|mut f| f.read_to_string(&mut buf))
        .map_err(|e| format!("read history: {e}"))?;
    Ok(buf)
}
```

- [ ] **Step 2: Wire commands into the Tauri builder**

In `src-tauri/src/lib.rs` (Tauri 2 default) or `src-tauri/src/main.rs`, locate the `tauri::Builder::default()` chain and update:

```rust
mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            commands::write_settings_atomic,
            commands::append_history_line,
            commands::read_history_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

Add to `src-tauri/Cargo.toml` under `[dependencies]` if not already present:

```toml
tauri-plugin-fs = "2"
tauri-plugin-notification = "2"
```

- [ ] **Step 3: Verify Rust compiles**

```bash
cargo check --manifest-path src-tauri/Cargo.toml
```

Expected: green.

- [ ] **Step 4: Commit**

```bash
git add src-tauri/
git commit -m "feat(shell): atomic settings write + history append commands"
```

---

## Task 13: SettingsStore

**Files:**

- Create: `src/lib/stores/settings.ts`
- Create: `src/lib/stores/settings.types.ts`
- Test: `tests/settings-store.test.ts`

- [ ] **Step 1: Define types and defaults**

```ts
// src/lib/stores/settings.types.ts
import { z } from "zod";

export const settingsSchema = z.object({
  durations: z.object({
    focus: z.number().int().min(1).max(180),
    shortBreak: z.number().int().min(1).max(60),
    longBreak: z.number().int().min(1).max(120),
    sessionsPerLongBreak: z.number().int().min(1).max(12),
  }),
  notifications: z.object({
    banner: z.boolean(),
    inApp: z.boolean(),
    chime: z.boolean(),
    dockBounce: z.boolean(),
  }),
  scene: z.object({
    id: z.string().min(1),
    timeOfDayMode: z.enum(["auto", "morning", "midday", "dusk", "night"]),
  }),
  window: z.object({
    alwaysOnTop: z.boolean(),
    menuBarCountdown: z.boolean(),
  }),
});

export type Settings = z.infer<typeof settingsSchema>;

export const defaultSettings: Settings = {
  durations: { focus: 25, shortBreak: 5, longBreak: 15, sessionsPerLongBreak: 4 },
  notifications: { banner: true, inApp: true, chime: true, dockBounce: false },
  scene: { id: "cabin", timeOfDayMode: "auto" },
  window: { alwaysOnTop: false, menuBarCountdown: true },
};
```

- [ ] **Step 2: Write failing tests**

```ts
// tests/settings-store.test.ts
import { describe, it, expect, vi } from "vitest";
import { get } from "svelte/store";
import { createSettingsStore } from "../src/lib/stores/settings";
import { defaultSettings } from "../src/lib/stores/settings.types";
import type { Platform } from "../src/lib/platform/platform.types";

function makePlatform(initial?: string): Platform {
  const writes: string[] = [];
  let stored = initial;
  return {
    appDataDir: async () => "/app",
    resourceDir: async () => "/res",
    readTextFile: async () =>
      stored ??
      (() => {
        throw new Error("ENOENT");
      })(),
    readDir: async () => [],
    writeSettingsAtomic: async (json) => {
      writes.push(json);
      stored = json;
    },
    appendHistoryLine: async () => {},
    readHistoryFile: async () => "",
    toAssetUrl: (p) => p,
    setWindowSize: async () => {},
    setAlwaysOnTop: async () => {},
    requestUserAttentionCritical: async () => {},
    sendNotification: async () => {},
    notificationsPermitted: async () => true,
    requestNotificationPermission: async () => true,
    // expose for tests
    __writes: writes,
  } as unknown as Platform;
}

describe("SettingsStore", () => {
  it("loads defaults when no file exists", async () => {
    const platform = makePlatform();
    const store = await createSettingsStore(platform);
    expect(get(store)).toEqual(defaultSettings);
  });

  it("loads existing settings file", async () => {
    const custom = { ...defaultSettings, durations: { ...defaultSettings.durations, focus: 50 } };
    const platform = makePlatform(JSON.stringify(custom));
    const store = await createSettingsStore(platform);
    expect(get(store).durations.focus).toBe(50);
  });

  it("persists on update via writeSettingsAtomic", async () => {
    const platform = makePlatform();
    const store = await createSettingsStore(platform, { debounceMs: 0 });
    store.update((s) => ({ ...s, durations: { ...s.durations, focus: 30 } }));
    await new Promise((r) => setTimeout(r, 5));
    expect((platform as any).__writes.length).toBeGreaterThan(0);
    const written = JSON.parse((platform as any).__writes.at(-1));
    expect(written.durations.focus).toBe(30);
  });

  it("falls back to defaults on corrupt file", async () => {
    const platform = makePlatform("{not valid json");
    const store = await createSettingsStore(platform);
    expect(get(store)).toEqual(defaultSettings);
  });
});
```

- [ ] **Step 3: Run — verify failure**

```bash
npm test
```

Expected: FAIL.

- [ ] **Step 4: Implement `src/lib/stores/settings.ts`**

```ts
import { writable, type Writable } from "svelte/store";
import type { Platform } from "../platform/platform.types";
import { defaultSettings, settingsSchema, type Settings } from "./settings.types";

interface Options {
  debounceMs?: number;
}

export async function createSettingsStore(
  platform: Platform,
  options: Options = {},
): Promise<Writable<Settings>> {
  const debounceMs = options.debounceMs ?? 500;
  const initial = await loadInitial(platform);
  const store = writable<Settings>(initial);

  let pending: ReturnType<typeof setTimeout> | null = null;
  store.subscribe((value) => {
    if (pending) clearTimeout(pending);
    pending = setTimeout(() => {
      void platform.writeSettingsAtomic(JSON.stringify(value, null, 2));
    }, debounceMs);
  });

  return store;
}

async function loadInitial(platform: Platform): Promise<Settings> {
  try {
    const path = `${await platform.appDataDir()}/settings.json`;
    const raw = await platform.readTextFile(path);
    const parsed = JSON.parse(raw);
    return settingsSchema.parse(parsed);
  } catch (err) {
    console.warn("[settings] using defaults:", err);
    return defaultSettings;
  }
}
```

- [ ] **Step 5: Run — verify pass**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/stores/settings.ts src/lib/stores/settings.types.ts tests/settings-store.test.ts
git commit -m "feat(stores): SettingsStore with atomic write + corrupt-file fallback"
```

---

## Task 14: HistoryStore

**Files:**

- Create: `src/lib/stores/history.ts`
- Test: `tests/history-store.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/history-store.test.ts
import { describe, it, expect } from "vitest";
import { get } from "svelte/store";
import { createHistoryStore } from "../src/lib/stores/history";
import type { Platform } from "../src/lib/platform/platform.types";

function platformWithHistory(initial: string): Platform {
  let file = initial;
  return {
    appDataDir: async () => "/app",
    resourceDir: async () => "/res",
    readTextFile: async () => "",
    readDir: async () => [],
    writeSettingsAtomic: async () => {},
    appendHistoryLine: async (line) => {
      file += line.endsWith("\n") ? line : line + "\n";
    },
    readHistoryFile: async () => file,
    toAssetUrl: (p) => p,
    setWindowSize: async () => {},
    setAlwaysOnTop: async () => {},
    requestUserAttentionCritical: async () => {},
    sendNotification: async () => {},
    notificationsPermitted: async () => true,
    requestNotificationPermission: async () => true,
  } as Platform;
}

const focusEntry = (endedAt: number) =>
  JSON.stringify({
    id: `id-${endedAt}`,
    phase: "focus",
    startedAt: endedAt - 25 * 60_000,
    endedAt,
    completed: true,
  });

describe("HistoryStore", () => {
  it("returns zero tallies for empty history", async () => {
    const p = platformWithHistory("");
    const store = await createHistoryStore(p, () => new Date("2026-05-26T12:00:00Z").getTime());
    expect(get(store)).toEqual({ today: 0, thisWeek: 0, weekFocusMinutes: 0 });
  });

  it("tolerates a truncated final line", async () => {
    const file = [focusEntry(new Date("2026-05-26T10:00:00Z").getTime()), "{not valid json"].join(
      "\n",
    );
    const p = platformWithHistory(file);
    const store = await createHistoryStore(p, () => new Date("2026-05-26T12:00:00Z").getTime());
    expect(get(store).today).toBe(1);
  });

  it("appends and updates tallies", async () => {
    const p = platformWithHistory("");
    const store = await createHistoryStore(p, () => new Date("2026-05-26T12:00:00Z").getTime());
    await store.appendFocusSession({
      startedAt: new Date("2026-05-26T10:00:00Z").getTime(),
      endedAt: new Date("2026-05-26T10:25:00Z").getTime(),
    });
    expect(get(store).today).toBe(1);
    expect(get(store).weekFocusMinutes).toBe(25);
  });
});
```

- [ ] **Step 2: Run — verify failure**

```bash
npm test
```

Expected: FAIL.

- [ ] **Step 3: Implement `src/lib/stores/history.ts`**

```ts
import { writable, type Readable } from "svelte/store";
import type { Platform } from "../platform/platform.types";

export interface HistoryEntry {
  id: string;
  phase: "focus";
  startedAt: number;
  endedAt: number;
  completed: true;
}

export interface Tallies {
  today: number;
  thisWeek: number;
  weekFocusMinutes: number;
}

export interface HistoryStore extends Readable<Tallies> {
  appendFocusSession(args: { startedAt: number; endedAt: number }): Promise<void>;
}

export async function createHistoryStore(
  platform: Platform,
  now: () => number = () => Date.now(),
): Promise<HistoryStore> {
  const entries = parseHistory(await platform.readHistoryFile());
  const inner = writable<Tallies>(computeTallies(entries, now()));

  return {
    subscribe: inner.subscribe,
    async appendFocusSession({ startedAt, endedAt }) {
      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        phase: "focus",
        startedAt,
        endedAt,
        completed: true,
      };
      await platform.appendHistoryLine(JSON.stringify(entry));
      entries.push(entry);
      inner.set(computeTallies(entries, now()));
    },
  };
}

function parseHistory(raw: string): HistoryEntry[] {
  if (!raw) return [];
  const out: HistoryEntry[] = [];
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (obj && obj.phase === "focus" && typeof obj.endedAt === "number") {
        out.push(obj as HistoryEntry);
      }
    } catch {
      // Truncated/corrupt line — drop it
      console.warn("[history] skipping unparseable line");
    }
  }
  return out;
}

function computeTallies(entries: HistoryEntry[], now: number): Tallies {
  const start = startOfDay(now);
  const weekStart = startOfWeek(now);
  let today = 0;
  let thisWeek = 0;
  let weekMs = 0;
  for (const e of entries) {
    if (e.endedAt >= start) today += 1;
    if (e.endedAt >= weekStart) {
      thisWeek += 1;
      weekMs += e.endedAt - e.startedAt;
    }
  }
  return { today, thisWeek, weekFocusMinutes: Math.round(weekMs / 60_000) };
}

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function startOfWeek(ts: number): number {
  const d = new Date(ts);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? 6 : day - 1; // ISO week starts Monday
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
```

- [ ] **Step 4: Run — verify pass**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/stores/history.ts tests/history-store.test.ts
git commit -m "feat(stores): HistoryStore with tolerant JSONL parsing"
```

---

## Task 15: SceneLoader

**Files:**

- Create: `src/lib/scenes/SceneLoader.ts`
- Test: `tests/scene-loader.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/scene-loader.test.ts
import { describe, it, expect } from "vitest";
import { loadAllScenes } from "../src/lib/scenes/SceneLoader";
import type { Platform } from "../src/lib/platform/platform.types";

const validManifest = {
  id: "cabin",
  name: "Cabin",
  author: "T",
  license: "MIT",
  version: 1,
  layers: { background: "background.webp" },
  clock: { x: 0.5, y: 0.2, diameter: 0.2, face: "warm-cream" },
  phaseTag: { x: 0.05, y: 0.05 },
  palette: { primary: "#aaa", accent: "#bbb", ink: "#000" },
  timeOfDay: {
    mode: "tint",
    tints: { morning: "#fff", midday: "#fff", dusk: "#fff", night: "#000" },
  },
};

const unsafeManifest = { ...validManifest, layers: { background: "../escape.webp" } };

function platformWith(scenes: Record<string, Record<string, string>>): Platform {
  return {
    appDataDir: async () => "/app",
    resourceDir: async () => "/res",
    readTextFile: async (path) => {
      for (const dir in scenes) {
        for (const file in scenes[dir]) {
          if (path === `${dir}/${file}`) return scenes[dir][file];
        }
      }
      throw new Error("ENOENT " + path);
    },
    readDir: async (path) => {
      // Returns folder names whose paths begin with `path`
      const prefix = path + "/";
      return Object.keys(scenes)
        .filter((d) => d.startsWith(prefix))
        .map((d) => d.slice(prefix.length).split("/")[0]);
    },
    writeSettingsAtomic: async () => {},
    appendHistoryLine: async () => {},
    readHistoryFile: async () => "",
    toAssetUrl: (p) => "asset:" + p,
    setWindowSize: async () => {},
    setAlwaysOnTop: async () => {},
    requestUserAttentionCritical: async () => {},
    sendNotification: async () => {},
    notificationsPermitted: async () => true,
    requestNotificationPermission: async () => true,
  } as Platform;
}

describe("SceneLoader", () => {
  it("loads a valid bundled scene", async () => {
    const platform = platformWith({
      "/res/scenes/cabin": { "scene.json": JSON.stringify(validManifest) },
    });
    const scenes = await loadAllScenes(platform);
    expect(scenes.map((s) => s.id)).toEqual(["cabin"]);
  });

  it("rejects manifests with unsafe asset paths", async () => {
    const platform = platformWith({
      "/res/scenes/bad": { "scene.json": JSON.stringify(unsafeManifest) },
    });
    const scenes = await loadAllScenes(platform);
    expect(scenes).toEqual([]);
  });

  it("merges bundled + user scenes", async () => {
    const platform = platformWith({
      "/res/scenes/cabin": { "scene.json": JSON.stringify(validManifest) },
      "/app/scenes/cafe": {
        "scene.json": JSON.stringify({ ...validManifest, id: "cafe", name: "Cafe" }),
      },
    });
    const scenes = await loadAllScenes(platform);
    expect(scenes.map((s) => s.id).sort()).toEqual(["cabin", "cafe"]);
  });
});
```

- [ ] **Step 2: Run — verify failure**

```bash
npm test
```

Expected: FAIL.

- [ ] **Step 3: Implement `src/lib/scenes/SceneLoader.ts`**

```ts
import type { Platform } from "../platform/platform.types";
import { sceneSchema, type SceneManifest } from "./sceneSchema";
import { collectManifestAssetPaths, isSafeRelativeAsset } from "./scenePathSafe";
import type { LoadedScene } from "./scene.types";

export async function loadAllScenes(platform: Platform): Promise<LoadedScene[]> {
  const [resource, appData] = await Promise.all([platform.resourceDir(), platform.appDataDir()]);
  const roots = [`${resource}/scenes`, `${appData}/scenes`];

  const scenes: LoadedScene[] = [];
  for (const root of roots) {
    const folders = await tryReadDir(platform, root);
    for (const folder of folders) {
      const baseDir = `${root}/${folder}`;
      const scene = await tryLoadScene(platform, baseDir);
      if (scene) scenes.push(scene);
    }
  }
  return scenes;
}

async function tryReadDir(platform: Platform, path: string): Promise<string[]> {
  try {
    return await platform.readDir(path);
  } catch {
    return [];
  }
}

async function tryLoadScene(platform: Platform, baseDir: string): Promise<LoadedScene | null> {
  try {
    const raw = await platform.readTextFile(`${baseDir}/scene.json`);
    const parsed = JSON.parse(raw);
    const manifest = sceneSchema.parse(parsed) as SceneManifest;

    const assetPaths = collectManifestAssetPaths(manifest);
    for (const p of assetPaths) {
      if (!isSafeRelativeAsset(p)) {
        console.warn(`[scenes] rejected ${baseDir}: unsafe path ${JSON.stringify(p)}`);
        return null;
      }
    }

    return {
      id: manifest.id,
      manifest,
      baseDir,
      assetUrl: (rel) => platform.toAssetUrl(`${baseDir}/${rel}`),
    };
  } catch (err) {
    console.warn(`[scenes] failed to load ${baseDir}:`, err);
    return null;
  }
}
```

- [ ] **Step 4: Run — verify pass**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/scenes/SceneLoader.ts tests/scene-loader.test.ts
git commit -m "feat(scenes): SceneLoader scans bundled + user scenes with path safety"
```

---

## Task 16: Notifier

**Files:**

- Create: `src/lib/notify/Notifier.ts`
- Test: `tests/notifier.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/notifier.test.ts
import { describe, it, expect, vi } from "vitest";
import { writable } from "svelte/store";
import { createNotifier } from "../src/lib/notify/Notifier";
import type { Settings } from "../src/lib/stores/settings.types";
import { defaultSettings } from "../src/lib/stores/settings.types";
import type { Platform } from "../src/lib/platform/platform.types";

function fakePlatform() {
  return {
    sendNotification: vi.fn().mockResolvedValue(undefined),
    notificationsPermitted: vi.fn().mockResolvedValue(true),
    requestNotificationPermission: vi.fn().mockResolvedValue(true),
    requestUserAttentionCritical: vi.fn().mockResolvedValue(undefined),
    // unused
    appDataDir: async () => "",
    resourceDir: async () => "",
    readTextFile: async () => "",
    readDir: async () => [],
    writeSettingsAtomic: async () => {},
    appendHistoryLine: async () => {},
    readHistoryFile: async () => "",
    toAssetUrl: () => "",
    setWindowSize: async () => {},
    setAlwaysOnTop: async () => {},
  } as unknown as Platform & ReturnType<typeof vi.fn>;
}

function settingsStore(overrides: Partial<Settings["notifications"]> = {}) {
  return writable<Settings>({
    ...defaultSettings,
    notifications: { ...defaultSettings.notifications, ...overrides },
  });
}

const event = {
  completedPhase: "focus" as const,
  nextPhase: "shortBreak" as const,
  natural: true as const,
  endedAt: Date.now(),
  sessionIndex: 1,
};

describe("Notifier", () => {
  it("fires enabled channels", async () => {
    const platform = fakePlatform();
    const inApp = vi.fn();
    const chime = vi.fn();
    const notifier = createNotifier(platform, settingsStore(), {
      onInAppAlert: inApp,
      playChime: chime,
    });
    await notifier.notifyPhaseEnd(event);
    expect(platform.sendNotification).toHaveBeenCalledTimes(1);
    expect(inApp).toHaveBeenCalledTimes(1);
    expect(chime).toHaveBeenCalledTimes(1);
    expect(platform.requestUserAttentionCritical).not.toHaveBeenCalled(); // off by default
  });

  it("does NOT fire any channel that is disabled", async () => {
    const platform = fakePlatform();
    const inApp = vi.fn();
    const chime = vi.fn();
    const notifier = createNotifier(
      platform,
      settingsStore({ banner: false, inApp: false, chime: false, dockBounce: false }),
      { onInAppAlert: inApp, playChime: chime },
    );
    await notifier.notifyPhaseEnd(event);
    expect(platform.sendNotification).not.toHaveBeenCalled();
    expect(inApp).not.toHaveBeenCalled();
    expect(chime).not.toHaveBeenCalled();
    expect(platform.requestUserAttentionCritical).not.toHaveBeenCalled();
  });

  it("fires dock bounce when enabled", async () => {
    const platform = fakePlatform();
    const notifier = createNotifier(
      platform,
      settingsStore({ banner: false, inApp: false, chime: false, dockBounce: true }),
      { onInAppAlert: vi.fn(), playChime: vi.fn() },
    );
    await notifier.notifyPhaseEnd(event);
    expect(platform.requestUserAttentionCritical).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run — verify failure**

```bash
npm test
```

Expected: FAIL.

- [ ] **Step 3: Implement `src/lib/notify/Notifier.ts`**

```ts
import { get, type Readable } from "svelte/store";
import type { Platform } from "../platform/platform.types";
import type { PhaseEndedEvent } from "../timer/timer.types";
import type { Settings } from "../stores/settings.types";

interface NotifierHandlers {
  onInAppAlert: (event: PhaseEndedEvent) => void;
  playChime: () => void;
}

const COPY: Record<PhaseEndedEvent["completedPhase"], { title: string; body: string }> = {
  focus: { title: "Focus complete", body: "Time for a break." },
  shortBreak: { title: "Break over", body: "Ready for the next focus session?" },
  longBreak: { title: "Long break over", body: "Back to focus when you're ready." },
};

export function createNotifier(
  platform: Platform,
  settings: Readable<Settings>,
  handlers: NotifierHandlers,
) {
  return {
    async notifyPhaseEnd(event: PhaseEndedEvent) {
      const cfg = get(settings).notifications;
      const text = COPY[event.completedPhase];
      const tasks: Promise<unknown>[] = [];
      if (cfg.banner) tasks.push(platform.sendNotification(text.title, text.body));
      if (cfg.inApp) handlers.onInAppAlert(event);
      if (cfg.chime) handlers.playChime();
      if (cfg.dockBounce) tasks.push(platform.requestUserAttentionCritical());
      await Promise.all(tasks);
    },
  };
}
```

- [ ] **Step 4: Run — verify pass**

```bash
npm test
```

Expected: PASS — all three notifier tests plus all previous tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/notify/ tests/notifier.test.ts
git commit -m "feat(notify): Notifier routes phase-end to enabled channels only"
```

---

## Task 17: Mode store + window resize

**Files:**

- Create: `src/lib/stores/mode.ts`

- [ ] **Step 1: Implement the mode store**

```ts
// src/lib/stores/mode.ts
import { writable } from "svelte/store";
import type { Platform } from "../platform/platform.types";

export type Mode = "compact" | "full";

const COMPACT_SIZE = { width: 320, height: 200 };
const DEFAULT_FULL_SIZE = { width: 900, height: 600 };

export function createModeStore(platform: Platform) {
  const store = writable<Mode>("full");
  let lastFullSize = DEFAULT_FULL_SIZE;

  return {
    subscribe: store.subscribe,
    async setMode(mode: Mode) {
      if (mode === "compact") {
        await platform.setWindowSize(COMPACT_SIZE.width, COMPACT_SIZE.height);
      } else {
        await platform.setWindowSize(lastFullSize.width, lastFullSize.height);
      }
      store.set(mode);
    },
    rememberFullSize(width: number, height: number) {
      lastFullSize = { width, height };
    },
  };
}
```

- [ ] **Step 2: Type-check**

```bash
npm run check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/stores/mode.ts
git commit -m "feat(stores): Mode store with window resize"
```

---

## Task 18: WallClock Svelte component

**Files:**

- Create: `src/views/WallClock.svelte`

- [ ] **Step 1: Implement the component**

```svelte
<script lang="ts">
  export let remainingMs: number;
  export let durationMs: number;
  export let accent = "#c97a5a";

  $: progress = Math.max(0, Math.min(1, 1 - remainingMs / durationMs));
  $: mm = Math.floor(remainingMs / 60_000);
  $: ss = Math.floor((remainingMs % 60_000) / 1000);
  $: label = `${mm.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;

  const R = 50;
  const CIRC = 2 * Math.PI * R;
  $: dashOffset = CIRC * progress;
</script>

<svg viewBox="-60 -60 120 120" class="clock" role="img" aria-label="Pomodoro timer">
  <circle r={R} fill="#f4ecdc" stroke="#3a2f24" stroke-width="6" />
  <circle
    r={R - 6}
    fill="none"
    stroke={accent}
    stroke-width="4"
    stroke-linecap="round"
    stroke-dasharray={CIRC}
    stroke-dashoffset={dashOffset}
    transform="rotate(-90)"
  />
  <g stroke="#3a2f24" stroke-width="2">
    <line x1="0" y1="-42" x2="0" y2="-36" />
    <line x1="42" y1="0" x2="36" y2="0" />
    <line x1="0" y1="42" x2="0" y2="36" />
    <line x1="-42" y1="0" x2="-36" y2="0" />
  </g>
  <text
    x="0"
    y="6"
    text-anchor="middle"
    font-size="14"
    font-family="ui-rounded, system-ui"
    fill="#3a2f24"
  >
    {label}
  </text>
</svg>

<style>
  .clock {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
```

- [ ] **Step 2: Verify type-check**

```bash
npm run check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/views/WallClock.svelte
git commit -m "feat(ui): WallClock component"
```

---

## Task 19: ButtonBar Svelte component

**Files:**

- Create: `src/views/ButtonBar.svelte`

- [ ] **Step 1: Implement the component**

```svelte
<script lang="ts">
  import type { RunState } from "../lib/timer/timer.types";

  export let runState: RunState;
  export let compact = false;

  export let onStart: () => void;
  export let onPause: () => void;
  export let onResume: () => void;
  export let onSkip: () => void;
  export let onExtend: () => void;
  export let onReset: () => void;
  export let onToggleMode: () => void;
  export let onOpenSettings: () => void;
  export let onOpenHistory: (() => void) | null = null;

  $: primaryLabel =
    runState === "running"
      ? "Pause"
      : runState === "paused"
        ? "Resume"
        : runState === "ended"
          ? "Start next"
          : "Start";

  function primaryClick() {
    if (runState === "running") onPause();
    else if (runState === "paused") onResume();
    else onStart();
  }
</script>

<div class="bar" class:compact>
  <button class="primary" on:click={primaryClick} aria-label={primaryLabel}>
    {compact ? (runState === "running" ? "⏸" : "▶") : primaryLabel}
  </button>
  <button on:click={onSkip} aria-label="Skip">{compact ? "⏭" : "Skip"}</button>
  <button on:click={onExtend} aria-label="Extend 5 minutes">{compact ? "+5" : "+5 min"}</button>
  <button on:click={onReset} aria-label="Reset">{compact ? "⟳" : "Reset"}</button>
  <span class="spacer"></span>
  <button on:click={onToggleMode} aria-label="Toggle mode">{compact ? "▦" : "Compact"}</button>
  {#if onOpenHistory}
    <button on:click={onOpenHistory} aria-label="History">{compact ? "📊" : "History"}</button>
  {/if}
  <button on:click={onOpenSettings} aria-label="Settings">⚙</button>
</div>

<style>
  .bar {
    display: flex;
    gap: 6px;
    align-items: center;
    padding: 10px 12px;
    color: #f0e6d4;
    font-family: ui-rounded, system-ui, sans-serif;
    font-size: 13px;
  }
  button {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: inherit;
    padding: 6px 12px;
    border-radius: 8px;
    cursor: pointer;
    font: inherit;
  }
  button:hover {
    background: rgba(255, 255, 255, 0.14);
  }
  button.primary {
    background: #c97a5a;
    color: #1a0f0a;
    border-color: #c97a5a;
  }
  .spacer {
    flex: 1;
  }
</style>
```

- [ ] **Step 2: Type-check and commit**

```bash
npm run check
git add src/views/ButtonBar.svelte
git commit -m "feat(ui): ButtonBar component"
```

---

## Task 20: CompactCard view

**Files:**

- Create: `src/views/CompactCard.svelte`

- [ ] **Step 1: Implement**

```svelte
<script lang="ts">
  import type { TimerSnapshot } from "../lib/timer/timer.types";
  import ButtonBar from "./ButtonBar.svelte";

  export let snapshot: TimerSnapshot;
  export let durationMs: number;
  export let sessionsPerLongBreak: number;

  export let actions: {
    onStart: () => void;
    onPause: () => void;
    onResume: () => void;
    onSkip: () => void;
    onExtend: () => void;
    onReset: () => void;
    onToggleMode: () => void;
    onOpenSettings: () => void;
  };

  $: mm = Math.floor(snapshot.remainingMs / 60_000);
  $: ss = Math.floor((snapshot.remainingMs % 60_000) / 1000);
  $: time = `${mm.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
  $: phaseLabel =
    snapshot.phase === "focus"
      ? `Focus · ${snapshot.sessionIndex} / ${sessionsPerLongBreak}`
      : snapshot.phase === "shortBreak"
        ? "Short break"
        : "Long break";
</script>

<div class="card">
  <div class="pill">{phaseLabel}</div>
  <div class="time">{time}</div>
  <ButtonBar
    runState={snapshot.runState}
    compact
    onStart={actions.onStart}
    onPause={actions.onPause}
    onResume={actions.onResume}
    onSkip={actions.onSkip}
    onExtend={actions.onExtend}
    onReset={actions.onReset}
    onToggleMode={actions.onToggleMode}
    onOpenSettings={actions.onOpenSettings}
  />
</div>

<style>
  .card {
    height: 100vh;
    background: linear-gradient(180deg, #2a2c33 0%, #1f2128 100%);
    color: #e6e3da;
    font-family: ui-rounded, system-ui, sans-serif;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .pill {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #c9b78a;
    background: rgba(201, 183, 138, 0.08);
    padding: 3px 10px;
    border-radius: 999px;
    align-self: flex-start;
  }
  .time {
    font-size: 56px;
    font-weight: 200;
    letter-spacing: -1px;
    line-height: 1;
    margin: 6px 0;
  }
</style>
```

- [ ] **Step 2: Type-check and commit**

```bash
npm run check
git add src/views/CompactCard.svelte
git commit -m "feat(ui): CompactCard view"
```

---

## Task 21: FullScene view

**Files:**

- Create: `src/views/FullScene.svelte`

- [ ] **Step 1: Implement**

```svelte
<script lang="ts">
  import type { TimerSnapshot } from "../lib/timer/timer.types";
  import type { LoadedScene } from "../lib/scenes/scene.types";
  import WallClock from "./WallClock.svelte";
  import ButtonBar from "./ButtonBar.svelte";

  export let snapshot: TimerSnapshot;
  export let durationMs: number;
  export let sessionsPerLongBreak: number;
  export let scene: LoadedScene | null;
  export let tint: string;
  export let alertEvent: { id: number } | null;

  export let actions: {
    onStart: () => void;
    onPause: () => void;
    onResume: () => void;
    onSkip: () => void;
    onExtend: () => void;
    onReset: () => void;
    onToggleMode: () => void;
    onOpenSettings: () => void;
    onOpenHistory: () => void;
  };

  $: phaseLabel =
    snapshot.phase === "focus" ? `Focus · ${snapshot.sessionIndex} / ${sessionsPerLongBreak}` :
    snapshot.phase === "shortBreak" ? "Short break" : "Long break";

  $: clockPos = scene?.manifest.clock ?? { x: 0.5, y: 0.2, diameter: 0.2, face: "warm-cream" };
  $: tagPos = scene?.manifest.phaseTag ?? { x: 0.04, y: 0.06 };
</script>

<div class="stage">
  {#if scene}
    <img class="bg" src={scene.assetUrl(scene.manifest.layers.background)} alt="" />
    {#if scene.manifest.layers.foreground}
      <img class="fg" src={scene.assetUrl(scene.manifest.layers.foreground)} alt="" />
    {/if}
  {:else}
    <div class="bg placeholder"></div>
  {/if}

  <div class="tint" style="background-color: {tint}"></div>

  <div class="phase-tag" style="left: {tagPos.x * 100}%; top: {tagPos.y * 100}%;">{phaseLabel}</div>

  <div
    class="clock-slot"
    style="
      left: {(clockPos.x - clockPos.diameter / 2) * 100}%;
      top: {(clockPos.y - clockPos.diameter / 2) * 100}%;
      width: {clockPos.diameter * 100}%;
      aspect-ratio: 1 / 1;
    "
  >
    <WallClock {remainingMs}={snapshot.remainingMs} {durationMs} accent={scene?.manifest.palette.primary ?? "#c97a5a"} />
  </div>

  {#if alertEvent}
    {#key alertEvent.id}
      <div class="overlay">Phase complete</div>
    {/key}
  {/if}

  <div class="bottom-bar">
    <ButtonBar
      runState={snapshot.runState}
      onStart={actions.onStart}
      onPause={actions.onPause}
      onResume={actions.onResume}
      onSkip={actions.onSkip}
      onExtend={actions.onExtend}
      onReset={actions.onReset}
      onToggleMode={actions.onToggleMode}
      onOpenSettings={actions.onOpenSettings}
      onOpenHistory={actions.onOpenHistory}
    />
  </div>
</div>

<style>
  .stage { position: relative; width: 100%; height: 100vh; overflow: hidden; background: #1a1c22; }
  .bg, .fg {
    position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
  }
  .placeholder { background: linear-gradient(180deg, #3b2820 0%, #2a1d18 100%); }
  .tint { position: absolute; inset: 0; mix-blend-mode: multiply; opacity: 0.25; pointer-events: none; }
  .phase-tag {
    position: absolute;
    background: rgba(20, 15, 12, 0.55); color: #f0e6d4;
    font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase;
    padding: 4px 12px; border-radius: 999px; backdrop-filter: blur(6px);
    font-family: ui-rounded, system-ui;
  }
  .clock-slot { position: absolute; }
  .bottom-bar {
    position: absolute; left: 0; right: 0; bottom: 0;
    background: linear-gradient(180deg, transparent, rgba(15, 10, 8, 0.85));
    padding-top: 24px;
  }
  .overlay {
    position: absolute; inset: 0; display: grid; place-items: center;
    background: rgba(0, 0, 0, 0.45); color: #f0e6d4; font-size: 28px;
    animation: pulse 1.6s ease-out forwards;
    font-family: ui-rounded, system-ui;
  }
  @keyframes pulse { 0% { opacity: 0; } 30% { opacity: 1; } 100% { opacity: 0; } }
</style>
```

- [ ] **Step 2: Type-check and commit**

```bash
npm run check
git add src/views/FullScene.svelte
git commit -m "feat(ui): FullScene with painted scene, wall clock overlay, alert"
```

---

## Task 22: SettingsDialog

**Files:**

- Create: `src/views/SettingsDialog.svelte`

- [ ] **Step 1: Implement**

```svelte
<script lang="ts">
  import type { Writable } from "svelte/store";
  import type { Settings } from "../lib/stores/settings.types";
  import type { LoadedScene } from "../lib/scenes/scene.types";

  export let settings: Writable<Settings>;
  export let scenes: LoadedScene[];
  export let onClose: () => void;

  let tab: "timer" | "scene" | "notifications" = "timer";

  function bindNumber(get: (s: Settings) => number, set: (s: Settings, v: number) => Settings) {
    return {
      get value() {
        return get($settings);
      },
      set value(v: number) {
        settings.update((s) => set(s, v));
      },
    };
  }

  function toggleBool(path: (s: Settings) => boolean, set: (s: Settings, v: boolean) => Settings) {
    settings.update((s) => set(s, !path(s)));
  }
</script>

<div class="backdrop" on:click={onClose}>
  <div class="modal" on:click|stopPropagation>
    <header>
      <span>⚙</span>
      <h3>Settings</h3>
      <button class="x" on:click={onClose}>✕</button>
    </header>

    <nav class="tabs">
      <button class:active={tab === "timer"} on:click={() => (tab = "timer")}>Timer</button>
      <button class:active={tab === "scene"} on:click={() => (tab = "scene")}>Scene</button>
      <button class:active={tab === "notifications"} on:click={() => (tab = "notifications")}
        >Notifications</button
      >
    </nav>

    <div class="body">
      {#if tab === "timer"}
        <label class="row">
          <span>Focus duration (min)</span>
          <input
            type="number"
            min="1"
            max="180"
            value={$settings.durations.focus}
            on:input={(e) =>
              settings.update((s) => ({
                ...s,
                durations: { ...s.durations, focus: +e.currentTarget.value },
              }))}
          />
        </label>
        <label class="row">
          <span>Short break (min)</span>
          <input
            type="number"
            min="1"
            max="60"
            value={$settings.durations.shortBreak}
            on:input={(e) =>
              settings.update((s) => ({
                ...s,
                durations: { ...s.durations, shortBreak: +e.currentTarget.value },
              }))}
          />
        </label>
        <label class="row">
          <span>Long break (min)</span>
          <input
            type="number"
            min="1"
            max="120"
            value={$settings.durations.longBreak}
            on:input={(e) =>
              settings.update((s) => ({
                ...s,
                durations: { ...s.durations, longBreak: +e.currentTarget.value },
              }))}
          />
        </label>
        <label class="row">
          <span>Sessions per long break</span>
          <input
            type="number"
            min="1"
            max="12"
            value={$settings.durations.sessionsPerLongBreak}
            on:input={(e) =>
              settings.update((s) => ({
                ...s,
                durations: { ...s.durations, sessionsPerLongBreak: +e.currentTarget.value },
              }))}
          />
        </label>
        <label class="row">
          <span>Always-on-top</span>
          <input
            type="checkbox"
            checked={$settings.window.alwaysOnTop}
            on:change={(e) =>
              settings.update((s) => ({
                ...s,
                window: { ...s.window, alwaysOnTop: e.currentTarget.checked },
              }))}
          />
        </label>
        <label class="row">
          <span>Menu bar countdown</span>
          <input
            type="checkbox"
            checked={$settings.window.menuBarCountdown}
            on:change={(e) =>
              settings.update((s) => ({
                ...s,
                window: { ...s.window, menuBarCountdown: e.currentTarget.checked },
              }))}
          />
        </label>
      {:else if tab === "scene"}
        <div class="scene-grid">
          {#each scenes as scene}
            <button
              class="tile"
              class:selected={$settings.scene.id === scene.id}
              on:click={() =>
                settings.update((s) => ({ ...s, scene: { ...s.scene, id: scene.id } }))}
            >
              <div class="preview" style="background: {scene.manifest.palette.primary}"></div>
              <div class="name">{scene.manifest.name}</div>
            </button>
          {/each}
        </div>
        <label class="row">
          <span>Time of day</span>
          <select
            value={$settings.scene.timeOfDayMode}
            on:change={(e) =>
              settings.update((s) => ({
                ...s,
                scene: {
                  ...s.scene,
                  timeOfDayMode: e.currentTarget.value as Settings["scene"]["timeOfDayMode"],
                },
              }))}
          >
            <option value="auto">Auto (wall clock)</option>
            <option value="morning">Morning</option>
            <option value="midday">Midday</option>
            <option value="dusk">Dusk</option>
            <option value="night">Night</option>
          </select>
        </label>
      {:else}
        <label class="row">
          <span>macOS banner</span>
          <input
            type="checkbox"
            checked={$settings.notifications.banner}
            on:change={() =>
              toggleBool(
                (s) => s.notifications.banner,
                (s, v) => ({ ...s, notifications: { ...s.notifications, banner: v } }),
              )}
          />
        </label>
        <label class="row">
          <span>In-app overlay</span>
          <input
            type="checkbox"
            checked={$settings.notifications.inApp}
            on:change={() =>
              toggleBool(
                (s) => s.notifications.inApp,
                (s, v) => ({ ...s, notifications: { ...s.notifications, inApp: v } }),
              )}
          />
        </label>
        <label class="row">
          <span>Audible chime</span>
          <input
            type="checkbox"
            checked={$settings.notifications.chime}
            on:change={() =>
              toggleBool(
                (s) => s.notifications.chime,
                (s, v) => ({ ...s, notifications: { ...s.notifications, chime: v } }),
              )}
          />
        </label>
        <label class="row">
          <span>Dock bounce</span>
          <input
            type="checkbox"
            checked={$settings.notifications.dockBounce}
            on:change={() =>
              toggleBool(
                (s) => s.notifications.dockBounce,
                (s, v) => ({ ...s, notifications: { ...s.notifications, dockBounce: v } }),
              )}
          />
        </label>
      {/if}
    </div>

    <footer>
      <button class="primary" on:click={onClose}>Close</button>
    </footer>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: grid;
    place-items: center;
    z-index: 100;
  }
  .modal {
    width: min(560px, 90vw);
    background: #1c1e25;
    color: #e6e3da;
    border-radius: 14px;
    overflow: hidden;
    font-family: ui-rounded, system-ui;
  }
  header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 18px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  header h3 {
    margin: 0;
    font-size: 15px;
    flex: 1;
  }
  .x {
    background: none;
    border: none;
    color: #8a8578;
    cursor: pointer;
    font-size: 16px;
  }
  .tabs {
    display: flex;
    padding: 0 18px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  .tabs button {
    background: none;
    border: none;
    color: #8a8578;
    padding: 10px 14px;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    font: inherit;
  }
  .tabs button.active {
    color: #c9b78a;
    border-bottom-color: #c9b78a;
  }
  .body {
    padding: 14px 18px;
    max-height: 60vh;
    overflow: auto;
  }
  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    font-size: 13px;
  }
  input[type="number"],
  select {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #e6e3da;
    padding: 4px 8px;
    border-radius: 6px;
  }
  input[type="checkbox"] {
    accent-color: #c9b78a;
  }
  footer {
    display: flex;
    justify-content: flex-end;
    padding: 12px 18px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(0, 0, 0, 0.15);
  }
  footer .primary {
    background: #c9b78a;
    color: #1c1e25;
    border: none;
    padding: 6px 14px;
    border-radius: 6px;
    cursor: pointer;
    font: inherit;
  }
  .scene-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 14px;
  }
  .tile {
    background: none;
    border: 2px solid transparent;
    padding: 0;
    border-radius: 8px;
    cursor: pointer;
    color: inherit;
    font: inherit;
  }
  .tile.selected {
    border-color: #c9b78a;
  }
  .tile .preview {
    aspect-ratio: 4/3;
    border-radius: 6px;
  }
  .tile .name {
    font-size: 11px;
    padding-top: 4px;
    color: #8a8578;
  }
</style>
```

- [ ] **Step 2: Type-check and commit**

```bash
npm run check
git add src/views/SettingsDialog.svelte
git commit -m "feat(ui): SettingsDialog with Timer/Scene/Notifications tabs"
```

---

## Task 23: HistoryPanel

**Files:**

- Create: `src/views/HistoryPanel.svelte`

- [ ] **Step 1: Implement**

```svelte
<script lang="ts">
  import type { Readable } from "svelte/store";
  import type { Tallies } from "../lib/stores/history";

  export let tallies: Readable<Tallies>;
  export let onClose: () => void;

  $: hoursFocused = (($tallies.weekFocusMinutes ?? 0) / 60).toFixed(1);
</script>

<div class="backdrop" on:click={onClose}>
  <div class="panel" on:click|stopPropagation>
    <h3>Your sessions</h3>
    <div class="stats">
      <div class="stat">
        <div class="big">{$tallies.today}</div>
        <div class="lbl">Today</div>
      </div>
      <div class="stat">
        <div class="big">{$tallies.thisWeek}</div>
        <div class="lbl">This week</div>
      </div>
      <div class="stat">
        <div class="big">{hoursFocused}h</div>
        <div class="lbl">Focused this week</div>
      </div>
    </div>
    <button class="close" on:click={onClose}>Close</button>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: grid;
    place-items: center;
    z-index: 100;
  }
  .panel {
    background: #1c1e25;
    color: #e6e3da;
    border-radius: 14px;
    padding: 20px;
    min-width: 360px;
    font-family: ui-rounded, system-ui;
  }
  h3 {
    margin: 0 0 14px;
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
  .stat {
    background: rgba(255, 255, 255, 0.04);
    padding: 14px;
    border-radius: 8px;
    text-align: center;
  }
  .big {
    font-size: 28px;
    font-weight: 300;
  }
  .lbl {
    font-size: 11px;
    color: #8a8578;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-top: 4px;
  }
  .close {
    display: block;
    margin: 14px 0 0 auto;
    background: #c9b78a;
    color: #1c1e25;
    border: none;
    padding: 6px 14px;
    border-radius: 6px;
    cursor: pointer;
    font: inherit;
  }
</style>
```

- [ ] **Step 2: Type-check and commit**

```bash
npm run check
git add src/views/HistoryPanel.svelte
git commit -m "feat(ui): HistoryPanel with today/week tallies"
```

---

## Task 24: App.svelte root composition

**Files:**

- Modify: `src/App.svelte`
- Modify: `src/main.ts` (if needed for global styles)
- Create: `src/lib/assets/chime.wav` (placeholder — see step 2)

- [ ] **Step 1: Add a placeholder chime asset**

For now, generate a 0.3s sine wave as a placeholder. From the project root:

```bash
mkdir -p src/lib/assets
# If you have `sox` installed:
# sox -n src/lib/assets/chime.wav synth 0.3 sine 880 fade 0.01 0.3 0.05
# Otherwise, download any short, public-domain WAV file ≤ 50KB to that path.
# As a last resort, create an empty file and replace it post-v1.
ls src/lib/assets/ # confirm chime.wav exists
```

- [ ] **Step 2: Replace `src/App.svelte` with the root composition**

```svelte
<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import { TimerEngine } from "./lib/timer/TimerEngine";
  import type { TimerSnapshot } from "./lib/timer/timer.types";
  import { tauriPlatform } from "./lib/platform/tauri";
  import { createSettingsStore } from "./lib/stores/settings";
  import { createHistoryStore } from "./lib/stores/history";
  import { createModeStore, type Mode } from "./lib/stores/mode";
  import { loadAllScenes } from "./lib/scenes/SceneLoader";
  import type { LoadedScene } from "./lib/scenes/scene.types";
  import { tintNow } from "./lib/scenes/timeOfDay";
  import { createNotifier } from "./lib/notify/Notifier";
  import type { Settings } from "./lib/stores/settings.types";
  import FullScene from "./views/FullScene.svelte";
  import CompactCard from "./views/CompactCard.svelte";
  import SettingsDialog from "./views/SettingsDialog.svelte";
  import HistoryPanel from "./views/HistoryPanel.svelte";
  import chimeUrl from "./lib/assets/chime.wav?url";

  let ready = false;
  let settings: Awaited<ReturnType<typeof createSettingsStore>>;
  let history: Awaited<ReturnType<typeof createHistoryStore>>;
  let mode = createModeStore(tauriPlatform);
  let scenes: LoadedScene[] = [];
  let activeScene: LoadedScene | null = null;
  let snapshot: TimerSnapshot;
  let engine: TimerEngine;
  let durationMs = 25 * 60_000;
  let alertEvent: { id: number } | null = null;
  let showSettings = false;
  let showHistory = false;
  let chimeAudio: HTMLAudioElement;

  onMount(async () => {
    settings = await createSettingsStore(tauriPlatform);
    history = await createHistoryStore(tauriPlatform);
    scenes = await loadAllScenes(tauriPlatform);
    chimeAudio = new Audio(chimeUrl);

    const initial = get(settings);
    engine = new TimerEngine(initial.durations);
    durationMs = initial.durations.focus * 60_000;
    activeScene = scenes.find((sc) => sc.id === initial.scene.id) ?? scenes[0] ?? null;

    settings.subscribe((s: Settings) => {
      activeScene = scenes.find((sc) => sc.id === s.scene.id) ?? scenes[0] ?? null;
    });

    const notifier = createNotifier(tauriPlatform, settings, {
      onInAppAlert: (e) => (alertEvent = { id: e.endedAt }),
      playChime: () => {
        chimeAudio.currentTime = 0;
        void chimeAudio.play();
      },
    });

    engine.onPhaseEnded(async (event) => {
      await notifier.notifyPhaseEnd(event);
      if (event.completedPhase === "focus") {
        await history.appendFocusSession({ startedAt: event.startedAt, endedAt: event.endedAt });
      }
    });

    snapshot = engine.snapshot();
    ready = true;

    setInterval(() => {
      snapshot = engine.snapshot();
    }, 250);
  });

  const actions = {
    onStart: () => {
      engine.start();
      snapshot = engine.snapshot();
    },
    onPause: () => {
      engine.pause();
      snapshot = engine.snapshot();
    },
    onResume: () => {
      engine.resume();
      snapshot = engine.snapshot();
    },
    onSkip: () => {
      engine.skip();
      snapshot = engine.snapshot();
    },
    onExtend: () => {
      engine.extend(5);
      snapshot = engine.snapshot();
    },
    onReset: () => {
      engine.reset();
      snapshot = engine.snapshot();
    },
    onToggleMode: async () => {
      const next: Mode = $mode === "compact" ? "full" : "compact";
      await mode.setMode(next);
    },
    onOpenSettings: () => (showSettings = true),
    onOpenHistory: () => (showHistory = true),
  };

  $: tint = activeScene
    ? tintNow(
        activeScene.manifest.timeOfDay.mode === "tint"
          ? activeScene.manifest.timeOfDay.tints
          : { morning: "#ffffff", midday: "#ffffff", dusk: "#ffffff", night: "#000000" },
      )
    : "#000000";
</script>

{#if ready}
  {#if $mode === "compact"}
    <CompactCard
      {snapshot}
      {durationMs}
      sessionsPerLongBreak={$settings.durations.sessionsPerLongBreak}
      {actions}
    />
  {:else}
    <FullScene
      {snapshot}
      {durationMs}
      sessionsPerLongBreak={$settings.durations.sessionsPerLongBreak}
      scene={activeScene}
      {tint}
      {alertEvent}
      {actions}
    />
  {/if}

  {#if showSettings}
    <SettingsDialog {settings} {scenes} onClose={() => (showSettings = false)} />
  {/if}
  {#if showHistory}
    <HistoryPanel tallies={history} onClose={() => (showHistory = false)} />
  {/if}
{:else}
  <div style="display:grid;place-items:center;height:100vh;color:#8a8578;font-family:ui-rounded">
    Loading…
  </div>
{/if}
```

- [ ] **Step 3: Add Vite type declaration for the `.wav` import**

Create `src/vite-env.d.ts` (or extend if exists):

```ts
/// <reference types="svelte" />
/// <reference types="vite/client" />

declare module "*.wav" {
  const src: string;
  export default src;
}
```

- [ ] **Step 4: Run dev to verify the UI loads**

```bash
npm run tauri dev
```

Expected: the Tauri window opens. You may see "Loading…" briefly, then the FullScene placeholder with a wall clock. Buttons should work (start/pause/skip/extend/reset). Toggle compact mode — window should resize. Open settings; change focus duration; close; settings persist on restart.

Stop with Cmd-Q.

- [ ] **Step 5: Commit**

```bash
git add src/App.svelte src/vite-env.d.ts src/lib/assets/
git commit -m "feat(app): wire root composition with stores, engine, notifier"
```

---

## Task 25: Two placeholder bundled scenes

**Files:**

- Create: `scenes/cabin/scene.json`, `scenes/cabin/background.webp`, `scenes/cabin/preview.webp`
- Create: `scenes/cafe/scene.json`, `scenes/cafe/background.webp`, `scenes/cafe/preview.webp`

- [ ] **Step 1: Create `scenes/cabin/scene.json`**

```json
{
  "id": "cabin",
  "name": "Cozy Cabin",
  "author": "PomoBuddy",
  "license": "CC0-1.0",
  "version": 1,
  "layers": { "background": "background.webp" },
  "preview": "preview.webp",
  "clock": { "x": 0.78, "y": 0.22, "diameter": 0.18, "face": "warm-cream" },
  "phaseTag": { "x": 0.04, "y": 0.06 },
  "palette": { "primary": "#c97a5a", "accent": "#c9b78a", "ink": "#3a2f24" },
  "timeOfDay": {
    "mode": "tint",
    "tints": { "morning": "#f0c79a", "midday": "#ffffff", "dusk": "#c97a5a", "night": "#4a5868" }
  },
  "responsive": {
    "portrait": { "clock": { "x": 0.72, "y": 0.18, "diameter": 0.28 } }
  }
}
```

- [ ] **Step 2: Create `scenes/cafe/scene.json`**

```json
{
  "id": "cafe",
  "name": "Lofi Cafe",
  "author": "PomoBuddy",
  "license": "CC0-1.0",
  "version": 1,
  "layers": { "background": "background.webp" },
  "preview": "preview.webp",
  "clock": { "x": 0.22, "y": 0.18, "diameter": 0.16, "face": "warm-cream" },
  "phaseTag": { "x": 0.04, "y": 0.06 },
  "palette": { "primary": "#6c8a5e", "accent": "#c9b78a", "ink": "#2d3a2a" },
  "timeOfDay": {
    "mode": "tint",
    "tints": { "morning": "#f0c79a", "midday": "#ffffff", "dusk": "#d8a06c", "night": "#3a4452" }
  }
}
```

- [ ] **Step 3: Provide placeholder image assets**

For now, generate solid-color placeholder WebPs so the app loads cleanly. Real painted illustrations come from the AI-art prompt pipeline (separate task, post-v1 scaffold).

```bash
# If you have ImageMagick:
# magick -size 1600x1000 gradient:'#6b4533'-'#2a1d18' scenes/cabin/background.webp
# magick -size 320x200 gradient:'#6b4533'-'#2a1d18' scenes/cabin/preview.webp
# magick -size 1600x1000 gradient:'#8a6e4f'-'#3d2a1e' scenes/cafe/background.webp
# magick -size 320x200 gradient:'#8a6e4f'-'#3d2a1e' scenes/cafe/preview.webp
ls scenes/cabin/ scenes/cafe/
```

Confirm both folders contain `scene.json`, `background.webp`, `preview.webp`.

- [ ] **Step 4: Re-run the app and verify scenes load**

```bash
npm run tauri dev
```

Expected: Open Settings → Scene tab — both scenes appear in the grid. Pick cafe; window changes tint. Stop the app.

- [ ] **Step 5: Commit**

```bash
git add scenes/
git commit -m "feat(scenes): add cabin + cafe placeholder scene packs"
```

---

## Task 26: README, CONTRIBUTING, LICENSE, scene-pack docs

**Files:**

- Create: `README.md`, `LICENSE`, `CONTRIBUTING.md`, `docs/scene-pack-format.md`, `docs/release-checklist.md`

- [ ] **Step 1: Add MIT `LICENSE`**

Copy the standard MIT license text into `LICENSE` with copyright `Copyright (c) 2026 Ismael Florentino`.

- [ ] **Step 2: Write `README.md`**

````markdown
# PomoBuddy

A macOS Pomodoro timer with a painted lofi scene to keep you company. Two modes: a small compact card, and a full-window scene with a wall clock that counts down your focus session.

![PomoBuddy screenshot](docs/screenshots/full-mode.webp)

## Why

Most Pomodoro timers are utilitarian. PomoBuddy adds a calm, painted ambience — a quiet cabin or cafe — without becoming a distraction. Every action is one click; no menu diving.

## Features

- Compact mode + full painted-scene mode
- Wall-clock-accurate timer (survives sleep/wake)
- Configurable durations (default 25 / 5 / 15 with 4 sessions per long break)
- Skip, +5 min extend, reset
- Four notification channels (system banner, in-app overlay, audible chime, dock bounce) — each independently toggleable
- Menu bar countdown + always-on-top option
- Multiple scenes, user-extensible via `scene.json` packs
- Time-of-day cycle that tints the scene through the day
- Light history: today / this week tallies

## Install

Pre-built `.dmg` releases live on the [Releases page](https://github.com/ismaelffj/PomoBuddy/releases) (coming with v1.0).

## Build from source

Prereqs: Node 20+, Rust stable, Xcode command-line tools.

```bash
git clone https://github.com/ismaelffj/PomoBuddy
cd PomoBuddy
npm install
npm run tauri dev      # development
npm run tauri build    # produces .dmg in src-tauri/target/release/bundle/dmg
```
````

## Where your data lives

- Settings: `~/Library/Application Support/PomoBuddy/settings.json`
- Session history: `~/Library/Application Support/PomoBuddy/history.jsonl`
- Custom scenes: `~/Library/Application Support/PomoBuddy/scenes/`

**No sync, no cloud, no telemetry.** Everything stays on your machine.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the scene-pack contribution guide and dev setup.

## License

MIT — see [LICENSE](LICENSE).

````

- [ ] **Step 3: Write `CONTRIBUTING.md`**

```markdown
# Contributing to PomoBuddy

## Dev setup
- Node 20+
- Rust stable
- macOS (Xcode command-line tools)

```bash
npm install
npm run tauri dev
````

## Project structure

- `src/lib/` — TS units (timer, scenes, stores, platform, notify). One responsibility each.
- `src/views/` — Svelte components. Read stores, render. No business logic.
- `src-tauri/` — Rust shell. Thin: window mgmt, atomic FS, notifications.
- `scenes/` — bundled scene packs.

## Tests

- `npm test` — Vitest unit suite. Add tests for any new logic in `src/lib/`.
- `npm run check` — Svelte type check.
- `npm run lint` — ESLint + Prettier.
- `cargo check --manifest-path src-tauri/Cargo.toml` — Rust + capability check.

CI runs all four on every PR.

## Manual smoke checklist

See [docs/release-checklist.md](docs/release-checklist.md).

## Submitting a scene pack

1. Create a folder under your local `scenes/` (in this repo or in `~/Library/Application Support/PomoBuddy/scenes/`)
2. Add a `scene.json` matching the schema in [docs/scene-pack-format.md](docs/scene-pack-format.md)
3. Add `background.webp` and optionally `foreground.webp` + `preview.webp`
4. Test it loads in the app
5. Open a PR with the scene folder under `scenes/` and your name + license declared in the manifest

Accepted licenses for bundled scenes: CC0, CC-BY, MIT, or compatible permissive license. Credit the artist in the manifest's `author` field.

## Commit style

Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `test:`).

````

- [ ] **Step 4: Write `docs/scene-pack-format.md`**

```markdown
# Scene Pack Format

A scene pack is a folder containing one `scene.json` manifest plus image assets. PomoBuddy loads scenes from two roots at startup:

1. `scenes/` bundled with the app (built-in scenes)
2. `~/Library/Application Support/PomoBuddy/scenes/` (your custom scenes)

Drop a folder into either location and it appears in **Settings → Scene** on next launch.

## Folder layout

````

my-scene/
├── scene.json
├── background.webp ← required
├── foreground.webp ← optional (drawn over the character/desk area for depth)
└── preview.webp ← optional (320×200 thumbnail for the scene picker)

````

## Manifest schema

```json
{
  "id": "cabin",
  "name": "Cozy Cabin",
  "author": "Your Name",
  "license": "CC-BY-4.0",
  "version": 1,

  "layers": {
    "background": "background.webp",
    "foreground": "foreground.webp"
  },

  "preview": "preview.webp",

  "clock": {
    "x": 0.78,
    "y": 0.22,
    "diameter": 0.18,
    "face": "warm-cream"
  },

  "phaseTag": { "x": 0.04, "y": 0.06 },

  "palette": {
    "primary": "#c97a5a",
    "accent":  "#c9b78a",
    "ink":     "#3a2f24"
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
    "portrait": { "clock": { "x": 0.72, "y": 0.18, "diameter": 0.28 } }
  }
}
````

## Field reference

| Field                                       | Type                     | Required | Notes                                                              |
| ------------------------------------------- | ------------------------ | -------- | ------------------------------------------------------------------ |
| `id`                                        | string                   | yes      | Unique scene identifier. Use lowercase-with-hyphens.               |
| `name`                                      | string                   | yes      | Human-readable name shown in the picker.                           |
| `author`                                    | string                   | yes      | Credit displayed in app metadata.                                  |
| `license`                                   | string                   | yes      | SPDX identifier (e.g., `CC0-1.0`, `CC-BY-4.0`, `MIT`).             |
| `version`                                   | `1`                      | yes      | Schema version; only `1` is supported today.                       |
| `layers.background`                         | string                   | yes      | Relative path to the base image.                                   |
| `layers.foreground`                         | string                   | no       | Relative path to a foreground layer drawn over the character/desk. |
| `preview`                                   | string                   | no       | Relative path to a 320×200 (≈) thumbnail.                          |
| `clock`                                     | object                   | yes      | Position + face style for the wall clock overlay.                  |
| `clock.x` / `clock.y`                       | 0–1                      | yes      | Center of the clock as a fraction of canvas width/height.          |
| `clock.diameter`                            | 0–1                      | yes      | Clock diameter as a fraction of the shorter canvas axis.           |
| `clock.face`                                | string                   | yes      | Accent name; `warm-cream` is the default.                          |
| `phaseTag.x` / `phaseTag.y`                 | 0–1                      | yes      | Top-left position of the phase label pill.                         |
| `palette.{primary,accent,ink}`              | hex                      | yes      | Colors the UI samples for the clock arc and overlays.              |
| `timeOfDay.mode`                            | `"tint"` \| `"variants"` | yes      | See below.                                                         |
| `responsive.portrait` / `responsive.square` | object                   | no       | Aspect-specific overrides for `clock` position.                    |

### Coordinate system

All positions are **fractions (0–1)** of the canvas, not pixels. This lets the same manifest scale across window sizes.

- `x = 0` is the left edge, `x = 1` is the right edge.
- `y = 0` is the top, `y = 1` is the bottom.
- `diameter = 0.18` means the clock is 18% of the shorter canvas dimension.

### Time-of-day

Two modes:

- **`tint`** — the base image is unchanged; PomoBuddy overlays a color tint that smoothly interpolates between the four named anchors (morning 06:00, midday 12:00, dusk 18:00, night 00:00). Cheap, single image.
- **`variants`** — supply separate `morning.webp`, `midday.webp`, `dusk.webp`, `night.webp`. Higher fidelity, larger bundle.

```json
{
  "timeOfDay": {
    "mode": "variants",
    "variants": {
      "morning": "morning.webp",
      "midday": "midday.webp",
      "dusk": "dusk.webp",
      "night": "night.webp"
    }
  }
}
```

### Responsive overrides

When the window is portrait or square, you can shift the clock position so the composition still works:

```json
{
  "responsive": {
    "portrait": { "clock": { "x": 0.72, "y": 0.18, "diameter": 0.28 } }
  }
}
```

The closest match wins; landscape uses the base `clock`.

## Path-safety rules

User-supplied scenes are loaded with strict validation. A manifest is rejected (and its scene hidden from the picker) if any asset path:

- contains `..` (parent-directory traversal)
- is absolute (`/foo`, `C:\foo`, `file://...`, `http://...`)
- has an extension other than `.webp`, `.png`, `.jpg`, `.jpeg`
- has leading/trailing whitespace or is empty

Always use **relative paths inside the scene folder**.

## Submitting a scene to the main repo

1. Confirm the art is yours or under a license compatible with the repo (CC0, CC-BY, MIT, Apache-2.0).
2. Place the folder under `scenes/` in your fork.
3. Make sure `npm run tauri dev` loads the scene cleanly.
4. Run `npm test` — manifest validation tests must pass.
5. Open a PR with: a screenshot, the license declaration in the manifest, and credit in the PR description.

## Image guidelines

- **Resolution:** at least 1600×1000 for `background`. Higher is fine; the app downscales.
- **Format:** WebP recommended. PNG/JPG also accepted but larger.
- **Style:** painted/illustration. Avoid high-contrast vibrant colors — the goal is calm ambience.
- **Composition:** leave a clear area for the wall clock (`clock.x`, `clock.y`, `clock.diameter`). Avoid placing detailed elements in the bottom 12% of the canvas — that's where the button bar sits.
- **Foreground layer:** keep it sparse (a partial silhouette, plants, a frame) — anything thick will block the clock.

````

- [ ] **Step 5: Write `docs/release-checklist.md`**

```markdown
# Release smoke checklist

Before tagging a release, run through this list manually.

## Timer correctness
- [ ] Start a 1-minute focus session. After 1 min, all enabled notification channels fire.
- [ ] Pause mid-session, wait 30s, resume — remaining time is correct.
- [ ] Skip during a focus — no notification fires, no history entry logged, next phase loaded (idle).
- [ ] Extend (+5) during a focus — remaining increases by exactly 5 min.
- [ ] Reset during a phase — returns to idle, full duration restored, same phase.
- [ ] Sleep the Mac mid-session for ≥ 1 min, wake — remaining is correct, no drift.
- [ ] Complete a long-break cycle (sessionsPerLongBreak = 2 for speed) — phase order is focus → short → focus → long → focus, sessionIndex resets to 1.

## UI
- [ ] Compact mode: all controls visible, no overflow at default size.
- [ ] Full mode: scene background loads, wall clock visible, phase tag in top-left, button bar at bottom.
- [ ] Window resizes work (drag corner, then toggle compact ↔ full).
- [ ] Portrait/half-screen aspect ratio doesn't break layout.

## Persistence
- [ ] Change focus duration to 30 min, quit app, relaunch — setting persisted.
- [ ] Complete a focus session, open History — counters incremented.
- [ ] Corrupt `settings.json` by hand (insert garbage), relaunch — app loads defaults, `.bak` written.

## Notifications
- [ ] Banner permission prompt appears on first enable; denying keeps toggle off.
- [ ] Each channel toggle independently fires/silences as expected.

## Scenes
- [ ] Drop a folder with a valid `scene.json` into `~/Library/Application Support/PomoBuddy/scenes/` — appears in Settings → Scene.
- [ ] Drop a folder with `scene.json` containing `"../escape.webp"` — does NOT appear in the picker; warning logged.
````

- [ ] **Step 6: Commit**

```bash
git add README.md LICENSE CONTRIBUTING.md docs/
git commit -m "docs: README, CONTRIBUTING, LICENSE, scene-pack format, release checklist"
```

---

## Self-review checklist (run before declaring the plan ready)

After all 26 tasks complete:

- [ ] `npm test` passes — all 30+ unit tests green
- [ ] `npm run check` passes
- [ ] `npm run lint` passes
- [ ] `cargo check --manifest-path src-tauri/Cargo.toml` passes
- [ ] `npm run tauri dev` launches the app and the entire release checklist (`docs/release-checklist.md`) is checked off
- [ ] `npm run tauri build` produces a `.dmg` in `src-tauri/target/release/bundle/dmg/`
- [ ] Git log on `main` shows ~26 well-scoped commits

If everything passes: ready to tag `v0.1.0` and push to GitHub.

## Spec coverage map

| Spec §                                          | Implemented in task                                                    |
| ----------------------------------------------- | ---------------------------------------------------------------------- |
| §3.1 Timer behavior                             | Tasks 4–7                                                              |
| §3.2 Modes                                      | Tasks 17, 20, 21                                                       |
| §3.3 Scenes                                     | Tasks 8–10, 15, 25                                                     |
| §3.4 Phase-end alert                            | Task 16                                                                |
| §3.5 Window behavior                            | Tasks 11, 17, 22                                                       |
| §3.6 History                                    | Tasks 14, 23                                                           |
| §4 Architecture                                 | All tasks (top-level shape)                                            |
| §5 Repo layout                                  | Established by Tasks 1, 2                                              |
| §6 Scene-pack format                            | Tasks 8, 9, 26                                                         |
| §6.3 Security                                   | Tasks 2 (capability scope), 9 (path validator), 15 (loader uses it)    |
| §7 Core components                              | Tasks 5–7, 11–17                                                       |
| §8 Data flow                                    | Task 24 wires it                                                       |
| §9 Persistence                                  | Task 12 (Rust commands), 13–14 (stores)                                |
| §10 Testing                                     | Embedded in each TDD task; CI from Task 3                              |
| §11 Risks (asset quality, Tauri/Svelte newness) | Mitigated by placeholder scenes (Task 25) and version-pinning (Task 1) |
| §12 v1 scope checklist                          | All boxes covered by Tasks 1–26                                        |
