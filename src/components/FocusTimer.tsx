import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import { useFocusMode } from "@/contexts/FocusModeContext";

interface FocusTimerProps {
  defaultMinutes?: number;
}

export function FocusTimer({ defaultMinutes = 25 }: FocusTimerProps) {
  const { isFocusMode, initialTimerSeconds, setInitialTimerSeconds, isTimerRunning, setIsTimerRunning } = useFocusMode();
  
  const [timeLeft, setTimeLeft] = useState(defaultMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(defaultMinutes);
  const [isEditing, setIsEditing] = useState(false);
  const [customTime, setCustomTime] = useState("");
  const alarmRef = useRef<HTMLAudioElement | null>(null);
  const alarmTimeoutsRef = useRef<number[]>([]);
  const previousTimeLeftRef = useRef(timeLeft);
  const previousFocusModeRef = useRef(false);
  const wasRunningBeforeEditRef = useRef(false);

  const durations = [5, 15, 25, 45];

  useEffect(() => {
    const audio = new Audio("/audio/piano-alarm.wav");
    audio.preload = "auto";
    audio.volume = 0.5;
    alarmRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  const stopAlarm = useCallback(() => {
    alarmTimeoutsRef.current.forEach((id) => clearTimeout(id));
    alarmTimeoutsRef.current = [];

    if (alarmRef.current) {
      alarmRef.current.pause();
      alarmRef.current.currentTime = 0;
    }
  }, []);

  const playAlarmOnce = useCallback(() => {
    if (!alarmRef.current) return;
    alarmRef.current.pause();
    alarmRef.current.currentTime = 0;
    alarmRef.current.play().catch(() => {});
  }, []);

  const playAlarmSequence = useCallback(() => {
    stopAlarm();
    playAlarmOnce();

    const repeatDelayMs = 1700;
    const timeouts = [repeatDelayMs, repeatDelayMs * 2].map((delay) =>
      window.setTimeout(playAlarmOnce, delay)
    );

    alarmTimeoutsRef.current = timeouts;
  }, [playAlarmOnce, stopAlarm]);

  // When entering focus mode, use the shared timer value from context
  useEffect(() => {
    const wasFocusMode = previousFocusModeRef.current;
    if (isFocusMode && !wasFocusMode) {
      // Entering focus mode: use the timer value and running state from context
      setTimeLeft(initialTimerSeconds);
      setSelectedDuration(Math.ceil(initialTimerSeconds / 60));
      setIsRunning(isTimerRunning);
    } else if (!isFocusMode && wasFocusMode) {
      // Exiting focus mode: save current state to context, keep timer running if it was
      stopAlarm();
      setIsTimerRunning(isRunning);
      setInitialTimerSeconds(timeLeft);
    }
    previousFocusModeRef.current = isFocusMode;
  }, [isFocusMode, initialTimerSeconds, stopAlarm, isTimerRunning, setIsTimerRunning, isRunning, timeLeft, setInitialTimerSeconds]);

  // When not in focus mode, sync timer changes to context for focus mode to pick up
  useEffect(() => {
    if (!isFocusMode) {
      setInitialTimerSeconds(timeLeft);
      setIsTimerRunning(isRunning);
    }
  }, [timeLeft, isRunning, isFocusMode, setInitialTimerSeconds, setIsTimerRunning]);

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

  useEffect(() => {
    const prev = previousTimeLeftRef.current;
    if (prev > 0 && timeLeft === 0) {
      playAlarmSequence();
    }
    previousTimeLeftRef.current = timeLeft;
  }, [playAlarmSequence, timeLeft]);

  const toggleTimer = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  const selectDuration = useCallback((minutes: number) => {
    stopAlarm();
    setSelectedDuration(minutes);
    setTimeLeft(minutes * 60);
    // Keep the current running state (no-op) so active timers continue
  }, [stopAlarm]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const parseSecondsFromInput = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return null;

    if (trimmed.includes(":")) {
      const [minsPart, secsPart = "0"] = trimmed.split(":");
      const mins = Number(minsPart);
      const secs = Number(secsPart);
      if (Number.isNaN(mins) || Number.isNaN(secs)) return null;
      return Math.max(1, mins * 60 + secs);
    }

    const minutesOnly = Number(trimmed);
    if (Number.isNaN(minutesOnly)) return null;
    return Math.max(1, minutesOnly * 60);
  };

  const startEditing = () => {
    wasRunningBeforeEditRef.current = isRunning;
    stopAlarm();
    setIsRunning(false);
    setIsEditing(true);
    setCustomTime(formatTime(timeLeft));
  };

  const commitCustomMinutes = () => {
    const totalSeconds = parseSecondsFromInput(customTime);
    if (!totalSeconds) {
      setIsRunning(wasRunningBeforeEditRef.current);
      setIsEditing(false);
      return;
    }

    const minutes = Math.max(1, Math.ceil(totalSeconds / 60));
    setSelectedDuration(minutes);
    setTimeLeft(totalSeconds);
    setIsRunning(wasRunningBeforeEditRef.current);
    setIsEditing(false);
  };

  const progress = ((selectedDuration * 60 - timeLeft) / (selectedDuration * 60)) * 100;

  return (
    <div className="bg-card rounded-2xl p-6 shadow-card animate-fade-in animate-delay-100">
      <h2 className="text-lg font-semibold text-foreground mb-4">Focus Timer</h2>
      
      {/* Duration selector */}
      <div className="flex gap-2 mb-6 justify-center flex-wrap">
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
        {isEditing ? (
          <input
            type="text"
            inputMode="numeric"
            value={customTime}
            autoFocus
            onChange={(e) => setCustomTime(e.target.value)}
            onBlur={commitCustomMinutes}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitCustomMinutes();
              if (e.key === "Escape") setIsEditing(false);
            }}
            className="absolute shrink-0 text-center text-3xl font-light leading-tight text-foreground bg-background/90 border border-input/70 rounded-md px-1.5 py-1 focus:outline-none focus:ring-2 focus:ring-primary/60"
            style={{ width: "112px", minWidth: "112px", maxWidth: "112px" }}
          />
        ) : (
          <button
            type="button"
            onClick={startEditing}
            className="absolute text-4xl font-light text-foreground tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/60 rounded-lg px-2"
            aria-label="Set custom timer minutes"
          >
            {formatTime(timeLeft)}
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center">
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
      </div>

      {isRunning && (
        <p className="text-center text-sm text-muted-foreground mt-4 animate-pulse-gentle">
          You're doing great. Stay focused. 🌱
        </p>
      )}
    </div>
  );
}
