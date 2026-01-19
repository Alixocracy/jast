import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { useFocusMode } from "@/contexts/FocusModeContext";
import { FocusTimer } from "./FocusTimer";
import { YouTubeAudioPlayer } from "./YouTubeAudioPlayer";
import { X, Volume2, VolumeX, Image, ChevronDown, Check } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Import background images
import mistyForest from "@/assets/backgrounds/misty-forest.png";
import moonlitSky from "@/assets/backgrounds/moonlit-sky.png";
import oceanSunset from "@/assets/backgrounds/ocean-sunset.png";
import mountainLake from "@/assets/backgrounds/mountain-lake.png";
import zenGarden from "@/assets/backgrounds/zen-garden.png";
import auroraNight from "@/assets/backgrounds/aurora-night.png";
import cherryBlossom from "@/assets/backgrounds/cherry-blossom.png";
import lavenderFields from "@/assets/backgrounds/lavender-fields.png";
import goldenMeadow from "@/assets/backgrounds/golden-meadow.png";
import tropicalFalls from "@/assets/backgrounds/tropical-falls.png";
import marsHorizon from "@/assets/backgrounds/mars-horizon.png";
import alpineDawn from "@/assets/backgrounds/alpine-dawn.png";
import marsPanorama from "@/assets/backgrounds/mars-panorama.png";

interface Background {
  id: string;
  name: string;
  src: string;
  isPanoramic?: boolean;
}

const BACKGROUNDS: Background[] = [
  { id: "forest", name: "Misty Forest", src: mistyForest },
  { id: "moon", name: "Moonlit Sky", src: moonlitSky },
  { id: "ocean", name: "Ocean Sunset", src: oceanSunset },
  { id: "lake", name: "Mountain Lake", src: mountainLake },
  { id: "zen", name: "Zen Garden", src: zenGarden },
  { id: "aurora", name: "Aurora Night", src: auroraNight },
  { id: "cherry", name: "Cherry Blossom", src: cherryBlossom },
  { id: "lavender", name: "Lavender Fields", src: lavenderFields },
  { id: "meadow", name: "Golden Meadow", src: goldenMeadow },
  { id: "tropical", name: "Tropical Falls", src: tropicalFalls },
  { id: "mars", name: "Mars Horizon", src: marsHorizon },
  { id: "alpine", name: "Alpine Dawn", src: alpineDawn },
  { id: "mars-pano", name: "Mars Journey", src: marsPanorama, isPanoramic: true },
];

// Pre-generate stable random values for particles
const generateDustParticles = () =>
  [...Array(60)].map(() => ({
    width: 1 + Math.random() * 3,
    height: 1 + Math.random() * 3,
    left: Math.random() * 100,
    top: Math.random() * 100,
    animationDelay: Math.random() * 8,
    animationDuration: 6 + Math.random() * 8,
  }));

const generateStars = () =>
  [...Array(30)].map(() => ({
    left: Math.random() * 100,
    top: Math.random() * 50,
    animationDelay: Math.random() * 4,
    animationDuration: 2 + Math.random() * 3,
  }));

interface Task {
  id: string;
  text: string;
  completed: boolean;
  color: string;
}

const STORAGE_KEY = "focusflow-tasks";

export function DreamyFocusOverlay() {
  const { isFocusMode, focusedTask, setFocusedTask } = useFocusMode();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedBg, setSelectedBg] = useState(BACKGROUNDS[0]);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [isYouTubeActive, setIsYouTubeActive] = useState(false);
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [undoneTasks, setUndoneTasks] = useState<Task[]>([]);

  // Memoize particles so they don't regenerate on every render
  const dustParticles = useMemo(() => generateDustParticles(), []);
  const stars = useMemo(() => generateStars(), []);

  // Load undone tasks from localStorage
  useEffect(() => {
    if (isFocusMode) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const tasks: Task[] = JSON.parse(stored);
          const undone = tasks.filter(t => !t.completed);
          setUndoneTasks(undone);
        }
      } catch (e) {
        console.error("Failed to load tasks", e);
      }
    }
  }, [isFocusMode]);

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

  // Handle local audio playback (only when YouTube is not active)
  useEffect(() => {
    if (isFocusMode && !isYouTubeActive) {
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
  }, [isFocusMode, isYouTubeActive]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Attempt to play local audio on any click (for browsers that block autoplay)
  const handleOverlayClick = () => {
    if (!isYouTubeActive && audioRef.current && audioRef.current.paused && !isMuted) {
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
        {selectedBg.isPanoramic ? (
          /* Panoramic scrolling background - duplicated for seamless loop */
          <div 
            className="absolute top-0 left-0 h-full flex animate-pan-horizontal"
          >
            <img 
              src={selectedBg.src} 
              alt={selectedBg.name}
              className="h-full w-auto flex-shrink-0"
            />
            <img 
              src={selectedBg.src} 
              alt={selectedBg.name}
              className="h-full w-auto flex-shrink-0"
            />
          </div>
        ) : (
          <img 
            src={selectedBg.src} 
            alt={selectedBg.name}
            className="w-full h-full object-cover transition-opacity duration-500"
          />
        )}
        {/* Very light overlay to keep background visible */}
        <div className="absolute inset-0 bg-black/15" />
        
        {/* Floating dust particles */}
        <div className="absolute inset-0 pointer-events-none">
          {dustParticles.map((particle, i) => (
            <div
              key={`dust-${i}`}
              className="absolute rounded-full bg-white/40 animate-float-dust"
              style={{
                width: `${particle.width}px`,
                height: `${particle.height}px`,
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                animationDelay: `${particle.animationDelay}s`,
                animationDuration: `${particle.animationDuration}s`,
              }}
            />
          ))}
        </div>

        {/* Twinkling stars */}
        <div className="absolute inset-0 pointer-events-none">
          {stars.map((star, i) => (
            <div
              key={`star-${i}`}
              className="absolute w-1 h-1 bg-white/50 rounded-full animate-twinkle"
              style={{
                left: `${star.left}%`,
                top: `${star.top}%`,
                animationDelay: `${star.animationDelay}s`,
                animationDuration: `${star.animationDuration}s`,
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
      <div className="relative z-30 flex justify-center pt-8">
        <div
          className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-black/30 backdrop-blur-md border border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Timer - compact mode for Safari compatibility */}
          <FocusTimer compact />

          {/* Divider */}
          <div className="w-px h-16 bg-white/20" />

          {/* Additional controls */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <TooltipProvider delayDuration={200}>
                {/* Audio toggle */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        setIsMuted(!isMuted);
                        if (isMuted && !isYouTubeActive && audioRef.current?.paused) {
                          audioRef.current.play().catch(() => {});
                        }
                      }}
                      className="p-2 rounded-lg bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-all"
                      aria-label={isMuted ? "Unmute music" : "Mute music"}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-black/80 text-white border-white/20">
                    {isMuted ? "Unmute" : "Mute"}
                  </TooltipContent>
                </Tooltip>


                {/* YouTube audio player */}
                <YouTubeAudioPlayer
                  isActive={isYouTubeActive}
                  isMuted={isMuted}
                  onActiveChange={setIsYouTubeActive}
                />

                {/* Background picker */}
                <div className="relative">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setShowBgPicker(!showBgPicker)}
                        className="p-2 rounded-lg bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-all"
                        aria-label="Change background"
                      >
                        <Image className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-black/80 text-white border-white/20">
                      Change background
                    </TooltipContent>
                  </Tooltip>

                {/* Background picker dropdown */}
                {showBgPicker && (
                  <div 
                    className="absolute top-full mt-2 right-0 p-3 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 animate-scale-in z-[100] pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex flex-col gap-2">
                      {/* First row - static backgrounds */}
                      <div className="flex gap-2">
                        {BACKGROUNDS.filter(bg => !bg.isPanoramic).slice(0, 6).map((bg) => (
                          <button
                            key={bg.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBg(bg);
                              setShowBgPicker(false);
                            }}
                            className={`w-14 h-10 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
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
                      {/* Second row - static backgrounds */}
                      <div className="flex gap-2">
                        {BACKGROUNDS.filter(bg => !bg.isPanoramic).slice(6).map((bg) => (
                          <button
                            key={bg.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBg(bg);
                              setShowBgPicker(false);
                            }}
                            className={`w-14 h-10 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
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
                      {/* Third row - panoramic backgrounds */}
                      <div className="flex gap-2 pt-1 border-t border-white/10">
                        {BACKGROUNDS.filter(bg => bg.isPanoramic).map((bg) => (
                          <button
                            key={bg.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBg(bg);
                              setShowBgPicker(false);
                            }}
                            className={`flex-1 h-10 rounded-lg overflow-hidden border-2 transition-all relative ${
                              selectedBg.id === bg.id 
                                ? "border-white scale-[1.02]" 
                                : "border-transparent hover:border-white/50"
                            }`}
                            aria-label={bg.name}
                          >
                            <img 
                              src={bg.src} 
                              alt={bg.name}
                              className="w-full h-full object-cover"
                            />
                            {/* Moving indicator icon */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <span className="text-white/80 text-[10px] font-medium tracking-wide">
                                🚀 {bg.name}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>

      {/* Task Card - Lower portion */}
      <div className="relative z-10 flex-1 flex items-end justify-center pb-[20%]">
        <div className="px-4 flex flex-col items-center">
          <div className="relative">
            {/* Main task card - clickable to show task picker */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTaskPicker(!showTaskPicker);
              }}
              className="p-6 rounded-2xl backdrop-blur-sm border border-white/15 animate-scale-in cursor-pointer hover:bg-white/5 transition-all group text-left"
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
                <span className="font-medium text-white text-xl flex-1">
                  {focusedTask.text}
                </span>
                <ChevronDown className={`w-5 h-5 text-white/50 transition-transform ${showTaskPicker ? 'rotate-180' : ''}`} />
              </div>
              <p className="text-white/50 text-sm mt-3">
                Breathe. Focus. You've got this. ✨
              </p>
            </button>

            {/* Task picker dropdown */}
            {showTaskPicker && undoneTasks.length > 1 && (
              <div 
                className="absolute bottom-full mb-2 left-0 right-0 p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 animate-scale-in max-h-[300px] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-white/40 text-xs px-2 py-1 mb-1">Switch to another task</p>
                {undoneTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => {
                      setFocusedTask({
                        id: task.id,
                        text: task.text,
                        color: task.color,
                      });
                      setShowTaskPicker(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                      focusedTask.id === task.id 
                        ? 'bg-white/20' 
                        : 'hover:bg-white/10'
                    }`}
                  >
                    <div 
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: task.color }}
                    />
                    <span className="text-white text-sm text-left flex-1 truncate">
                      {task.text}
                    </span>
                    {focusedTask.id === task.id && (
                      <Check className="w-4 h-4 text-white/70 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
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
