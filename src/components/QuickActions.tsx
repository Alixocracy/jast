import { Coffee, Droplets, Footprints, Wind } from "lucide-react";
import { toast } from "sonner";
import { usePointsContext } from "@/contexts/PointsContext";

const actions = [
  {
    icon: Droplets,
    label: "Drink Water",
    message: "Hydration helps your brain work better! 💧",
    color: "bg-focus/20 text-focus hover:bg-focus/30",
    points: 1,
  },
  {
    icon: Footprints,
    label: "Take a Walk",
    message: "Moving your body can reset your focus! 🚶",
    color: "bg-calm text-calm-foreground hover:bg-calm/80",
    points: 2,
  },
  {
    icon: Wind,
    label: "Deep Breath",
    message: "Take 3 deep breaths. You've got this! 🌬️",
    color: "bg-gentle text-gentle-foreground hover:bg-gentle/80",
    points: 1,
  },
  {
    icon: Coffee,
    label: "Mindful Break",
    message: "A short break can spark creativity! ☕",
    color: "bg-accent text-accent-foreground hover:bg-accent/80",
    points: 3,
  },
];

export function QuickActions() {
  const { addPoints } = usePointsContext();

  const handleAction = (action: typeof actions[0]) => {
    addPoints(action.label, action.points);
    toast(`${action.message} +${action.points} pts`, {
      duration: 3000,
    });
  };

  return (
    <div className="bg-card rounded-2xl p-6 shadow-card animate-fade-in animate-delay-400">
      <h2 className="text-lg font-semibold text-foreground mb-4">Quick Wellness</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Tap to log a self-care moment and earn points
      </p>

      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => handleAction(action)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 ${action.color} relative`}
          >
            <action.icon className="w-6 h-6" />
            <span className="text-sm font-medium">{action.label}</span>
            <span className="absolute top-2 right-2 text-xs opacity-70">+{action.points}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
