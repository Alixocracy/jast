import { useState, useEffect } from "react";
import { Sparkles, Zap, Flame, Crown, Star } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface PointsDisplayProps {
  total: number;
  history: { action: string; points: number; timestamp: string }[];
  onReset: () => void;
}

const LEVELS = [
  { min: 0, name: "Seedling", icon: Sparkles, color: "from-emerald-400 to-teal-500", bg: "bg-emerald-500/20" },
  { min: 50, name: "Rising Star", icon: Star, color: "from-sky-400 to-blue-500", bg: "bg-sky-500/20" },
  { min: 100, name: "Achiever", icon: Zap, color: "from-violet-400 to-purple-500", bg: "bg-violet-500/20" },
  { min: 200, name: "Champion", icon: Flame, color: "from-orange-400 to-rose-500", bg: "bg-orange-500/20" },
  { min: 500, name: "Master", icon: Crown, color: "from-amber-400 to-yellow-500", bg: "bg-amber-500/20" },
];

const getLevelInfo = (points: number) => {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].min) {
      const nextLevel = LEVELS[i + 1];
      const progress = nextLevel 
        ? ((points - LEVELS[i].min) / (nextLevel.min - LEVELS[i].min)) * 100
        : 100;
      return { 
        ...LEVELS[i], 
        progress: Math.min(progress, 100),
        nextLevel: nextLevel?.name,
        pointsToNext: nextLevel ? nextLevel.min - points : 0
      };
    }
  }
  return { ...LEVELS[0], progress: 0, nextLevel: LEVELS[1]?.name, pointsToNext: LEVELS[1]?.min || 0 };
};

export function PointsDisplay({ total, history, onReset }: PointsDisplayProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [prevTotal, setPrevTotal] = useState(total);
  const levelInfo = getLevelInfo(total);
  const LevelIcon = levelInfo.icon;
  const recentHistory = history.slice(0, 8);

  // Trigger celebration on point gain
  useEffect(() => {
    if (total > prevTotal) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 1000);
      setPrevTotal(total);
      return () => clearTimeout(timer);
    }
    setPrevTotal(total);
  }, [total, prevTotal]);

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (levelInfo.progress / 100) * circumference;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative group">
          {/* Outer glow effect */}
          <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${levelInfo.color} opacity-30 blur-lg group-hover:opacity-50 transition-opacity duration-300`} />
          
          {/* Main orb container */}
          <div className="relative w-16 h-16 flex items-center justify-center">
            {/* SVG Ring Progress */}
            <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Background ring */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                className="text-muted/30"
              />
              {/* Progress ring */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                strokeWidth="6"
                strokeLinecap="round"
                className={`transition-all duration-700 ease-out`}
                style={{
                  stroke: `url(#gradient-${levelInfo.name})`,
                  strokeDasharray: circumference,
                  strokeDashoffset,
                }}
              />
              {/* Gradient definitions */}
              <defs>
                <linearGradient id={`gradient-${levelInfo.name}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={levelInfo.color.includes('emerald') ? '#34d399' : 
                    levelInfo.color.includes('sky') ? '#38bdf8' :
                    levelInfo.color.includes('violet') ? '#a78bfa' :
                    levelInfo.color.includes('orange') ? '#fb923c' : '#fbbf24'} />
                  <stop offset="100%" stopColor={levelInfo.color.includes('emerald') ? '#14b8a6' : 
                    levelInfo.color.includes('sky') ? '#3b82f6' :
                    levelInfo.color.includes('violet') ? '#a855f7' :
                    levelInfo.color.includes('orange') ? '#f43f5e' : '#eab308'} />
                </linearGradient>
              </defs>
            </svg>

            {/* Inner orb */}
            <div className={`relative w-11 h-11 rounded-full bg-gradient-to-br ${levelInfo.color} flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-105`}>
              <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/30 to-transparent" />
              <LevelIcon className="w-5 h-5 text-white drop-shadow-md relative z-10" />
            </div>

            {/* Floating particles */}
            {showCelebration && (
              <>
                {[...Array(6)].map((_, i) => (
                  <span
                    key={i}
                    className="absolute w-1.5 h-1.5 rounded-full animate-ping"
                    style={{
                      background: `linear-gradient(to right, var(--tw-gradient-stops))`,
                      top: `${20 + Math.random() * 60}%`,
                      left: `${20 + Math.random() * 60}%`,
                      animationDelay: `${i * 100}ms`,
                      animationDuration: '600ms',
                    }}
                  />
                ))}
              </>
            )}

            {/* Points badge */}
            <div className="absolute -bottom-1 -right-1 bg-card border border-border rounded-full px-1.5 py-0.5 shadow-md">
              <span className="text-xs font-bold text-foreground">{total}</span>
            </div>
          </div>
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0 overflow-hidden" align="end">
        {/* Header with gradient */}
        <div className={`bg-gradient-to-r ${levelInfo.color} p-4 text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <LevelIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm opacity-80">Current Level</p>
                <h3 className="text-xl font-bold">{levelInfo.name}</h3>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{total}</p>
              <p className="text-xs opacity-80">points</p>
            </div>
          </div>

          {/* Progress to next level */}
          {levelInfo.nextLevel && (
            <div className="mt-4">
              <div className="flex justify-between text-xs opacity-80 mb-1">
                <span>{levelInfo.name}</span>
                <span>{levelInfo.nextLevel}</span>
              </div>
              <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${levelInfo.progress}%` }}
                />
              </div>
              <p className="text-xs opacity-80 mt-1 text-center">
                {levelInfo.pointsToNext} pts to level up
              </p>
            </div>
          )}
          {!levelInfo.nextLevel && (
            <p className="mt-3 text-sm text-center opacity-90">
              You've reached the highest level! 🎉
            </p>
          )}
        </div>

        {/* Points breakdown */}
        <div className="p-4 bg-card">
          <div className="grid grid-cols-4 gap-2 mb-4">
            <PointSource label="Tasks" points={history.filter(h => h.action.includes('task')).reduce((sum, h) => sum + h.points, 0)} icon="✓" />
            <PointSource label="Wellness" points={history.filter(h => ['Drink Water', 'Deep Breath', 'Take a Walk', 'Mindful Break'].includes(h.action)).reduce((sum, h) => sum + h.points, 0)} icon="💚" />
            <PointSource label="Focus" points={history.filter(h => h.action.includes('Focus')).reduce((sum, h) => sum + h.points, 0)} icon="⏱" />
            <PointSource label="Other" points={history.filter(h => !h.action.includes('task') && !['Drink Water', 'Deep Breath', 'Take a Walk', 'Mindful Break'].includes(h.action) && !h.action.includes('Focus')).reduce((sum, h) => sum + h.points, 0)} icon="✨" />
          </div>

          {/* Recent activity */}
          {recentHistory.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground mb-2">Recent Activity</p>
              <div className="space-y-1 max-h-28 overflow-y-auto">
                {recentHistory.map((entry, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center text-sm py-1.5 px-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <span className="text-foreground">{entry.action}</span>
                    <span className="text-primary font-semibold">+{entry.points}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={onReset}
            className="w-full mt-4 text-xs text-muted-foreground hover:text-destructive transition-colors py-2 border border-border rounded-lg hover:border-destructive/50"
          >
            Reset all progress
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function PointSource({ label, points, icon }: { label: string; points: number; icon: string }) {
  return (
    <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
      <span className="text-lg mb-1">{icon}</span>
      <span className="text-lg font-bold text-foreground">{points}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}
