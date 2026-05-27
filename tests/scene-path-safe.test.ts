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
    ["scene.svg", true, "svg allowed (animated lofi scenes)"],
    ["bg.gif", false, "gif not in allowlist"],
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
