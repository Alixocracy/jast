import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useJast } from "@/contexts/JastContext";
import { useUserName } from "@/contexts/UserNameContext";
import { jastNudge } from "@/lib/jastClient";

/**
 * Listens for app events (task done, timer end) and asks JAST for a short
 * encouraging comment. Posts as toast + chat message.
 */
export function JastNudgeListener() {
  const { settings, setHistory, openChat } = useJast();
  const { userName } = useUserName();
  const settingsRef = useRef(settings);
  const userNameRef = useRef(userName);
  const lastNudgeRef = useRef(0);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  useEffect(() => {
    userNameRef.current = userName;
  }, [userName]);

  useEffect(() => {
    async function nudge(prompt: string) {
      const s = settingsRef.current;
      if (!s.enabled) return;
      // throttle: 1 nudge / 4s
      const now = Date.now();
      if (now - lastNudgeRef.current < 4000) return;
      lastNudgeRef.current = now;
      try {
        const text = await jastNudge({
          prompt,
          settings: s,
          userName: userNameRef.current,
        });
        if (!text) return;
        const msg = {
          id: `n-${Date.now()}`,
          role: "assistant" as const,
          content: text,
          timestamp: Date.now(),
          isNudge: true,
        };
        setHistory((prev) => [...prev, msg]);
        window.dispatchEvent(new CustomEvent("jast-nudge-added"));
        toast(text, {
          icon: "✨",
          action: {
            label: "Reply",
            onClick: () => openChat(),
          },
        });
      } catch (e) {
        // silent
      }
    }

    const onTaskDone = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      if (!settingsRef.current.commentOnTaskDone) return;
      nudge(
        `The user just completed the task: "${detail.text || "a task"}". Give a short, warm encouragement (1-2 sentences). Consider their overall progress today if you have it. Don't list anything.`,
      );
    };
    const onTimerEnd = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      if (!settingsRef.current.commentOnTimerEnd) return;
      nudge(
        `The user's focus timer just ended${detail.task ? ` (they were focusing on: "${detail.task}")` : ""}. Suggest a quick break activity in 1-2 sentences. Be gentle and brief.`,
      );
    };

    window.addEventListener("jast-task-completed", onTaskDone);
    window.addEventListener("jast-timer-finished", onTimerEnd);
    return () => {
      window.removeEventListener("jast-task-completed", onTaskDone);
      window.removeEventListener("jast-timer-finished", onTimerEnd);
    };
  }, [setHistory, openChat]);

  return null;
}
