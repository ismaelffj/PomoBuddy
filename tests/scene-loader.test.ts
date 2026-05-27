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

const unsafeManifest = {
  ...validManifest,
  layers: { background: "../escape.webp" },
};

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
  };
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
