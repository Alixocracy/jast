import { MessageCircle } from "lucide-react";
import { useJast } from "@/contexts/JastContext";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { JastAvatar } from "./JastAvatar";

export function JastCompanionCard() {
  const { settings, updateSettings, openChat, unread } = useJast();

  return (
    <div className="bg-card rounded-2xl p-5 shadow-card animate-fade-in border border-border/50">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <JastAvatar size={40} className="shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-foreground">JAST · Your AI companion</h3>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {settings.enabled
                ? "Chat, ask for help, or get gentle nudges."
                : "Turn on a friendly mentor to chat with throughout the day."}
            </p>
            {settings.enabled && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button onClick={openChat} size="sm" className="relative">
                  <MessageCircle className="w-4 h-4" />
                  Open chat
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 bg-energy text-energy-foreground text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {unread}
                    </span>
                  )}
                </Button>
                <button
                  onClick={openChat}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Settings & sharing →
                </button>
              </div>
            )}
          </div>
        </div>
        <Switch
          checked={settings.enabled}
          onCheckedChange={(v) => updateSettings({ enabled: v })}
          aria-label="Enable JAST"
          className="shrink-0"
        />
      </div>
    </div>
  );
}
