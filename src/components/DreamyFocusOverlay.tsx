import { useEffect, useRef, useCallback, useState } from "react";
import { useFocusMode } from "@/contexts/FocusModeContext";
import { FocusTimer } from "./FocusTimer";
import { X, Volume2, VolumeX, Image } from "lucide-react";

// Import background images
import mistyForest from "@/assets/backgrounds/misty-forest.png";
import moonlitSky from "@/assets/backgrounds/moonlit-sky.png";
import oceanSunset from "@/assets/backgrounds/ocean-sunset.png";
import mountainLake from "@/assets/backgrounds/mountain-lake.png";
import zenGarden from "@/assets/backgrounds/zen-garden.png";
import auroraNight from "@/assets/backgrounds/aurora-night.png";

const BACKGROUNDS = [
  { id: "forest", name: "Misty Forest", src: mistyForest },
  { id: "moon", name: "Moonlit Sky", src: moonlitSky },
  { id: "ocean", name: "Ocean Sunset", src: oceanSunset },
  { id: "lake", name: "Mountain Lake", src: mountainLake },
  { id: "zen", name: "Zen Garden", src: zenGarden },
  { id: "aurora", name: "Aurora Night", src: auroraNight },
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
      className="fixed inset-0 z-50 flex flex-col animate-fade-in"
      onClick={handleOverlayClick}
    >
      {/* Background image with minimal overlay */}
      <div className="absolute inset-0 overflow-hidden">
        <img 
          src={selectedBg.src} 
          alt={selectedBg.name}
          className="w-full h-full object-cover transition-opacity duration-500"
        />
        {/* Very light overlay to keep background visible */}
        <div className="absolute inset-0 bg-black/15" />
        
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
          className="absolute bottom-0 left-0 right-0 h-[50%] opacity-20 animate-drift pointer-events-none"
          style={{
            background: "linear-gradient(to top, rgba(255,255,255,0.3), transparent)",
          }}
        />
        <div 
          className="absolute bottom-[5%] left-[-20%] w-[140%] h-[40%] opacity-15 animate-drift-slow pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, rgba(255,255,255,0.4), transparent 70%)",
          }}
        />
        
        {/* Noise/grain texture overlay */}
        <div 
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Exit button - top right */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          exitFocusMode();
        }}
        className="fixed top-6 right-6 z-50 p-2 rounded-full bg-black/20 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/30 transition-all"
        aria-label="Exit focus mode"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Horizontal Control Panel - Top of page */}
      <div className="relative z-10 flex justify-center pt-8">
        <div 
          className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-black/30 backdrop-blur-md border border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Timer with layout based on sketch: display on left, controls on right */}
          <div className="dreamy-timer-panel">
            <FocusTimer />
          </div>

          {/* Divider */}
          <div className="w-px h-16 bg-white/20" />

          {/* Additional controls */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              {/* Audio toggle */}
              <button
                onClick={() => {
                  setIsMuted(!isMuted);
                  if (isMuted && audioRef.current?.paused) {
                    audioRef.current.play().catch(() => {});
                  }
                }}
                className="p-2 rounded-lg bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-all"
                aria-label={isMuted ? "Unmute music" : "Mute music"}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Background picker */}
              <div className="relative">
                <button
                  onClick={() => setShowBgPicker(!showBgPicker)}
                  className="p-2 rounded-lg bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-all"
                  aria-label="Change background"
                >
                  <Image className="w-4 h-4" />
                </button>

                {/* Background picker dropdown */}
                {showBgPicker && (
                  <div 
                    className="absolute top-full mt-2 right-0 p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 flex gap-2 animate-scale-in"
                  >
                    {BACKGROUNDS.map((bg) => (
                      <button
                        key={bg.id}
                        onClick={() => {
                          setSelectedBg(bg);
                          setShowBgPicker(false);
                        }}
                        className={`w-14 h-10 rounded-lg overflow-hidden border-2 transition-all ${
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
            </div>
          </div>
        </div>
      </div>

      {/* Task Card - Lower portion */}
      <div className="relative z-10 flex-1 flex items-end justify-center pb-[20%]">
        <div className="px-4 flex flex-col items-center">
          <div 
            className="p-6 rounded-2xl backdrop-blur-sm border border-white/15 animate-scale-in"
            style={{
              backgroundColor: `${focusedTask.color}15`,
              boxShadow: `0 0 40px ${focusedTask.color}20`,
              minWidth: '400px',
            }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full animate-pulse"
                style={{ backgroundColor: focusedTask.color }}
              />
              <span className="font-medium text-white text-xl">
                {focusedTask.text}
              </span>
            </div>
            <p className="text-white/50 text-sm mt-3">
              Breathe. Focus. You've got this. ✨
            </p>
          </div>
          {/* Exit hint */}
          <p className="text-white/30 text-xs text-center mt-4">
            Press ESC to exit focus mode
          </p>
        </div>
      </div>
    </div>
  );
}
