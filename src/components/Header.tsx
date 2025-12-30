import { Sparkles } from "lucide-react";
import { useUserName } from "./OnboardingModal";

export function Header() {
  const { userName } = useUserName();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getTimeEmoji = () => {
    const hour = new Date().getHours();
    if (hour < 6) return "🌙";
    if (hour < 12) return "🌅";
    if (hour < 17) return "☀️";
    if (hour < 20) return "🌆";
    return "🌙";
  };

  return (
    <header className="mb-8 animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-10 h-10 rounded-xl gradient-calm flex items-center justify-center shadow-soft">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">JAST: Your Personal Wellbeing Assistant</span>
      </div>
      
      <h1 className="text-3xl font-semibold text-foreground mb-1">
        {getGreeting()}{userName ? ` ${userName}` : ""} {getTimeEmoji()}
      </h1>
      <p className="text-muted-foreground">
        Let's make today manageable, one step at a time.
      </p>
    </header>
  );
}
