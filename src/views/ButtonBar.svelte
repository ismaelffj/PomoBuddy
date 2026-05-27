<script lang="ts">
  import type { RunState } from "../lib/timer/timer.types";

  export let runState: RunState;
  export let compact = false;

  export let onStart: () => void;
  export let onPause: () => void;
  export let onResume: () => void;
  export let onSkip: () => void;
  export let onExtend: () => void;
  export let onReset: () => void;

  $: primaryLabel =
    runState === "running"
      ? "Pause"
      : runState === "paused"
        ? "Resume"
        : runState === "ended"
          ? "Start next"
          : "Start";

  function primaryClick() {
    if (runState === "running") onPause();
    else if (runState === "paused") onResume();
    else onStart();
  }
</script>

<div class="bar" class:compact>
  <button class="primary" on:click={primaryClick} aria-label={primaryLabel}>
    {compact ? (runState === "running" ? "⏸" : "▶") : primaryLabel}
  </button>
  <button on:click={onSkip} aria-label="Skip">{compact ? "⏭" : "Skip"}</button>
  <button on:click={onExtend} aria-label="Extend 5 minutes">{compact ? "+5" : "+5 min"}</button>
  <button on:click={onReset} aria-label="Reset">{compact ? "⟳" : "Reset"}</button>
</div>

<style>
  .bar {
    display: flex;
    gap: 6px;
    align-items: center;
    justify-content: center;
    padding: 10px 12px;
    color: #f0e6d4;
    font-family: ui-rounded, system-ui, sans-serif;
    font-size: 13px;
  }
  button {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: inherit;
    padding: 6px 12px;
    border-radius: 8px;
    cursor: pointer;
    font: inherit;
    white-space: nowrap;
  }
  button:hover {
    background: rgba(255, 255, 255, 0.14);
  }
  button.primary {
    background: #c97a5a;
    color: #1a0f0a;
    border-color: #c97a5a;
  }
</style>
