import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";

interface FocusTimerProps {
  defaultMinutes?: number;
}

export function FocusTimer({ defaultMinutes = 25 }: FocusTimerProps) {
  const [timeLeft, setTimeLeft] = useState(defaultMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(defaultMinutes);

  const durations = [5, 15, 25, 45];

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const toggleTimer = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(selectedDuration * 60);
  }, [selectedDuration]);

  const selectDuration = useCallback((minutes: number) => {
    setSelectedDuration(minutes);
    setTimeLeft(minutes * 60);
    setIsRunning(false);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = ((selectedDuration * 60 - timeLeft) / (selectedDuration * 60)) * 100;

  return (
    <div className="bg-card rounded-2xl p-6 shadow-card animate-fade-in animate-delay-100">
      <h2 className="text-lg font-semibold text-foreground mb-4">Focus Timer</h2>
      
      {/* Duration selector */}
      <div className="flex gap-2 mb-6">
        {durations.map((duration) => (
          <button
            key={duration}
            onClick={() => selectDuration(duration)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              selectedDuration === duration
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {duration}m
          </button>
        ))}
      </div>

      {/* Timer display */}
      <div className="relative flex items-center justify-center mb-6">
        <svg className="w-40 h-40 transform -rotate-90">
          <circle
            cx="80"
            cy="80"
            r="70"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted"
          />
          <circle
            cx="80"
            cy="80"
            r="70"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={440}
            strokeDashoffset={440 - (440 * progress) / 100}
            strokeLinecap="round"
            className="text-primary transition-all duration-1000"
          />
        </svg>
        <span className="absolute text-4xl font-light text-foreground tabular-nums">
          {formatTime(timeLeft)}
        </span>
      </div>

      {/* Controls */}
      <div className="flex gap-3 justify-center">
        <Button
          variant="default"
          size="lg"
          onClick={toggleTimer}
          className="gap-2"
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Start
            </>
          )}
        </Button>
        <Button variant="outline" size="lg" onClick={resetTimer}>
          <RotateCcw className="w-5 h-5" />
        </Button>
      </div>

      {isRunning && (
        <p className="text-center text-sm text-muted-foreground mt-4 animate-pulse-gentle">
          You're doing great. Stay focused. 🌱
        </p>
      )}
    </div>
  );
}
