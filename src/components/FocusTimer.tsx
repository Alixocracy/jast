import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import { useFocusMode } from "@/contexts/FocusModeContext";

interface FocusTimerProps {
  defaultMinutes?: number;
  compact?: boolean;
}

export function FocusTimer({ defaultMinutes = 25, compact = false }: FocusTimerProps) {
  const { isFocusMode, initialTimerSeconds, setInitialTimerSeconds, isTimerRunning, setIsTimerRunning } = useFocusMode();
  
  // Initialize from context values so timer persists across focus mode transitions
  const [timeLeft, setTimeLeft] = useState(() => initialTimerSeconds);
  // In focus mode we always auto-start, regardless of main page running state
  const [isRunning, setIsRunning] = useState(() => (isFocusMode ? true : isTimerRunning));
  const [selectedDuration, setSelectedDuration] = useState(() => Math.ceil(initialTimerSeconds / 60));
  const [isEditing, setIsEditing] = useState(false);
  const [customTime, setCustomTime] = useState("");
  const alarmRef = useRef<HTMLAudioElement | null>(null);
  const alarmTimeoutsRef = useRef<number[]>([]);
  const previousTimeLeftRef = useRef(timeLeft);
  const previousFocusModeRef = useRef(isFocusMode);
  const wasRunningBeforeEditRef = useRef(false);
  const hasInitializedRef = useRef(false);

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

  // Sync from context when component mounts or when transitioning focus modes
  useEffect(() => {
    const wasFocusMode = previousFocusModeRef.current;
    
    // Skip on first render since we initialized from context
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      previousFocusModeRef.current = isFocusMode;
      return;
    }
    
    if (isFocusMode && !wasFocusMode) {
      // Entering focus mode: use the timer value from context and always start running
      setTimeLeft(initialTimerSeconds);
      setSelectedDuration(Math.ceil(initialTimerSeconds / 60));
      setIsRunning(true);
    } else if (!isFocusMode && wasFocusMode) {
      // Exiting focus mode: save current state to context, keep timer running if it was
      stopAlarm();
      setIsTimerRunning(isRunning);
      setInitialTimerSeconds(timeLeft);
    }
    previousFocusModeRef.current = isFocusMode;
  }, [isFocusMode, initialTimerSeconds, stopAlarm, isTimerRunning, setIsTimerRunning, isRunning, timeLeft, setInitialTimerSeconds]);

  // Sync timer state to context so it persists across focus mode transitions (including unmount)
  useEffect(() => {
    setInitialTimerSeconds(timeLeft);
    setIsTimerRunning(isRunning);
  }, [timeLeft, isRunning, setInitialTimerSeconds, setIsTimerRunning]);

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

  // Compact SVG dimensions for focus mode (Safari-compatible - no CSS geometry props)
  const svgSize = compact ? 72 : 160;
  const circleCenter = compact ? 36 : 80;
  const circleRadius = compact ? 30 : 70;
  const strokeWidth = compact ? 5 : 8;
  const circumference = 2 * Math.PI * circleRadius;

  // Compact mode for focus overlay
  if (compact) {
    return (
      <div className="flex items-center gap-4">
        {/* Timer circle */}
        <div className="relative flex items-center justify-center">
          <svg 
            width={svgSize} 
            height={svgSize} 
            className="transform -rotate-90"
            style={{ width: svgSize, height: svgSize }}
          >
            <circle
              cx={circleCenter}
              cy={circleCenter}
              r={circleRadius}
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth={strokeWidth}
              fill="none"
            />
            <circle
              cx={circleCenter}
              cy={circleCenter}
              r={circleRadius}
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (circumference * progress) / 100}
              strokeLinecap="round"
              className="transition-all duration-1000"
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
              className="absolute text-center text-sm font-medium text-white bg-black/50 border border-white/30 rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-white/60"
              style={{ width: "60px" }}
            />
          ) : (
            <button
              type="button"
              onClick={startEditing}
              className="absolute text-base font-medium text-white tabular-nums focus:outline-none focus:ring-2 focus:ring-white/60 rounded px-1"
              aria-label="Set custom timer minutes"
            >
              {formatTime(timeLeft)}
            </button>
          )}
        </div>

        {/* Duration buttons */}
        <div className="flex gap-1.5">
          {durations.map((duration) => (
            <button
              key={duration}
              onClick={() => selectDuration(duration)}
              className={`px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                selectedDuration === duration
                  ? "bg-white/30 text-white"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              {duration}m
            </button>
          ))}
        </div>

        {/* Play/Pause button */}
        <button
          onClick={toggleTimer}
          className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-all"
          aria-label={isRunning ? "Pause timer" : "Start timer"}
        >
          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
      </div>
    );
  }

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
        <svg 
          width={svgSize} 
          height={svgSize} 
          className="transform -rotate-90"
          style={{ width: svgSize, height: svgSize }}
        >
          <circle
            cx={circleCenter}
            cy={circleCenter}
            r={circleRadius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-muted"
          />
          <circle
            cx={circleCenter}
            cy={circleCenter}
            r={circleRadius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (circumference * progress) / 100}
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
