<script lang="ts">
  import type { Readable } from "svelte/store";
  import type { Tallies } from "../lib/stores/history";

  export let tallies: Readable<Tallies>;
  export let onClose: () => void;

  $: hoursFocused = (($tallies.weekFocusMinutes ?? 0) / 60).toFixed(1);
</script>

<div
  class="backdrop"
  on:click={onClose}
  on:keydown={(e) => e.key === "Escape" && onClose()}
  role="presentation"
>
  <div
    class="panel"
    on:click|stopPropagation
    on:keydown|stopPropagation
    role="dialog"
    aria-modal="true"
    aria-label="Session history"
    tabindex="-1"
  >
    <h3>Your sessions</h3>
    <div class="stats">
      <div class="stat">
        <div class="big">{$tallies.today}</div>
        <div class="lbl">Today</div>
      </div>
      <div class="stat">
        <div class="big">{$tallies.thisWeek}</div>
        <div class="lbl">This week</div>
      </div>
      <div class="stat">
        <div class="big">{hoursFocused}h</div>
        <div class="lbl">Focused this week</div>
      </div>
    </div>
    <button class="close" on:click={onClose}>Close</button>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: grid;
    place-items: center;
    z-index: 100;
  }
  .panel {
    background: #1c1e25;
    color: #e6e3da;
    border-radius: 14px;
    padding: 20px;
    min-width: 360px;
    font-family: ui-rounded, system-ui;
  }
  h3 {
    margin: 0 0 14px;
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
  .stat {
    background: rgba(255, 255, 255, 0.04);
    padding: 14px;
    border-radius: 8px;
    text-align: center;
  }
  .big {
    font-size: 28px;
    font-weight: 300;
  }
  .lbl {
    font-size: 11px;
    color: #8a8578;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-top: 4px;
  }
  .close {
    display: block;
    margin: 14px 0 0 auto;
    background: #c9b78a;
    color: #1c1e25;
    border: none;
    padding: 6px 14px;
    border-radius: 6px;
    cursor: pointer;
    font: inherit;
  }
</style>
