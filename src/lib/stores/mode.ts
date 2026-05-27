import { writable } from "svelte/store";
import type { Platform } from "../platform/platform.types";

export type Mode = "compact" | "full";

const COMPACT_SIZE = { width: 320, height: 200 };
const DEFAULT_FULL_SIZE = { width: 900, height: 600 };

export function createModeStore(platform: Platform) {
  const store = writable<Mode>("full");
  let lastFullSize = DEFAULT_FULL_SIZE;

  return {
    subscribe: store.subscribe,
    async setMode(mode: Mode) {
      if (mode === "compact") {
        await platform.setWindowSize(COMPACT_SIZE.width, COMPACT_SIZE.height);
      } else {
        await platform.setWindowSize(lastFullSize.width, lastFullSize.height);
      }
      store.set(mode);
    },
    rememberFullSize(width: number, height: number) {
      lastFullSize = { width, height };
    },
  };
}
