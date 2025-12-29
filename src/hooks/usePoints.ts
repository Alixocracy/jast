import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "focusflow-points";

export interface PointsData {
  total: number;
  history: { action: string; points: number; timestamp: string }[];
}

const getStoredPoints = (): PointsData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load points from localStorage", e);
  }
  return { total: 0, history: [] };
};

export function usePoints() {
  const [pointsData, setPointsData] = useState<PointsData>(getStoredPoints);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pointsData));
  }, [pointsData]);

  const addPoints = useCallback((action: string, points: number) => {
    setPointsData((prev) => ({
      total: prev.total + points,
      history: [
        { action, points, timestamp: new Date().toISOString() },
        ...prev.history.slice(0, 49), // Keep last 50 entries
      ],
    }));
  }, []);

  const resetPoints = useCallback(() => {
    setPointsData({ total: 0, history: [] });
  }, []);

  return {
    total: pointsData.total,
    history: pointsData.history,
    addPoints,
    resetPoints,
  };
}
