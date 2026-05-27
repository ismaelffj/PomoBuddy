<script lang="ts">
  import type { TimerSnapshot } from "../lib/timer/timer.types";
  import ButtonBar from "./ButtonBar.svelte";

  export let snapshot: TimerSnapshot;
  export let sessionsPerLongBreak: number;
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
  };

  $: mm = Math.floor(snapshot.remainingMs / 60_000);
  $: ss = Math.floor((snapshot.remainingMs % 60_000) / 1000);
  $: time = `${mm.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
  $: phaseLabel =
    snapshot.phase === "focus"
      ? `Focus · ${snapshot.sessionIndex} / ${sessionsPerLongBreak}`
      : snapshot.phase === "shortBreak"
        ? "Short break"
        : "Long break";
</script>

<div class="card">
  <div class="top-row">
    <div class="pill">{phaseLabel}</div>
    <div class="corner">
      <button
        class="icon"
        class:active={alwaysOnTop}
        on:click={actions.onToggleAlwaysOnTop}
        aria-label={alwaysOnTop ? "Unpin" : "Pin always on top"}
        aria-pressed={alwaysOnTop}
      >
        📌
      </button>
      <button class="icon" on:click={actions.onToggleMode} aria-label="Expand to full mode">
        ⛶
      </button>
      <button class="icon" on:click={actions.onOpenSettings} aria-label="Settings">⚙</button>
    </div>
  </div>
  <div class="time">{time}</div>
  <ButtonBar
    runState={snapshot.runState}
    compact
    onStart={actions.onStart}
    onPause={actions.onPause}
    onResume={actions.onResume}
    onSkip={actions.onSkip}
    onExtend={actions.onExtend}
    onReset={actions.onReset}
  />
</div>

<style>
  .card {
    height: 100vh;
    background: linear-gradient(180deg, #2a2c33 0%, #1f2128 100%);
    color: #e6e3da;
    font-family: ui-rounded, system-ui, sans-serif;
    padding: 10px 12px 4px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .pill {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #c9b78a;
    background: rgba(201, 183, 138, 0.08);
    padding: 3px 10px;
    border-radius: 999px;
  }
  .corner {
    display: flex;
    gap: 4px;
  }
  .icon {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #d7d2c4;
    width: 26px;
    height: 26px;
    display: grid;
    place-items: center;
    border-radius: 6px;
    cursor: pointer;
    padding: 0;
    font-size: 13px;
    line-height: 1;
  }
  .icon:hover {
    background: rgba(255, 255, 255, 0.12);
  }
  .icon.active {
    background: #c97a5a;
    border-color: #c97a5a;
    color: #1a0f0a;
  }
  .icon.active:hover {
    background: #d68866;
  }
  .time {
    font-size: 52px;
    font-weight: 200;
    letter-spacing: -1px;
    line-height: 1;
    margin: 4px 0 0;
  }
</style>
