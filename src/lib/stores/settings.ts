import { writable, type Writable } from "svelte/store";
import type { Platform } from "../platform/platform.types";
import { defaultSettings, settingsSchema, type Settings } from "./settings.types";

interface Options {
  debounceMs?: number;
}

export async function createSettingsStore(
  platform: Platform,
  options: Options = {},
): Promise<Writable<Settings>> {
  const debounceMs = options.debounceMs ?? 500;
  const initial = await loadInitial(platform);
  const store = writable<Settings>(initial);

  let firstEmit = true;
  let pending: ReturnType<typeof setTimeout> | null = null;
  store.subscribe((value) => {
    if (firstEmit) {
      firstEmit = false;
      return;
    }
    if (pending) clearTimeout(pending);
    pending = setTimeout(() => {
      void platform.writeSettingsAtomic(JSON.stringify(value, null, 2));
    }, debounceMs);
  });

  return store;
}

async function loadInitial(platform: Platform): Promise<Settings> {
  try {
    const path = `${await platform.appDataDir()}/settings.json`;
    const raw = await platform.readTextFile(path);
    const parsed = JSON.parse(raw);
    return settingsSchema.parse(parsed);
  } catch (err) {
    console.warn("[settings] using defaults:", err);
    return defaultSettings;
  }
}
