import { useState, useEffect } from "react";
import { RefreshCw, Heart } from "lucide-react";
import { PointsDisplay } from "./PointsDisplay";
import { usePointsContext } from "@/contexts/PointsContext";

const affirmations = [
  "You are capable of amazing things.",
  "Progress, not perfection.",
  "Your brain works differently, and that's a superpower.",
  "One step at a time is still moving forward.",
  "It's okay to take breaks. They help you think.",
  "You're doing better than you think.",
  "Small wins count. Celebrate them.",
  "Your focus is a gift, even when it's hard to find.",
  "Be patient with yourself. Growth takes time.",
  "You don't have to do everything today.",
  "Your worth isn't measured by productivity.",
  "Taking care of yourself is productive.",
  "You are more than your to-do list.",
  "Every moment is a fresh start.",
  "Your unique perspective matters.",
];

export function Affirmation() {
  const [currentAffirmation, setCurrentAffirmation] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const { total, history, resetPoints } = usePointsContext();

  const getNewAffirmation = () => {
    setIsAnimating(true);
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * affirmations.length);
      setCurrentAffirmation(affirmations[randomIndex]);
      setIsAnimating(false);
    }, 200);
  };

  useEffect(() => {
    getNewAffirmation();
  }, []);

  return (
    <div className="gradient-warm rounded-2xl p-6 shadow-card animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-4 h-4 text-energy" />
            <span className="text-xs font-medium text-accent-foreground/70 uppercase tracking-wide">
              Daily Reminder
            </span>
            <button
              onClick={getNewAffirmation}
              className="ml-1 p-2 rounded-full text-accent-foreground/60 hover:text-accent-foreground hover:bg-white/10 transition-colors"
              aria-label="New reminder"
            >
              <RefreshCw className={`w-4 h-4 ${isAnimating ? "animate-spin" : ""}`} />
            </button>
          </div>
          
          <p
            className={`text-xl font-medium text-accent-foreground mb-4 min-h-[3.5rem] transition-all duration-200 ${
              isAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
            }`}
          >
            {currentAffirmation}
          </p>
        </div>

        <PointsDisplay total={total} history={history} onReset={resetPoints} />
      </div>
    </div>
  );
}
