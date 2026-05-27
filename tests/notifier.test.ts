import { describe, it, expect, vi } from "vitest";
import { writable } from "svelte/store";
import { createNotifier } from "../src/lib/notify/Notifier";
import type { Settings } from "../src/lib/stores/settings.types";
import { defaultSettings } from "../src/lib/stores/settings.types";
import type { Platform } from "../src/lib/platform/platform.types";

function fakePlatform() {
  return {
    sendNotification: vi.fn().mockResolvedValue(undefined),
    notificationsPermitted: vi.fn().mockResolvedValue(true),
    requestNotificationPermission: vi.fn().mockResolvedValue(true),
    requestUserAttentionCritical: vi.fn().mockResolvedValue(undefined),
    appDataDir: async () => "",
    resourceDir: async () => "",
    readTextFile: async () => "",
    readDir: async () => [],
    writeSettingsAtomic: async () => {},
    appendHistoryLine: async () => {},
    readHistoryFile: async () => "",
    toAssetUrl: () => "",
    setWindowSize: async () => {},
    setAlwaysOnTop: async () => {},
  } as unknown as Platform & {
    sendNotification: ReturnType<typeof vi.fn>;
    requestUserAttentionCritical: ReturnType<typeof vi.fn>;
  };
}

function settingsStore(overrides: Partial<Settings["notifications"]> = {}) {
  return writable<Settings>({
    ...defaultSettings,
    notifications: { ...defaultSettings.notifications, ...overrides },
  });
}

const event = {
  completedPhase: "focus" as const,
  nextPhase: "shortBreak" as const,
  natural: true as const,
  startedAt: Date.now() - 25 * 60_000,
  endedAt: Date.now(),
  sessionIndex: 1,
};

describe("Notifier", () => {
  it("fires enabled channels", async () => {
    const platform = fakePlatform();
    const inApp = vi.fn();
    const chime = vi.fn();
    const notifier = createNotifier(platform, settingsStore(), {
      onInAppAlert: inApp,
      playChime: chime,
    });
    await notifier.notifyPhaseEnd(event);
    expect(platform.sendNotification).toHaveBeenCalledTimes(1);
    expect(inApp).toHaveBeenCalledTimes(1);
    expect(chime).toHaveBeenCalledTimes(1);
    expect(platform.requestUserAttentionCritical).not.toHaveBeenCalled();
  });

  it("does NOT fire any channel that is disabled", async () => {
    const platform = fakePlatform();
    const inApp = vi.fn();
    const chime = vi.fn();
    const notifier = createNotifier(
      platform,
      settingsStore({ banner: false, inApp: false, chime: false, dockBounce: false }),
      { onInAppAlert: inApp, playChime: chime },
    );
    await notifier.notifyPhaseEnd(event);
    expect(platform.sendNotification).not.toHaveBeenCalled();
    expect(inApp).not.toHaveBeenCalled();
    expect(chime).not.toHaveBeenCalled();
    expect(platform.requestUserAttentionCritical).not.toHaveBeenCalled();
  });

  it("fires dock bounce when enabled", async () => {
    const platform = fakePlatform();
    const notifier = createNotifier(
      platform,
      settingsStore({ banner: false, inApp: false, chime: false, dockBounce: true }),
      { onInAppAlert: vi.fn(), playChime: vi.fn() },
    );
    await notifier.notifyPhaseEnd(event);
    expect(platform.requestUserAttentionCritical).toHaveBeenCalledTimes(1);
  });
});
