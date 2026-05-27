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
    const { license: _license, ...bad } = valid;
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
