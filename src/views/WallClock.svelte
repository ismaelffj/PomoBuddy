<script lang="ts">
  import { onMount } from "svelte";

  export let remainingMs: number;
  export let durationMs: number;
  export let accent: string = "#c97a5a";

  $: progress = durationMs <= 0 ? 0 : Math.max(0, Math.min(1, 1 - remainingMs / durationMs));
  $: mm = Math.floor(remainingMs / 60_000);
  $: ss = Math.floor((remainingMs % 60_000) / 1000);
  $: label = `${mm.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;

  const R = 50;
  const CIRC = 2 * Math.PI * R;
  $: dashOffset = CIRC * progress;

  // Wall-clock time of day for the analog hands. We only show
  // hour/minute precision (no sweeping second hand), so polling every
  // 30s keeps the minute hand from ever lagging visibly.
  let now = new Date();
  $: minute = now.getMinutes();
  $: hour = now.getHours();
  $: minuteAngle = minute * 6; // 0° = pointing up at 12
  $: hourAngle = ((hour % 12) + minute / 60) * 30;

  onMount(() => {
    const id = setInterval(() => {
      now = new Date();
    }, 30_000);
    return () => clearInterval(id);
  });
</script>

<svg viewBox="-60 -60 120 120" class="clock" role="img" aria-label="Pomodoro timer">
  <circle r={R} fill="#f4ecdc" stroke="#3a2f24" stroke-width="6" />
  <circle
    r={R - 6}
    fill="none"
    stroke={accent}
    stroke-width="4"
    stroke-linecap="round"
    stroke-dasharray={CIRC}
    stroke-dashoffset={dashOffset}
    transform="rotate(-90)"
  />
  <g stroke="#3a2f24" stroke-width="2">
    <line x1="0" y1="-42" x2="0" y2="-36" />
    <line x1="42" y1="0" x2="36" y2="0" />
    <line x1="0" y1="42" x2="0" y2="36" />
    <line x1="-42" y1="0" x2="-36" y2="0" />
  </g>
  <!-- Analog hands: wall-clock time of day. Sit behind the digital
       readout (drawn before <text>), at half opacity so the Pomodoro
       countdown stays the focal point. -->
  <g stroke="#3a2f24" stroke-linecap="round" opacity="0.5">
    <line x1="0" y1="0" x2="0" y2="-26" stroke-width="3" transform="rotate({hourAngle})" />
    <line x1="0" y1="0" x2="0" y2="-38" stroke-width="2" transform="rotate({minuteAngle})" />
  </g>
  <circle cx="0" cy="0" r="2" fill="#3a2f24" opacity="0.7" />
  <text
    x="0"
    y="0"
    text-anchor="middle"
    dominant-baseline="central"
    font-size="24"
    font-family="ui-monospace, 'SF Mono', Menlo, Consolas, monospace"
    font-weight="600"
    fill="#3a2f24"
    style="font-variant-numeric: tabular-nums;"
  >
    {label}
  </text>
</svg>

<style>
  .clock {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
