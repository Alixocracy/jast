// Bridge for JAST tool calls + reading shared context from localStorage

import type { JastSettings } from "@/contexts/JastContext";

const TASKS_KEY = "focusflow-tasks";
const BACKLOG_KEY = "focusflow-backlog";
const BRAINDUMP_KEY = "focusflow-braindump";

const TASK_COLORS = ["#A8C5A8", "#C5A8C5", "#A8C5D5", "#E5C5A8", "#E5A8B5", "#A8E5D5", "#E5E5A8", "#E5B5A8"];

function readJSON<T>(key: string, fallback: T): T {
  try {
    const s = localStorage.getItem(key);
    if (s) return JSON.parse(s);
  } catch {}
  return fallback;
}

function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function buildJastContext(settings: JastSettings) {
  const ctx: any = {};
  const tasks = readJSON<any[]>(TASKS_KEY, []);
  if (settings.shareTasks) {
    ctx.tasks = tasks.map((t) => ({
      id: t.id,
      text: t.text,
      completed: t.completed,
      timeSpent: t.timeSpent || 0,
    }));
  }
  if (settings.shareBacklog) {
    ctx.backlog = readJSON<any[]>(BACKLOG_KEY, []).map((t) => ({ id: t.id, text: t.text }));
  }
  if (settings.shareBrainDump) {
    ctx.brainDump = readJSON<any[]>(BRAINDUMP_KEY, []).map((t) => ({ id: t.id, text: t.text }));
  }
  if (settings.shareProgress) {
    const done = tasks.filter((t) => t.completed).length;
    ctx.progress = {
      done,
      total: tasks.length,
      percentDone: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
    };
  }
  return ctx;
}

// --- Tool executors ---
export type JastToolCall =
  | { name: "add_task"; args: { text: string; color?: string } }
  | { name: "complete_task"; args: { id: string } }
  | { name: "edit_task"; args: { id: string; text: string } }
  | { name: "delete_task"; args: { id: string } }
  | { name: "add_to_backlog"; args: { text: string } }
  | { name: "add_brain_dump"; args: { text: string } };

export function executeJastTool(call: JastToolCall): string {
  try {
    switch (call.name) {
      case "add_task": {
        const tasks = readJSON<any[]>(TASKS_KEY, []);
        const incompleteCount = tasks.filter((t) => !t.completed).length;
        const newTask = {
          id: Date.now().toString(),
          text: call.args.text,
          completed: false,
          color: call.args.color || TASK_COLORS[Math.floor(Math.random() * TASK_COLORS.length)],
        };
        if (incompleteCount >= 10) {
          // overflow to backlog
          const backlog = readJSON<any[]>(BACKLOG_KEY, []);
          backlog.push(newTask);
          writeJSON(BACKLOG_KEY, backlog);
          window.dispatchEvent(new CustomEvent("backlog-updated"));
          return `Today is full — added to backlog instead: "${call.args.text}"`;
        }
        tasks.push(newTask);
        writeJSON(TASKS_KEY, tasks);
        window.dispatchEvent(new CustomEvent("tasks-updated-from-focus"));
        return `Added task: "${call.args.text}"`;
      }
      case "complete_task": {
        const tasks = readJSON<any[]>(TASKS_KEY, []);
        const updated = tasks.map((t) => (t.id === call.args.id ? { ...t, completed: true } : t));
        writeJSON(TASKS_KEY, updated);
        window.dispatchEvent(new CustomEvent("tasks-updated-from-focus"));
        return "Marked complete.";
      }
      case "edit_task": {
        const tasks = readJSON<any[]>(TASKS_KEY, []);
        const updated = tasks.map((t) =>
          t.id === call.args.id ? { ...t, text: call.args.text } : t,
        );
        writeJSON(TASKS_KEY, updated);
        window.dispatchEvent(new CustomEvent("tasks-updated-from-focus"));
        return "Updated.";
      }
      case "delete_task": {
        const tasks = readJSON<any[]>(TASKS_KEY, []);
        writeJSON(TASKS_KEY, tasks.filter((t) => t.id !== call.args.id));
        window.dispatchEvent(new CustomEvent("tasks-updated-from-focus"));
        return "Deleted.";
      }
      case "add_to_backlog": {
        const backlog = readJSON<any[]>(BACKLOG_KEY, []);
        backlog.push({
          id: Date.now().toString(),
          text: call.args.text,
          color: TASK_COLORS[0],
        });
        writeJSON(BACKLOG_KEY, backlog);
        window.dispatchEvent(new CustomEvent("backlog-updated"));
        return `Added to backlog: "${call.args.text}"`;
      }
      case "add_brain_dump": {
        const dump = readJSON<any[]>(BRAINDUMP_KEY, []);
        dump.unshift({
          id: Date.now().toString(),
          text: call.args.text,
          timestamp: new Date().toISOString(),
        });
        writeJSON(BRAINDUMP_KEY, dump);
        window.dispatchEvent(new CustomEvent("braindump-updated"));
        return `Added to brain dump.`;
      }
    }
  } catch (e) {
    return `Tool error: ${e instanceof Error ? e.message : "unknown"}`;
  }
  return "Unknown tool.";
}
