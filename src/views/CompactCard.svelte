<script lang="ts">
  import type { TimerSnapshot } from "../lib/timer/timer.types";
  import ButtonBar from "./ButtonBar.svelte";

  export let snapshot: TimerSnapshot;
  export let sessionsPerLongBreak: number;

  export let actions: {
    onStart: () => void;
    onPause: () => void;
    onResume: () => void;
    onSkip: () => void;
    onExtend: () => void;
    onReset: () => void;
    onToggleMode: () => void;
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
  <div class="pill">{phaseLabel}</div>
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
    onToggleMode={actions.onToggleMode}
    onOpenSettings={actions.onOpenSettings}
  />
</div>

<style>
  .card {
    height: 100vh;
    background: linear-gradient(180deg, #2a2c33 0%, #1f2128 100%);
    color: #e6e3da;
    font-family: ui-rounded, system-ui, sans-serif;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .pill {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #c9b78a;
    background: rgba(201, 183, 138, 0.08);
    padding: 3px 10px;
    border-radius: 999px;
    align-self: flex-start;
  }
  .time {
    font-size: 56px;
    font-weight: 200;
    letter-spacing: -1px;
    line-height: 1;
    margin: 6px 0;
  }
</style>
