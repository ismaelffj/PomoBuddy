# Scene Art Prompts (v1 cabin + cafe)

Prompts to generate the v1 bundled scene art in ChatGPT / DALL-E. Each scene's
`scene.json` already pins the composition constraints (clock location, palette,
button-bar safe zone) — these prompts are written to match.

## Style guide (apply to every PomoBuddy scene)

Keep all scenes feeling like one set by holding these constant:

- **Aesthetic:** Studio-Ghibli-adjacent painted illustration. Soft visible
  brushwork, hand-rendered look, gentle gradients, no airbrushed plastic.
  Reference: lofi hip-hop YouTube cover art from the late 2020s.
- **Palette discipline:** muted, warm, earthy. **No vivid colors, no neon,
  no saturated red/blue/yellow.** Think dusty terracotta, cream, sage,
  warm wood, dusk slate. Low contrast.
- **Light:** one warm interior light source + cooler outdoor light through a
  window. The interior should glow.
- **Character:** a single character at work — reading, writing, or sketching.
  Render them slightly stylized (Ghibli-anime adjacent), not photorealistic.
  Headphones encouraged. Face can be subtle / partially turned away.
- **Mood:** quiet, focused, slightly melancholic but warm. Solo work, not
  loneliness.
- **Composition discipline:**
  - **Aspect ratio: 16:10 landscape** (target 1600×1000).
  - **Leave the bottom ~12% calm and uncluttered** — the button bar overlays here.
  - **Leave one specific wall area clear** for the wall clock (per scene).
  - Don't paint a clock on the wall yourself — PomoBuddy draws the timer clock
    over the image.
- **Don't include:** text/letters, UI elements, vivid neon, harsh shadows,
  futuristic tech, anime fan-service tropes, dramatic poses, watermarks.

---

## Scene 1 — Cabin

**Clock space to reserve:** upper-right wall area, roughly **18% of canvas
size, centered around 78% width / 22% height**. Keep this patch of wall
plain (or with very subtle texture only).

**Output target:** `scenes/cabin/background.png`, 1600×1000.

### Prompt (paste into DALL-E)

> A cozy wooden cabin interior at dusk, hand-painted Ghibli-style illustration.
> A character sits at a wooden desk in the lower-center of the frame, reading
> with their head slightly bowed — wearing soft headphones, a knit sweater,
> warm lamplight on their face. The desk holds a stack of three leather-bound
> books, an open notebook, a steaming ceramic mug, and a small brass desk lamp
> with a warm glow. To the left, a window showing pine trees outside in soft
> evening light, with gentle rain streaks. Wooden plank walls, a worn rug on
> the floor, a small radio on a shelf. Warm interior palette: terracotta
> accents (#c97a5a), cream walls (#a89678), deep walnut wood (#3a2f24),
> dusty cream highlights (#c9b78a). Cool dusk blue through the window.
>
> **Critical composition rule:** Keep the upper-right portion of the wall
> completely clear and plain — empty wood paneling or cream wall, no
> furniture, no shelves, no decoration in that area. This space will be
> covered by an overlay element later. Don't paint any clocks anywhere in
> the image.
>
> Bottom 12% of the canvas should be calm and free of detailed elements —
> just floor or a low desk edge.
>
> Style: soft painterly brushwork, gentle gradients, muted palette, no harsh
> outlines, no vivid colors, no text, no UI elements. Aspect ratio 16:10
> landscape.

---

## Scene 2 — Cafe

**Clock space to reserve:** upper-LEFT wall area, roughly **16% of canvas
size, centered around 22% width / 18% height**. Plain wall here.

**Output target:** `scenes/cafe/background.png`, 1600×1000.

### Prompt (paste into DALL-E)

> A small cozy cafe interior in the golden hour, hand-painted Ghibli-style
> illustration. A character sits at a round wooden table just right of
> center, wearing headphones and a chunky sweater (sage green or warm
> rust), reading a book or sketching. Two-tone interior: soft sage-green
> wainscoting below, warm exposed brick above. A large window on the right
> side floods the room with warm afternoon light, showing a quiet European
> street outside with distant building silhouettes. Shelves with potted
> plants and ceramic jars. A second empty chair across the table. A small
> ceramic coffee cup and a leather-bound notebook on the table, a backpack
> resting against the chair.
>
> Palette: muted sage green (#6c8a5e), warm cream highlights (#c9b78a),
> dark forest-green ink shadows (#2d3a2a), warm wood and weathered brick
> browns, golden afternoon sunlight pooling on the floor.
>
> **Critical composition rule:** Keep the upper-LEFT portion of the wall
> (above and behind the character's left shoulder) completely clear and
> plain — just brick texture or wall, no posters, no shelves, no
> decoration in that area. This space will be covered by an overlay
> element later. Don't paint any clocks anywhere.
>
> Bottom 12% of the canvas should be calm — just floor or a low table edge.
>
> Style: soft painterly brushwork, gentle gradients, muted palette, no harsh
> outlines, no vivid colors, no text, no UI elements, no menu boards.
> Aspect ratio 16:10 landscape.

---

## Workflow: getting the images into the app

1. **Generate** with the prompt above. Expect 2–4 iterations before the
   composition is right — the clock-area cleanliness is the part DALL-E
   tends to fudge. If the upper-right (cabin) or upper-left (cafe) wall has
   shelves or decoration, re-prompt with "the upper-right wall must be
   completely empty" and emphasize.

2. **Sanity check the composition** by mentally overlaying:
   - Cabin: a circle ~18% of canvas wide, centered around 78%/22% — is that
     space clean wall?
   - Cafe: a circle ~16% of canvas wide, centered around 22%/18% — same
     question.
   - Bottom ~12% strip: free of important detail?

3. **Resize/crop to 1600×1000** if the model output is different
   dimensions:

   ```bash
   # macOS built-in (sips):
   sips -z 1000 1600 source.png --out scenes/cabin/background.png
   ```

4. **Make a 320×200 preview thumbnail** from the same image:

   ```bash
   sips -z 200 320 scenes/cabin/background.png --out scenes/cabin/preview.png
   ```

5. **(Optional) Convert to WebP** for smaller bundle size:

   ```bash
   # If cwebp installed: cwebp -q 85 background.png -o background.webp
   # Then update scene.json: "background": "background.webp"
   ```

   PNG works fine — keep PNG if you don't already have cwebp.

6. **Reload the app** with `npm run tauri dev` and pick the scene from
   Settings → Scene to verify it looks right with the wall clock overlaid
   on the reserved area.

7. **Iterate** if the clock obscures something important or the composition
   feels off. The clock position can be nudged in `scene.json` (`clock.x`,
   `clock.y`, `clock.diameter`) — small adjustments are fine.

8. **Commit** the new images:
   ```bash
   git add scenes/cabin/background.png scenes/cabin/preview.png
   git commit -m "feat(scenes): add painted cabin scene art"
   ```

---

## Tips & gotchas

- **DALL-E often paints clocks even when told not to.** If it sneaks one
  in, re-prompt with "absolutely no clocks of any kind, no clock faces,
  no analog clocks, no digital clocks anywhere in the scene."
- **Avoid character faces** that read as photorealistic — that breaks the
  painted ambience. If a face looks too realistic, re-prompt with "face
  turned slightly away" or "back of head visible."
- **Iterate on light, not detail.** A cleaner, simpler painting beats a
  busy one. The wall clock + button bar will add visual interest on top.
- **Match across scenes.** Once one scene's lighting/saturation looks
  right, reference it explicitly in subsequent prompts: "Same painted
  style and warm palette as the cabin scene we generated earlier."
