# Contributing to PomoBuddy

Thanks for taking a look. PomoBuddy is a small, deliberate app — contributions are welcome
but please keep changes scoped and aligned with the design intent (see
[docs/superpowers/specs/2026-05-26-pomobuddy-design.md](docs/superpowers/specs/2026-05-26-pomobuddy-design.md)).

## Dev setup

Prerequisites: Node 20+, Rust stable, Xcode command-line tools (macOS).

```bash
npm install
npm run tauri dev
```

## Project structure

- `src/lib/` — TypeScript units. One responsibility each, easy to test in isolation:
  - `timer/` — pure logic, no DOM, no Tauri
  - `scenes/` — manifest schema, path-safety, time-of-day tints, scene loader
  - `stores/` — reactive Svelte stores (settings, history, mode)
  - `platform/` — thin Tauri wrapper, stubbable for the future web build
  - `notify/` — routes phase-end to enabled notification channels
- `src/views/` — Svelte components. Read stores, render. No business logic.
- `src-tauri/` — Rust shell. Thin: window mgmt, atomic FS commands, notifications.
- `scenes/` — bundled scene packs (the ones the app ships with).
- `tests/` — Vitest unit tests for the logic units.
- `docs/` — scene-pack format reference, release checklist, design spec, plan.

## Verifying changes

```bash
npm test                                          # Vitest
npm run check                                     # svelte-check (type-check)
npm run lint                                      # ESLint + Prettier
cargo check --manifest-path src-tauri/Cargo.toml  # Rust + Tauri capabilities
```

CI runs all four on every PR (see [.github/workflows/ci.yml](.github/workflows/ci.yml)).

Before tagging a release, run through the
[release smoke checklist](docs/release-checklist.md) manually.

## Submitting a scene pack

This is the easiest way to contribute.

1. Create a folder under `scenes/` (or under `~/Library/Application Support/PomoBuddy/scenes/`
   to test locally without modifying the repo).
2. Add a `scene.json` matching the schema in
   [docs/scene-pack-format.md](docs/scene-pack-format.md).
3. Add `background.webp` (or `.png`/`.jpg`) and optionally `foreground.webp` and `preview.webp`.
4. Confirm it loads with `npm run tauri dev` and appears in **Settings → Scene**.
5. Open a PR with the scene folder under `scenes/`. Include in the PR description:
   - A screenshot of the scene in the app
   - Confirmation the license declared in `scene.json` is yours to grant
   - Credit for the artist if applicable

Accepted licenses for bundled scenes: **CC0, CC-BY, MIT, Apache-2.0**, or compatible
permissive license.

## Submitting a code change

1. Discuss non-trivial changes in an issue first — the design spec is intentionally tight
   and most additions need a conversation.
2. Follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`,
   `docs:`, `chore:`, `test:`, `ci:`).
3. Add tests for any new logic in `src/lib/`. Views don't need automated tests — they're
   covered by the manual smoke checklist.
4. Keep changes focused. If you spot something else worth fixing, open a separate PR.
