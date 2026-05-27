import type {
  ClockSource,
  Phase,
  PhaseEndedEvent,
  PhaseEndedListener,
  RunState,
  TimerDurations,
  TimerSnapshot,
} from "./timer.types";

const MIN_MS = 60_000;

export class TimerEngine {
  private runState: RunState = "idle";
  private phase: Phase = "focus";
  private sessionIndex = 1;

  private phaseStartedAt = 0;
  private phaseDurationMs = 0;
  private pausedOffsetMs = 0;
  private pausedAt = 0;

  private listeners = new Set<PhaseEndedListener>();
  private endedEmittedFor = -1;

  constructor(
    private durations: TimerDurations,
    private clock: ClockSource = () => Date.now(),
  ) {
    this.phaseDurationMs = durations.focus * MIN_MS;
  }

  onPhaseEnded(fn: PhaseEndedListener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  snapshot(): TimerSnapshot {
    if (this.runState === "running" && this.computeRemainingMs() <= 0) {
      this.transitionToEnded();
    }
    return {
      runState: this.runState,
      phase: this.phase,
      remainingMs: Math.max(0, this.computeRemainingMs()),
      sessionIndex: this.sessionIndex,
    };
  }

  start(): void {
    if (this.runState === "running") return;
    if (this.runState === "ended") {
      const nextPhase = this.computeNextPhase(this.phase);
      this.advanceTo(nextPhase, this.phase !== "focus" /* incrementSession */);
    }
    this.phaseStartedAt = this.clock();
    this.pausedOffsetMs = 0;
    this.runState = "running";
  }

  pause(): void {
    if (this.runState !== "running") return;
    this.pausedAt = this.clock();
    this.runState = "paused";
  }

  resume(): void {
    if (this.runState !== "paused") return;
    this.pausedOffsetMs += this.clock() - this.pausedAt;
    this.runState = "running";
  }

  skip(): void {
    const nextPhase = this.computeNextPhase(this.phase);
    this.advanceTo(nextPhase, this.phase !== "focus");
    this.runState = "idle";
  }

  extend(min: number): void {
    this.phaseDurationMs += min * MIN_MS;
  }

  reset(): void {
    this.advanceTo(this.phase, false);
    this.runState = "idle";
  }

  private computeRemainingMs(): number {
    if (this.runState === "idle") return this.phaseDurationMs;
    if (this.runState === "paused") {
      return this.phaseDurationMs - (this.pausedAt - this.phaseStartedAt - this.pausedOffsetMs);
    }
    if (this.runState === "running") {
      return this.phaseDurationMs - (this.clock() - this.phaseStartedAt - this.pausedOffsetMs);
    }
    return 0;
  }

  private transitionToEnded(): void {
    if (this.endedEmittedFor === this.phaseStartedAt) return;
    this.endedEmittedFor = this.phaseStartedAt;
    this.runState = "ended";
    const completedPhase = this.phase;
    const nextPhase = this.computeNextPhase(completedPhase);
    const event: PhaseEndedEvent = {
      completedPhase,
      nextPhase,
      natural: true,
      startedAt: this.phaseStartedAt,
      endedAt: this.clock(),
      sessionIndex: this.sessionIndex,
    };
    for (const fn of this.listeners) fn(event);
  }

  private computeNextPhase(current: Phase): Phase {
    if (current === "focus") {
      return this.sessionIndex >= this.durations.sessionsPerLongBreak ? "longBreak" : "shortBreak";
    }
    return "focus";
  }

  private advanceTo(nextPhase: Phase, incrementSession: boolean): void {
    if (this.phase === "longBreak" && nextPhase === "focus") {
      this.sessionIndex = 1;
    } else if (incrementSession) {
      if (this.sessionIndex >= this.durations.sessionsPerLongBreak) {
        this.sessionIndex = 1;
      } else {
        this.sessionIndex += 1;
      }
    }
    this.phase = nextPhase;
    this.phaseDurationMs = this.durationFor(nextPhase);
    this.phaseStartedAt = 0;
    this.pausedOffsetMs = 0;
    this.pausedAt = 0;
    this.endedEmittedFor = -1;
  }

  private durationFor(phase: Phase): number {
    if (phase === "focus") return this.durations.focus * MIN_MS;
    if (phase === "shortBreak") return this.durations.shortBreak * MIN_MS;
    return this.durations.longBreak * MIN_MS;
  }
}
