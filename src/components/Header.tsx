import { useUserName } from "@/contexts/UserNameContext";
import { ThemeToggle } from "./ThemeToggle";
import { JastAvatar } from "./JastAvatar";
import { useOnboarding } from "./OnboardingModal";

export function Header() {
  const { userName } = useUserName();
  const { openOnboarding } = useOnboarding();

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
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openOnboarding(1)}
            className="rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            aria-label="Open welcome dialog to update your name"
          >
            <JastAvatar size={48} className="transition-shadow hover:shadow-md" />
          </button>
          <span className="text-sm font-medium text-muted-foreground">JAST: Your Personal Wellbeing Assistant</span>
        </div>
        <ThemeToggle />
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
