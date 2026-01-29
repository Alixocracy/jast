import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { useFocusMode } from "@/contexts/FocusModeContext";
import { FocusTimer } from "./FocusTimer";
import { YouTubeAudioPlayer } from "./YouTubeAudioPlayer";
import { X, Volume2, VolumeX, Image, ChevronDown, Check, Minimize2, Maximize2, Plus, Pencil } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { TASK_COLORS, MAX_TODAY_TASKS } from "./TaskList";
import { addToBacklog } from "@/components/Backlog";

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
import marsPanoramaTile from "@/assets/backgrounds/mars-panorama-tile-hq.png";

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
  { id: "mars-pano", name: "Mars Journey", src: marsPanoramaTile, isPanoramic: true },
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
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");
  const [selectedColor, setSelectedColor] = useState(TASK_COLORS[0].value);

  // Memoize particles so they don't regenerate on every render
  const dustParticles = useMemo(() => generateDustParticles(), []);
  const stars = useMemo(() => generateStars(), []);

  // Load tasks from localStorage
  useEffect(() => {
    if (isFocusMode) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const tasks: Task[] = JSON.parse(stored);
          setAllTasks(tasks);
        }
      } catch (e) {
        console.error("Failed to load tasks", e);
      }
    }
  }, [isFocusMode]);

  // Derived undone tasks
  const undoneTasks = useMemo(() => allTasks.filter(t => !t.completed), [allTasks]);

  // Save tasks to localStorage when modified
  const saveTasks = useCallback((tasks: Task[]) => {
    setAllTasks(tasks);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    // Dispatch event to notify TaskList component
    window.dispatchEvent(new CustomEvent("tasks-updated-from-focus"));
  }, []);

  // Toggle task completion
  const handleToggleTask = useCallback((taskId: string) => {
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;
    
    const updatedTasks = allTasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    saveTasks(updatedTasks);
    
    if (!task.completed) {
      toast.success("Task completed! 🎉");
      // If this was the focused task, switch to another undone task
      if (focusedTask?.id === taskId) {
        const nextUndone = updatedTasks.find(t => !t.completed && t.id !== taskId);
        if (nextUndone) {
          setFocusedTask({ id: nextUndone.id, text: nextUndone.text, color: nextUndone.color });
        }
      }
    }
  }, [allTasks, saveTasks, focusedTask, setFocusedTask]);

  // Edit task text
  const handleStartEdit = useCallback((task: Task) => {
    setEditingTaskId(task.id);
    setEditText(task.text);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingTaskId || !editText.trim()) {
      setEditingTaskId(null);
      setEditText("");
      return;
    }
    
    const updatedTasks = allTasks.map(t =>
      t.id === editingTaskId ? { ...t, text: editText.trim() } : t
    );
    saveTasks(updatedTasks);
    
    // Update focused task if it was edited
    if (focusedTask?.id === editingTaskId) {
      setFocusedTask({ ...focusedTask, text: editText.trim() });
    }
    
    setEditingTaskId(null);
    setEditText("");
  }, [editingTaskId, editText, allTasks, saveTasks, focusedTask, setFocusedTask]);

  // Add new task
  const handleAddTask = useCallback(() => {
    if (!newTaskText.trim()) {
      setIsAddingTask(false);
      return;
    }
    
    const incompleteTasks = allTasks.filter(t => !t.completed);
    if (incompleteTasks.length >= MAX_TODAY_TASKS) {
      // Add to backlog instead
      addToBacklog({
        id: Date.now().toString(),
        text: newTaskText.trim(),
        color: selectedColor,
      });
      toast.info("Today's list is full. Task added to backlog.");
    } else {
      const newTask: Task = {
        id: Date.now().toString(),
        text: newTaskText.trim(),
        completed: false,
        color: selectedColor,
      };
      saveTasks([...allTasks, newTask]);
      toast.success("Task added!");
    }
    
    setNewTaskText("");
    setIsAddingTask(false);
  }, [newTaskText, selectedColor, allTasks, saveTasks]);

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
            className="absolute inset-0 overflow-hidden"
            aria-hidden="true"
          >
            <div
              className="absolute inset-0 flex animate-pan-horizontal"
              style={{ willChange: "transform" }}
            >
              <img
                src={selectedBg.src}
                alt=""
                className="h-full w-auto max-w-none flex-shrink-0 select-none"
                draggable={false}
              />
              <img
                src={selectedBg.src}
                alt=""
                className="h-full w-auto max-w-none flex-shrink-0 select-none"
                draggable={false}
              />
            </div>
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

      {/* Top right controls */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-2">
        {/* Minimize button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMinimized(!isMinimized);
          }}
          className="p-2 rounded-full bg-black/20 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/30 transition-all"
          aria-label={isMinimized ? "Restore controls" : "Minimize controls"}
        >
          {isMinimized ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
        </button>
        
        {/* Exit button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            exitFocusMode();
          }}
          className="p-2 rounded-full bg-black/20 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/30 transition-all"
          aria-label="Exit focus mode"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Horizontal Control Panel - Top of page (or bottom when minimized) */}
      <div
        className={
          isMinimized
            ? "fixed left-1/2 -translate-x-1/2 z-30 flex justify-center transition-all duration-300"
            : "relative z-30 flex justify-center pt-8 transition-all duration-300"
        }
        style={isMinimized ? { bottom: "calc(1.5rem + env(safe-area-inset-bottom))" } : undefined}
      >
        <div
          className={`flex items-center rounded-2xl bg-black/30 backdrop-blur-md border border-white/10 transition-all duration-300 ${
            isMinimized ? 'px-2 py-1.5 gap-2' : 'px-5 py-4 gap-4'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Timer - compact mode for Safari compatibility */}
          <FocusTimer compact={isMinimized ? "mini" : true} />

          {/* Divider */}
          <div className={`w-px bg-white/20 transition-all ${isMinimized ? 'h-6' : 'h-16'}`} />

          {/* Additional controls */}
          <div className={`flex ${isMinimized ? 'flex-row' : 'flex-col gap-2'}`}>
            <div className="flex items-center gap-1.5">
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
                      className={`rounded-lg bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-all ${
                        isMinimized ? 'p-1.5' : 'p-2'
                      }`}
                      aria-label={isMuted ? "Unmute music" : "Mute music"}
                    >
                      {isMuted ? <VolumeX className={isMinimized ? "w-3 h-3" : "w-4 h-4"} /> : <Volume2 className={isMinimized ? "w-3 h-3" : "w-4 h-4"} />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side={isMinimized ? "top" : "bottom"} className="bg-black/80 text-white border-white/20">
                    {isMuted ? "Unmute" : "Mute"}
                  </TooltipContent>
                </Tooltip>


                {/* YouTube audio player */}
                <YouTubeAudioPlayer
                  isActive={isYouTubeActive}
                  isMuted={isMuted}
                  onActiveChange={setIsYouTubeActive}
                  dropdownUp={isMinimized}
                />

                {/* Background picker */}
                <div className="relative">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setShowBgPicker(!showBgPicker)}
                        className={`rounded-lg bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-all ${
                          isMinimized ? 'p-1.5' : 'p-2'
                        }`}
                        aria-label="Change background"
                      >
                        <Image className={isMinimized ? "w-3 h-3" : "w-4 h-4"} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side={isMinimized ? "top" : "bottom"} className="bg-black/80 text-white border-white/20">
                      Change background
                    </TooltipContent>
                  </Tooltip>

                {/* Background picker dropdown */}
                {showBgPicker && (
                  <div 
                    className={`absolute right-0 p-3 rounded-xl bg-black/90 backdrop-blur-md border border-white/20 animate-scale-in z-[200] pointer-events-auto ${
                      isMinimized ? 'bottom-full mb-2' : 'top-full mt-2'
                    }`}
                    onClick={(e) => e.stopPropagation()}
                    style={{ minWidth: '380px' }}
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

          {/* Task info when minimized */}
          {isMinimized && (
            <>
              <div className="w-px h-6 bg-white/20" />
              <div className="flex items-center gap-2 max-w-[200px]">
                <div 
                  className="w-2 h-2 rounded-full animate-pulse shrink-0"
                  style={{ backgroundColor: focusedTask.color }}
                />
                <span className="text-white text-xs truncate">
                  {focusedTask.text}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Task Card - Lower portion (hidden when minimized) */}
      {!isMinimized && (
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
              {showTaskPicker && (
                <div 
                  className="absolute bottom-full mb-2 left-0 right-0 p-2 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 animate-scale-in max-h-[350px] overflow-y-auto z-[100]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-white/40 text-xs px-2 py-1 mb-1">Manage tasks</p>
                  
                  {/* Undone tasks */}
                  {undoneTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg transition-all group ${
                        focusedTask.id === task.id 
                          ? 'bg-white/20' 
                          : 'hover:bg-white/10'
                      }`}
                    >
                      {/* Complete button */}
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        className="w-5 h-5 rounded-full border-2 border-white/40 hover:border-white flex items-center justify-center transition-all shrink-0 hover:bg-white/20"
                        title="Mark as done"
                      >
                        <Check className="w-3 h-3 text-white/0 hover:text-white/70" />
                      </button>
                      
                      {/* Task text / edit input */}
                      {editingTaskId === task.id ? (
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit();
                            if (e.key === "Escape") {
                              setEditingTaskId(null);
                              setEditText("");
                            }
                          }}
                          onBlur={handleSaveEdit}
                          className="flex-1 bg-white/10 text-white text-sm px-2 py-1 rounded border border-white/30 focus:outline-none focus:border-white/60"
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => {
                            setFocusedTask({
                              id: task.id,
                              text: task.text,
                              color: task.color,
                            });
                            setShowTaskPicker(false);
                          }}
                          className="flex-1 text-white text-sm text-left truncate"
                        >
                          {task.text}
                        </button>
                      )}
                      
                      {/* Color indicator */}
                      <div 
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: task.color }}
                      />
                      
                      {/* Edit button */}
                      {editingTaskId !== task.id && (
                        <button
                          onClick={() => handleStartEdit(task)}
                          className="opacity-0 group-hover:opacity-100 text-white/50 hover:text-white transition-all p-1"
                          title="Edit task"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                      
                      {/* Current focus indicator */}
                      {focusedTask.id === task.id && (
                        <div className="text-white/50 text-xs">focusing</div>
                      )}
                    </div>
                  ))}
                  
                  {/* Add new task section */}
                  <div className="mt-2 pt-2 border-t border-white/10">
                    {isAddingTask ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={newTaskText}
                          onChange={(e) => setNewTaskText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddTask();
                            if (e.key === "Escape") {
                              setIsAddingTask(false);
                              setNewTaskText("");
                            }
                          }}
                          placeholder="New task..."
                          className="w-full bg-white/10 text-white text-sm px-3 py-2 rounded-lg border border-white/20 focus:outline-none focus:border-white/40 placeholder:text-white/30"
                          autoFocus
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-white/40 text-xs">Color:</span>
                          {TASK_COLORS.slice(0, 6).map((color) => (
                            <button
                              key={color.value}
                              onClick={() => setSelectedColor(color.value)}
                              className={`w-4 h-4 rounded-full border-2 transition-all hover:scale-110 ${
                                selectedColor === color.value ? 'border-white' : 'border-transparent'
                              }`}
                              style={{ backgroundColor: color.value }}
                              title={color.name}
                            />
                          ))}
                          <div className="flex-1" />
                          <button
                            onClick={() => {
                              setIsAddingTask(false);
                              setNewTaskText("");
                            }}
                            className="text-white/50 hover:text-white text-xs px-2 py-1"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleAddTask}
                            className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1 rounded-lg transition-all"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsAddingTask(true)}
                        className="w-full flex items-center gap-2 p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="text-sm">Add a task</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Exit hint */}
            <p className="text-white/30 text-xs text-center mt-4">
              Press ESC to exit focus mode
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
