import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

export type JastTone = "warm" | "energetic" | "coach";

export interface JastSettings {
  enabled: boolean;
  tone: JastTone;
  shareTasks: boolean;
  shareBacklog: boolean;
  shareBrainDump: boolean;
  shareProgress: boolean;
  commentOnTaskDone: boolean;
  commentOnTimerEnd: boolean;
}

const DEFAULT_SETTINGS: JastSettings = {
  enabled: false,
  tone: "warm",
  shareTasks: true,
  shareBacklog: false,
  shareBrainDump: false,
  shareProgress: true,
  commentOnTaskDone: true,
  commentOnTimerEnd: true,
};

const SETTINGS_KEY = "jast-settings";
const HISTORY_KEY = "jast-chat-history";

export interface JastMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isNudge?: boolean;
}

interface JastContextValue {
  settings: JastSettings;
  updateSettings: (patch: Partial<JastSettings>) => void;
  history: JastMessage[];
  setHistory: (m: JastMessage[] | ((prev: JastMessage[]) => JastMessage[])) => void;
  clearHistory: () => void;
  isOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  unread: number;
  markRead: () => void;
}

const JastContext = createContext<JastContextValue | null>(null);

export function JastProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<JastSettings>(() => {
    try {
      const s = localStorage.getItem(SETTINGS_KEY);
      if (s) return { ...DEFAULT_SETTINGS, ...JSON.parse(s) };
    } catch {}
    return DEFAULT_SETTINGS;
  });
  const [history, setHistoryState] = useState<JastMessage[]>(() => {
    try {
      const s = localStorage.getItem(HISTORY_KEY);
      if (s) return JSON.parse(s);
    } catch {}
    return [];
  });
  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-200)));
    } catch {}
  }, [history]);

  const updateSettings = useCallback((patch: Partial<JastSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const setHistory = useCallback(
    (m: JastMessage[] | ((prev: JastMessage[]) => JastMessage[])) => {
      setHistoryState((prev) => {
        const next = typeof m === "function" ? (m as any)(prev) : m;
        return next;
      });
    },
    [],
  );

  const clearHistory = useCallback(() => setHistoryState([]), []);

  const openChat = useCallback(() => {
    setIsOpen(true);
    setUnread(0);
  }, []);
  const closeChat = useCallback(() => setIsOpen(false), []);
  const markRead = useCallback(() => setUnread(0), []);

  // Track unread nudges added while drawer is closed
  useEffect(() => {
    const handler = () => {
      if (!isOpen) setUnread((u) => u + 1);
    };
    window.addEventListener("jast-nudge-added", handler);
    return () => window.removeEventListener("jast-nudge-added", handler);
  }, [isOpen]);

  return (
    <JastContext.Provider
      value={{
        settings,
        updateSettings,
        history,
        setHistory,
        clearHistory,
        isOpen,
        openChat,
        closeChat,
        unread,
        markRead,
      }}
    >
      {children}
    </JastContext.Provider>
  );
}

export function useJast() {
  const ctx = useContext(JastContext);
  if (!ctx) throw new Error("useJast must be used within JastProvider");
  return ctx;
}
