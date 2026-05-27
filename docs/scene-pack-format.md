# Scene Pack Format

A scene pack is a folder containing one `scene.json` manifest plus image assets.
PomoBuddy loads scenes from two roots at startup:

1. `scenes/` bundled with the app (built-in scenes)
2. `~/Library/Application Support/PomoBuddy/scenes/` (your custom scenes)

Drop a folder into either location and it appears in **Settings → Scene** on next launch.

## Folder layout

```
my-scene/
├── scene.json
├── background.webp     ← required
├── foreground.webp     ← optional (drawn over the character/desk area for depth)
└── preview.webp        ← optional (320×200 thumbnail for the scene picker)
```

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
    "accent": "#c9b78a",
    "ink": "#3a2f24"
  },

  "timeOfDay": {
    "mode": "tint",
    "tints": {
      "morning": "#f0c79a",
      "midday": "#ffffff",
      "dusk": "#c97a5a",
      "night": "#4a5868"
    }
  },

  "responsive": {
    "portrait": { "clock": { "x": 0.72, "y": 0.18, "diameter": 0.28 } }
  }
}
```

## Field reference

| Field                          | Type                     | Required | Notes                                                                   |
| ------------------------------ | ------------------------ | -------- | ----------------------------------------------------------------------- |
| `id`                           | string                   | yes      | Unique scene identifier. Use lowercase-with-hyphens.                    |
| `name`                         | string                   | yes      | Human-readable name shown in the picker.                                |
| `author`                       | string                   | yes      | Credit displayed in app metadata.                                       |
| `license`                      | string                   | yes      | SPDX identifier (e.g., `CC0-1.0`, `CC-BY-4.0`, `MIT`).                  |
| `version`                      | `1`                      | yes      | Schema version; only `1` is supported today.                            |
| `layers.background`            | string                   | yes      | Relative path to the base image.                                        |
| `layers.foreground`            | string                   | no       | Relative path to a foreground layer drawn over the character/desk.      |
| `preview`                      | string                   | no       | Relative path to a 320×200 (≈) thumbnail for the picker.                |
| `clock`                        | object                   | yes      | Position + face style for the wall clock overlay.                       |
| `clock.x` / `clock.y`          | 0–1                      | yes      | Center of the clock as a fraction of canvas width/height.               |
| `clock.diameter`               | 0–1                      | yes      | Clock diameter as a fraction of the shorter canvas axis.                |
| `clock.face`                   | string                   | yes      | Accent name; `warm-cream` is the default.                               |
| `phaseTag.x` / `phaseTag.y`    | 0–1                      | yes      | Top-left position of the phase label pill.                              |
| `palette.{primary,accent,ink}` | hex                      | yes      | Colors the UI samples for the clock arc and overlays.                   |
| `timeOfDay.mode`               | `"tint"` \| `"variants"` | yes      | See below.                                                              |
| `responsive.portrait`          | object                   | no       | Aspect-specific overrides for `clock` position when window is portrait. |

### Coordinate system

All positions are **fractions (0–1)** of the canvas, not pixels. This lets the same manifest
scale across window sizes.

- `x = 0` is the left edge, `x = 1` is the right edge.
- `y = 0` is the top, `y = 1` is the bottom.
- `diameter = 0.18` means the clock is 18% of the shorter canvas dimension.

### Time-of-day

Two modes:

- **`tint`** — the base image is unchanged; PomoBuddy overlays a color tint that smoothly
  interpolates between the four named anchors (morning 06:00, midday 12:00, dusk 18:00,
  night 00:00). Cheap, single image.
- **`variants`** — supply separate `morning.webp`, `midday.webp`, `dusk.webp`, `night.webp`.
  Higher fidelity, larger bundle.

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

When the window is portrait or square, you can shift the clock position so the composition
still works:

```json
{
  "responsive": {
    "portrait": { "clock": { "x": 0.72, "y": 0.18, "diameter": 0.28 } }
  }
}
```

The closest match wins; landscape uses the base `clock`.

## Path-safety rules

User-supplied scenes are loaded with strict validation. A manifest is rejected (and its
scene hidden from the picker) if any asset path:

- contains `..` (parent-directory traversal)
- is absolute (`/foo`, `C:\foo`, `file://...`, `http://...`)
- has an extension other than `.webp`, `.png`, `.jpg`, `.jpeg`
- has leading/trailing whitespace or is empty

Always use **relative paths inside the scene folder**.

Tauri's asset protocol is configured with a narrow scope (`app.security.assetProtocol.scope`)
covering only the bundled `scenes/` and user `scenes/` roots. Even if a manifest tried to
reference paths outside those, they would not load.

## Image guidelines

- **Resolution:** at least 1600×1000 for `background`. Higher is fine; the app downscales.
- **Format:** WebP recommended. PNG/JPG also accepted but larger.
- **Style:** painted/illustration. Avoid high-contrast vibrant colors — the goal is calm
  ambience.
- **Composition:** leave a clear area for the wall clock (`clock.x`, `clock.y`,
  `clock.diameter`). Avoid placing detailed elements in the bottom 12% of the canvas —
  that's where the button bar sits.
- **Foreground layer:** keep it sparse (a partial silhouette, plants, a frame) — anything
  thick will block the clock.

## Submitting a scene to the main repo

1. Confirm the art is yours or under a license compatible with the repo (CC0, CC-BY, MIT,
   Apache-2.0).
2. Place the folder under `scenes/` in your fork.
3. Make sure `npm run tauri dev` loads the scene cleanly.
4. Run `npm test` — manifest validation tests must pass.
5. Open a PR with a screenshot, the license declaration in the manifest, and credit in the
   PR description.
