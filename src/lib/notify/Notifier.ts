import { get, type Readable } from "svelte/store";
import type { Platform } from "../platform/platform.types";
import type { Phase, PhaseEndedEvent } from "../timer/timer.types";
import type { Settings } from "../stores/settings.types";

interface NotifierHandlers {
  onInAppAlert: (event: PhaseEndedEvent) => void;
  playChime: () => void;
}

const COPY: Record<Phase, { title: string; body: string }> = {
  focus: { title: "Focus complete", body: "Time for a break." },
  shortBreak: { title: "Break over", body: "Ready for the next focus session?" },
  longBreak: { title: "Long break over", body: "Back to focus when you're ready." },
};

export function createNotifier(
  platform: Platform,
  settings: Readable<Settings>,
  handlers: NotifierHandlers,
) {
  return {
    async notifyPhaseEnd(event: PhaseEndedEvent) {
      const cfg = get(settings).notifications;
      const text = COPY[event.completedPhase];
      const tasks: Promise<unknown>[] = [];
      if (cfg.banner) tasks.push(platform.sendNotification(text.title, text.body));
      if (cfg.inApp) handlers.onInAppAlert(event);
      if (cfg.chime) handlers.playChime();
      if (cfg.dockBounce) tasks.push(platform.requestUserAttentionCritical());
      await Promise.all(tasks);
    },
  };
}
