<script lang="ts">
  import { onMount } from "svelte";
  import { get, type Writable } from "svelte/store";
  import { TimerEngine } from "./lib/timer/TimerEngine";
  import type { TimerSnapshot } from "./lib/timer/timer.types";
  import { tauriPlatform } from "./lib/platform/tauri";
  import { createSettingsStore } from "./lib/stores/settings";
  import { createHistoryStore, type HistoryStore } from "./lib/stores/history";
  import { createModeStore, type Mode } from "./lib/stores/mode";
  import { loadAllScenes } from "./lib/scenes/SceneLoader";
  import type { LoadedScene } from "./lib/scenes/scene.types";
  import { tintNow } from "./lib/scenes/timeOfDay";
  import { createNotifier } from "./lib/notify/Notifier";
  import type { Settings } from "./lib/stores/settings.types";
  import FullScene from "./views/FullScene.svelte";
  import CompactCard from "./views/CompactCard.svelte";
  import SettingsDialog from "./views/SettingsDialog.svelte";
  import HistoryPanel from "./views/HistoryPanel.svelte";
  import chimeUrl from "./lib/assets/chime.wav?url";

  let ready = false;
  let settings: Writable<Settings>;
  let history: HistoryStore;
  const mode = createModeStore(tauriPlatform);
  let scenes: LoadedScene[] = [];
  let activeScene: LoadedScene | null = null;
  let snapshot: TimerSnapshot = {
    runState: "idle",
    phase: "focus",
    remainingMs: 25 * 60_000,
    sessionIndex: 1,
  };
  let engine: TimerEngine;
  let durationMs = 25 * 60_000;
  let alertEvent: { id: number } | null = null;
  let showSettings = false;
  let showHistory = false;
  let chimeAudio: HTMLAudioElement;

  onMount(async () => {
    settings = await createSettingsStore(tauriPlatform);
    history = await createHistoryStore(tauriPlatform);
    scenes = await loadAllScenes(tauriPlatform);
    chimeAudio = new Audio(chimeUrl);

    const initial = get(settings);
    engine = new TimerEngine(initial.durations);
    durationMs = initial.durations.focus * 60_000;
    activeScene = scenes.find((sc) => sc.id === initial.scene.id) ?? scenes[0] ?? null;

    settings.subscribe((s: Settings) => {
      activeScene = scenes.find((sc) => sc.id === s.scene.id) ?? scenes[0] ?? null;
      durationMs = durationForPhase(snapshot.phase, s);
    });

    const notifier = createNotifier(tauriPlatform, settings, {
      onInAppAlert: (e) => (alertEvent = { id: e.endedAt }),
      playChime: () => {
        chimeAudio.currentTime = 0;
        void chimeAudio.play().catch(() => {});
      },
    });

    engine.onPhaseEnded(async (event) => {
      await notifier.notifyPhaseEnd(event);
      if (event.completedPhase === "focus") {
        await history.appendFocusSession({
          startedAt: event.startedAt,
          endedAt: event.endedAt,
        });
      }
    });

    snapshot = engine.snapshot();
    ready = true;

    setInterval(() => {
      snapshot = engine.snapshot();
      durationMs = durationForPhase(snapshot.phase, get(settings));
    }, 250);
  });

  function durationForPhase(phase: TimerSnapshot["phase"], s: Settings): number {
    if (phase === "focus") return s.durations.focus * 60_000;
    if (phase === "shortBreak") return s.durations.shortBreak * 60_000;
    return s.durations.longBreak * 60_000;
  }

  const actions = {
    onStart: () => {
      engine.start();
      snapshot = engine.snapshot();
    },
    onPause: () => {
      engine.pause();
      snapshot = engine.snapshot();
    },
    onResume: () => {
      engine.resume();
      snapshot = engine.snapshot();
    },
    onSkip: () => {
      engine.skip();
      snapshot = engine.snapshot();
    },
    onExtend: () => {
      engine.extend(5);
      snapshot = engine.snapshot();
    },
    onReset: () => {
      engine.reset();
      snapshot = engine.snapshot();
    },
    onToggleMode: async () => {
      const next: Mode = $mode === "compact" ? "full" : "compact";
      await mode.setMode(next);
    },
    onOpenSettings: () => (showSettings = true),
    onOpenHistory: () => (showHistory = true),
  };

  $: tint = activeScene
    ? tintNow(
        activeScene.manifest.timeOfDay.mode === "tint"
          ? activeScene.manifest.timeOfDay.tints
          : { morning: "#ffffff", midday: "#ffffff", dusk: "#ffffff", night: "#000000" },
      )
    : "#000000";
</script>

{#if ready && settings && history}
  {#if $mode === "compact"}
    <CompactCard
      {snapshot}
      sessionsPerLongBreak={$settings.durations.sessionsPerLongBreak}
      {actions}
    />
  {:else}
    <FullScene
      {snapshot}
      {durationMs}
      sessionsPerLongBreak={$settings.durations.sessionsPerLongBreak}
      scene={activeScene}
      {tint}
      {alertEvent}
      {actions}
    />
  {/if}

  {#if showSettings}
    <SettingsDialog {settings} {scenes} onClose={() => (showSettings = false)} />
  {/if}
  {#if showHistory}
    <HistoryPanel tallies={history} onClose={() => (showHistory = false)} />
  {/if}
{:else}
  <div class="loading">Loading…</div>
{/if}

<style>
  .loading {
    display: grid;
    place-items: center;
    height: 100vh;
    color: #8a8578;
    font-family: ui-rounded, system-ui;
  }
</style>
