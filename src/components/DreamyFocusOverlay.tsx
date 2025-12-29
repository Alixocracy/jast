import { useEffect, useRef, useCallback, useState } from "react";
import { useFocusMode } from "@/contexts/FocusModeContext";
import { FocusTimer } from "./FocusTimer";
import { X, Volume2, VolumeX, Image } from "lucide-react";

// Import background images
import watercolorLandscape from "@/assets/backgrounds/watercolor-landscape.png";
import mistyForest from "@/assets/backgrounds/misty-forest.png";
import moonlitSky from "@/assets/backgrounds/moonlit-sky.png";
import oceanSunset from "@/assets/backgrounds/ocean-sunset.png";

const BACKGROUNDS = [
  { id: "landscape", name: "Landscape", src: watercolorLandscape },
  { id: "forest", name: "Misty Forest", src: mistyForest },
  { id: "moon", name: "Moonlit Sky", src: moonlitSky },
  { id: "ocean", name: "Ocean Sunset", src: oceanSunset },
];

export function DreamyFocusOverlay() {
  const { isFocusMode, focusedTask, setFocusedTask } = useFocusMode();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedBg, setSelectedBg] = useState(BACKGROUNDS[0]);
  const [showBgPicker, setShowBgPicker] = useState(false);

  const exitFocusMode = useCallback(() => {
    setFocusedTask(null);
  }, [setFocusedTask]);

  // Handle escape key to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFocusMode) {
        exitFocusMode();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFocusMode, exitFocusMode]);

  // Handle audio playback
  useEffect(() => {
    if (isFocusMode) {
      if (!audioRef.current) {
        audioRef.current = new Audio("/audio/dreamer.mp3");
        audioRef.current.loop = true;
        audioRef.current.volume = 0.3;
      }
      
      // Play audio with user interaction handling
      const playAudio = async () => {
        try {
          await audioRef.current?.play();
        } catch (error) {
          console.log("Audio autoplay blocked, will play on next interaction");
        }
      };
      
      playAudio();
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

  // Attempt to play audio on any click (for browsers that block autoplay)
  const handleOverlayClick = () => {
    if (audioRef.current && audioRef.current.paused && !isMuted) {
      audioRef.current.play().catch(() => {});
    }
    setShowBgPicker(false);
  };

  if (!isFocusMode || !focusedTask) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
      onClick={handleOverlayClick}
    >
      {/* Background image with overlay */}
      <div className="absolute inset-0 overflow-hidden">
        <img 
          src={selectedBg.src} 
          alt={selectedBg.name}
          className="w-full h-full object-cover transition-opacity duration-500"
        />
        {/* Lighter dark overlay */}
        <div className="absolute inset-0 bg-black/25" />
        
        {/* Floating dust particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(60)].map((_, i) => (
            <div
              key={`dust-${i}`}
              className="absolute rounded-full bg-white/40 animate-float-dust"
              style={{
                width: `${1 + Math.random() * 3}px`,
                height: `${1 + Math.random() * 3}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 8}s`,
                animationDuration: `${6 + Math.random() * 8}s`,
              }}
            />
          ))}
        </div>

        {/* Twinkling stars */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div
              key={`star-${i}`}
              className="absolute w-1 h-1 bg-white/50 rounded-full animate-twinkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 50}%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        {/* Drifting fog layers */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-[50%] opacity-30 animate-drift pointer-events-none"
          style={{
            background: "linear-gradient(to top, rgba(255,255,255,0.3), transparent)",
          }}
        />
        <div 
          className="absolute bottom-[5%] left-[-20%] w-[140%] h-[40%] opacity-20 animate-drift-slow pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, rgba(255,255,255,0.4), transparent 70%)",
          }}
        />
        <div 
          className="absolute top-[20%] right-[-10%] w-[60%] h-[30%] opacity-15 animate-drift-reverse pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, rgba(255,255,255,0.3), transparent 60%)",
          }}
        />
        
        {/* Noise/grain texture overlay */}
        <div 
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Fixed position buttons at top corners */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          exitFocusMode();
        }}
        className="fixed top-6 right-6 z-50 p-3 rounded-full bg-white/10 backdrop-blur-sm text-white/70 hover:text-white hover:bg-white/20 transition-all"
        aria-label="Exit focus mode"
      >
        <X className="w-6 h-6" />
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsMuted(!isMuted);
          // Try to play if unmuting
          if (isMuted && audioRef.current?.paused) {
            audioRef.current.play().catch(() => {});
          }
        }}
        className="fixed top-6 left-6 z-50 p-3 rounded-full bg-white/10 backdrop-blur-sm text-white/70 hover:text-white hover:bg-white/20 transition-all"
        aria-label={isMuted ? "Unmute music" : "Mute music"}
      >
        {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
      </button>

      {/* Background picker button */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowBgPicker(!showBgPicker);
          }}
          className="p-3 rounded-full bg-white/10 backdrop-blur-sm text-white/70 hover:text-white hover:bg-white/20 transition-all"
          aria-label="Change background"
        >
          <Image className="w-6 h-6" />
        </button>

        {/* Background picker dropdown */}
        {showBgPicker && (
          <div 
            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 flex gap-2 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {BACKGROUNDS.map((bg) => (
              <button
                key={bg.id}
                onClick={() => {
                  setSelectedBg(bg);
                  setShowBgPicker(false);
                }}
                className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  selectedBg.id === bg.id 
                    ? "border-white scale-105" 
                    : "border-transparent hover:border-white/50"
                }`}
                aria-label={bg.name}
              >
                <img 
                  src={bg.src} 
                  alt={bg.name}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-4 max-w-md w-full">
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

        {/* Exit hint */}
        <p className="text-white/40 text-xs">
          Press ESC or click the X to exit focus mode
        </p>
      </div>
    </div>
  );
}
