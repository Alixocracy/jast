import { useJast } from "@/contexts/JastContext";
import { JastAvatar } from "./JastAvatar";

export function JastFloatingButton() {
  const { settings, openChat, isOpen, unread } = useJast();
  if (!settings.enabled || isOpen) return null;
  return (
    <button
      onClick={openChat}
      aria-label="Open JAST chat"
      className="fixed bottom-5 right-5 z-[60] rounded-full shadow-glow hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-primary/50"
    >
      <div className="relative">
        <JastAvatar size={56} className="ring-2 ring-primary/40" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-energy text-energy-foreground text-[10px] rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1 font-medium shadow">
            {unread}
          </span>
        )}
      </div>
    </button>
  );
}
