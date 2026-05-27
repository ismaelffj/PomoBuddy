export type Phase = "focus" | "shortBreak" | "longBreak";
export type RunState = "idle" | "running" | "paused" | "ended";

export interface PhaseEndedEvent {
  completedPhase: Phase;
  nextPhase: Phase;
  natural: true;
  startedAt: number;
  endedAt: number;
  sessionIndex: number;
}

export interface TimerDurations {
  focus: number;
  shortBreak: number;
  longBreak: number;
  sessionsPerLongBreak: number;
}

export interface TimerSnapshot {
  runState: RunState;
  phase: Phase;
  remainingMs: number;
  sessionIndex: number;
}

export type ClockSource = () => number;
export type PhaseEndedListener = (event: PhaseEndedEvent) => void;
