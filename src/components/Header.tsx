import { useUserName } from "@/contexts/UserNameContext";
import { ThemeToggle } from "./ThemeToggle";
import { Sparkles } from "lucide-react";
import { JastAvatar } from "./JastAvatar";
import { useOnboarding } from "./OnboardingModal";
import { Affirmation } from "./Affirmation";
import { PointsDisplay } from "./PointsDisplay";
import { usePointsContext } from "@/contexts/PointsContext";
import { Switch } from "@/components/ui/switch";
import { useJast } from "@/contexts/JastContext";

export function Header() {
  const { userName } = useUserName();
  const { openOnboarding } = useOnboarding();
  const { total, history, resetPoints } = usePointsContext();
  const { settings, updateSettings } = useJast();

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
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button
            type="button"
            onClick={() => openOnboarding(1)}
            className="rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary shrink-0"
            aria-label="Open welcome dialog to update your name"
          >
            <JastAvatar size={48} className="transition-shadow hover:shadow-md" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold text-foreground">
              {getGreeting()}{userName ? ` ${userName}` : ""} {getTimeEmoji()}
            </h1>
            <Affirmation />
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => updateSettings({ enabled: !settings.enabled })}
            aria-label={settings.enabled ? "Disable JAST" : "Enable JAST"}
            title={settings.enabled ? "JAST is on — click to disable" : "JAST is off — click to enable"}
            className="relative rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          >
            <JastAvatar
              size={32}
              className={
                settings.enabled
                  ? "ring-2 ring-primary shadow-glow"
                  : "grayscale opacity-50 hover:opacity-80"
              }
            />
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background ${
                settings.enabled ? "bg-emerald-500" : "bg-muted-foreground/50"
              }`}
            />
          </button>
          <div className="scale-110 origin-right">
            <ThemeToggle />
          </div>
          <PointsDisplay total={total} history={history} onReset={resetPoints} />
        </div>
      </div>
    </header>
  );
}
