import { describe, it, expect } from "vitest";
import { tintForHour } from "../src/lib/scenes/timeOfDay";

const tints = {
  morning: "#ff0000",
  midday: "#00ff00",
  dusk: "#0000ff",
  night: "#000000",
};

describe("tintForHour", () => {
  it("returns morning at 06:00 exactly", () => {
    expect(tintForHour(6, tints)).toBe("#ff0000");
  });

  it("returns midday at 12:00 exactly", () => {
    expect(tintForHour(12, tints)).toBe("#00ff00");
  });

  it("interpolates between morning and midday at 09:00 (midpoint)", () => {
    expect(tintForHour(9, tints).toLowerCase()).toBe("#808000");
  });

  it("wraps at 03:00 (between night and morning)", () => {
    expect(tintForHour(3, tints).toLowerCase()).toBe("#800000");
  });
});
