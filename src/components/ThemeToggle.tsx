import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-14 h-8 rounded-full bg-muted animate-pulse" />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative w-14 h-8 rounded-full bg-gradient-to-r from-amber-100 to-amber-200 dark:from-indigo-900 dark:to-purple-900 p-1 transition-all duration-500 shadow-soft hover:shadow-glow focus:outline-none focus:ring-2 focus:ring-primary/50"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {/* Track decorations */}
      <div className="absolute inset-0 rounded-full overflow-hidden">
        {/* Light mode: clouds */}
        <div className={`absolute top-1 left-1 w-2 h-1.5 bg-white/60 rounded-full transition-opacity duration-300 ${isDark ? "opacity-0" : "opacity-100"}`} />
        <div className={`absolute top-2.5 left-2.5 w-1.5 h-1 bg-white/40 rounded-full transition-opacity duration-300 ${isDark ? "opacity-0" : "opacity-100"}`} />
        
        {/* Dark mode: stars */}
        <div className={`absolute top-1.5 right-2 w-1 h-1 bg-white rounded-full transition-opacity duration-300 animate-twinkle ${isDark ? "opacity-100" : "opacity-0"}`} />
        <div className={`absolute top-3 right-4 w-0.5 h-0.5 bg-white/80 rounded-full transition-opacity duration-300 animate-twinkle animate-delay-200 ${isDark ? "opacity-100" : "opacity-0"}`} />
        <div className={`absolute bottom-2 right-3 w-0.5 h-0.5 bg-white/60 rounded-full transition-opacity duration-300 animate-twinkle animate-delay-300 ${isDark ? "opacity-100" : "opacity-0"}`} />
      </div>

      {/* Toggle knob */}
      <div
        className={`relative w-6 h-6 rounded-full shadow-md transition-all duration-500 ease-out flex items-center justify-center ${
          isDark
            ? "translate-x-6 bg-gradient-to-br from-slate-700 to-slate-800"
            : "translate-x-0 bg-gradient-to-br from-amber-300 to-orange-400"
        }`}
      >
        {/* Sun icon */}
        <Sun
          className={`absolute w-4 h-4 text-amber-900 transition-all duration-300 ${
            isDark ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"
          }`}
        />
        
        {/* Moon icon */}
        <Moon
          className={`absolute w-3.5 h-3.5 text-indigo-200 transition-all duration-300 ${
            isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
          }`}
        />
      </div>
    </button>
  );
}
