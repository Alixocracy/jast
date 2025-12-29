import { Star, Trophy } from "lucide-react";
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

const getLevelInfo = (points: number) => {
  if (points >= 500) return { level: "Master", emoji: "🏆", color: "text-yellow-500" };
  if (points >= 200) return { level: "Champion", emoji: "⭐", color: "text-purple-500" };
  if (points >= 100) return { level: "Achiever", emoji: "🌟", color: "text-blue-500" };
  if (points >= 50) return { level: "Rising Star", emoji: "✨", color: "text-green-500" };
  return { level: "Beginner", emoji: "🌱", color: "text-muted-foreground" };
};

export function PointsDisplay({ total, history, onReset }: PointsDisplayProps) {
  const levelInfo = getLevelInfo(total);
  const recentHistory = history.slice(0, 10);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-energy/20 to-primary/20 hover:from-energy/30 hover:to-primary/30 transition-all duration-200 border border-energy/30">
          <Star className="w-4 h-4 text-energy fill-energy" />
          <span className="font-semibold text-foreground">{total}</span>
          <span className="text-sm">{levelInfo.emoji}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className={`w-5 h-5 ${levelInfo.color}`} />
              <span className="font-semibold">{levelInfo.level}</span>
            </div>
            <span className="text-2xl font-bold text-foreground">{total} pts</span>
          </div>

          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-energy to-primary rounded-full transition-all duration-500"
              style={{ width: `${Math.min((total % 100), 100)}%` }}
            />
          </div>

          <div className="text-xs text-muted-foreground text-center">
            {total < 50 && `${50 - total} pts to Rising Star`}
            {total >= 50 && total < 100 && `${100 - total} pts to Achiever`}
            {total >= 100 && total < 200 && `${200 - total} pts to Champion`}
            {total >= 200 && total < 500 && `${500 - total} pts to Master`}
            {total >= 500 && "You've reached the highest level! 🎉"}
          </div>

          {recentHistory.length > 0 && (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              <p className="text-xs font-medium text-muted-foreground">Recent activity</p>
              {recentHistory.map((entry, i) => (
                <div
                  key={i}
                  className="flex justify-between text-xs py-1 border-b border-border/50 last:border-0"
                >
                  <span className="text-foreground">{entry.action}</span>
                  <span className="text-energy font-medium">+{entry.points}</span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={onReset}
            className="w-full text-xs text-muted-foreground hover:text-destructive transition-colors py-1"
          >
            Reset points
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
