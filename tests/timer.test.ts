import { describe, it, expect, vi } from "vitest";
import { TimerEngine } from "../src/lib/timer/TimerEngine";
import type { PhaseEndedEvent, TimerDurations } from "../src/lib/timer/timer.types";

const minutes = (n: number) => n * 60_000;

function makeEngine(durations?: Partial<TimerDurations>) {
  let now = 1_000_000_000_000;
  const clock = () => now;
  const advance = (ms: number) => {
    now += ms;
  };
  const engine = new TimerEngine(
    {
      focus: 25,
      shortBreak: 5,
      longBreak: 15,
      sessionsPerLongBreak: 4,
      ...durations,
    },
    clock,
  );
  return { engine, advance };
}

describe("TimerEngine — core", () => {
  it("starts in idle on focus with full remaining", () => {
    const { engine } = makeEngine();
    const s = engine.snapshot();
    expect(s.runState).toBe("idle");
    expect(s.phase).toBe("focus");
    expect(s.remainingMs).toBe(minutes(25));
    expect(s.sessionIndex).toBe(1);
  });

  it("running: remaining decreases monotonically with wall-clock", () => {
    const { engine, advance } = makeEngine();
    engine.start();
    advance(60_000);
    expect(engine.snapshot().remainingMs).toBe(minutes(24));
    advance(60_000);
    expect(engine.snapshot().remainingMs).toBe(minutes(23));
  });

  it("survives a large clock jump (sleep/wake) without drift", () => {
    const { engine, advance } = makeEngine();
    engine.start();
    advance(minutes(30)); // jump past end
    const s = engine.snapshot();
    expect(s.runState).toBe("ended");
    expect(s.remainingMs).toBe(0);
  });
});

describe("TimerEngine — actions", () => {
  it("pause + resume preserves remaining", () => {
    const { engine, advance } = makeEngine();
    engine.start();
    advance(minutes(10));
    engine.pause();
    advance(minutes(3));
    engine.resume();
    advance(minutes(5));
    expect(engine.snapshot().remainingMs).toBe(minutes(10));
  });

  it("skip advances phase WITHOUT emitting PhaseEndedEvent", () => {
    const { engine } = makeEngine();
    const spy = vi.fn<(e: PhaseEndedEvent) => void>();
    engine.onPhaseEnded(spy);
    engine.start();
    engine.skip();
    expect(spy).not.toHaveBeenCalled();
    expect(engine.snapshot().phase).toBe("shortBreak");
    expect(engine.snapshot().runState).toBe("idle");
  });

  it("extend(5) adds 5 minutes to remaining", () => {
    const { engine, advance } = makeEngine();
    engine.start();
    advance(minutes(10));
    engine.extend(5);
    expect(engine.snapshot().remainingMs).toBe(minutes(20));
  });

  it("reset returns to idle with current phase reset", () => {
    const { engine, advance } = makeEngine();
    engine.start();
    advance(minutes(20));
    engine.reset();
    const s = engine.snapshot();
    expect(s.runState).toBe("idle");
    expect(s.phase).toBe("focus");
    expect(s.remainingMs).toBe(minutes(25));
  });

  it("natural end emits PhaseEndedEvent exactly once", () => {
    const { engine, advance } = makeEngine();
    const spy = vi.fn<(e: PhaseEndedEvent) => void>();
    engine.onPhaseEnded(spy);
    engine.start();
    advance(minutes(25));
    engine.snapshot();
    engine.snapshot();
    expect(spy).toHaveBeenCalledTimes(1);
    const ev = spy.mock.calls[0][0];
    expect(ev.completedPhase).toBe("focus");
    expect(ev.nextPhase).toBe("shortBreak");
    expect(ev.natural).toBe(true);
    expect(typeof ev.startedAt).toBe("number");
    expect(ev.endedAt - ev.startedAt).toBe(minutes(25));
  });
});

describe("TimerEngine — cycle", () => {
  it("after sessionsPerLongBreak focus ends, next phase is longBreak", () => {
    const { engine, advance } = makeEngine({ sessionsPerLongBreak: 2 });
    engine.start();
    advance(minutes(25));
    engine.snapshot();
    engine.start();
    advance(minutes(5));
    engine.snapshot();
    engine.start();
    advance(minutes(25));
    engine.snapshot();
    engine.start();
    expect(engine.snapshot().phase).toBe("longBreak");
  });

  it("longBreak completes and resets sessionIndex to 1 for next focus", () => {
    const { engine, advance } = makeEngine({ sessionsPerLongBreak: 2 });
    for (const ms of [minutes(25), minutes(5), minutes(25), minutes(15)]) {
      engine.start();
      advance(ms);
      engine.snapshot();
    }
    engine.start();
    expect(engine.snapshot().phase).toBe("focus");
    expect(engine.snapshot().sessionIndex).toBe(1);
  });
});
