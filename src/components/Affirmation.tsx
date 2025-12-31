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

  "You can start where you are.",
  "Small steps still count.",
  "Your energy comes and goes, and that's okay.",
  "You don’t need to rush to move forward.",
  "Doing your best looks different every day.",
  "It’s okay to begin again.",
  "You’re allowed to take things slowly.",
  "Your effort matters, even when it’s quiet.",
  "You don’t have to finish everything today.",
  "Curiosity is more helpful than pressure.",

  "You are allowed to do things your way.",
  "Rest helps your ideas grow.",
  "Progress can be gentle.",
  "You’re not behind; you’re learning.",
  "One small action is enough for now.",
  "You can refocus whenever you need to.",
  "Your mind has its own rhythm.",
  "You don’t need perfection to make progress.",
  "It’s okay to pause and continue later.",
  "You are building momentum, little by little.",

  "Your attention will return when it’s ready.",
  "Trying counts, even when it’s messy.",
  "You’re allowed to change your approach.",
  "A calm mind supports clear action.",
  "You don’t have to push to move forward.",
  "Small progress adds up.",
  "You can choose ease where possible.",
  "Your curiosity keeps you going.",
  "It’s okay to take things in pieces.",

  "You’re learning what works for you.",
  "Your mind is allowed to wander and come back.",
  "You can reset at any moment.",
  "Effort doesn’t have to feel heavy.",
  "You are allowed to simplify.",
  "You’re doing more than you realize.",
  "Focus grows with patience.",
  "You don’t need pressure to be effective.",
  "One kind thought can change your momentum.",
  "You are allowed to enjoy progress.",

  "You can move forward without urgency.",
  "Noticing is a form of progress.",
  "Feel proud of small wins.",
  "You don’t need to solve everything at once.",
  "You can gently guide your attention back.",
  "Progress doesn’t have to be loud.",
  "You are allowed to work in short bursts.",
  "You can choose what matters most right now.",

  "Your brain is creative, even when distracted.",
  "It’s okay if today looks simple.",
  "You’re allowed to take the easier step.",
  "Your effort is enough for today.",
  "You can return to tasks without guilt.",
  "Growth happens in small moments.",
  "You don’t need to do everything well.",
  "You’re allowed to learn as you go.",
  "Focus comes more easily with kindness.",
  "You can keep going without burning out.",

  "Your mind responds to encouragement.",
  "You are allowed to take breaks without earning them.",
  "One step forward is still progress.",
  "You can meet yourself where you are.",
  "Your ideas matter, even unfinished ones.",
  "You don’t need to compare your pace.",
  "You can build momentum gently.",
  "It’s okay to stop and restart.",
  "Your attention is not broken.",
  "You are allowed to do less and still grow.",

  "Progress can feel light.",
  "You don’t need fear to motivate you.",
  "You’re learning how to support yourself.",
  "Small choices create big shifts over time.",
  "You can take today as it comes.",
  "Your focus strengthens with practice.",
  "You are allowed to enjoy the process.",
  "You can choose calm over pressure.",
  "You’re allowed to make progress imperfectly.",
  "Your mind is capable of gentle focus.",

  "You can keep going at your own pace.",
  "Today doesn’t have to be exceptional.",
  "You’re allowed to feel scattered and capable.",
  "One helpful thought is enough.",
  "You can trust yourself to continue.",
  "Progress doesn’t need approval to be real.",
  "You are allowed to build energy slowly.",
  "Your attention will find its way back.",
  "You can move forward with kindness.",
  "You’re doing more than you think.",

  "You can begin again right now.",
  "Your effort deserves compassion.",
  "You are allowed to choose ease.",
  "One small win is still a win.",
  "You don’t need to push to be productive.",
  "Your brain brings value in its own way.",
  "You can keep going without pressure.",
  "You are allowed to grow gently.",
  "Progress is happening, even quietly.",
  "You are enough, exactly as you are."
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
