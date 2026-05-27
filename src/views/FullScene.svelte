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
  export let alwaysOnTop: boolean;

  export let actions: {
    onStart: () => void;
    onPause: () => void;
    onResume: () => void;
    onSkip: () => void;
    onExtend: () => void;
    onReset: () => void;
    onToggleMode: () => void;
    onToggleAlwaysOnTop: () => void;
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

  <div class="corner-actions">
    <button
      class="icon"
      class:active={alwaysOnTop}
      on:click={actions.onToggleAlwaysOnTop}
      aria-label={alwaysOnTop ? "Unpin (allow other windows above)" : "Pin always on top"}
      aria-pressed={alwaysOnTop}
    >
      📌
    </button>
    <button class="icon" on:click={actions.onToggleMode} aria-label="Compact mode">⛶</button>
    <button class="icon" on:click={actions.onOpenHistory} aria-label="History">📊</button>
    <button class="icon" on:click={actions.onOpenSettings} aria-label="Settings">⚙</button>
  </div>

  <div
    class="clock-slot"
    style="
      --clock-d: clamp(120px, {clockPos.diameter * 100}vmin, 320px);
      left: calc({clockPos.x * 100}% - var(--clock-d) / 2);
      top: calc({clockPos.y * 100}% - var(--clock-d) / 2);
      width: var(--clock-d);
      height: var(--clock-d);
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
  .corner-actions {
    position: absolute;
    top: 12px;
    right: 12px;
    display: flex;
    gap: 6px;
  }
  .corner-actions .icon {
    background: rgba(20, 15, 12, 0.55);
    backdrop-filter: blur(6px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #f0e6d4;
    width: 30px;
    height: 30px;
    display: grid;
    place-items: center;
    border-radius: 8px;
    cursor: pointer;
    padding: 0;
    font-size: 14px;
    line-height: 1;
  }
  .corner-actions .icon:hover {
    background: rgba(20, 15, 12, 0.8);
  }
  .corner-actions .icon.active {
    background: #c97a5a;
    border-color: #c97a5a;
    color: #1a0f0a;
  }
  .corner-actions .icon.active:hover {
    background: #d68866;
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
