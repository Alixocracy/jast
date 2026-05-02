import { Cloud, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

type ThemeName = "light" | "cloudy" | "dark";
const ORDER: ThemeName[] = ["light", "cloudy", "dark"];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-20 h-8 rounded-full bg-muted animate-pulse" />;
  }

  const current: ThemeName = (ORDER.includes(theme as ThemeName) ? theme : "light") as ThemeName;
  const isLight = current === "light";
  const isCloudy = current === "cloudy";
  const isDark = current === "dark";

  const next = () => {
    const idx = ORDER.indexOf(current);
    setTheme(ORDER[(idx + 1) % ORDER.length]);
  };

  // Knob position: 3 stops across a wider track
  const knobTranslate = isLight ? "translate-x-0" : isCloudy ? "translate-x-6" : "translate-x-12";

  // Track gradient per state
  const trackBg = isLight
    ? "from-amber-100 to-amber-200"
    : isCloudy
    ? "from-cyan-100 to-teal-200"
    : "from-indigo-900 to-purple-900";

  return (
    <button
      onClick={next}
      className={`relative w-20 h-8 rounded-full bg-gradient-to-r ${trackBg} p-1 transition-all duration-500 shadow-soft hover:shadow-glow focus:outline-none focus:ring-2 focus:ring-primary/50`}
      aria-label={`Theme: ${current}. Click to switch.`}
      title={`Theme: ${current}`}
    >
      {/* Track decorations */}
      <div className="absolute inset-0 rounded-full overflow-hidden">
        {/* Light: tiny clouds */}
        <div className={`absolute top-1 left-1 w-2 h-1.5 bg-white/70 rounded-full transition-opacity duration-300 ${isLight ? "opacity-100" : "opacity-0"}`} />
        <div className={`absolute top-2.5 left-2.5 w-1.5 h-1 bg-white/50 rounded-full transition-opacity duration-300 ${isLight ? "opacity-100" : "opacity-0"}`} />

        {/* Cloudy: drifting clouds */}
        <div className={`absolute top-1.5 left-2 w-3 h-1.5 bg-white/80 rounded-full transition-opacity duration-300 animate-drift ${isCloudy ? "opacity-100" : "opacity-0"}`} />
        <div className={`absolute bottom-1.5 right-8 w-2.5 h-1.5 bg-white/70 rounded-full transition-opacity duration-300 animate-drift-reverse ${isCloudy ? "opacity-100" : "opacity-0"}`} />

        {/* Dark: stars */}
        <div className={`absolute top-1.5 right-2 w-1 h-1 bg-white rounded-full transition-opacity duration-300 animate-twinkle ${isDark ? "opacity-100" : "opacity-0"}`} />
        <div className={`absolute top-3 right-4 w-0.5 h-0.5 bg-white/80 rounded-full transition-opacity duration-300 animate-twinkle animate-delay-200 ${isDark ? "opacity-100" : "opacity-0"}`} />
        <div className={`absolute bottom-2 right-3 w-0.5 h-0.5 bg-white/60 rounded-full transition-opacity duration-300 animate-twinkle animate-delay-300 ${isDark ? "opacity-100" : "opacity-0"}`} />
      </div>

      {/* Toggle knob */}
      <div
        className={`relative w-6 h-6 rounded-full shadow-md transition-all duration-500 ease-out flex items-center justify-center ${knobTranslate} ${
          isDark
            ? "bg-gradient-to-br from-slate-700 to-slate-800"
            : isCloudy
            ? "bg-gradient-to-br from-cyan-300 to-teal-500"
            : "bg-gradient-to-br from-amber-300 to-orange-400"
        }`}
      >
        <Sun
          className={`absolute w-4 h-4 text-amber-900 transition-all duration-300 ${
            isLight ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-0"
          }`}
        />
        <Cloud
          className={`absolute w-3.5 h-3.5 text-white transition-all duration-300 ${
            isCloudy ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
          }`}
        />
        <Moon
          className={`absolute w-3.5 h-3.5 text-indigo-200 transition-all duration-300 ${
            isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
          }`}
        />
      </div>
    </button>
  );
}
