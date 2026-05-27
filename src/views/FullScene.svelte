<script lang="ts">
  import type { TimerSnapshot } from "../lib/timer/timer.types";
  import type { LoadedScene } from "../lib/scenes/scene.types";
  import WallClock from "./WallClock.svelte";
  import ButtonBar from "./ButtonBar.svelte";

  export let snapshot: TimerSnapshot;
  export let durationMs: number;
  export let sessionsPerLongBreak: number;
  export let scene: LoadedScene | null;
  export let tint: string;
  export let alertEvent: { id: number } | null;

  export let actions: {
    onStart: () => void;
    onPause: () => void;
    onResume: () => void;
    onSkip: () => void;
    onExtend: () => void;
    onReset: () => void;
    onToggleMode: () => void;
    onOpenSettings: () => void;
    onOpenHistory: () => void;
  };

  $: phaseLabel =
    snapshot.phase === "focus"
      ? `Focus · ${snapshot.sessionIndex} / ${sessionsPerLongBreak}`
      : snapshot.phase === "shortBreak"
        ? "Short break"
        : "Long break";

  $: clockPos = scene?.manifest.clock ?? {
    x: 0.5,
    y: 0.2,
    diameter: 0.2,
    face: "warm-cream",
  };
  $: tagPos = scene?.manifest.phaseTag ?? { x: 0.04, y: 0.06 };
</script>

<div class="stage">
  {#if scene}
    <img class="bg" src={scene.assetUrl(scene.manifest.layers.background)} alt="" />
    {#if scene.manifest.layers.foreground}
      <img class="fg" src={scene.assetUrl(scene.manifest.layers.foreground)} alt="" />
    {/if}
  {:else}
    <div class="bg placeholder"></div>
  {/if}

  <div class="tint" style="background-color: {tint}"></div>

  <div class="phase-tag" style="left: {tagPos.x * 100}%; top: {tagPos.y * 100}%;">
    {phaseLabel}
  </div>

  <div
    class="clock-slot"
    style="
      left: {(clockPos.x - clockPos.diameter / 2) * 100}%;
      top: {(clockPos.y - clockPos.diameter / 2) * 100}%;
      width: {clockPos.diameter * 100}%;
      aspect-ratio: 1 / 1;
    "
  >
    <WallClock
      remainingMs={snapshot.remainingMs}
      {durationMs}
      accent={scene?.manifest.palette.primary ?? "#c97a5a"}
    />
  </div>

  {#if alertEvent}
    {#key alertEvent.id}
      <div class="overlay">Phase complete</div>
    {/key}
  {/if}

  <div class="bottom-bar">
    <ButtonBar
      runState={snapshot.runState}
      onStart={actions.onStart}
      onPause={actions.onPause}
      onResume={actions.onResume}
      onSkip={actions.onSkip}
      onExtend={actions.onExtend}
      onReset={actions.onReset}
      onToggleMode={actions.onToggleMode}
      onOpenSettings={actions.onOpenSettings}
      onOpenHistory={actions.onOpenHistory}
    />
  </div>
</div>

<style>
  .stage {
    position: relative;
    width: 100%;
    height: 100vh;
    overflow: hidden;
    background: #1a1c22;
  }
  .bg,
  .fg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .placeholder {
    background: linear-gradient(180deg, #3b2820 0%, #2a1d18 100%);
  }
  .tint {
    position: absolute;
    inset: 0;
    mix-blend-mode: multiply;
    opacity: 0.25;
    pointer-events: none;
  }
  .phase-tag {
    position: absolute;
    background: rgba(20, 15, 12, 0.55);
    color: #f0e6d4;
    font-size: 11px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    padding: 4px 12px;
    border-radius: 999px;
    backdrop-filter: blur(6px);
    font-family: ui-rounded, system-ui;
  }
  .clock-slot {
    position: absolute;
  }
  .bottom-bar {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(180deg, transparent, rgba(15, 10, 8, 0.85));
    padding-top: 24px;
  }
  .overlay {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, 0.45);
    color: #f0e6d4;
    font-size: 28px;
    animation: pulse 1.6s ease-out forwards;
    font-family: ui-rounded, system-ui;
  }
  @keyframes pulse {
    0% {
      opacity: 0;
    }
    30% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }
</style>
