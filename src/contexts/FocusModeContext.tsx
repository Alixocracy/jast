import { createContext, useContext, useState, ReactNode } from "react";

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
}

const FocusModeContext = createContext<FocusModeContextType | undefined>(undefined);

export function FocusModeProvider({ children }: { children: ReactNode }) {
  const [focusedTask, setFocusedTask] = useState<FocusedTask | null>(null);
  const [initialTimerSeconds, setInitialTimerSeconds] = useState(25 * 60);

  return (
    <FocusModeContext.Provider value={{
      focusedTask,
      setFocusedTask,
      isFocusMode: focusedTask !== null,
      initialTimerSeconds,
      setInitialTimerSeconds,
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
