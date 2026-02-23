import { createContext, useContext, useState, useRef, useEffect, useCallback, ReactNode } from "react";

interface FocusedTask {
  id: string;
  text: string;
  color: string;
}

interface FocusModeContextType {
  focusedTask: FocusedTask | null;
  setFocusedTask: (task: FocusedTask | null) => void;
  isFocusMode: boolean;
  initialTimerSeconds: number;
  setInitialTimerSeconds: (seconds: number) => void;
  isTimerRunning: boolean;
  setIsTimerRunning: (running: boolean) => void;
  recordTimeForTask: () => void;
}

const TASKS_STORAGE_KEY = "focusflow-tasks";

/** Add elapsed seconds to a task's timeSpent in localStorage */
function addTimeToTask(taskId: string, seconds: number) {
  if (seconds <= 0) return;
  try {
    const stored = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!stored) return;
    const tasks = JSON.parse(stored);
    const updated = tasks.map((t: any) =>
      t.id === taskId ? { ...t, timeSpent: (t.timeSpent || 0) + seconds } : t
    );
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("tasks-updated-from-focus"));
  } catch (e) {
    console.error("Failed to save time to task", e);
  }
}

const FocusModeContext = createContext<FocusModeContextType | undefined>(undefined);

export function FocusModeProvider({ children }: { children: ReactNode }) {
  const [focusedTask, setFocusedTaskState] = useState<FocusedTask | null>(null);
  const [initialTimerSeconds, setInitialTimerSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const focusStartRef = useRef<number | null>(null);
  const focusedTaskRef = useRef<FocusedTask | null>(null);

  // Keep ref in sync
  useEffect(() => {
    focusedTaskRef.current = focusedTask;
  }, [focusedTask]);

  /** Flush accumulated time from focusStartRef to the current focused task */
  const recordTimeForTask = useCallback(() => {
    if (focusStartRef.current && focusedTaskRef.current) {
      const elapsed = Math.round((Date.now() - focusStartRef.current) / 1000);
      addTimeToTask(focusedTaskRef.current.id, elapsed);
      focusStartRef.current = null;
    }
  }, []);

  /** Start tracking when timer starts running on a focused task */
  useEffect(() => {
    if (isTimerRunning && focusedTask) {
      if (!focusStartRef.current) {
        focusStartRef.current = Date.now();
      }
    } else {
      // Timer paused or stopped — record elapsed
      recordTimeForTask();
    }
  }, [isTimerRunning, focusedTask, recordTimeForTask]);

  const setFocusedTask = useCallback((task: FocusedTask | null) => {
    // If switching tasks while timer is running, record time for old task first
    if (focusedTaskRef.current && focusStartRef.current) {
      const elapsed = Math.round((Date.now() - focusStartRef.current) / 1000);
      addTimeToTask(focusedTaskRef.current.id, elapsed);
      focusStartRef.current = null;
    }
    setFocusedTaskState(task);
    // If new task and timer is running, start tracking immediately
    if (task && isTimerRunning) {
      focusStartRef.current = Date.now();
    }
  }, [isTimerRunning]);

  return (
    <FocusModeContext.Provider value={{
      focusedTask,
      setFocusedTask,
      isFocusMode: focusedTask !== null,
      initialTimerSeconds,
      setInitialTimerSeconds,
      isTimerRunning,
      setIsTimerRunning,
      recordTimeForTask,
    }}>
      {children}
    </FocusModeContext.Provider>
  );
}

export function useFocusMode() {
  const context = useContext(FocusModeContext);
  if (!context) {
    throw new Error("useFocusMode must be used within a FocusModeProvider");
  }
  return context;
}
