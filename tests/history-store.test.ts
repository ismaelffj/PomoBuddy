import { describe, it, expect } from "vitest";
import { get } from "svelte/store";
import { createHistoryStore } from "../src/lib/stores/history";
import type { Platform } from "../src/lib/platform/platform.types";

function platformWithHistory(initial: string): Platform {
  let file = initial;
  return {
    appDataDir: async () => "/app",
    resourceDir: async () => "/res",
    getSceneRoots: async () => ["/res/scenes", "/app/scenes"],
    readTextFile: async () => "",
    readDir: async () => [],
    writeSettingsAtomic: async () => {},
    appendHistoryLine: async (line) => {
      file += line.endsWith("\n") ? line : line + "\n";
    },
    readHistoryFile: async () => file,
    toAssetUrl: (p) => p,
    setWindowSize: async () => {},
    setAlwaysOnTop: async () => {},
    requestUserAttentionCritical: async () => {},
    sendNotification: async () => {},
    notificationsPermitted: async () => true,
    requestNotificationPermission: async () => true,
  };
}

const focusEntry = (endedAt: number) =>
  JSON.stringify({
    id: `id-${endedAt}`,
    phase: "focus",
    startedAt: endedAt - 25 * 60_000,
    endedAt,
    completed: true,
  });

describe("HistoryStore", () => {
  it("returns zero tallies for empty history", async () => {
    const p = platformWithHistory("");
    const store = await createHistoryStore(p, () => new Date("2026-05-26T12:00:00").getTime());
    expect(get(store)).toEqual({ today: 0, thisWeek: 0, weekFocusMinutes: 0 });
  });

  it("tolerates a truncated final line", async () => {
    const file = [focusEntry(new Date("2026-05-26T10:00:00").getTime()), "{not valid json"].join(
      "\n",
    );
    const p = platformWithHistory(file);
    const store = await createHistoryStore(p, () => new Date("2026-05-26T12:00:00").getTime());
    expect(get(store).today).toBe(1);
  });

  it("appends and updates tallies", async () => {
    const p = platformWithHistory("");
    const store = await createHistoryStore(p, () => new Date("2026-05-26T12:00:00").getTime());
    await store.appendFocusSession({
      startedAt: new Date("2026-05-26T10:00:00").getTime(),
      endedAt: new Date("2026-05-26T10:25:00").getTime(),
    });
    expect(get(store).today).toBe(1);
    expect(get(store).weekFocusMinutes).toBe(25);
  });
});
