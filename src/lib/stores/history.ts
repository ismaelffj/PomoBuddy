import { writable, type Readable } from "svelte/store";
import type { Platform } from "../platform/platform.types";

export interface HistoryEntry {
  id: string;
  phase: "focus";
  startedAt: number;
  endedAt: number;
  completed: true;
}

export interface Tallies {
  today: number;
  thisWeek: number;
  weekFocusMinutes: number;
}

export interface HistoryStore extends Readable<Tallies> {
  appendFocusSession(args: { startedAt: number; endedAt: number }): Promise<void>;
}

export async function createHistoryStore(
  platform: Platform,
  now: () => number = () => Date.now(),
): Promise<HistoryStore> {
  const entries = parseHistory(await platform.readHistoryFile());
  const inner = writable<Tallies>(computeTallies(entries, now()));

  return {
    subscribe: inner.subscribe,
    async appendFocusSession({ startedAt, endedAt }) {
      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        phase: "focus",
        startedAt,
        endedAt,
        completed: true,
      };
      await platform.appendHistoryLine(JSON.stringify(entry));
      entries.push(entry);
      inner.set(computeTallies(entries, now()));
    },
  };
}

function parseHistory(raw: string): HistoryEntry[] {
  if (!raw) return [];
  const out: HistoryEntry[] = [];
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (obj && obj.phase === "focus" && typeof obj.endedAt === "number") {
        out.push(obj as HistoryEntry);
      }
    } catch {
      console.warn("[history] skipping unparseable line");
    }
  }
  return out;
}

function computeTallies(entries: HistoryEntry[], now: number): Tallies {
  const start = startOfDay(now);
  const weekStart = startOfWeek(now);
  let today = 0;
  let thisWeek = 0;
  let weekMs = 0;
  for (const e of entries) {
    if (e.endedAt >= start) today += 1;
    if (e.endedAt >= weekStart) {
      thisWeek += 1;
      weekMs += e.endedAt - e.startedAt;
    }
  }
  return { today, thisWeek, weekFocusMinutes: Math.round(weekMs / 60_000) };
}

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function startOfWeek(ts: number): number {
  const d = new Date(ts);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
