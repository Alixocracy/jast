import { createContext, useContext, ReactNode } from "react";
import { usePoints } from "@/hooks/usePoints";

interface PointsContextValue {
  total: number;
  history: { action: string; points: number; timestamp: string }[];
  addPoints: (action: string, points: number) => void;
  resetPoints: () => void;
}

const PointsContext = createContext<PointsContextValue | null>(null);

export function PointsProvider({ children }: { children: ReactNode }) {
  const points = usePoints();

  return (
    <PointsContext.Provider value={points}>
      {children}
    </PointsContext.Provider>
  );
}

export function usePointsContext() {
  const context = useContext(PointsContext);
  if (!context) {
    throw new Error("usePointsContext must be used within a PointsProvider");
  }
  return context;
}
