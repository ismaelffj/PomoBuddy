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
