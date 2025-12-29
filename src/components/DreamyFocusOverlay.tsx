import { useEffect, useRef } from "react";
import { useFocusMode } from "@/contexts/FocusModeContext";
import { FocusTimer } from "./FocusTimer";
import { X, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";

export function DreamyFocusOverlay() {
  const { isFocusMode, focusedTask, setFocusedTask } = useFocusMode();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (isFocusMode) {
      if (!audioRef.current) {
        audioRef.current = new Audio("/audio/dreamer.mp3");
        audioRef.current.loop = true;
        audioRef.current.volume = 0.3;
      }
      audioRef.current.play().catch(console.log);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [isFocusMode]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  if (!isFocusMode || !focusedTask) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      {/* Dreamy background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(220,40%,15%)] via-[hsl(230,35%,20%)] to-[hsl(25,30%,20%)] overflow-hidden">
        {/* Stars */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/60 rounded-full animate-twinkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 60}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
        
        {/* Moon glow */}
        <div 
          className="absolute top-[15%] right-[20%] w-32 h-32 rounded-full animate-float"
          style={{
            background: "radial-gradient(circle, hsl(45, 40%, 90%) 0%, hsl(45, 30%, 70%) 40%, transparent 70%)",
            boxShadow: "0 0 80px 40px hsl(45, 40%, 70% / 0.3)",
          }}
        />
        
        {/* Clouds/mist layers */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-[60%] opacity-40 animate-drift"
          style={{
            background: "linear-gradient(to top, hsl(35, 30%, 60% / 0.4), transparent)",
          }}
        />
        <div 
          className="absolute bottom-[10%] left-[-10%] w-[120%] h-[40%] opacity-30 animate-drift-slow"
          style={{
            background: "radial-gradient(ellipse at center, hsl(220, 30%, 50% / 0.3), transparent 70%)",
          }}
        />
        
        {/* Noise/grain texture overlay */}
        <div 
          className="absolute inset-0 opacity-[0.15] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-4 max-w-md w-full">
        {/* Close button */}
        <button
          onClick={() => setFocusedTask(null)}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 backdrop-blur-sm text-white/70 hover:text-white hover:bg-white/20 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Mute button */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="absolute top-4 left-4 p-2 rounded-full bg-white/10 backdrop-blur-sm text-white/70 hover:text-white hover:bg-white/20 transition-all"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>

        {/* Timer with dreamy styling */}
        <div className="dreamy-timer w-full">
          <FocusTimer />
        </div>

        {/* Focused task card */}
        <div 
          className="w-full p-6 rounded-2xl backdrop-blur-md border border-white/20 animate-scale-in"
          style={{
            backgroundColor: `${focusedTask.color}20`,
            boxShadow: `0 0 60px ${focusedTask.color}30, inset 0 1px 0 rgba(255,255,255,0.1)`,
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: focusedTask.color }}
            />
            <span className="font-medium text-white text-lg">
              {focusedTask.text}
            </span>
          </div>
          <p className="text-white/60 text-sm mt-3">
            Breathe. Focus. You've got this. ✨
          </p>
        </div>
      </div>
    </div>
  );
}
