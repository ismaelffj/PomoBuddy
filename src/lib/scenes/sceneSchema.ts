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
