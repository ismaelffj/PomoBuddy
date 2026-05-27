<script lang="ts">
  import type { Writable } from "svelte/store";
  import type { Settings } from "../lib/stores/settings.types";
  import type { LoadedScene } from "../lib/scenes/scene.types";

  export let settings: Writable<Settings>;
  export let scenes: LoadedScene[];
  export let onClose: () => void;

  let tab: "timer" | "scene" | "notifications" = "timer";

  function toggleBool(get: (s: Settings) => boolean, set: (s: Settings, v: boolean) => Settings) {
    settings.update((s) => set(s, !get(s)));
  }
</script>

<div
  class="backdrop"
  on:click={onClose}
  on:keydown={(e) => e.key === "Escape" && onClose()}
  role="presentation"
>
  <div
    class="modal"
    on:click|stopPropagation
    on:keydown|stopPropagation
    role="dialog"
    aria-modal="true"
    aria-label="Settings"
    tabindex="-1"
  >
    <header>
      <span>⚙</span>
      <h3>Settings</h3>
      <button class="x" on:click={onClose} aria-label="Close">✕</button>
    </header>

    <nav class="tabs">
      <button class:active={tab === "timer"} on:click={() => (tab = "timer")}>Timer</button>
      <button class:active={tab === "scene"} on:click={() => (tab = "scene")}>Scene</button>
      <button class:active={tab === "notifications"} on:click={() => (tab = "notifications")}>
        Notifications
      </button>
    </nav>

    <div class="body">
      {#if tab === "timer"}
        <label class="row">
          <span>Focus duration (min)</span>
          <input
            type="number"
            min="1"
            max="180"
            value={$settings.durations.focus}
            on:input={(e) =>
              settings.update((s) => ({
                ...s,
                durations: { ...s.durations, focus: +e.currentTarget.value },
              }))}
          />
        </label>
        <label class="row">
          <span>Short break (min)</span>
          <input
            type="number"
            min="1"
            max="60"
            value={$settings.durations.shortBreak}
            on:input={(e) =>
              settings.update((s) => ({
                ...s,
                durations: { ...s.durations, shortBreak: +e.currentTarget.value },
              }))}
          />
        </label>
        <label class="row">
          <span>Long break (min)</span>
          <input
            type="number"
            min="1"
            max="120"
            value={$settings.durations.longBreak}
            on:input={(e) =>
              settings.update((s) => ({
                ...s,
                durations: { ...s.durations, longBreak: +e.currentTarget.value },
              }))}
          />
        </label>
        <label class="row">
          <span>Sessions per long break</span>
          <input
            type="number"
            min="1"
            max="12"
            value={$settings.durations.sessionsPerLongBreak}
            on:input={(e) =>
              settings.update((s) => ({
                ...s,
                durations: {
                  ...s.durations,
                  sessionsPerLongBreak: +e.currentTarget.value,
                },
              }))}
          />
        </label>
        <label class="row">
          <span>Always-on-top</span>
          <input
            type="checkbox"
            checked={$settings.window.alwaysOnTop}
            on:change={(e) =>
              settings.update((s) => ({
                ...s,
                window: { ...s.window, alwaysOnTop: e.currentTarget.checked },
              }))}
          />
        </label>
        <label class="row">
          <span>Menu bar countdown</span>
          <input
            type="checkbox"
            checked={$settings.window.menuBarCountdown}
            on:change={(e) =>
              settings.update((s) => ({
                ...s,
                window: { ...s.window, menuBarCountdown: e.currentTarget.checked },
              }))}
          />
        </label>
      {:else if tab === "scene"}
        <div class="scene-grid">
          {#each scenes as scene (scene.id)}
            <button
              class="tile"
              class:selected={$settings.scene.id === scene.id}
              on:click={() =>
                settings.update((s) => ({
                  ...s,
                  scene: { ...s.scene, id: scene.id },
                }))}
            >
              <div class="preview" style="background: {scene.manifest.palette.primary}"></div>
              <div class="name">{scene.manifest.name}</div>
            </button>
          {/each}
        </div>
        <label class="row">
          <span>Time of day</span>
          <select
            value={$settings.scene.timeOfDayMode}
            on:change={(e) =>
              settings.update((s) => ({
                ...s,
                scene: {
                  ...s.scene,
                  timeOfDayMode: e.currentTarget.value as Settings["scene"]["timeOfDayMode"],
                },
              }))}
          >
            <option value="auto">Auto (wall clock)</option>
            <option value="morning">Morning</option>
            <option value="midday">Midday</option>
            <option value="dusk">Dusk</option>
            <option value="night">Night</option>
          </select>
        </label>
      {:else}
        <label class="row">
          <span>macOS banner</span>
          <input
            type="checkbox"
            checked={$settings.notifications.banner}
            on:change={() =>
              toggleBool(
                (s) => s.notifications.banner,
                (s, v) => ({ ...s, notifications: { ...s.notifications, banner: v } }),
              )}
          />
        </label>
        <label class="row">
          <span>In-app overlay</span>
          <input
            type="checkbox"
            checked={$settings.notifications.inApp}
            on:change={() =>
              toggleBool(
                (s) => s.notifications.inApp,
                (s, v) => ({ ...s, notifications: { ...s.notifications, inApp: v } }),
              )}
          />
        </label>
        <label class="row">
          <span>Audible chime</span>
          <input
            type="checkbox"
            checked={$settings.notifications.chime}
            on:change={() =>
              toggleBool(
                (s) => s.notifications.chime,
                (s, v) => ({ ...s, notifications: { ...s.notifications, chime: v } }),
              )}
          />
        </label>
        <label class="row">
          <span>Dock bounce</span>
          <input
            type="checkbox"
            checked={$settings.notifications.dockBounce}
            on:change={() =>
              toggleBool(
                (s) => s.notifications.dockBounce,
                (s, v) => ({ ...s, notifications: { ...s.notifications, dockBounce: v } }),
              )}
          />
        </label>
      {/if}
    </div>

    <footer>
      <button class="primary" on:click={onClose}>Close</button>
    </footer>
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
  .modal {
    width: min(560px, 90vw);
    background: #1c1e25;
    color: #e6e3da;
    border-radius: 14px;
    overflow: hidden;
    font-family: ui-rounded, system-ui;
  }
  header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 18px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  header h3 {
    margin: 0;
    font-size: 15px;
    flex: 1;
  }
  .x {
    background: none;
    border: none;
    color: #8a8578;
    cursor: pointer;
    font-size: 16px;
  }
  .tabs {
    display: flex;
    padding: 0 18px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  .tabs button {
    background: none;
    border: none;
    color: #8a8578;
    padding: 10px 14px;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    font: inherit;
  }
  .tabs button.active {
    color: #c9b78a;
    border-bottom-color: #c9b78a;
  }
  .body {
    padding: 14px 18px;
    max-height: 60vh;
    overflow: auto;
  }
  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    font-size: 13px;
  }
  input[type="number"],
  select {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #e6e3da;
    padding: 4px 8px;
    border-radius: 6px;
  }
  input[type="checkbox"] {
    accent-color: #c9b78a;
  }
  footer {
    display: flex;
    justify-content: flex-end;
    padding: 12px 18px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(0, 0, 0, 0.15);
  }
  footer .primary {
    background: #c9b78a;
    color: #1c1e25;
    border: none;
    padding: 6px 14px;
    border-radius: 6px;
    cursor: pointer;
    font: inherit;
  }
  .scene-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 14px;
  }
  .tile {
    background: none;
    border: 2px solid transparent;
    padding: 0;
    border-radius: 8px;
    cursor: pointer;
    color: inherit;
    font: inherit;
  }
  .tile.selected {
    border-color: #c9b78a;
  }
  .tile .preview {
    aspect-ratio: 4 / 3;
    border-radius: 6px;
  }
  .tile .name {
    font-size: 11px;
    padding-top: 4px;
    color: #8a8578;
  }
</style>
