import { describe, it, expect } from "vitest";
import { get } from "svelte/store";
import { createSettingsStore } from "../src/lib/stores/settings";
import { defaultSettings } from "../src/lib/stores/settings.types";
import type { Platform } from "../src/lib/platform/platform.types";

interface MockPlatform extends Platform {
  __writes: string[];
}

function makePlatform(initial?: string): MockPlatform {
  const writes: string[] = [];
  let stored = initial;
  return {
    appDataDir: async () => "/app",
    resourceDir: async () => "/res",
    loadScenes: async () => [],
    readTextFile: async () => {
      if (stored === undefined) throw new Error("ENOENT");
      return stored;
    },
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
    __writes: writes,
  };
}

describe("SettingsStore", () => {
  it("loads defaults when no file exists", async () => {
    const platform = makePlatform();
    const store = await createSettingsStore(platform);
    expect(get(store)).toEqual(defaultSettings);
  });

  it("loads existing settings file", async () => {
    const custom = {
      ...defaultSettings,
      durations: { ...defaultSettings.durations, focus: 50 },
    };
    const platform = makePlatform(JSON.stringify(custom));
    const store = await createSettingsStore(platform);
    expect(get(store).durations.focus).toBe(50);
  });

  it("persists on update via writeSettingsAtomic", async () => {
    const platform = makePlatform();
    const store = await createSettingsStore(platform, { debounceMs: 0 });
    store.update((s) => ({
      ...s,
      durations: { ...s.durations, focus: 30 },
    }));
    await new Promise((r) => setTimeout(r, 10));
    expect(platform.__writes.length).toBeGreaterThan(0);
    const written = JSON.parse(platform.__writes.at(-1)!);
    expect(written.durations.focus).toBe(30);
  });

  it("falls back to defaults on corrupt file", async () => {
    const platform = makePlatform("{not valid json");
    const store = await createSettingsStore(platform);
    expect(get(store)).toEqual(defaultSettings);
  });
});
